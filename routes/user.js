const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile (XP, streak, etc.)
router.patch('/profile', auth, async (req, res) => {
  try {
    const updates = {};
    const allowed = ['xp', 'streak', 'gamesPlayed', 'subjects'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;