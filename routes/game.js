const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const GameResult = require('../models/GameResult');
const router = express.Router();

// Submit game result
router.post('/result', auth, async (req, res) => {
  try {
    const { gameId, score, xpEarned } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Update XP and gamesPlayed
    user.xp = (user.xp || 0) + xpEarned;
    user.gamesPlayed = (user.gamesPlayed || 0) + 1;
    
    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = user.lastActive ? new Date(user.lastActive) : null;
    if (lastActive) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastActive.getTime() === yesterday.getTime()) {
        user.streak = (user.streak || 0) + 1;
      } else if (lastActive.getTime() !== today.getTime()) {
        user.streak = 1;
      }
    } else {
      user.streak = 1;
    }
    user.lastActive = new Date();
    
    await user.save();
    
    // Save game result for analytics
    await GameResult.create({
      userId: user._id,
      gameId,
      score,
      xpEarned
    });
    
    res.json({
      xp: user.xp,
      streak: user.streak,
      gamesPlayed: user.gamesPlayed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard for a grade
router.get('/leaderboard/:grade', async (req, res) => {
  try {
    const grade = parseInt(req.params.grade);
    const users = await User.find({ role: 'student', grade })
      .sort('-xp')
      .limit(20)
      .select('name xp streak');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;