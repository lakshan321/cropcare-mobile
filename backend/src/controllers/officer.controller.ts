import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Consultation } from '../models/Consultation';
import { CaseStatus, CasePriority } from '../types';

export const getOfficerCases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, priority, district, sort = 'newest', page = '1', limit = '20' } = req.query;

    const query: any = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (priority && priority !== 'All') {
      query.priority = priority;
    }
    if (district && district !== 'All') {
      query.district = district;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { farmerName: searchRegex },
        { crop: searchRegex },
        { location: searchRegex },
        { district: searchRegex },
        { aiSuggestedDisease: searchRegex },
      ];
    }

    const sortOption: any = {};
    if (sort === 'highest_priority') {
      // High, Medium, Low sort
      sortOption.priority = -1;
      sortOption.createdAt = -1;
    } else {
      sortOption.createdAt = -1;
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [cases, total, counts] = await Promise.all([
      Consultation.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Consultation.countDocuments(query),
      Consultation.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCounts: Record<string, number> = {
      Submitted: 0,
      'In Review': 0,
      Resolved: 0,
    };
    counts.forEach((c) => {
      if (c._id && statusCounts[c._id] !== undefined) {
        statusCounts[c._id] = c.count;
      }
    });

    const highPriorityCount = await Consultation.countDocuments({
      priority: 'High',
      status: { $ne: 'Resolved' },
    });

    res.status(200).json({
      success: true,
      cases,
      counts: {
        total: statusCounts.Submitted + statusCounts['In Review'] + statusCounts.Resolved,
        submitted: statusCounts.Submitted,
        inReview: statusCounts['In Review'],
        resolved: statusCounts.Resolved,
        open: statusCounts.Submitted + statusCounts['In Review'],
        highPriority: highPriorityCount,
      },
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

export const getOfficerCaseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      res.status(404).json({ success: false, message: 'Case not found.' });
      return;
    }

    res.status(200).json({ success: true, case: consultation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCaseAssignmentAndPriority = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { assignedOfficerId, assignedOfficerName, priority, status } = req.body;
    const officer = req.user!;

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      res.status(404).json({ success: false, message: 'Case not found.' });
      return;
    }

    const previousStatus = consultation.status;

    if (priority && ['Low', 'Medium', 'High'].includes(priority)) {
      consultation.priority = priority as CasePriority;
    }

    if (assignedOfficerId !== undefined) {
      consultation.assignedOfficerId = assignedOfficerId || officer._id;
      consultation.assignedOfficerName = assignedOfficerName || officer.fullName;
    }

    // Permitted state transitions check: Submitted -> In Review -> Resolved
    if (status && status !== consultation.status) {
      const valid =
        (consultation.status === 'Submitted' && status === 'In Review') ||
        (consultation.status === 'In Review' && status === 'Resolved') ||
        (consultation.status === 'Resolved' && status === 'In Review'); // via withdrawal

      if (!valid) {
        res.status(400).json({
          success: false,
          message: `Invalid state transition from '${consultation.status}' to '${status}'. Permitted: Submitted -> In Review -> Resolved.`,
        });
        return;
      }

      consultation.status = status as CaseStatus;
      consultation.auditTrail.push({
        action: 'STATUS_CHANGED',
        by: {
          id: officer._id.toString(),
          name: officer.fullName,
          role: officer.role,
        },
        timestamp: new Date(),
        note: `Status updated from ${previousStatus} to ${status}.`,
        previousStatus,
        newStatus: status,
      });
    }

    consultation.version += 1;
    await consultation.save();

    res.status(200).json({
      success: true,
      message: 'Case updated successfully.',
      case: consultation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const savePrivateDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const officer = req.user!;
    const { confirmedDisease, severity, treatment, instructions, followUpDate, expectedVersion } = req.body;

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      res.status(404).json({ success: false, message: 'Case not found.' });
      return;
    }

    // Concurrency check
    if (expectedVersion !== undefined && consultation.version !== expectedVersion) {
      res.status(409).json({
        success: false,
        message: 'Conflict: This case has been modified by another officer. Please reload and try again.',
        currentVersion: consultation.version,
      });
      return;
    }

    consultation.privateDraft = {
      confirmedDisease: confirmedDisease || '',
      severity: severity || 'Moderate',
      treatment: treatment || '',
      instructions: instructions || '',
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      updatedAt: new Date(),
      officerId: officer._id,
    };

    // Transition Submitted to In Review automatically when draft is started
    if (consultation.status === 'Submitted') {
      consultation.status = 'In Review';
      consultation.assignedOfficerId = officer._id;
      consultation.assignedOfficerName = officer.fullName;
    }

    consultation.auditTrail.push({
      action: 'DRAFT_SAVED',
      by: {
        id: officer._id.toString(),
        name: officer.fullName,
        role: officer.role,
      },
      timestamp: new Date(),
      note: 'Officer updated private working draft.',
    });

    consultation.version += 1;
    await consultation.save();

    res.status(200).json({
      success: true,
      message: 'Private draft saved successfully.',
      draft: consultation.privateDraft,
      case: consultation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPrivateDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      res.status(404).json({ success: false, message: 'Case not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      draft: consultation.privateDraft || null,
      version: consultation.version,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePrivateDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const officer = req.user!;
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      res.status(404).json({ success: false, message: 'Case not found.' });
      return;
    }

    consultation.privateDraft = undefined;
    consultation.auditTrail.push({
      action: 'DRAFT_DISCARDED',
      by: {
        id: officer._id.toString(),
        name: officer.fullName,
        role: officer.role,
      },
      timestamp: new Date(),
      note: 'Officer discarded working draft.',
    });

    consultation.version += 1;
    await consultation.save();

    res.status(200).json({
      success: true,
      message: 'Private draft discarded successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const publishResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const officer = req.user!;
    const { confirmedDisease, severity, treatment, instructions, followUpDate, expectedVersion } = req.body;

    if (!confirmedDisease || !treatment || !instructions) {
      res.status(400).json({
        success: false,
        message: 'Validation failed: Confirmed disease, treatment, and instructions are required to publish.',
      });
      return;
    }

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      res.status(404).json({ success: false, message: 'Case not found.' });
      return;
    }

    // Concurrency check
    if (expectedVersion !== undefined && consultation.version !== expectedVersion) {
      res.status(409).json({
        success: false,
        message: 'Conflict: This case has been updated elsewhere. Please refresh before publishing.',
        currentVersion: consultation.version,
      });
      return;
    }

    const previousStatus = consultation.status;

    // Securely use authenticated officer identity
    consultation.publishedResponse = {
      confirmedDisease: confirmedDisease.trim(),
      severity: severity || 'Moderate',
      treatment: treatment.trim(),
      instructions: instructions.trim(),
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      officerId: officer._id,
      officerName: officer.fullName,
      publishedAt: new Date(),
      isWithdrawn: false,
    };

    // Remove private draft upon successful publish
    consultation.privateDraft = undefined;
    consultation.status = 'Resolved';
    consultation.assignedOfficerId = officer._id;
    consultation.assignedOfficerName = officer.fullName;

    consultation.auditTrail.push({
      action: 'RESPONSE_PUBLISHED',
      by: {
        id: officer._id.toString(),
        name: officer.fullName,
        role: officer.role,
      },
      timestamp: new Date(),
      note: `Published expert diagnosis: "${confirmedDisease}". Case marked Resolved.`,
      previousStatus,
      newStatus: 'Resolved',
    });

    consultation.version += 1;
    await consultation.save();

    res.status(200).json({
      success: true,
      message: 'Expert response published successfully to the farmer.',
      case: consultation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editPublishedResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const officer = req.user!;
    const { confirmedDisease, severity, treatment, instructions, followUpDate } = req.body;

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation || !consultation.publishedResponse) {
      res.status(404).json({ success: false, message: 'No published response found for this case.' });
      return;
    }

    if (confirmedDisease !== undefined) consultation.publishedResponse.confirmedDisease = confirmedDisease.trim();
    if (severity !== undefined) consultation.publishedResponse.severity = severity;
    if (treatment !== undefined) consultation.publishedResponse.treatment = treatment.trim();
    if (instructions !== undefined) consultation.publishedResponse.instructions = instructions.trim();
    if (followUpDate !== undefined) consultation.publishedResponse.followUpDate = followUpDate ? new Date(followUpDate) : undefined;
    consultation.publishedResponse.updatedAt = new Date();

    consultation.auditTrail.push({
      action: 'RESPONSE_EDITED',
      by: {
        id: officer._id.toString(),
        name: officer.fullName,
        role: officer.role,
      },
      timestamp: new Date(),
      note: 'Officer revised published advice content.',
    });

    consultation.version += 1;
    await consultation.save();

    res.status(200).json({
      success: true,
      message: 'Published response updated successfully.',
      case: consultation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const withdrawResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const officer = req.user!;
    const { reason } = req.body;

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation || !consultation.publishedResponse) {
      res.status(404).json({ success: false, message: 'No published response to withdraw.' });
      return;
    }

    const previousStatus = consultation.status;

    consultation.publishedResponse.isWithdrawn = true;
    consultation.publishedResponse.withdrawnAt = new Date();
    consultation.status = 'In Review'; // Reopen case

    consultation.auditTrail.push({
      action: 'RESPONSE_WITHDRAWN',
      by: {
        id: officer._id.toString(),
        name: officer.fullName,
        role: officer.role,
      },
      timestamp: new Date(),
      note: reason ? `Response withdrawn: ${reason}` : 'Response withdrawn and case reopened to In Review.',
      previousStatus,
      newStatus: 'In Review',
    });

    consultation.version += 1;
    await consultation.save();

    res.status(200).json({
      success: true,
      message: 'Expert response withdrawn. Case has been reopened to In Review.',
      case: consultation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
