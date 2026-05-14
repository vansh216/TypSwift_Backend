import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../model/User.model.js';

// ─────────────────────────────────────────
// Helper — generate JWT token
// ─────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Check all fields are present
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required',
      });
    }

    // 2. Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email
          ? 'Email already in use'
          : 'Username already taken',
      });
    }

    // 3. Hash password
    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // 5. Return token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id      : user._id,
        username: user.username,
        email   : user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // 2. Find user — include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 4. Return token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id      : user._id,
        username: user.username,
        email   : user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id      : req.user._id,
        username: req.user.username,
        email   : req.user.email,
        avatar  : req.user.avatar,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};