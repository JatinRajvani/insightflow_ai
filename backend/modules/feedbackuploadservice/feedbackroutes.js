const express = require('express');
const router = express.Router();
const { uploadFeedback, getAllFeedbacks, getThemes, uploadFeedbackBatch } = require('./feedbackcontrollers');

// POST /api/feedback/upload - Upload feedback and analyze it
router.post('/upload', uploadFeedback);

// POST /api/feedback/upload-batch - Bulk upload feedbacks from CSV
router.post('/upload-batch', uploadFeedbackBatch);

// GET /api/feedback - Retrieve all analyzed feedbacks
router.get('/', getAllFeedbacks);

// GET /api/feedback/themes - Retrieve all theme memories
router.get('/themes', getThemes);

module.exports = router;
