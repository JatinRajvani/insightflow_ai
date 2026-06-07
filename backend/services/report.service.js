const Groq = require('groq-sdk');

let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not defined in the environment variables');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

/**
 * Generates a deep product analysis report using Groq.
 * @param {string} productName - Name of the product
 * @param {object[]} themeStats - Aggregated themes for this product
 * @param {object[]} feedbackSamples - Sample feedbacks for this product
 * @returns {Promise<object>} AI generated report matching the schema
 */
async function generateProductReport(productName, themeStats = [], feedbackSamples = []) {
  const client = getGroqClient();

  const systemPrompt = `You are an expert Product Analyst. Your job is to evaluate feedback data for a company product and write a high-level strategic intelligence report.

Your output must be a single, valid JSON object matching the schema below. Do not wrap the JSON in markdown formatting (like \`\`\`json).

Response Schema:
{
  "executiveSummary": "A concise paragraph summarizing the overall customer sentiment, primary user concerns, and general status of the product.",
  "strengths": ["Strength 1 (2-3 words)", "Strength 2 (2-3 words)", "Strength 3 (2-3 words)"],
  "weaknesses": ["Weakness 1 (2-3 words)", "Weakness 2 (2-3 words)", "Weakness 3 (2-3 words)"],
  "criticalRisks": ["Highlight 1-2 major emerging risks based on trending negative themes. Keep them brief and actionable."],
  "actionPlan": "A concrete 1-2 sentence suggested action plan for the product team based on the weaknesses and risks."
}

Product Evaluated: "${productName}"

Theme statistics for this product:
${JSON.stringify(themeStats)}

Recent raw feedback samples for this product:
${JSON.stringify(feedbackSamples)}`;

  const models = ['llama-3.3-70b-specdec', 'llama-3.1-8b-instant', 'llama3-8b-8192'];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Generating AI product report using Groq model: ${model}`);
      const chatCompletion = await client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Perform analysis for product: "${productName}"` }
        ],
        model: model,
        response_format: { type: 'json_object' }
      });

      const resultText = chatCompletion.choices[0].message.content;
      const parsedData = JSON.parse(resultText);
      return parsedData;
    } catch (error) {
      console.warn(`Model ${model} failed to generate report:`, error.message);
      lastError = error;
    }
  }

  throw new Error(`All Groq models failed to generate report. Last error: ${lastError ? lastError.message : 'Unknown'}`);
}

/**
 * Generates a global cross-product strategic intelligence report using Groq.
 * @param {object[]} themeStats - List of all themes across all products
 * @param {object[]} products - List of all products
 * @returns {Promise<object>} AI generated report matching the schema
 */
async function generateGlobalRecommendations(themeStats = [], products = []) {
  const client = getGroqClient();

  const systemPrompt = `You are a Chief Product Officer (CPO) and Strategic AI Agent. Your task is to evaluate feedback summaries across ALL company products and write a high-level cross-product strategic intelligence report.

Your output must be a single, valid JSON object matching the schema below. Do not wrap the JSON in markdown formatting (like \`\`\`json).

Response Schema:
{
  "executiveOverview": "A concise paragraph summarizing overall customer sentiment, major positive/negative clusters, and overall health of the catalog.",
  "globalSWOT": {
    "strengths": ["Strength 1 (2-3 words)", "Strength 2 (2-3 words)", "Strength 3 (2-3 words)"],
    "weaknesses": ["Weakness 1 (2-3 words)", "Weakness 2 (2-3 words)", "Weakness 3 (2-3 words)"],
    "opportunities": ["Opportunity 1 (2-3 words)", "Opportunity 2 (2-3 words)", "Opportunity 3 (2-3 words)"],
    "threats": ["Threat 1 (2-3 words)", "Threat 2 (2-3 words)", "Threat 3 (2-3 words)"]
  },
  "roadmapSuggestions": [
    {
      "item": "Proposed feature/improvement name",
      "priority": "High" | "Medium" | "Low",
      "reason": "Clear justification based on sentiment levels and mention statistics (1 sentence)."
    },
    {
      "item": "Proposed feature/improvement name",
      "priority": "High" | "Medium" | "Low",
      "reason": "Clear justification (1 sentence)."
    },
    {
      "item": "Proposed feature/improvement name",
      "priority": "High" | "Medium" | "Low",
      "reason": "Clear justification (1 sentence)."
    }
  ],
  "riskAlerts": [
    "Highlight 1-2 major cross-product risks based on negative trending concepts. Keep them brief and actionable."
  ],
  "suggestedActions": "A concrete 1-2 sentence suggested strategic next step for the engineering and business teams."
}

Products under evaluation:
${JSON.stringify(products.map(p => ({ name: p.name, description: p.description })))}

Theme Memory Statistics across all products:
${JSON.stringify(themeStats.map(t => ({ theme: t.theme, productName: t.productName, mentions: t.mentions, positive: t.positiveCount, negative: t.negativeCount })))}`;

  const models = ['llama-3.3-70b-specdec', 'llama-3.1-8b-instant', 'llama3-8b-8192'];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Generating Global AI Report using Groq model: ${model}`);
      const chatCompletion = await client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: "Perform cross-product global strategic analysis" }
        ],
        model: model,
        response_format: { type: 'json_object' }
      });

      const resultText = chatCompletion.choices[0].message.content;
      const parsedData = JSON.parse(resultText);
      return parsedData;
    } catch (error) {
      console.warn(`Model ${model} failed to generate global report:`, error.message);
      lastError = error;
    }
  }

  throw new Error(`All Groq models failed to generate global report. Last error: ${lastError ? lastError.message : 'Unknown'}`);
}

module.exports = { 
  generateProductReport,
  generateGlobalRecommendations
};
