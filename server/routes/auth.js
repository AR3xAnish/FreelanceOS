const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretfreelanceoskey123!';

// JWT Token Generator Helper
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, businessName, logo, address, gstNumber, currency } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required fields.' });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use.' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      businessName,
      logo,
      address,
      gstNumber,
      currency,
    });

    await user.save();

    // Generate Token
    const token = generateToken(user._id);

    // Respond with user details (excluding password) and token
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ error: 'Server registration error. Please try again.' });
  }
});

// @route   POST /api/auth/login
// @desc    Log in user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required fields.' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Generate Token
    const token = generateToken(user._id);

    // Respond with user details (excluding password) and token
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Server login error. Please try again.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get authenticated user profile
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;
