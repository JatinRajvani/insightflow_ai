import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Loader2, Send, CheckCircle2, AlertCircle, Sparkles, Tag, Target, 
  ShieldAlert, Zap, MessageSquare, FileSpreadsheet, UploadCloud, ThumbsUp, ThumbsDown, Minus
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE;

export default function FeedbackUpload() {
  const [uploadMode, setUploadMode] = useState('text'); // 'text' | 'csv'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Single text state
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [analyzedData, setAnalyzedData] = useState(null);

  // CSV states
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]); // Array of parsed records before sending
  const [batchResult, setBatchResult] = useState(null); // Summary after upload succeeds

  // Fetch available products on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await axios.get(`${API_BASE}/products`);
        if (response.data && response.data.data) {
          setProducts(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching products list:', err);
      }
    }
    fetchProducts();
  }, []);

  // Handler for single feedback submission
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setLoading(true);
    setError(null);
    setAnalyzedData(null);
    setBatchResult(null);

    try {
      const payload = { feedback: feedbackText };
      if (selectedProduct) {
        payload.productName = selectedProduct;
      }

      const response = await axios.post(`${API_BASE}/feedback/upload`, payload);
      if (response.data && response.data.data) {
        setAnalyzedData(response.data.data);
        setFeedbackText(''); // Clear input on success
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.details || 
        'Something went wrong while processing your feedback.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse a single CSV row, respecting commas within quotes
  const parseCSVRow = (line) => {
    const row = [];
    let insideQuote = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current);
    return row;
  };

  // CSV Parser
  const parseCSVData = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) return [];

    // Parse headers and strip outer quotes
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    // Find indexes
    const feedbackIdx = headers.findIndex(h => /feedback|content|text/i.test(h));
    const productIdx = headers.findIndex(h => /product/i.test(h));
    const platformIdx = headers.findIndex(h => /platform|source|channel/i.test(h));

    if (feedbackIdx === -1) {
      throw new Error('CSV must contain a header column named "feedback" (or "content" / "text").');
    }

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      if (row.length === 0 || !row[feedbackIdx]) continue;

      records.push({
        feedback: row[feedbackIdx].trim().replace(/^["']|["']$/g, ''),
        productName: productIdx !== -1 && row[productIdx] ? row[productIdx].trim().replace(/^["']|["']$/g, '') : '',
        platform: platformIdx !== -1 && row[platformIdx] ? row[platformIdx].trim().replace(/^["']|["']$/g, '') : 'CSV Upload'
      });
    }
    return records;
  };

  // Handle CSV file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setCsvFile(file);
    setCsvPreview([]);
    setBatchResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseCSVData(event.target.result);
        setCsvPreview(parsed);
      } catch (err) {
        setError(err.message);
        setCsvFile(null);
        setCsvPreview([]);
      }
    };
    reader.readAsText(file);
  };

  // Handle CSV batch submission
  const handleCSVSubmit = async (e) => {
    e.preventDefault();
    if (csvPreview.length === 0) return;

    setLoading(true);
    setError(null);
    setAnalyzedData(null);
    setBatchResult(null);

    try {
      const response = await axios.post(`${API_BASE}/feedback/upload-batch`, {
        feedbacks: csvPreview
      });

      if (response.data && response.data.data) {
        setBatchResult(response.data.data);
        setCsvFile(null);
        setCsvPreview([]);
      }
    } catch (err) {
      console.error('Batch upload failed:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.details || 
        'Batch parsing failed. Please verify that CSV data holds correct formats.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper to render sentiment icon
  const renderSentimentIcon = (sentiment) => {
    if (sentiment === 'positive') return <ThumbsUp size={12} className="text-emerald" />;
    if (sentiment === 'negative') return <ThumbsDown size={12} className="text-critical" />;
    return <Minus size={12} className="text-secondary" />;
  };

  return (
    <div className="upload-page animate-fade-in">
      <div className="page-header">
        <h2 className="title">Upload Customer Feedback</h2>
        <p className="subtitle">Submit user quotes individually or upload CSV spreadsheets to feed the AI Memory Engine.</p>
      </div>

      {/* Upload Mode Selector tabs */}
      <div className="flex align-center gap-16" style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => {
            setUploadMode('text');
            setError(null);
          }}
          className={`nav-item ${uploadMode === 'text' ? 'active' : ''}`}
          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', width: 'auto' }}
        >
          <MessageSquare size={14} className="nav-icon" />
          <span>Single Feedback</span>
        </button>

        <button 
          onClick={() => {
            setUploadMode('csv');
            setError(null);
          }}
          className={`nav-item ${uploadMode === 'csv' ? 'active' : ''}`}
          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', width: 'auto' }}
        >
          <FileSpreadsheet size={14} className="nav-icon" />
          <span>CSV Bulk Upload</span>
        </button>
      </div>

      <div className="upload-grid">
        {/* Left Side: Upload Controls */}
        <div className="glass-card upload-card">
          
          {uploadMode === 'text' ? (
            /* Single Feedback Form */
            <form onSubmit={handleSingleSubmit} className="upload-form">
              <div className="form-group">
                <label htmlFor="feedback-input">User Feedback Text</label>
                <textarea
                  id="feedback-input"
                  placeholder="e.g. Please add dark mode as soon as possible. It is essential for night reading."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-select">Product Association (Optional)</label>
                <select
                  id="product-select"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="">Detect Automatically (AI)</option>
                  {products.map((product) => (
                    <option key={product._id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="submit-btn" disabled={loading || !feedbackText.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="spinner" size={18} />
                    Analyzing with Groq AI...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Process Feedback
                  </>
                )}
              </button>
            </form>
          ) : (
            /* CSV Bulk Upload Form */
            <form onSubmit={handleCSVSubmit} className="upload-form">
              <div className="form-group">
                <label>Upload CSV Spreadsheet</label>
                <div className="csv-dropzone">
                  <UploadCloud size={32} className="text-muted" style={{ marginBottom: '10px' }} />
                  <input
                    type="file"
                    id="csv-file-input"
                    accept=".csv"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="csv-file-input" className="csv-file-label">
                    {csvFile ? csvFile.name : 'Click to select CSV File'}
                  </label>
                  <p className="csv-help-text">
                    Spreadsheet must include a <strong>feedback</strong> column. Optional columns: <strong>platform</strong>, <strong>productName</strong>.
                  </p>
                </div>
              </div>

              {csvPreview.length > 0 && (
                <div className="csv-preview-info">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Detected <strong>{csvPreview.length}</strong> feedback rows ready to process.</span>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading || csvPreview.length === 0}>
                {loading ? (
                  <>
                    <Loader2 className="spinner" size={18} />
                    Processing {csvPreview.length} Feedbacks...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={16} />
                    Process CSV Feed
                  </>
                )}
              </button>
            </form>
          )}

          {error && (
            <div className="alert-message error flex align-center gap-8" style={{ marginTop: '16px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Side: Results Panel */}
        <div className="glass-card result-card">
          
          {/* Case 1: Loading State */}
          {loading && (
            <div className="empty-state">
              <Loader2 className="spinner text-violet" size={32} />
              <h3>Groq Intelligence Processing...</h3>
              <p>Extracting conceptual themes, sentiment classifications, and updating persistent theme trends in MongoDB.</p>
            </div>
          )}

          {/* Case 2: Success Single Feedback View */}
          {!loading && analyzedData && (
            <div className="analysis-result animate-fade-in">
              <div className="result-header flex align-center justify-between">
                <div className="flex align-center gap-8 text-violet">
                  <Sparkles size={20} className="glow-icon" />
                  <span className="section-title">AI Processing Success</span>
                </div>
                <div className="badge badge-positive flex align-center gap-4">
                  <CheckCircle2 size={12} />
                  Completed
                </div>
              </div>

              <div className="feedback-quote">
                <MessageSquare className="quote-icon" size={18} />
                <p>"{analyzedData.feedback}"</p>
              </div>

              <div className="metadata-grid">
                <div className="meta-item">
                  <span className="meta-label">Associated Product</span>
                  <div className="meta-value flex align-center gap-8">
                    <Target size={16} className="text-cyan" />
                    <strong>{analyzedData.productName}</strong>
                  </div>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Theme (Memory Engine)</span>
                  <div className="meta-value flex align-center gap-8">
                    <Tag size={16} className="text-violet" />
                    <strong>{analyzedData.theme}</strong>
                  </div>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Sentiment</span>
                  <div className="meta-value">
                    <span className={`badge badge-${analyzedData.sentiment}`}>
                      {analyzedData.sentiment}
                    </span>
                  </div>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Feedback Type</span>
                  <div className="meta-value">
                    <span className="type-chip">{analyzedData.type}</span>
                  </div>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Product Area</span>
                  <div className="meta-value">
                    <span className="area-chip">{analyzedData.productArea}</span>
                  </div>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Priority Level</span>
                  <div className="meta-value">
                    <span className={`badge badge-${analyzedData.priority.toLowerCase()}`}>
                      {analyzedData.priority}
                    </span>
                  </div>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Actionability</span>
                  <div className="meta-value flex align-center gap-8">
                    {analyzedData.actionability === 'Immediate Action' ? (
                      <ShieldAlert size={16} className="text-critical" />
                    ) : (
                      <Zap size={16} className="text-cyan" />
                    )}
                    <span>{analyzedData.actionability}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Case 3: Success CSV Batch View */}
          {!loading && batchResult && (
            <div className="analysis-result animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="result-header flex align-center justify-between" style={{ marginBottom: '12px' }}>
                <div className="flex align-center gap-8 text-violet">
                  <Sparkles size={20} className="glow-icon" />
                  <span className="section-title">Batch Processing Success</span>
                </div>
                <div className="badge badge-positive flex align-center gap-4">
                  <CheckCircle2 size={12} />
                  Done ({batchResult.length})
                </div>
              </div>

              <p className="text-muted" style={{ fontSize: '13.5px', marginBottom: '16px', textAlign: 'left' }}>
                Analyzed and inserted <strong>{batchResult.length}</strong> feedback entries into MongoDB. Here is the summary:
              </p>

              {/* Scrollable list of results */}
              <div className="batch-results-list" style={{ overflowY: 'auto', flexGrow: 1, maxHeight: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {batchResult.map((res, i) => (
                  <div key={res._id || i} className="batch-result-item" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                    <p style={{ fontSize: '13px', fontStyle: 'italic' }}>"{res.feedback.length > 80 ? res.feedback.substring(0, 80) + '...' : res.feedback}"</p>
                    <div className="flex align-center gap-8 flex-wrap" style={{ fontSize: '11px' }}>
                      <span className="flex align-center gap-4">{renderSentimentIcon(res.sentiment)} <strong style={{ textTransform: 'capitalize' }}>{res.sentiment}</strong></span>
                      <span className="text-cyan"><strong>{res.productName}</strong></span>
                      <span className="text-violet"><strong>{res.theme}</strong></span>
                      <span className={`badge badge-${res.priority.toLowerCase()}`} style={{ fontSize: '9px', padding: '1px 6px' }}>{res.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Case 4: Initial Empty State */}
          {!loading && !analyzedData && !batchResult && (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <Sparkles className="glow-icon" size={24} />
              </div>
              <h3>AI Intelligence Output</h3>
              <p>Submit single feedbacks or load CSV spreadsheets to view extracted metadata, sentiment maps, and concept trends.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
