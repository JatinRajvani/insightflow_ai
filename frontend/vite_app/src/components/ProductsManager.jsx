import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Star, RefreshCw, Sparkles, TrendingUp, TrendingDown, 
  Minus, Info, Calendar, ThumbsUp, ThumbsDown, ShieldAlert, 
  Zap, AlertTriangle, Loader2 
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function ProductsManager({ selectedProduct, setSelectedProduct }) {
  const [products, setProducts] = useState([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  
  // Selected product analysis details
  const [analysis, setAnalysis] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const [addError, setAddError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Sync edit fields on select
  useEffect(() => {
    if (selectedProduct) {
      setEditName(selectedProduct.name);
      setEditDesc(selectedProduct.description || '');
      setIsEditing(false);
    }
  }, [selectedProduct]);

  // Handle Product Update
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      const response = await axios.put(`${API_BASE}/products/${selectedProduct._id}`, {
        name: editName,
        description: editDesc
      });
      
      if (response.data && response.data.data) {
        const updated = response.data.data;
        // Update product in list
        setProducts((prev) => prev.map((p) => p._id === updated._id ? { ...p, ...updated } : p));
        setSelectedProduct(updated); // Sync selection
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating product:', err);
      alert(err.response?.data?.error || 'Failed to update product details.');
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${selectedProduct.name}"?\n\nAll associated feedbacks, theme memories, and AI analysis reports will be DELETED PERMANENTLY. This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/products/${selectedProduct._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== selectedProduct._id));
      setSelectedProduct(null); // Clear selection
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product.');
    }
  };
  // Fetch all products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoadingList(true);
    try {
      const response = await axios.get(`${API_BASE}/products`);
      if (response.data && response.data.data) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load products list:', err);
    } finally {
      setLoadingList(false);
    }
  }

  // Load product analysis when selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      fetchAnalysis(selectedProduct.name);
    } else {
      setAnalysis(null);
    }
  }, [selectedProduct]);

  async function fetchAnalysis(name) {
    setLoadingAnalysis(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/products/${name}/analysis`);
      if (response.data && response.data.data) {
        setAnalysis(response.data.data);
      }
    } catch (err) {
      console.error(`Error loading analysis for "${name}":`, err);
      setError(err.response?.data?.error || 'Failed to retrieve analysis details.');
    } finally {
      setLoadingAnalysis(false);
    }
  }

  // Handle product addition
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    setAddError(null);
    try {
      const response = await axios.post(`${API_BASE}/products`, {
        name: newProductName,
        description: newProductDesc
      });
      
      if (response.data && response.data.data) {
        const addedProduct = response.data.data;
        setProducts((prev) => [...prev, addedProduct]);
        setNewProductName('');
        setNewProductDesc('');
        setSelectedProduct(addedProduct); // Auto-select the newly added product
      }
    } catch (err) {
      console.error('Error adding product:', err);
      setAddError(err.response?.data?.error || 'Failed to create product.');
    }
  };

  // Trigger AI analysis regeneration
  const handleRegenerateReport = async () => {
    if (!selectedProduct) return;

    setRegenerating(true);
    try {
      const response = await axios.post(`${API_BASE}/products/${selectedProduct.name}/analysis/regenerate`);
      if (response.data && response.data.data) {
        setAnalysis((prev) => ({
          ...prev,
          aiReport: response.data.data
        }));
      }
    } catch (err) {
      console.error('Regeneration failed:', err);
      alert('Failed to regenerate report. Please try again.');
    } finally {
      setRegenerating(false);
    }
  };

  // Helper to render star rating icons
  const renderStars = (rating) => {
    const stars = [];
    const rounded = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={16} 
          className={i <= rounded ? 'fill-amber-500 text-amber-500' : 'text-slate-600'} 
        />
      );
    }
    return stars;
  };

  // Helper to render trend icons
  const renderTrendIcon = (trend) => {
    if (trend === 'Increasing') return <TrendingUp size={14} className="text-critical" />;
    if (trend === 'Decreasing') return <TrendingDown size={14} className="text-emerald" />;
    return <Minus size={14} className="text-secondary" />;
  };

  return (
    <div className="upload-page animate-fade-in">
      <div className="page-header">
        <h2 className="title">Products & Intelligence Dashboard</h2>
        <p className="subtitle">Track metrics, aggregate themes, and generate strategic executive reports for your products.</p>
      </div>

      <div className="products-layout">
        {/* Left column: Add product + list products */}
        <div className="products-sidebar">
          {/* Add Product Card */}
          <div className="glass-card">
            <h3 className="products-list-header" style={{ marginBottom: '16px' }}>Add New Product</h3>
            <form onSubmit={handleAddProduct} className="product-add-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Product Name (e.g. S26, Watch Ultra)"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <textarea
                  placeholder="Short Description..."
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  rows={2}
                  style={{ minHeight: '60px' }}
                />
              </div>
              <button type="submit" className="submit-btn" style={{ padding: '10px' }}>
                <Plus size={16} />
                Create Product
              </button>
            </form>
            {addError && (
              <p className="text-critical" style={{ fontSize: '13px', marginTop: '8px', textAlign: 'left' }}>
                {addError}
              </p>
            )}
          </div>

          {/* Products List Card */}
          <div className="glass-card products-list-card">
            <span className="products-list-header">Company Products</span>
            {loadingList ? (
              <div className="flex align-center justify-center" style={{ padding: '20px 0' }}>
                <Loader2 className="spinner text-violet" size={20} />
              </div>
            ) : products.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '14px', padding: '10px 0' }}>No products found. Add one above!</p>
            ) : (
              <div className="products-scroll">
                {products.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => setSelectedProduct(p)}
                    className={`product-item-btn ${selectedProduct?._id === p._id ? 'active' : ''}`}
                  >
                    <span className="product-item-name">{p.name}</span>
                    {p.description && <span className="product-item-desc">{p.description}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Selected product analysis */}
        <div className="products-workspace">
          {!selectedProduct ? (
            <div className="glass-card result-card" style={{ height: '100%' }}>
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <Info className="glow-icon" size={24} />
                </div>
                <h3>No Product Selected</h3>
                <p>Choose a product from the list on the left to see customer feedback ratings, theme breakdowns, and cached AI reports.</p>
              </div>
            </div>
          ) : loadingAnalysis ? (
            <div className="glass-card result-card" style={{ height: '100%' }}>
              <div className="empty-state">
                <Loader2 className="spinner text-violet" size={32} />
                <h3>Analyzing Customer Feedback...</h3>
                <p>Aggregating ratings, sentiment distributions, and loading cached strategic intelligence summaries from MongoDB.</p>
              </div>
            </div>
          ) : error ? (
            <div className="glass-card result-card" style={{ height: '100%' }}>
              <div className="empty-state">
                <AlertTriangle className="text-critical" size={32} />
                <h3>Failed to Load Analysis</h3>
                <p>{error}</p>
                <button onClick={() => fetchAnalysis(selectedProduct.name)} className="submit-btn" style={{ marginTop: '16px', padding: '8px 16px' }}>
                  Try Again
                </button>
              </div>
            </div>
          ) : !analysis ? null : (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Product Title and Header */}
              <div className="product-workspace-header">
                {isEditing ? (
                  <form onSubmit={handleUpdateProduct} className="product-edit-form flex flex-col gap-16" style={{ width: '100%' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Edit Name</label>
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                        required 
                        style={{ padding: '8px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Edit Description</label>
                      <textarea 
                        value={editDesc} 
                        onChange={(e) => setEditDesc(e.target.value)} 
                        rows={2} 
                        style={{ padding: '8px', minHeight: '50px' }}
                      />
                    </div>
                    <div className="flex align-center gap-8">
                      <button type="submit" className="submit-btn" style={{ padding: '6px 14px', fontSize: '13px' }}>Save Changes</button>
                      <button type="button" onClick={() => setIsEditing(false)} className="submit-btn" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 14px', fontSize: '13px' }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between align-center gap-16 flex-wrap" style={{ width: '100%' }}>
                    <div style={{ flexGrow: 1, textAlign: 'left' }}>
                      <h3 className="product-workspace-title">{analysis.productName}</h3>
                      <p className="product-workspace-desc">{selectedProduct.description || 'No product description provided.'}</p>
                    </div>
                    <div className="flex align-center gap-8">
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="submit-btn" 
                        style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 12px', fontSize: '13px' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={handleDeleteProduct} 
                        className="submit-btn" 
                        style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: 'var(--sentiment-negative)', padding: '6px 12px', fontSize: '13px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Statistics Grid */}
              <div className="stats-summary-grid">
                {/* Star rating card */}
                <div className="glass-card rating-display-card">
                  <span className="meta-label">Overall Customer Rating</span>
                  <div className="rating-number">{analysis.summary.overallRating.toFixed(1)}</div>
                  <div className="rating-stars">
                    {renderStars(analysis.summary.overallRating)}
                  </div>
                  <span className="rating-count">Based on {analysis.summary.totalFeedbacks} feedbacks</span>
                </div>

                {/* Sentiment Distribution Card */}
                <div className="glass-card sentiment-bars-card">
                  <span className="meta-label" style={{ marginBottom: '8px' }}>Sentiment Breakdown</span>
                  
                  {/* Positive */}
                  <div className="sentiment-bar-row">
                    <div className="sentiment-bar-header">
                      <span className="flex align-center gap-8"><ThumbsUp size={12} className="text-emerald" /> Positive</span>
                      <span>{analysis.summary.sentimentDistribution.positivePercentage}% ({analysis.summary.positiveCount})</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill positive" 
                        style={{ width: `${analysis.summary.sentimentDistribution.positivePercentage}%` }} 
                      />
                    </div>
                  </div>

                  {/* Neutral */}
                  <div className="sentiment-bar-row">
                    <div className="sentiment-bar-header">
                      <span className="flex align-center gap-8"><Minus size={12} className="text-secondary" /> Neutral</span>
                      <span>{analysis.summary.sentimentDistribution.neutralPercentage}% ({analysis.summary.neutralCount})</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill neutral" 
                        style={{ width: `${analysis.summary.sentimentDistribution.neutralPercentage}%` }} 
                      />
                    </div>
                  </div>

                  {/* Negative */}
                  <div className="sentiment-bar-row">
                    <div className="sentiment-bar-header">
                      <span className="flex align-center gap-8"><ThumbsDown size={12} className="text-critical" /> Negative</span>
                      <span>{analysis.summary.sentimentDistribution.negativePercentage}% ({analysis.summary.negativeCount})</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill negative" 
                        style={{ width: `${analysis.summary.sentimentDistribution.negativePercentage}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Themes Memory Section */}
              <div className="themes-section">
                <h4 className="products-list-header" style={{ marginBottom: '16px' }}>Extracted Theme Memory</h4>
                {analysis.themes.length === 0 ? (
                  <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No feedback theme data has been compiled for this product yet.
                  </div>
                ) : (
                  <div className="themes-table-wrap">
                    <table className="themes-table">
                      <thead>
                        <tr>
                          <th>Theme</th>
                          <th>Total Mentions</th>
                          <th>Sentiment Ratio (+/-)</th>
                          <th>Trend Direction</th>
                          <th>Last Seen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.themes.map((t) => (
                          <tr key={t._id}>
                            <td><strong>{t.theme}</strong></td>
                            <td>{t.mentions}</td>
                            <td>
                              <span className="text-emerald">{t.positiveCount}</span> / <span className="text-critical">{t.negativeCount}</span>
                            </td>
                            <td className="flex align-center gap-8" style={{ borderBottom: 'none', padding: '16px 8px' }}>
                              {renderTrendIcon(t.trend)}
                              <span className={`badge badge-${t.trend.toLowerCase()}`}>{t.trend}</span>
                            </td>
                            <td>{new Date(t.lastSeen).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* AI Analysis Report Card */}
              <div className="ai-report-section">
                <div className="flex align-center justify-between" style={{ marginBottom: '16px' }}>
                  <h4 className="products-list-header">AI Analyst Intelligence Report</h4>
                  <button 
                    className="submit-btn" 
                    onClick={handleRegenerateReport} 
                    disabled={regenerating || analysis.summary.totalFeedbacks === 0}
                    style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '6px', opacity: analysis.summary.totalFeedbacks === 0 ? 0.4 : 1 }}
                  >
                    {regenerating ? (
                      <>
                        <Loader2 className="spinner" size={14} />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={12} />
                        Update Analysis
                      </>
                    )}
                  </button>
                </div>

                {!analysis.aiReport ? (
                  <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                    <div className="empty-state" style={{ margin: '0 auto' }}>
                      <div className="empty-icon-wrap">
                        <Sparkles className="glow-icon" size={24} />
                      </div>
                      <h3>AI Report Awaiting Feedback</h3>
                      <p>No customer feedback has been submitted for this product yet. AI intelligence reports will automatically generate once feedback is uploaded on the 'Upload Feedback' tab.</p>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card ai-report-body">
                    {/* Executive Summary */}
                    <div className="report-summary-box">
                      <strong>Executive Summary:</strong>
                      <p style={{ marginTop: '8px' }}>{analysis.aiReport.executiveSummary}</p>
                    </div>

                    {/* SWOT Grid */}
                    <div className="report-swot-grid">
                      {/* Strengths */}
                      <div className="swot-card strengths">
                        <div className="swot-title text-emerald">
                          <ThumbsUp size={16} /> Key Strengths
                        </div>
                        {analysis.aiReport.strengths.length === 0 ? (
                          <p className="swot-text">None explicitly noted in feedback samples.</p>
                        ) : (
                          <ul className="swot-list">
                            {analysis.aiReport.strengths.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Weaknesses */}
                      <div className="swot-card weaknesses">
                        <div className="swot-title text-critical">
                          <ThumbsDown size={16} /> Key Weaknesses
                        </div>
                        {analysis.aiReport.weaknesses.length === 0 ? (
                          <p className="swot-text">None explicitly noted in feedback samples.</p>
                        ) : (
                          <ul className="swot-list">
                            {analysis.aiReport.weaknesses.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Critical Risks */}
                      <div className="swot-card risks">
                        <div className="swot-title" style={{ color: '#f97316' }}>
                          <AlertTriangle size={16} /> Critical Risks
                        </div>
                        {analysis.aiReport.criticalRisks.length === 0 ? (
                          <p className="swot-text">No major risks detected.</p>
                        ) : (
                          <ul className="swot-list">
                            {analysis.aiReport.criticalRisks.map((r, idx) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Action Plan */}
                      <div className="swot-card action-plan">
                        <div className="swot-title text-cyan">
                          <Zap size={16} /> Action Plan
                        </div>
                        <p className="swot-text">{analysis.aiReport.actionPlan}</p>
                      </div>
                    </div>

                    {/* Footer Timestamp */}
                    <div className="report-footer flex align-center gap-8 justify-between">
                      <div className="flex align-center gap-8">
                        <Calendar size={14} />
                        <span>Report Last Generated: {new Date(analysis.aiReport.lastUpdated).toLocaleString()}</span>
                      </div>
                      <div className="flex align-center gap-4 text-violet">
                        <Sparkles size={14} className="glow-icon" />
                        <span>Powered by Groq Llama-3</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
