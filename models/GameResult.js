const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameId: { type: String, required: true },
  score: { type: Number, required: true },
  xpEarned: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GameResult', gameResultSchema);