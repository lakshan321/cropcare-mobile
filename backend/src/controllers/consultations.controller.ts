import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Consultation } from '../models/Consultation';
import { Diagnosis } from '../models/Diagnosis';

export const createConsultation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { diagnosisId, farmerNotes, location, district, office, idempotencyKey } = req.body;

    if (!diagnosisId || !farmerNotes || !location || !district || !office) {
      res.status(400).json({
        success: false,
        message: 'All fields (diagnosisId, farmerNotes, location, district, office) are required.',
      });
      return;
    }

    // Check for duplicate recent submission to prevent duplicate creation on retry
    const existingRecent = await Consultation.findOne({
      farmerId: user._id,
      diagnosisId,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) }, // within 60s
    });

    if (existingRecent) {
      // Return existing without duplicating
      res.status(200).json({
        success: true,
        message: 'Consultation already received.',
        consultation: sanitizeFarmerConsultation(existingRecent),
      });
      return;
    }

    const diagnosis = await Diagnosis.findById(diagnosisId);
    if (!diagnosis) {
      res.status(404).json({ success: false, message: 'Diagnosis record not found.' });
      return;
    }

    const consultation = new Consultation({
      farmerId: user._id,
      farmerName: user.fullName,
      farmerPhone: user.phone || '',
      diagnosisId: diagnosis._id,
      imageUrl: diagnosis.imageUrl,
      crop: diagnosis.crop,
      aiSuggestedDisease: diagnosis.disease,
      aiConfidence: diagnosis.confidence,
      farmerNotes: farmerNotes.trim(),
      location: location.trim(),
      district: district.trim(),
      office: office.trim(),
      status: 'Submitted',
      priority: diagnosis.severity === 'Severe' ? 'High' : diagnosis.severity === 'Moderate' ? 'Medium' : 'Low',
      auditTrail: [
        {
          action: 'SUBMITTED',
          by: {
            id: user._id.toString(),
            name: user.fullName,
            role: 'farmer',
          },
          timestamp: new Date(),
          note: 'Consultation submitted by farmer.',
          newStatus: 'Submitted',
        },
      ],
      version: 1,
    });

    await consultation.save();

    res.status(201).json({
      success: true,
      message: 'Consultation request submitted successfully.',
      consultation: sanitizeFarmerConsultation(consultation),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyConsultations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status } = req.query;

    const query: any = { farmerId: userId };
    if (status && ['Submitted', 'In Review', 'Resolved'].includes(status as string)) {
      query.status = status;
    }

    const cases = await Consultation.find(query).sort({ createdAt: -1 });

    // Ensure privateDraft is NEVER sent to farmers
    const sanitized = cases.map(sanitizeFarmerConsultation);

    res.status(200).json({
      success: true,
      cases: sanitized,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConsultationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const consultation = await Consultation.findOne({ _id: req.params.id, farmerId: userId });

    if (!consultation) {
      res.status(404).json({ success: false, message: 'Case not found or access denied.' });
      return;
    }

    res.status(200).json({
      success: true,
      consultation: sanitizeFarmerConsultation(consultation),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateConsultationNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { farmerNotes, location, district, office } = req.body;

    const consultation = await Consultation.findOne({ _id: req.params.id, farmerId: userId });
    if (!consultation) {
      res.status(404).json({ success: false, message: 'Case not found or access denied.' });
      return;
    }

    if (consultation.status !== 'Submitted') {
      res.status(400).json({
        success: false,
        message: 'Cannot edit case notes once an officer has begun review or resolved the case.',
      });
      return;
    }

    if (farmerNotes !== undefined) consultation.farmerNotes = farmerNotes.trim();
    if (location !== undefined) consultation.location = location.trim();
    if (district !== undefined) consultation.district = district.trim();
    if (office !== undefined) consultation.office = office.trim();

    consultation.auditTrail.push({
      action: 'FARMER_UPDATED_NOTES',
      by: {
        id: req.user!._id.toString(),
        name: req.user!.fullName,
        role: 'farmer',
      },
      timestamp: new Date(),
      note: 'Farmer updated symptoms/location notes before review.',
    });

    consultation.version += 1;
    await consultation.save();

    res.status(200).json({
      success: true,
      message: 'Consultation notes updated successfully.',
      consultation: sanitizeFarmerConsultation(consultation),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelConsultation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const consultation = await Consultation.findOne({ _id: req.params.id, farmerId: userId });

    if (!consultation) {
      res.status(404).json({ success: false, message: 'Case not found or access denied.' });
      return;
    }

    if (consultation.status !== 'Submitted') {
      res.status(400).json({
        success: false,
        message: 'Cannot cancel a consultation that is already In Review or Resolved.',
      });
      return;
    }

    await Consultation.deleteOne({ _id: consultation._id });

    res.status(200).json({
      success: true,
      message: 'Consultation request cancelled and deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: strictly strips privateDraft and private internal notes before returning to farmer
function sanitizeFarmerConsultation(doc: any) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.privateDraft;
  return obj;
}
