import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SavedDiagnosis } from '../models/SavedDiagnosis';
import { Diagnosis } from '../models/Diagnosis';

export const saveDiagnosis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { diagnosisId, personalObservations } = req.body;

    const diagnosis = await Diagnosis.findById(diagnosisId);
    if (!diagnosis) {
      res.status(404).json({ success: false, message: 'Diagnosis record not found.' });
      return;
    }

    const savedRecord = new SavedDiagnosis({
      userId,
      diagnosisId: diagnosis._id,
      crop: diagnosis.crop,
      disease: diagnosis.disease,
      confidence: diagnosis.confidence,
      severity: diagnosis.severity,
      imageUrl: diagnosis.imageUrl,
      personalObservations: personalObservations || diagnosis.farmerNotes || '',
      savedDate: new Date(),
    });

    await savedRecord.save();

    res.status(201).json({
      success: true,
      message: 'Diagnosis saved to your history successfully.',
      savedDiagnosis: savedRecord,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSavedDiagnoses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { search, page = '1', limit = '20' } = req.query;

    const query: any = { userId };
    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { crop: searchRegex },
        { disease: searchRegex },
        { personalObservations: searchRegex },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      SavedDiagnosis.find(query).sort({ savedDate: -1 }).skip(skip).limit(limitNum),
      SavedDiagnosis.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      records,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSavedDiagnosisById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const record = await SavedDiagnosis.findOne({ _id: req.params.id, userId }).populate('diagnosisId');

    if (!record) {
      res.status(404).json({ success: false, message: 'Saved diagnosis record not found.' });
      return;
    }

    res.status(200).json({ success: true, record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSavedDiagnosis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { personalObservations } = req.body;

    const record = await SavedDiagnosis.findOne({ _id: req.params.id, userId });
    if (!record) {
      res.status(404).json({ success: false, message: 'Saved diagnosis record not found.' });
      return;
    }

    if (personalObservations !== undefined) {
      record.personalObservations = personalObservations;
    }

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Personal observations updated successfully.',
      record,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSavedDiagnosis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const record = await SavedDiagnosis.findOneAndDelete({ _id: req.params.id, userId });

    if (!record) {
      res.status(404).json({ success: false, message: 'Saved diagnosis record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Saved diagnosis deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
