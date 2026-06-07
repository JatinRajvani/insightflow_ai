# InsightFlow AI - Product Documentation & User Manual

Welcome to the official documentation for **InsightFlow AI**, a memory-powered user feedback intelligence platform that parses customer reviews, maintains persistent theme memory, detects trends, and generates strategic executive product recommendations.

---

## 1. Product Overview & Core Value

Organizations receive user feedback from multiple channels (Reddit, Discord, Forums, Support Tickets, etc.). Teams usually analyze feedback in isolation, losing valuable historical context.

**InsightFlow AI** introduces a persistent **Memory Layer** that remembers what users have been saying over time. It aggregates comments into structured themes, tracks trend directions, identifies recurring problems, and uses LLMs to generate Chief Product Officer (CPO) level strategic recommendations and product roadmaps.

---

## 2. Technology Stack & System Architecture

InsightFlow AI is built as a decoupled Client-Server web application:

### Frontend
- **Framework**: React.js (Vite environment)
- **Styling**: Modern, premium Glassmorphism theme using Vanilla CSS (`index.css` and `App.css`) with curated harmonious dark mode HSL variables andOutfit fonts.
- **Charts**: **Recharts** (Interactive Pie charts for global sentiment distribution, and Bar charts for volume distributions).
- **Icons**: **Lucide React** for modern dashboard visuals.
- **HTTP Client**: **Axios** for API requests.

### Backend
- **Runtime & Framework**: Node.js & Express.js.
- **Database**: MongoDB (utilizing compound compound indexing for theme search and performance optimizations).
- **AI Processing Engine**: **Groq Cloud SDK** running Llama-3-based models for high-speed sentiment tagging, priority detection, theme extraction, and SWOT generation.

---

## 3. Core Modules & Features Built

The application features six fully completed interactive panels inside the sidebar navigation:

### 1. Executive Intelligence Dashboard
The primary landing view providing a high-level briefing on catalog health:
- **KPI Metrics Cards**: Total catalog products count, weighted overall customer rating score (out of 5 stars calculated from positive/neutral/negative reviews), and total feedbacks processed.
- **Global Sentiment Profile**: An interactive Recharts Pie Chart representing positive, neutral, and negative distributions.
- **Immediate Action Alerts**: Highlights quotes marked as High/Critical priority or categorized as requiring immediate resolution.
- **Product Directory**: Cards summarizing each product, their specific rating stars, compound sentiment bars, and top themes, with a direct **View Analysis** link.

### 2. Upload Feedback Center
Supports dual-mode customer review ingestion:
- **Single Feedback Mode**: Users paste a customer quote, select a product (or let the AI detect it automatically), and submit. The AI returns real-time classifications: associated product, theme, sentiment, category, area, priority, and actionability.
- **CSV Bulk Upload Mode**: Accepts `.csv` files. It parses CSV headers client-side in the browser using the FileReader API. It supports columns for `feedback`, `platform`, and `productName`. Once submitted, a batch loader processes feedbacks sequentially to avoid AI rate limits and lists completed results.

### 3. Products & Analysis Manager
The workspace for product catalog registrations and deep-dives:
- **Add Product Form**: Register new company products.
- **Product Details Panel**: Inspect overall rating, sentiment progress bars, and extracted themes.
- **CPO Strategic Report**: Groq-generated cached executive SWOT briefs (Strengths, Weaknesses, Critical Risks, Action Plan) powered by Llama models.
- **Edit Details**: Inline form to modify product name or description.
- **Delete Product**: Purges the product and its cached report.

### 4. Theme Memory Dashboard
Visualizes the AI Memory Engine:
- **Search & Filters**: Live search theme names and filter by associated product or trend direction.
- **Theme Grid**: Cards displaying product badges, mention counts, trend badges (`Increasing` in red, `Stable` in violet, `Decreasing` in green), sentiment compound tracks, and first/last seen timestamps.
- **Associated Feedback Logs Drill-down**: Click a theme card to open an interactive modal displaying all original quotes mapped to this theme.

### 5. AI Recommendations Hub
The global strategic center compiling cross-product analysis:
- **Executive Strategic Overview**: Narrative summary of customer satisfaction.
- **Global SWOT Analysis**: A 2x2 SWOT grid mapping Strengths, Weaknesses, Opportunities, and Threats across all products.
- **AI Prioritized Roadmap**: Priority suggestions with business justifications.
- **Strategic Actions**: Prominent warning callouts and strategic next steps.
- **Export Capabilities**: Buttons to **Copy Markdown** text of the CPO brief or **Download as a .md** document.

