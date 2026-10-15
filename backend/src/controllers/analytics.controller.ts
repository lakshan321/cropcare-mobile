import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Consultation } from '../models/Consultation';
import { SavedAnalyticsView } from '../models/SavedAnalyticsView';

export const getAnalyticsSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { district, crop, status, dateRange } = req.query;

    const match: any = {};
    if (district && district !== 'All' && district !== 'All locations') {
      match.district = district;
    }
    if (crop && crop !== 'All' && crop !== 'All crops') {
      match.crop = crop;
    }
    if (status && status !== 'All') {
      match.status = status;
    }

    if (dateRange && dateRange !== 'All') {
      const now = new Date();
      if (dateRange === '7d') {
        match.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      } else if (dateRange === '30d') {
        match.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      } else if (dateRange === '90d') {
        match.createdAt = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
      }
    }

    const [
      totalCases,
      statusCounts,
      highPriorityCases,
      byDistrict,
      byCrop,
      byDisease,
      confirmedVsAI,
    ] = await Promise.all([
      Consultation.countDocuments(match),
      Consultation.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Consultation.countDocuments({ ...match, priority: 'High', status: { $ne: 'Resolved' } }),
      Consultation.aggregate([
        { $match: match },
        { $group: { _id: '$district', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Consultation.aggregate([
        { $match: match },
        { $group: { _id: '$crop', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Consultation.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $ifNull: ['$publishedResponse.confirmedDisease', '$aiSuggestedDisease'],
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Consultation.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $cond: [{ $ifNull: ['$publishedResponse', false] }, 'Confirmed', 'AI Suggested'] },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statuses: Record<string, number> = { Submitted: 0, 'In Review': 0, Resolved: 0 };
    statusCounts.forEach((s) => {
      if (s._id) statuses[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      summary: {
        totalCases,
        openCases: statuses.Submitted + statuses['In Review'],
        resolvedCases: statuses.Resolved,
        highPriorityCases,
        statusDistribution: statuses,
        districtDistribution: byDistrict.map((d) => ({ district: d._id || 'Unknown', count: d.count })),
        cropDistribution: byCrop.map((c) => ({ crop: c._id || 'Unknown', count: c.count })),
        diseaseDistribution: byDisease.map((d) => ({ disease: d._id || 'Unknown', count: d.count })),
        verificationStatus: confirmedVsAI.map((v) => ({ type: v._id, count: v.count })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CSV Export with formula injection protection and cell escaping
export const exportAnalyticsCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { district, crop, status } = req.query;

    const match: any = {};
    if (district && district !== 'All') match.district = district;
    if (crop && crop !== 'All') match.crop = crop;
    if (status && status !== 'All') match.status = status;

    const cases = await Consultation.find(match).sort({ createdAt: -1 });

    const sanitizeCell = (val: any): string => {
      let str = String(val ?? '').trim();
      // Formula injection prevention: prefix dangerous starting characters with single quote
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      // Escape double quotes by doubling them
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Case ID',
      'Submission Date',
      'District',
      'Location',
      'Crop',
      'AI Suggested Disease',
      'AI Confidence (%)',
      'Case Priority',
      'Case Status',
      'Expert Confirmed Disease',
      'Verification Status',
      'Assigned Officer',
    ];

    const rows = cases.map((c) => {
      const isConfirmed = Boolean(c.publishedResponse && !c.publishedResponse.isWithdrawn);
      const confirmedDisease = isConfirmed ? c.publishedResponse!.confirmedDisease : 'Pending Review';
      const verificationStatus = isConfirmed ? 'Expert-Confirmed' : 'Unverified AI Suggestion';

      return [
        sanitizeCell(c._id.toString()),
        sanitizeCell(c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''),
        sanitizeCell(c.district),
        sanitizeCell(c.location),
        sanitizeCell(c.crop),
        sanitizeCell(c.aiSuggestedDisease),
        sanitizeCell(c.aiConfidence),
        sanitizeCell(c.priority),
        sanitizeCell(c.status),
        sanitizeCell(confirmedDisease),
        sanitizeCell(verificationStatus),
        sanitizeCell(c.assignedOfficerName || 'Unassigned'),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="cropcare_analytics_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Saved Analytics Views CRUD
export const getSavedViews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const officerId = req.user!._id;
    const views = await SavedAnalyticsView.find({ officerId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, views });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSavedView = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const officerId = req.user!._id;
    const { name, filters } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'View name is required.' });
      return;
    }

    const view = new SavedAnalyticsView({
      officerId,
      name: name.trim(),
      filters: filters || {},
    });

    await view.save();

    res.status(201).json({
      success: true,
      message: 'Analytics view saved successfully.',
      view,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSavedView = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const officerId = req.user!._id;
    const { name, filters } = req.body;

    const view = await SavedAnalyticsView.findOne({ _id: req.params.id, officerId });
    if (!view) {
      res.status(404).json({ success: false, message: 'Saved view not found.' });
      return;
    }

    if (name !== undefined) view.name = name.trim();
    if (filters !== undefined) view.filters = filters;

    await view.save();

    res.status(200).json({
      success: true,
      message: 'Saved view updated successfully.',
      view,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSavedView = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const officerId = req.user!._id;
    const view = await SavedAnalyticsView.findOneAndDelete({ _id: req.params.id, officerId });

    if (!view) {
      res.status(404).json({ success: false, message: 'Saved view not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Saved view deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
