import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import { ImageDraft } from '../models/ImageDraft';

export const createDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Please upload an image file.' });
      return;
    }

    const userId = req.user!._id;
    const imageUrl = `/uploads/${req.file.filename}`;
    const cropNote = req.body.cropNote || '';

    const draft = new ImageDraft({
      userId,
      imageUrl,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      cropNote,
      status: 'draft',
    });

    await draft.save();

    res.status(201).json({
      success: true,
      message: 'Image preview draft created successfully.',
      draft,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create image draft.' });
  }
};

export const getCurrentDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const draft = await ImageDraft.findOne({ userId, status: 'draft' }).sort({ createdAt: -1 });

    if (!draft) {
      res.status(404).json({ success: false, message: 'No active image draft found.' });
      return;
    }

    res.status(200).json({ success: true, draft });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDraftById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const draft = await ImageDraft.findOne({ _id: req.params.id, userId });

    if (!draft) {
      res.status(404).json({ success: false, message: 'Draft not found.' });
      return;
    }

    res.status(200).json({ success: true, draft });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { cropNote, status } = req.body;

    const draft = await ImageDraft.findOne({ _id: req.params.id, userId });
    if (!draft) {
      res.status(404).json({ success: false, message: 'Draft not found.' });
      return;
    }

    if (cropNote !== undefined) draft.cropNote = cropNote;
    if (status !== undefined) draft.status = status;

    // If new file was attached during update (e.g., retake)
    if (req.file) {
      // Remove old file
      const oldFilename = path.basename(draft.imageUrl);
      const oldPath = path.resolve(__dirname, '../../uploads', oldFilename);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch {}
      }
      draft.imageUrl = `/uploads/${req.file.filename}`;
      draft.originalFilename = req.file.originalname;
      draft.mimeType = req.file.mimetype;
      draft.fileSize = req.file.size;
    }

    await draft.save();

    res.status(200).json({
      success: true,
      message: 'Image draft updated successfully.',
      draft,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const draft = await ImageDraft.findOneAndDelete({ _id: req.params.id, userId });

    if (!draft) {
      res.status(404).json({ success: false, message: 'Draft not found.' });
      return;
    }

    // Attempt to remove file
    const filename = path.basename(draft.imageUrl);
    const filePath = path.resolve(__dirname, '../../uploads', filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }

    res.status(200).json({
      success: true,
      message: 'Draft dismissed and removed successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
