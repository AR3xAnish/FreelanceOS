const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Get token from authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required. Access denied.' });
    }

    const token = authHeader.replace('Bearer ', '');

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretfreelanceoskey123!');

    // 3. Find user and attach to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User session not found. Access denied.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token. Access denied.' });
  }
};

module.exports = authMiddleware;
