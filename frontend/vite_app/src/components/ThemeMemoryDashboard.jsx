import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Filter, Calendar, TrendingUp, TrendingDown, Minus, 
  Info, X, MessageSquare, Loader2, AlertTriangle, Tag, 
  ThumbsUp, ThumbsDown, ShieldAlert, Zap, BarChart3
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function ThemeMemoryDashboard() {
  const [themes, setThemes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedTrend, setSelectedTrend] = useState('');

  // Modal / drill-down states
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    setError(null);
    try {
      const [themesRes, productsRes] = await Promise.all([
        axios.get(`${API_BASE}/feedback/themes`),
        axios.get(`${API_BASE}/products`)
      ]);

      if (themesRes.data && themesRes.data.data) {
        setThemes(themesRes.data.data);
      }
      if (productsRes.data && productsRes.data.data) {
        setProducts(productsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching theme memory initial data:', err);
      setError(err.response?.data?.error || 'Failed to retrieve theme memory datasets.');
    } finally {
      setLoading(false);
    }
  }

  // Fetch feedbacks for a specific theme & product
  async function fetchThemeFeedbacks(themeName, productName) {
    setLoadingFeedbacks(true);
    try {
      const response = await axios.get(
        `${API_BASE}/feedback?theme=${encodeURIComponent(themeName)}&productName=${encodeURIComponent(productName)}`
      );
      if (response.data && response.data.data) {
        setFeedbacks(response.data.data);
      }
    } catch (err) {
      console.error(`Error fetching feedbacks for theme "${themeName}":`, err);
    } finally {
      setLoadingFeedbacks(false);
    }
  }

  const handleOpenLogs = (theme) => {
    setActiveTheme(theme);
    setModalOpen(true);
    fetchThemeFeedbacks(theme.theme, theme.productName);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setActiveTheme(null);
    setFeedbacks([]);
  };

  // Helper to render trend icons
  const renderTrendIcon = (trend) => {
    if (trend === 'Increasing') return <TrendingUp size={14} className="text-critical" />;
    if (trend === 'Decreasing') return <TrendingDown size={14} className="text-emerald" />;
    return <Minus size={14} className="text-secondary" />;
  };

  // Filter logic
  const filteredThemes = themes.filter((t) => {
    const matchesSearch = t.theme.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = selectedProduct === '' || t.productName === selectedProduct;
    const matchesTrend = selectedTrend === '' || t.trend === selectedTrend;
    return matchesSearch && matchesProduct && matchesTrend;
  });

  if (loading) {
    return (
      <div className="upload-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '80vh', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="spinner text-violet" size={48} />
        <h3 style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Loading Theme Memory...</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Retrieving historic user theme records, sentiment ratios, and mention counts.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="upload-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '80vh', justifyContent: 'center', alignItems: 'center' }}>
        <AlertTriangle className="text-critical" size={48} />
        <h3 style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Failed to Load Theme Memory</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{error}</p>
        <button onClick={fetchInitialData} className="submit-btn" style={{ marginTop: '20px', padding: '10px 20px' }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="upload-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h2 className="title">Extracted Theme Memory</h2>
        <p className="subtitle">Track recurring user concepts and complaints remembered by the AI Memory Engine over time.</p>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-card themes-filter-card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <div className="themes-filter-bar">
          {/* Search */}
          <div className="search-input-wrap">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search theme memories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Product Filter */}
          <div className="filter-select-wrap">
            <Filter className="select-icon" size={14} />
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

          {/* Trend Filter */}
          <div className="filter-select-wrap">
            <BarChart3 className="select-icon" size={14} />
            <select
              value={selectedTrend}
              onChange={(e) => setSelectedTrend(e.target.value)}
            >
              <option value="">All Trends</option>
              <option value="Increasing">Increasing</option>
              <option value="Stable">Stable</option>
              <option value="Decreasing">Decreasing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Themes Grid */}
      {filteredThemes.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <Info className="glow-icon" size={24} />
            </div>
            <h3>No Themes Found</h3>
            <p>We couldn't find any themes matching your search query or selected filter options.</p>
          </div>
        </div>
      ) : (
        <div className="themes-memory-grid">
          {filteredThemes.map((t) => {
            const total = (t.positiveCount || 0) + (t.neutralCount || 0) + (t.negativeCount || 0) || 1;
            const posPer = Math.round(((t.positiveCount || 0) / total) * 100);
            const neuPer = Math.round(((t.neutralCount || 0) / total) * 100);
            const negPer = Math.round(((t.negativeCount || 0) / total) * 100);

            return (
              <div key={t._id} className="glass-card theme-memory-card">
                <div className="theme-card-header">
                  <span className="theme-card-product">{t.productName}</span>
                  <div className="flex align-center gap-6">
                    {renderTrendIcon(t.trend)}
                    <span className={`badge badge-${t.trend.toLowerCase()}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {t.trend}
                    </span>
                  </div>
                </div>

                <h4 className="theme-card-title">{t.theme}</h4>

                <div className="theme-card-mentions">
                  <span className="mentions-num">{t.mentions}</span>
                  <span className="mentions-label">Mentions</span>
                </div>

                {/* Sentiment Ratio Bar */}
                <div style={{ margin: '16px 0' }}>
                  <div className="flex justify-between" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>Sentiment Breakdown</span>
                    <span>
                      <span className="text-emerald">{posPer}%</span> / <span className="text-critical">{negPer}%</span>
                    </span>
                  </div>
                  <div className="progress-track-compound">
                    <div className="progress-fill positive" style={{ width: `${posPer}%` }} title={`Positive: ${t.positiveCount || 0}`}></div>
                    <div className="progress-fill neutral" style={{ width: `${neuPer}%` }} title={`Neutral: ${t.neutralCount || 0}`}></div>
                    <div className="progress-fill negative" style={{ width: `${negPer}%` }} title={`Negative: ${t.negativeCount || 0}`}></div>
                  </div>
                </div>

                {/* Dates */}
                <div className="theme-card-dates">
                  <div className="date-row">
                    <Calendar size={12} className="text-muted" />
                    <span>First Seen: {new Date(t.firstSeen).toLocaleDateString()}</span>
                  </div>
                  <div className="date-row">
                    <Calendar size={12} className="text-muted" />
                    <span>Last Seen: {new Date(t.lastSeen).toLocaleDateString()}</span>
                  </div>
                </div>

                <button 
                  className="submit-btn theme-logs-btn"
                  onClick={() => handleOpenLogs(t)}
                >
                  <MessageSquare size={14} />
                  View Feedback Logs
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Drill-down Modal */}
      {modalOpen && activeTheme && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content glass-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseModal}>
              <X size={18} />
            </button>

            <div className="modal-header">
              <div className="flex align-center gap-8 text-violet">
                <Tag size={20} className="glow-icon" />
                <h3 className="modal-title">{activeTheme.theme}</h3>
              </div>
              <p className="modal-subtitle">
                Associated feedback quotes for product <strong>{activeTheme.productName}</strong>
              </p>
            </div>

            {loadingFeedbacks ? (
              <div className="modal-loader">
                <Loader2 className="spinner text-violet" size={32} />
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading associated feedbacks...</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="modal-loader">
                <Info size={24} className="text-muted" />
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>No matching feedbacks found.</p>
              </div>
            ) : (
              <div className="modal-feedback-list">
                {feedbacks.map((f) => (
                  <div key={f._id} className="modal-feedback-item">
                    <p className="modal-feedback-text">"{f.feedback}"</p>
                    
                    <div className="modal-feedback-meta">
                      {/* Sentiment */}
                      <span className={`badge badge-${f.sentiment}`}>
                        {f.sentiment}
                      </span>

                      {/* Priority */}
                      <span className={`badge badge-${f.priority?.toLowerCase()}`}>
                        {f.priority}
                      </span>

                      {/* Type */}
                      <span className="type-chip">{f.type}</span>

                      {/* Area */}
                      <span className="area-chip">{f.productArea}</span>

                      {/* Actionability */}
                      <div className="flex align-center gap-4" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {f.actionability === 'Immediate Action' ? (
                          <ShieldAlert size={14} className="text-critical" />
                        ) : (
                          <Zap size={14} className="text-cyan" />
                        )}
                        <span>{f.actionability}</span>
                      </div>

                      {/* Date */}
                      <span className="feedback-date" style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(f.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