### 6. Feedback Explorer & Analytics
An operational desk for auditing and analytics:
- **Distribution Charts**: Side-by-side Recharts Bar Charts showing feedback counts grouped by **Source Channel** (Reddit, Discord, surveys, etc.) and by **Category/Type** (Bugs, Performance, UX, Praise).
- **Search & Filter Controls**: Text query input targeting quotes and themes, combined with selectors for Product, Sentiment, Priority, and Category.
- **Expandable Grid Table**: Search results are displayed in a clean tabular format. Click any feedback row to expand it into an in-depth audit subpanel, displaying the full quote text, theme mapping, area tag, and actionability rating.

---

## 4. Database Schema & Cascade Logic

MongoDB collection structures are designed for modular relations:

### 1. `products`
```json
{
  "_id": "ObjectId",
  "name": "Product Name",
  "description": "Short description text",
  "createdAt": "Date"
}
```

### 2. `feedbacks`
```json
{
  "_id": "ObjectId",
  "feedback": "Original comment quote text",
  "productName": "Product Name",
  "sentiment": "positive | neutral | negative",
  "type": "Feature Request | Bug Report | Performance Issue | UX/UI Issue | Praise",
  "theme": "Theme Title",
  "productArea": "UI | Performance | Authentication | Search | Payments | etc.",
  "priority": "Low | Medium | High | Critical",
  "actionability": "Immediate Action | Monitor | Low Priority",
  "platform": "reddit | discord | survey | support | etc.",
  "createdAt": "Date"
}
```

### 3. `theme_memory`
```json
{
  "_id": "ObjectId",
  "theme": "Theme Title",
  "productName": "Product Name",
  "mentions": "Number",
  "positiveCount": "Number",
  "neutralCount": "Number",
  "negativeCount": "Number",
  "firstSeen": "Date",
  "lastSeen": "Date",
  "trend": "Stable | Increasing | Decreasing",
  "history": []
}
```

### 4. `product_analysis` (Cached AI SWOT Reports per Product)
```json
{
  "_id": "ObjectId",
  "productName": "Product Name",
  "executiveSummary": "Narrative paragraph",
  "strengths": ["Array"],
  "weaknesses": ["Array"],
  "criticalRisks": ["Array"],
  "actionPlan": "Suggested roadmap text",
  "lastUpdated": "Date"
}
```

### 5. `global_analysis` (Cached CPO Report across All Products)
```json
{
  "_id": "ObjectId",
  "type": "global_brief",
  "executiveOverview": "Narrative summary",
  "globalSWOT": {
    "strengths": ["Array"],
    "weaknesses": ["Array"],
    "opportunities": ["Array"],
    "threats": ["Array"]
  },
  "roadmapSuggestions": [
    { "item": "Name", "priority": "Level", "reason": "Text" }
  ],
  "riskAlerts": ["Array"],
  "suggestedActions": "Narrative recommendations",
  "lastUpdated": "Date"
}
```

### Cascade Logic Mappings
To ensure database integrity:
- **Edit Product Name**: When a product's name is updated in `ProductsManager`, the backend updates `products` and triggers bulk rename queries in related collections:
  - `feedbacks` (`productName` is renamed)
  - `theme_memory` (`productName` is renamed)
  - `product_analysis` (`productName` is renamed)
- **Delete Product**: When a product is deleted, the backend deletes it from `products` and performs cascade deletes for associated records:
  - Deletes all matching records from `feedbacks`
  - Deletes all matching records from `theme_memory`
  - Deletes all matching records from `product_analysis`

---

## 5. How to Run and Test

### 1. Start Database and Backend API
Configure database connection strings inside `backend/.env`.
```bash
# Navigate to backend
cd backend
# Run server using nodemon dev server
npm run dev
```

### 2. Start Frontend App
```bash
# Navigate to frontend/vite_app
cd frontend/vite_app
# Run Vite server
npm run dev
```
Open `http://localhost:5173/` in your browser.

### 3. Bulk CSV Testing
You can manually test bulk upload using the raw CSV sample file created in the root directory:
[feedback_test_samples.csv](file:///c:/Users/Jatin%20Rajvani/Desktop/insightflow_ai/feedback_test_samples.csv)
1. Go to the **Upload Feedback** screen.
2. Select **CSV Bulk Upload** tab.
3. Select or drag the `feedback_test_samples.csv` file and click **Process CSV Feed**.
4. Check database insertions under **Feedback Explorer**.
