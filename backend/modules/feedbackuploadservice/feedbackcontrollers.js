const { getDB } = require('../../config/db');
const { analyzeFeedbackText } = require('../../services/ai.service');

/**
 * Handle a single text feedback upload, run AI extraction, and update memory engine.
 */
async function uploadFeedback(req, res) {
  const { feedback } = req.body;

  if (!feedback || typeof feedback !== 'string' || feedback.trim() === '') {
    return res.status(400).json({ error: 'Feedback text is required and must be a string' });
  }

  try {
    const db = getDB();

    // 1. Retrieve all company products
    const productsList = await db.collection('products').find().toArray();
    const availableProducts = productsList.map(p => p.name);
    const defaultProduct = req.body.productName || 'General';

    // 2. Retrieve all unique existing theme names for AI context mapping
    const existingThemesDocs = await db.collection('theme_memory').find({}, { projection: { theme: 1 } }).toArray();
    const existingThemes = [...new Set(existingThemesDocs.map(doc => doc.theme))];

    // 3. Call the AI service to analyze and structure fields
    const analyzedFields = await analyzeFeedbackText(feedback, existingThemes, availableProducts, defaultProduct);

    // 4. Save the analyzed feedback to the database
    const feedbackDoc = {
      ...analyzedFields,
      createdAt: new Date()
    };
    const feedbackResult = await db.collection('feedbacks').insertOne(feedbackDoc);
    feedbackDoc._id = feedbackResult.insertedId;

    // 5. Update the theme memory stats (upsert per product)
    const isPos = analyzedFields.sentiment === 'positive' ? 1 : 0;
    const isNeu = analyzedFields.sentiment === 'neutral' ? 1 : 0;
    const isNeg = analyzedFields.sentiment === 'negative' ? 1 : 0;

    await db.collection('theme_memory').updateOne(
      { theme: analyzedFields.theme, productName: analyzedFields.productName },
      {
        $setOnInsert: {
          firstSeen: new Date(),
          trend: 'Stable',
          history: []
        },
        $set: {
          lastSeen: new Date()
        },
        $inc: {
          mentions: 1,
          positiveCount: isPos,
          neutralCount: isNeu,
          negativeCount: isNeg
        }
      },
      { upsert: true }
    );

    // 5b. Dynamically recalculate trend based on frequency per product
    await updateThemeTrend(db, analyzedFields.theme, analyzedFields.productName);

    // 6. Return success and the parsed feedback structure
    return res.status(201).json({
      message: 'Feedback uploaded and analyzed successfully',
      data: feedbackDoc
    });

  } catch (error) {
    console.error('Error in uploadFeedback controller:', error);
    return res.status(500).json({
      error: 'An error occurred while uploading and analyzing feedback',
      details: error.message
    });
  }
}

/**
 * Get all analyzed feedbacks from the database.
 */
async function getAllFeedbacks(req, res) {
  try {
    const db = getDB();
    const query = {};
    if (req.query.theme) {
      query.theme = req.query.theme;
    }
    if (req.query.productName) {
      query.productName = req.query.productName;
    }
    const feedbacks = await db.collection('feedbacks').find(query).sort({ createdAt: -1 }).toArray();
    return res.status(200).json({ data: feedbacks });
  } catch (error) {
    console.error('Error in getAllFeedbacks controller:', error);
    return res.status(500).json({ error: 'Failed to retrieve feedbacks' });
  }
}

/**
 * Get all theme memories from the database.
 */
async function getThemes(req, res) {
  try {
    const db = getDB();
    const themes = await db.collection('theme_memory').find().toArray();
    return res.status(200).json({ data: themes });
  } catch (error) {
    console.error('Error in getThemes controller:', error);
    return res.status(500).json({ error: 'Failed to retrieve theme memory' });
  }
}

/**
 * Calculates and updates the trend for a theme dynamically.
 * Compares mentions in the last 7 days vs mentions in the 7 days prior.
 */
