import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import User from '../models/User.js';
import env from '../config/env.js';

function generateToken(userId) {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

export async function signup(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      authProvider: 'local',
    });

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Invalid credentials' });

    const token = generateToken(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar },
    });
  })(req, res, next);
}

export async function googleAuth(req, res, next) {
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
}

export async function googleCallback(req, res, next) {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
    }
    const token = generateToken(user._id);
    res.redirect(`${env.CLIENT_URL}/auth/callback?token=${token}`);
  })(req, res, next);
}

export async function getMe(req, res) {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
      slackConfig: req.user.slackConfig,
    },
  });
}

export async function updateProfile(req, res, next) {
  try {
    const { name, slackConfig } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (slackConfig) updates.slackConfig = slackConfig;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-passwordHash');
    res.json({ user });
  } catch (error) {
    next(error);
  }
}
