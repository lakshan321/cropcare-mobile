import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/auth';

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(50),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    district: z.string().optional(),
    phone: z.string().optional(),
    // Any role supplied in public registration is ignored or rejected
    role: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const generateToken = (userId: string, username: string, role: string): string => {
  return jwt.sign({ userId, username, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, fullName, district, phone } = req.body;

    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this username already exists.',
      });
      return;
    }

    // Explicitly enforce role 'farmer' on all public registrations
    const user = new User({
      username: username.toLowerCase().trim(),
      password,
      fullName: fullName.trim(),
      role: 'farmer',
      district: district || 'Kandy',
      phone: phone || '',
    });

    await user.save();

    const token = generateToken(user._id.toString(), user.username, user.role);

    res.status(201).json({
      success: true,
      message: 'Farmer account registered successfully.',
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        district: user.district,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed.',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
      return;
    }

    const token = generateToken(user._id.toString(), user.username, user.role);

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        district: user.district,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed.',
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      fullName: req.user.fullName,
      role: req.user.role,
      district: req.user.district,
      phone: req.user.phone,
      createdAt: req.user.createdAt,
    },
  });
};
