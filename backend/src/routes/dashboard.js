const express = require('express');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { getDashboardOverview, getEcosystemInsights, getAnalyticsSummary } = require('../services/analyticsService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/dashboard/overview
router.get('/overview', optionalAuth, async (req, res) => {
  try {
    const data = await getDashboardOverview();
    return success(res, data, 'Dashboard overview loaded');
  } catch (err) {
    logger.error('Dashboard overview error:', err);
    return error(res, 'Failed to load dashboard');
  }
});

// GET /api/dashboard/analytics
router.get('/analytics', optionalAuth, async (req, res) => {
  try {
    const data = await getAnalyticsSummary();
    return success(res, data, 'Analytics loaded');
  } catch (err) {
    logger.error('Analytics error:', err);
    return error(res, 'Failed to load analytics');
  }
});

// GET /api/dashboard/insights
router.get('/insights', optionalAuth, async (req, res) => {
  try {
    const data = await getEcosystemInsights();
    return success(res, data, 'Ecosystem insights generated');
  } catch (err) {
    logger.error('Insights error:', err);
    return error(res, 'Failed to generate insights');
  }
});

module.exports = router;