async function updateThemeTrend(db, theme, productName) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  try {
    const recentCount = await db.collection('feedbacks').countDocuments({
      theme: theme,
      productName: productName,
      createdAt: { $gte: sevenDaysAgo, $lte: now }
    });

    const previousCount = await db.collection('feedbacks').countDocuments({
      theme: theme,
      productName: productName,
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
    });

    let trend = 'Stable';
    if (recentCount > previousCount) {
      trend = 'Increasing';
    } else if (recentCount < previousCount) {
      trend = 'Decreasing';
    }

    await db.collection('theme_memory').updateOne(
      { theme: theme, productName: productName },
      { $set: { trend: trend } }
    );
  } catch (error) {
    console.error(`Error calculating trend for theme "${theme}" (product: "${productName}"):`, error);
  }
}

/**
 * Handle a batch upload of feedback objects, run AI extraction sequentially, and update theme memory.
 */
async function uploadFeedbackBatch(req, res) {
  const { feedbacks } = req.body;

  if (!feedbacks || !Array.isArray(feedbacks) || feedbacks.length === 0) {
    return res.status(400).json({ error: 'Feedbacks list must be a non-empty array' });
  }

  try {
    const db = getDB();

    // 1. Retrieve all company products
    const productsList = await db.collection('products').find().toArray();
    const availableProducts = productsList.map(p => p.name);

    const processedResults = [];

    // 2. Loop through each feedback item sequentially to avoid rate-limiting
    for (const item of feedbacks) {
      const feedbackText = item.feedback;
      if (!feedbackText || typeof feedbackText !== 'string' || feedbackText.trim() === '') {
        continue; // skip empty rows
      }

      // Retrieve unique themes for context mapping (refresh inside loop so we remember newly created themes!)
      const existingThemesDocs = await db.collection('theme_memory').find({}, { projection: { theme: 1 } }).toArray();
      const existingThemes = [...new Set(existingThemesDocs.map(doc => doc.theme))];

      const defaultProduct = item.productName || 'General';
      const defaultPlatform = item.platform || 'CSV Upload';

      // Call AI classifier
      const analyzedFields = await analyzeFeedbackText(feedbackText, existingThemes, availableProducts, defaultProduct);

      // Force platform if provided in CSV
      analyzedFields.platform = defaultPlatform;

      const feedbackDoc = {
        ...analyzedFields,
        createdAt: new Date()
      };

      const result = await db.collection('feedbacks').insertOne(feedbackDoc);
      feedbackDoc._id = result.insertedId;

      // Update theme memory stats
      const isPos = analyzedFields.sentiment === 'positive' ? 1 : 0;
      const isNeu = analyzedFields.sentiment === 'neutral' ? 1 : 0;
      const isNeg = analyzedFields.sentiment === 'negative' ? 1 : 0;

      await db.collection('theme_memory').updateOne(
        { theme: analyzedFields.theme, productName: analyzedFields.productName },
        {
          $setOnInsert: {
            firstSeen: new Date(),
            trend: 'Stable',
            history: []
          },
          $set: {
            lastSeen: new Date()
          },
          $inc: {
            mentions: 1,
            positiveCount: isPos,
            neutralCount: isNeu,
            negativeCount: isNeg
          }
        },
        { upsert: true }
      );

      // Recalculate trend
      await updateThemeTrend(db, analyzedFields.theme, analyzedFields.productName);

      processedResults.push(feedbackDoc);
    }

    return res.status(201).json({
      message: `Processed and analyzed ${processedResults.length} feedbacks successfully`,
      data: processedResults
    });

  } catch (error) {
    console.error('Error in uploadFeedbackBatch controller:', error);
    return res.status(500).json({
      error: 'An error occurred while uploading the feedback batch',
      details: error.message
    });
  }
}

module.exports = {
  uploadFeedback,
  getAllFeedbacks,
  getThemes,
  uploadFeedbackBatch
};
