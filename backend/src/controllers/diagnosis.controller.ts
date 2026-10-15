import { Response } from 'express';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import { Diagnosis } from '../models/Diagnosis';
import { ImageDraft } from '../models/ImageDraft';
import { getDiagnosisProvider } from '../providers';

export const analyzePlant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { draftId, cropHint } = req.body;

    let imageUrl = '';
    let absoluteImagePath = '';

    if (draftId) {
      const draft = await ImageDraft.findOne({ _id: draftId, userId });
      if (!draft) {
        res.status(404).json({ success: false, message: 'Referenced image draft not found.' });
        return;
      }
      imageUrl = draft.imageUrl;
      draft.status = 'analyzed';
      await draft.save();
    } else if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else {
      res.status(400).json({ success: false, message: 'Please provide either a draftId or an image file.' });
      return;
    }

    const filename = path.basename(imageUrl);
    absoluteImagePath = path.resolve(__dirname, '../../uploads', filename);

    // Call the pluggable diagnosis provider (Mock or Real)
    const provider = getDiagnosisProvider();
    const result = await provider.analyzeImage(absoluteImagePath, cropHint);

    const diagnosis = new Diagnosis({
      userId,
      draftId: draftId || undefined,
      imageUrl,
      crop: result.crop,
      disease: result.disease,
      confidence: result.confidence,
      severity: result.severity,
      symptoms: result.symptoms,
      causes: result.causes,
      organicTreatment: result.organicTreatment,
      chemicalTreatment: result.chemicalTreatment,
      prevention: result.prevention,
      isMock: result.isMock,
      provider: result.provider,
      status: 'completed',
      farmerNotes: req.body.farmerNotes || '',
    });

    await diagnosis.save();

    res.status(201).json({
      success: true,
      message: 'Plant disease analysis completed successfully.',
      diagnosis,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Analysis processing failed.',
    });
  }
};

export const getAnalysisJobStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const diagnosis = await Diagnosis.findOne({ _id: req.params.id, userId });

    if (!diagnosis) {
      res.status(404).json({ success: false, message: 'Analysis record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      diagnosis,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelAnalysisJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const diagnosis = await Diagnosis.findOne({ _id: req.params.id, userId });

    if (!diagnosis) {
      res.status(404).json({ success: false, message: 'Analysis record not found.' });
      return;
    }

    diagnosis.status = 'cancelled';
    await diagnosis.save();

    res.status(200).json({
      success: true,
      message: 'Analysis job cancelled successfully.',
      diagnosis,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDiagnosisById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const diagnosis = await Diagnosis.findOne({ _id: req.params.id, userId });

    if (!diagnosis) {
      res.status(404).json({ success: false, message: 'Diagnosis record not found.' });
      return;
    }

    res.status(200).json({ success: true, diagnosis });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFarmerNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { farmerNotes } = req.body;

    const diagnosis = await Diagnosis.findOne({ _id: req.params.id, userId });
    if (!diagnosis) {
      res.status(404).json({ success: false, message: 'Diagnosis record not found.' });
      return;
    }

    diagnosis.farmerNotes = farmerNotes || '';
    await diagnosis.save();

    res.status(200).json({
      success: true,
      message: 'Farmer observations updated successfully.',
      diagnosis,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
