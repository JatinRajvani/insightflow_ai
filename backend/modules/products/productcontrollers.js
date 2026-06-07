const { getDB } = require('../../config/db');
const { ObjectId } = require('mongodb');
const { generateProductReport } = require('../../services/report.service');

/**
 * Helper to generate and save/cache a product report
 */
async function generateAndCacheReport(db, productName, themeStats, feedbackDocs) {
  const feedbackSamples = feedbackDocs.map(f => ({
    feedback: f.feedback,
    sentiment: f.sentiment,
    type: f.type,
    theme: f.theme
  }));

  const reportData = await generateProductReport(productName, themeStats, feedbackSamples);
  
  const reportDoc = {
    productName,
    ...reportData,
    lastUpdated: new Date()
  };

  await db.collection('product_analysis').updateOne(
    { productName },
    { $set: reportDoc },
    { upsert: true }
  );

  return reportDoc;
}

/**
 * Add a new product
 */
async function createProduct(req, res) {
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Product name is required and must be a string' });
  }

  const trimmedName = name.trim();

  try {
    const db = getDB();

    // Check if product already exists
    const existing = await db.collection('products').findOne({ name: trimmedName });
    if (existing) {
      return res.status(400).json({ error: `Product with name "${trimmedName}" already exists` });
    }

    const newProduct = {
      name: trimmedName,
      description: description || '',
      createdAt: new Date()
    };

    const result = await db.collection('products').insertOne(newProduct);
    newProduct._id = result.insertedId;

    return res.status(201).json({
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Internal server error while creating product' });
  }
}

/**
 * Get all products
 */
async function getAllProducts(req, res) {
  try {
    const db = getDB();
    const products = await db.collection('products').find().sort({ name: 1 }).toArray();
    return res.status(200).json({ data: products });
  } catch (error) {
    console.error('Error listing products:', error);
    return res.status(500).json({ error: 'Internal server error while retrieving products' });
  }
}

/**
 * Get live metrics, associated themes, and cached/fresh AI report for a product
 */
async function getProductAnalysis(req, res) {
  const { productName } = req.params;

  try {
    const db = getDB();

    // Verify if product exists
    const product = await db.collection('products').findOne({ name: productName });
    if (!product) {
      return res.status(404).json({ error: `Product "${productName}" not found` });
    }

    // 1. Gather all feedbacks for this product to compute live stats
    const feedbacks = await db.collection('feedbacks').find({ productName }).sort({ createdAt: -1 }).toArray();
    
    const totalFeedbacks = feedbacks.length;
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    feedbacks.forEach(f => {
      if (f.sentiment === 'positive') positiveCount++;
      else if (f.sentiment === 'neutral') neutralCount++;
      else if (f.sentiment === 'negative') negativeCount++;
    });

    // Compute direct ratings and splits
    let overallRating = 0.0;
    if (totalFeedbacks > 0) {
      overallRating = parseFloat(((positiveCount * 5 + neutralCount * 3 + negativeCount * 1) / totalFeedbacks).toFixed(1));
    }

    const positivePercentage = totalFeedbacks > 0 ? Math.round((positiveCount / totalFeedbacks) * 100) : 0;
    const neutralPercentage = totalFeedbacks > 0 ? Math.round((neutralCount / totalFeedbacks) * 100) : 0;
    const negativePercentage = totalFeedbacks > 0 ? Math.round((negativeCount / totalFeedbacks) * 100) : 0;

    // 2. Fetch all themes for this product
    const themes = await db.collection('theme_memory').find({ productName }).sort({ mentions: -1 }).toArray();

    // 3. Fetch cached AI report (or generate a fresh one if missing, but only if feedback exists)
    let aiReport = null;
    if (totalFeedbacks > 0) {
      aiReport = await db.collection('product_analysis').findOne({ productName });
      if (!aiReport) {
        // Use up to 10 latest feedbacks as sample context
        const feedbackSamples = feedbacks.slice(0, 10);
        aiReport = await generateAndCacheReport(db, productName, themes, feedbackSamples);
      }
    }

    return res.status(200).json({
      data: {
        productName,
        summary: {
          totalFeedbacks,
          positiveCount,
          neutralCount,
          negativeCount,
          overallRating,
          sentimentDistribution: {
            positivePercentage,
            neutralPercentage,
            negativePercentage
          }
        },
        themes,
        aiReport
      }
    });

  } catch (error) {
    console.error(`Error in getProductAnalysis for "${productName}":`, error);
    return res.status(500).json({ error: 'Internal server error while generating product analysis' });
  }
}

/**
 * Manually force regeneration of the cached AI analysis report
 */
async function regenerateProductAnalysis(req, res) {
  const { productName } = req.params;

  try {
    const db = getDB();

    // Verify if product exists
    const product = await db.collection('products').findOne({ name: productName });
    if (!product) {
      return res.status(404).json({ error: `Product "${productName}" not found` });
    }

    // Gather themes and feedback samples
    const themes = await db.collection('theme_memory').find({ productName }).sort({ mentions: -1 }).toArray();
    const feedbacks = await db.collection('feedbacks').find({ productName }).sort({ createdAt: -1 }).limit(10).toArray();
    
    if (feedbacks.length === 0) {
      return res.status(400).json({ error: 'Cannot regenerate AI analysis report without feedback data' });
    }

    // Trigger Groq AI report generation
    console.log(`Regenerating AI analysis report for product: ${productName}`);
    const newReport = await generateAndCacheReport(db, productName, themes, feedbacks);

    return res.status(200).json({
      message: 'Product analysis report regenerated successfully',
      data: newReport
    });
  } catch (error) {
    console.error(`Error in regenerateProductAnalysis for "${productName}":`, error);
    return res.status(500).json({ error: 'Internal server error while regenerating product report' });
  }
}

/**
 * Update product name and description (with cascading name changes in feedbacks, themes, and reports)
 */
async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Product name is required and must be a string' });
  }

  const trimmedName = name.trim();

  try {
    const db = getDB();
    const objectId = new ObjectId(id);

    // 1. Fetch current product details
    const currentProduct = await db.collection('products').findOne({ _id: objectId });
    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const oldName = currentProduct.name;

    // 2. Check if name is being changed and if new name is already taken
    if (trimmedName !== oldName) {
      const existing = await db.collection('products').findOne({ name: trimmedName });
      if (existing) {
        return res.status(400).json({ error: `Product with name "${trimmedName}" already exists` });
      }
    }

    // 3. Update the product
    await db.collection('products').updateOne(
      { _id: objectId },
      { $set: { name: trimmedName, description: description || '' } }
    );

    // 4. Cascade name changes across related collections if the name was updated
    if (trimmedName !== oldName) {
      console.log(`Cascading name change from "${oldName}" to "${trimmedName}"...`);
      await Promise.all([
        db.collection('feedbacks').updateMany({ productName: oldName }, { $set: { productName: trimmedName } }),
        db.collection('theme_memory').updateMany({ productName: oldName }, { $set: { productName: trimmedName } }),
        db.collection('product_analysis').updateMany({ productName: oldName }, { $set: { productName: trimmedName } })
      ]);
    }

    return res.status(200).json({
      message: 'Product updated successfully',
      data: {
        _id: objectId,
        name: trimmedName,
        description: description || ''
      }
    });

  } catch (error) {
    console.error(`Error updating product "${id}":`, error);
    return res.status(500).json({ error: 'Internal server error while updating product' });
  }
}

/**
 * Delete product and cascade delete all associated feedbacks, theme memory, and reports
 */
async function deleteProduct(req, res) {
  const { id } = req.params;

  try {
    const db = getDB();
    const objectId = new ObjectId(id);

    // 1. Find product to get its name
    const product = await db.collection('products').findOne({ _id: objectId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const productName = product.name;

    // 2. Delete product from database
    await db.collection('products').deleteOne({ _id: objectId });

    // 3. Cascade delete from related collections
    console.log(`Cascade deleting feedbacks, themes, and reports for product: "${productName}"...`);
    await Promise.all([
      db.collection('feedbacks').deleteMany({ productName }),
      db.collection('theme_memory').deleteMany({ productName }),
      db.collection('product_analysis').deleteMany({ productName })
    ]);

    return res.status(200).json({
      message: `Product "${productName}" and all associated feedback data deleted successfully`
    });

  } catch (error) {
    console.error(`Error deleting product "${id}":`, error);
    return res.status(500).json({ error: 'Internal server error while deleting product' });
  }
}

module.exports = {
  createProduct,
  getAllProducts,
  getProductAnalysis,
  regenerateProductAnalysis,
  updateProduct,
  deleteProduct
};
