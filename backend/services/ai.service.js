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
 * Analyzes feedback text using Groq, checking against existing themes and product names.
 * @param {string} feedbackText - The raw feedback text.
 * @param {string[]} existingThemes - Array of existing theme names.
 * @param {string[]} availableProducts - Array of company product names.
 * @param {string} defaultProductName - Fallback product name if none detected.
 * @returns {Promise<object>} The extracted structured fields.
 */
async function analyzeFeedbackText(feedbackText, existingThemes = [], availableProducts = [], defaultProductName = 'General') {
  const client = getGroqClient();

  const systemPrompt = `You are an expert Product Feedback Classifier. Your task is to analyze user feedback and extract specific metadata fields in a structured JSON format.

Below are the guidelines for each field:

1. feedback: Keep the original feedback text.
2. productName: Identify which company product this feedback is about.
   - You MUST choose from the list of Available Products: ${JSON.stringify(availableProducts)}.
   - If the feedback explicitly or implicitly refers to one of these products, choose that product.
   - If the feedback does not refer to any of the products, or is general/ambiguous, use "${defaultProductName}".
3. sentiment: Must be exactly one of: "positive", "neutral", "negative".
4. type: Must be exactly one of: "Feature Request", "Bug Report", "Performance Issue", "UX/UI Issue", "Praise".
5. theme: Identify the main theme. To maintain consistency, you are provided with a list of existing themes.
   - If the feedback matches one of these existing themes semantically (e.g. "please add dark theme" maps to "Dark Mode"), you MUST use that existing theme name EXACTLY.
   - Otherwise, suggest a new concise theme name (2-3 words, capitalized like "Dark Mode", "Search Experience", "Payment Gateway").
6. productArea: Must be exactly one of: "UI", "Performance", "Authentication", "Search", "Payments", "Notifications", "Analytics", "Dashboard", "Mobile App", "API".
7. priority: Must be exactly one of: "Low", "Medium", "High", "Critical".
8. actionability: Must be exactly one of: "Immediate Action", "Monitor", "Low Priority".

Existing Themes in Database:
${JSON.stringify(existingThemes)}

Return ONLY a valid JSON object. Do not wrap in markdown block formatting like \`\`\`json.

Response Schema:
{
  "feedback": "Original feedback text",
  "productName": "Product Name",
  "sentiment": "positive" | "neutral" | "negative",
  "type": "Feature Request" | "Bug Report" | "Performance Issue" | "UX/UI Issue" | "Praise",
  "theme": "Theme Name",
  "productArea": "UI" | "Performance" | "Authentication" | "Search" | "Payments" | "Notifications" | "Analytics" | "Dashboard" | "Mobile App" | "API",
  "priority": "Low" | "Medium" | "High" | "Critical",
  "actionability": "Immediate Action" | "Monitor" | "Low Priority"
}`;

  // Try multiple models in case of limits/availability issues
  const models = ['llama-3.3-70b-specdec', 'llama-3.1-8b-instant', 'llama3-8b-8192'];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Attempting AI analysis using Groq model: ${model}`);
      const chatCompletion = await client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this feedback: "${feedbackText}"` }
        ],
        model: model,
        response_format: { type: 'json_object' }
      });

      const resultText = chatCompletion.choices[0].message.content;
      const parsedData = JSON.parse(resultText);
      return parsedData;
    } catch (error) {
      console.warn(`Model ${model} failed:`, error.message);
      lastError = error;
    }
  }

  throw new Error(`All Groq models failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
}

module.exports = { analyzeFeedbackText };
