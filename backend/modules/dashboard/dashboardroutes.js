const express = require('express');
const router = express.Router();
const { getDashboardOverview, getGlobalRecommendations, regenerateGlobalRecommendations, getFeedbackAnalytics } = require('./dashboardcontrollers');

// GET /api/dashboard/overview - Retrieve dashboard overview metrics
router.get('/overview', getDashboardOverview);

// GET /api/dashboard/recommendations - Fetch global AI strategic recommendations
router.get('/recommendations', getGlobalRecommendations);

// POST /api/dashboard/recommendations/regenerate - Force regenerate global AI brief
router.post('/recommendations/regenerate', regenerateGlobalRecommendations);

// GET /api/dashboard/analytics - Fetch channel and category volume metrics
router.get('/analytics', getFeedbackAnalytics);

module.exports = router;
