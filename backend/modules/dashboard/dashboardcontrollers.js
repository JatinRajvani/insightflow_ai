const { getDB } = require('../../config/db');
const { generateGlobalRecommendations } = require('../../services/report.service');

/**
 * Get aggregated dashboard statistics, latest feedbacks, critical issues, and product performance summaries.
 */
async function getDashboardOverview(req, res) {
  try {
    const db = getDB();

    // 1. Fetch total counts
    const productsCount = await db.collection('products').countDocuments();
    const totalFeedbacks = await db.collection('feedbacks').countDocuments();

    // 2. Fetch all feedbacks to compute global sentiment and overall rating
    const feedbacks = await db.collection('feedbacks').find().toArray();

    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    feedbacks.forEach(f => {
      if (f.sentiment === 'positive') positiveCount++;
      else if (f.sentiment === 'neutral') neutralCount++;
      else if (f.sentiment === 'negative') negativeCount++;
    });

    let overallRating = 0.0;
    if (totalFeedbacks > 0) {
      overallRating = parseFloat(((positiveCount * 5 + neutralCount * 3 + negativeCount * 1) / totalFeedbacks).toFixed(1));
    }

    const positivePercentage = totalFeedbacks > 0 ? Math.round((positiveCount / totalFeedbacks) * 100) : 0;
    const neutralPercentage = totalFeedbacks > 0 ? Math.round((neutralCount / totalFeedbacks) * 100) : 0;
    const negativePercentage = totalFeedbacks > 0 ? Math.round((negativeCount / totalFeedbacks) * 100) : 0;

    // 3. Fetch last 5 feedbacks
    const lastFiveFeedbacks = await db.collection('feedbacks')
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // 4. Fetch high priority/critical problems that need immediate action
    const highProblems = await db.collection('feedbacks')
      .find({
        $or: [
          { priority: { $in: ['High', 'Critical'] } },
          { actionability: 'Immediate Action' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // 5. Fetch all products to compile summary list
    const products = await db.collection('products').find().sort({ name: 1 }).toArray();
    const productsSummary = [];

    for (const prod of products) {
      const prodFeedbacks = feedbacks.filter(f => f.productName === prod.name);
      const prodFeedbackCount = prodFeedbacks.length;

      let prodPos = 0;
      let prodNeu = 0;
      let prodNeg = 0;

      prodFeedbacks.forEach(f => {
        if (f.sentiment === 'positive') prodPos++;
        else if (f.sentiment === 'neutral') prodNeu++;
        else if (f.sentiment === 'negative') prodNeg++;
      });

      let prodRating = 0.0;
      if (prodFeedbackCount > 0) {
        prodRating = parseFloat(((prodPos * 5 + prodNeu * 3 + prodNeg * 1) / prodFeedbackCount).toFixed(1));
      }

      // Find top theme for this product from theme_memory
      const topThemeDoc = await db.collection('theme_memory')
        .findOne({ productName: prod.name }, { sort: { mentions: -1 } });

      productsSummary.push({
        _id: prod._id,
        name: prod.name,
        description: prod.description,
        totalFeedbacks: prodFeedbackCount,
        overallRating: prodRating,
        sentimentDistribution: {
          positivePercentage: prodFeedbackCount > 0 ? Math.round((prodPos / prodFeedbackCount) * 100) : 0,
          neutralPercentage: prodFeedbackCount > 0 ? Math.round((prodNeu / prodFeedbackCount) * 100) : 0,
          negativePercentage: prodFeedbackCount > 0 ? Math.round((prodNeg / prodFeedbackCount) * 100) : 0
        },
        topTheme: topThemeDoc ? topThemeDoc.theme : 'None'
      });
    }

    return res.status(200).json({
      data: {
        totalProducts: productsCount,
        totalFeedbacks,
        overallRating,
        sentimentDistribution: {
          positiveCount,
          neutralCount,
          negativeCount,
          positivePercentage,
          neutralPercentage,
          negativePercentage
        },
        lastFiveFeedbacks,
        highProblems,
        productsSummary
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    return res.status(500).json({
      error: 'An error occurred while loading dashboard statistics',
      details: error.message
    });
  }
}

/**
 * Get cached global AI strategic recommendations report, or trigger fresh generation if missing
 */
async function getGlobalRecommendations(req, res) {
  try {
    const db = getDB();

    // 1. Check if cached global analysis report exists
    let globalReport = await db.collection('global_analysis').findOne({ type: 'global_brief' });

    if (!globalReport) {
      // Fetch themes and products
      const themes = await db.collection('theme_memory').find().toArray();
      const products = await db.collection('products').find().toArray();

      if (themes.length === 0 || products.length === 0) {
        return res.status(200).json({
          message: 'No product or feedback theme memory data available to compile AI report.',
          data: null
        });
      }

      console.log('Generating initial global AI strategic brief...');
      const reportData = await generateGlobalRecommendations(themes, products);
      
      globalReport = {
        type: 'global_brief',
        ...reportData,
        lastUpdated: new Date()
      };

      await db.collection('global_analysis').updateOne(
        { type: 'global_brief' },
        { $set: globalReport },
        { upsert: true }
      );
    }

    return res.status(200).json({ data: globalReport });
  } catch (error) {
    console.error('Error in getGlobalRecommendations controller:', error);
    return res.status(500).json({
      error: 'An error occurred while generating/retrieving global AI reports',
      details: error.message
    });
  }
}

/**
 * Force regenerate the cached global AI strategic recommendations report
 */
async function regenerateGlobalRecommendations(req, res) {
  try {
    const db = getDB();

    const themes = await db.collection('theme_memory').find().toArray();
    const products = await db.collection('products').find().toArray();

    if (themes.length === 0 || products.length === 0) {
      return res.status(400).json({
        error: 'Cannot regenerate global report without theme memory and product catalog data'
      });
    }

    console.log('Regenerating global AI strategic report...');
    const reportData = await generateGlobalRecommendations(themes, products);
    
    const globalReport = {
      type: 'global_brief',
      ...reportData,
      lastUpdated: new Date()
    };

    await db.collection('global_analysis').updateOne(
      { type: 'global_brief' },
      { $set: globalReport },
      { upsert: true }
    );

    return res.status(200).json({
      message: 'Global AI report regenerated successfully',
      data: globalReport
    });
  } catch (error) {
    console.error('Error in regenerateGlobalRecommendations controller:', error);
    return res.status(500).json({
      error: 'An error occurred while regenerating the global AI report',
      details: error.message
    });
  }
}

async function getFeedbackAnalytics(req, res) {
  try {
    const db = getDB();
    const feedbacks = await db.collection('feedbacks').find().toArray();

    // 1. Initialize count mappings for platform sources
    const sourcesMap = {
      reddit: 0,
      discord: 0,
      survey: 0,
      forums: 0,
      tickets: 0,
      social: 0,
      other: 0
    };

    // 2. Initialize count mappings for categories
    const categoriesMap = {
      'Feature Request': 0,
      'Bug Report': 0,
      'Performance Issue': 0,
      'UX/UI Issue': 0,
      'Praise': 0
    };

    feedbacks.forEach(f => {
      // Platform source grouping
      const plat = (f.platform || 'other').toLowerCase();
      if (plat.includes('reddit')) sourcesMap.reddit++;
      else if (plat.includes('discord')) sourcesMap.discord++;
      else if (plat.includes('survey')) sourcesMap.survey++;
      else if (plat.includes('forum')) sourcesMap.forums++;
      else if (plat.includes('ticket') || plat.includes('support')) sourcesMap.tickets++;
      else if (plat.includes('social') || plat.includes('twitter') || plat.includes('facebook')) sourcesMap.social++;
      else sourcesMap.other++;

      // Category / Type grouping
      const cat = f.type || 'Other';
      if (categoriesMap[cat] !== undefined) {
        categoriesMap[cat]++;
      } else {
        categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
      }
    });

    // Format for Recharts
    const sourcesData = Object.keys(sourcesMap).map(key => ({
      source: key.charAt(0).toUpperCase() + key.slice(1),
      count: sourcesMap[key]
    }));

    const categoriesData = Object.keys(categoriesMap).map(key => ({
      category: key,
      count: categoriesMap[key]
    }));

    return res.status(200).json({
      data: {
        sourcesData,
        categoriesData
      }
    });

  } catch (error) {
    console.error('Error fetching feedback analytics:', error);
    return res.status(500).json({
      error: 'An error occurred while compiling feedback analytics',
      details: error.message
    });
  }
}

module.exports = {
  getDashboardOverview,
  getGlobalRecommendations,
  regenerateGlobalRecommendations,
  getFeedbackAnalytics
};
