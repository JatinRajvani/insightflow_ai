const express = require('express');
const router = express.Router();
const { createProduct, getAllProducts, getProductAnalysis, regenerateProductAnalysis, updateProduct, deleteProduct } = require('./productcontrollers');

// POST /api/products - Create a new product
router.post('/', createProduct);

// GET /api/products - Get all products
router.get('/', getAllProducts);

// GET /api/products/:productName/analysis - Retrieve product analysis summary & AI report
router.get('/:productName/analysis', getProductAnalysis);

// POST /api/products/:productName/analysis/regenerate - Force regenerate the AI report
router.post('/:productName/analysis/regenerate', regenerateProductAnalysis);

// PUT /api/products/:id - Update product details
router.put('/:id', updateProduct);

// DELETE /api/products/:id - Delete product and associated data
router.delete('/:id', deleteProduct);

module.exports = router;
