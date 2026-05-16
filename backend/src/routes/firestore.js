/**
 * routes/firestore.js
 * REST endpoints for Firestore data (activity feed, notifications, stats)
 * Frontend uses these as fallback; it can also subscribe directly via Firebase JS SDK
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  getRecentActivity,
  getUserNotifications,
  markNotificationRead,
  logActivity,
} = require('../services/firestoreService');

// GET /api/firestore/activity?limit=20
// Returns recent ecosystem activity feed
router.get('/activity', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = await getRecentActivity(limit);
    res.json({ success: true, data: activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/firestore/notifications
// Returns notifications for the logged-in user
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user.id);
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/firestore/notifications/:id/read
router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await markNotificationRead(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/firestore/activity (admin only — manual event logging)
router.post('/activity', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const { type, title, description, meta } = req.body;
    await logActivity({ type, title, description, meta, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;