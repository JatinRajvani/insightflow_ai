import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Filter, Calendar, ChevronDown, ChevronUp, Loader2, 
  AlertTriangle, ThumbsUp, ThumbsDown, Minus, Info, 
  ShieldAlert, Zap, Database, Tag, RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE;

export default function FeedbackExplorer() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Expandable row states
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    setError(null);
    try {
      const [feedbacksRes, productsRes, analyticsRes] = await Promise.all([
        axios.get(`${API_BASE}/feedback`),
        axios.get(`${API_BASE}/products`),
        axios.get(`${API_BASE}/dashboard/analytics`)
      ]);

      if (feedbacksRes.data && feedbacksRes.data.data) {
        setFeedbacks(feedbacksRes.data.data);
      }
      if (productsRes.data && productsRes.data.data) {
        setProducts(productsRes.data.data);
      }
      if (analyticsRes.data && analyticsRes.data.data) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load feedback explorer datasets:', err);
      setError(err.response?.data?.error || 'Failed to retrieve feedback explorer database.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const [feedbacksRes, analyticsRes] = await Promise.all([
        axios.get(`${API_BASE}/feedback`),
        axios.get(`${API_BASE}/dashboard/analytics`)
      ]);
      if (feedbacksRes.data && feedbacksRes.data.data) {
        setFeedbacks(feedbacksRes.data.data);
      }
      if (analyticsRes.data && analyticsRes.data.data) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err) {
      console.error('Error refreshing explorer datasets:', err);
    } finally {
      setRefreshing(false);
    }
  }

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Client-side Filter Logic
  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesSearch = f.feedback.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (f.theme && f.theme.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesProduct = selectedProduct === '' || f.productName === selectedProduct;
    const matchesSentiment = selectedSentiment === '' || f.sentiment === selectedSentiment;
    const matchesPriority = selectedPriority === '' || f.priority === selectedPriority;
    const matchesType = selectedType === '' || f.type === selectedType;

    return matchesSearch && matchesProduct && matchesSentiment && matchesPriority && matchesType;
  });

  // Helper to render sentiment badge
  const renderSentimentBadge = (sentiment) => {
    if (sentiment === 'positive') return <span className="badge badge-positive flex align-center gap-4"><ThumbsUp size={10} /> Positive</span>;
    if (sentiment === 'negative') return <span className="badge badge-negative flex align-center gap-4"><ThumbsDown size={10} /> Negative</span>;
    return <span className="badge badge-neutral flex align-center gap-4"><Minus size={10} /> Neutral</span>;
  };

  if (loading) {
    return (
      <div className="upload-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '80vh', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="spinner text-violet" size={48} />
        <h3 style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Loading Feedback Explorer...</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Fetching raw feedback records, generating aggregates, and compiling charts.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="upload-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '80vh', justifyContent: 'center', alignItems: 'center' }}>
        <AlertTriangle className="text-critical" size={48} />
        <h3 style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Failed to Load Explorer</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{error}</p>
        <button onClick={fetchInitialData} className="submit-btn" style={{ marginTop: '20px', padding: '10px 20px' }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="upload-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="title">Feedback Explorer & Analytics</h2>
          <p className="subtitle">Audit raw feedback quotes, inspect category volume distributions, and search record histories.</p>
        </div>

        <button 
          className="submit-btn" 
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '14px' }}
        >
          {refreshing ? (
            <>
              <Loader2 className="spinner" size={14} />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw size={14} />
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Visual Analytics Charts Row */}
      {analytics && (
        <div className="dashboard-charts-row" style={{ marginBottom: '32px' }}>
          {/* Source Distribution Chart */}
          <div className="glass-card chart-container-card" style={{ height: '300px' }}>
            <span className="products-list-header" style={{ marginBottom: '16px', display: 'block' }}>Feedback Volume by Source</span>
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.sourcesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="source" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0f111a', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="var(--cyan)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="glass-card chart-container-card" style={{ height: '300px' }}>
            <span className="products-list-header" style={{ marginBottom: '16px', display: 'block' }}>Feedback Volume by Category</span>
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoriesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0f111a', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="var(--violet)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Explorer Controls Card */}
      <div className="glass-card explorer-filters-card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
        {/* Search */}
        <div className="search-input-wrap" style={{ marginBottom: '16px' }}>
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search feedback text, concepts, themes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>

        {/* Dropdown Filters Grid */}
        <div className="explorer-filters-grid">
          {/* Product Filter */}
          <div className="filter-select-wrap">
            <Filter className="select-icon" size={12} />
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p._id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sentiment Filter */}
          <div className="filter-select-wrap">
            <ThumbsUp className="select-icon" size={12} />
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="filter-select-wrap">
            <ShieldAlert className="select-icon" size={12} />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="filter-select-wrap">
            <Tag className="select-icon" size={12} />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Performance Issue">Performance Issue</option>
              <option value="UX/UI Issue">UX/UI Issue</option>
              <option value="Praise">Praise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="glass-card explorer-table-card" style={{ padding: '0px', overflow: 'hidden' }}>
        {filteredFeedbacks.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <Database className="glow-icon" size={24} />
              </div>
              <h3>No Feedback Found</h3>
              <p>No records matched your specific filter constraints or keywords.</p>
            </div>
          </div>
        ) : (
          <div className="explorer-table-wrap">
            <table className="themes-table explorer-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Product</th>
                  <th>Feedback Text</th>
                  <th style={{ width: '110px' }}>Sentiment</th>
                  <th style={{ width: '90px' }}>Priority</th>
                  <th style={{ width: '130px' }}>Category</th>
                  <th style={{ width: '90px' }}>Platform</th>
                  <th style={{ width: '100px' }}>Date</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.map((f) => {
                  const isExpanded = !!expandedRows[f._id];
                  const previewText = f.feedback.length > 70 ? f.feedback.substring(0, 70) + '...' : f.feedback;

                  return (
                    <React.Fragment key={f._id}>
                      <tr 
                        className={`explorer-row-header ${isExpanded ? 'row-expanded' : ''}`}
                        onClick={() => toggleRow(f._id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td><strong>{f.productName}</strong></td>
                        <td className="explorer-text-cell" title={f.feedback}>
                          "{isExpanded ? f.feedback : previewText}"
                        </td>
                        <td>{renderSentimentBadge(f.sentiment)}</td>
                        <td>
                          <span className={`badge badge-${f.priority.toLowerCase()}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                            {f.priority}
                          </span>
                        </td>
                        <td><span className="type-chip" style={{ fontSize: '12px' }}>{f.type}</span></td>
                        <td>
                          <span className="area-chip" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                            {f.platform || 'General'}
                          </span>
                        </td>
                        <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="view-analysis-link" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(f._id);
                            }}
                            style={{ margin: 0, padding: '4px' }}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Details Subpanel */}
                      {isExpanded && (
                        <tr className="explorer-detail-row">
                          <td colSpan={8} style={{ padding: '0px', background: 'rgba(255,255,255,0.005)' }}>
                            <div className="explorer-expanded-panel animate-fade-in">
                              <div className="panel-grid">
                                {/* Quote Box */}
                                <div className="panel-quote-box">
                                  <strong>Full Feedback Quote:</strong>
                                  <p>"{f.feedback}"</p>
                                </div>

                                {/* Metadata Breakdown */}
                                <div className="panel-metadata-box">
                                  <div className="meta-subitem">
                                    <span className="meta-sublabel">Associated Theme</span>
                                    <div className="meta-subval flex align-center gap-6 text-violet">
                                      <Tag size={12} />
                                      <strong>{f.theme}</strong>
                                    </div>
                                  </div>

                                  <div className="meta-subitem">
                                    <span className="meta-sublabel">Product Area Tag</span>
                                    <div className="meta-subval">
                                      <span className="area-chip">{f.productArea}</span>
                                    </div>
                                  </div>

                                  <div className="meta-subitem">
                                    <span className="meta-sublabel">Actionability Category</span>
                                    <div className="meta-subval flex align-center gap-6">
                                      {f.actionability === 'Immediate Action' ? (
                                        <ShieldAlert size={14} className="text-critical" />
                                      ) : (
                                        <Zap size={14} className="text-cyan" />
                                      )}
                                      <strong>{f.actionability}</strong>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
