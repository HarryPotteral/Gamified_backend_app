const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Middleware to ensure teacher role
async function teacherOnly(req, res, next) {
  const user = await User.findById(req.userId);
  if (!user || user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  req.teacher = user;
  next();
}

// Get all students (optionally filtered by grade)
router.get('/students', auth, teacherOnly, async (req, res) => {
  try {
    const { grade } = req.query;
    const filter = { role: 'student' };
    if (grade) filter.grade = parseInt(grade);
    const students = await User.find(filter).select('-password').sort('name');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get at-risk students (low streak, inactive)
router.get('/atrisk', auth, teacherOnly, async (req, res) => {
  try {
    const { grade } = req.query;
    const filter = { role: 'student' };
    if (grade) filter.grade = parseInt(grade);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const atRisk = await User.find({
      ...filter,
      $or: [
        { streak: 0 },
        { lastActive: { $lt: oneWeekAgo } },
        { xp: { $lt: 1000 } } // threshold can be adjusted
      ]
    }).select('name grade xp streak lastActive').sort('-xp');
    
    res.json(atRisk);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get class statistics
router.get('/stats/:grade', auth, teacherOnly, async (req, res) => {
  try {
    const grade = parseInt(req.params.grade);
    const students = await User.find({ role: 'student', grade });
    
    const total = students.length;
    const avgXP = total > 0 ? students.reduce((sum, s) => sum + s.xp, 0) / total : 0;
    const atRiskCount = students.filter(s => s.streak === 0 || !s.lastActive || s.lastActive < new Date(Date.now() - 7*24*60*60*1000)).length;
    
    // Per-subject averages
    const subjects = ['math', 'science', 'tamil', 'english'];
    const subjectAvgs = {};
    subjects.forEach(sub => {
      const sum = students.reduce((acc, s) => acc + (s.subjects?.[sub] || 0), 0);
      subjectAvgs[sub] = total > 0 ? Math.round(sum / total) : 0;
    });
    
    res.json({
      totalStudents: total,
      avgXP: Math.round(avgXP),
      atRiskCount,
      subjects: subjects.map(id => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        avg: subjectAvgs[id]
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Send nudge (simplified – just logs; could integrate with email/push)
router.post('/nudge', auth, teacherOnly, async (req, res) => {
  try {
    const { studentId, message } = req.body;
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    // In production: send email or push notification
    console.log(`NUDGE: Teacher ${req.teacher.name} nudged ${student.name}: ${message}`);
    
    // Could store in a notifications collection
    
    res.json({ success: true, message: `Nudge sent to ${student.name}` });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;