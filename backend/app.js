const express = require('express');
const cors = require('cors');
const feedbackRoutes = require('./modules/feedbackuploadservice/feedbackroutes');
const productRoutes = require('./modules/products/productroutes');
const dashboardRoutes = require('./modules/dashboard/dashboardroutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/feedback', feedbackRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to InsightFlow AI Backend API (Phase 1)' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

module.exports = app;
