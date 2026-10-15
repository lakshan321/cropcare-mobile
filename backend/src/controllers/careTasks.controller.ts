import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CareTask } from '../models/CareTask';

export const getCareTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { category, isCompleted } = req.query;

    const filter: any = { userId };
    if (category) filter.category = category;
    if (isCompleted !== undefined) filter.isCompleted = isCompleted === 'true';

    const tasks = await CareTask.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ success: true, tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCareTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { task, category, diagnosisId, dueDate } = req.body;

    if (!task || !task.trim()) {
      res.status(400).json({ success: false, message: 'Task description is required.' });
      return;
    }

    const careTask = new CareTask({
      userId,
      task: task.trim(),
      category: category || 'custom',
      diagnosisId: diagnosisId || undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      isCompleted: false,
    });

    await careTask.save();

    res.status(201).json({
      success: true,
      message: 'Care task created successfully.',
      task: careTask,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCareTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { task, isCompleted, category, dueDate } = req.body;

    const careTask = await CareTask.findOne({ _id: req.params.id, userId });
    if (!careTask) {
      res.status(404).json({ success: false, message: 'Care task not found.' });
      return;
    }

    if (task !== undefined) careTask.task = task.trim();
    if (isCompleted !== undefined) careTask.isCompleted = Boolean(isCompleted);
    if (category !== undefined) careTask.category = category;
    if (dueDate !== undefined) careTask.dueDate = dueDate ? new Date(dueDate) : undefined;

    await careTask.save();

    res.status(200).json({
      success: true,
      message: 'Care task updated successfully.',
      task: careTask,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCareTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const careTask = await CareTask.findOneAndDelete({ _id: req.params.id, userId });

    if (!careTask) {
      res.status(404).json({ success: false, message: 'Care task not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Care task deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
