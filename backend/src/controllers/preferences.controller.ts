import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserPreference } from '../models/UserPreference';

export const getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    let pref = await UserPreference.findOne({ userId });

    if (!pref) {
      pref = new UserPreference({ userId, language: 'en', notificationsEnabled: true });
      await pref.save();
    }

    res.status(200).json({ success: true, preferences: pref });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { language, notificationsEnabled } = req.body;

    let pref = await UserPreference.findOne({ userId });
    if (!pref) {
      pref = new UserPreference({ userId });
    }

    if (language && ['en', 'si', 'ta'].includes(language)) {
      pref.language = language;
    }
    if (notificationsEnabled !== undefined) {
      pref.notificationsEnabled = Boolean(notificationsEnabled);
    }

    await pref.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully.',
      preferences: pref,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
