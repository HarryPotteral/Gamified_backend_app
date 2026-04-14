const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'parent'], default: 'student' },
  grade: { type: Number, min: 6, max: 12 }, // only for students
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  lastActive: { type: Date },
  subjects: { // per-subject progress (0-100)
    math: { type: Number, default: 0 },
    science: { type: Number, default: 0 },
    tamil: { type: Number, default: 0 },
    english: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);