import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, Star, MessageSquare, AlertTriangle, ShieldAlert, 
  ArrowRight, ThumbsUp, ThumbsDown, Minus, RefreshCw, Loader2, Sparkles
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
console.log(import.meta.env.VITE_API_BASE);
const API_BASE = import.meta.env.VITE_API_BASE;

export default function DashboardOverview({ setActiveTab, setSelectedProduct }) {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  async function fetchOverviewData() {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/dashboard/overview`);
      if (response.data && response.data.data) {
        setOverviewData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard overview stats:', err);
      setError(err.response?.data?.error || 'Failed to retrieve overview statistics.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/dashboard/overview`);
      if (response.data && response.data.data) {
        setOverviewData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to refresh dashboard overview stats:', err);
      setError('Failed to refresh data.');
    } finally {
      setRefreshing(false);
    }
  }

  // Handle navigating to products detailed view
  const handleViewProduct = (productName, description) => {
    // Find the product item matching details
    const productObj = { name: productName, description };
    setSelectedProduct(productObj);
    setActiveTab('products');
  };

  // Helper to render star rating icons
  const renderStars = (rating) => {
    const stars = [];
    const rounded = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={14} 
          className={i <= rounded ? 'fill-amber-500 text-amber-500' : 'text-slate-600'} 
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="upload-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '80vh', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="spinner text-violet" size={48} />
        <h3 style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Loading Dashboard Overview...</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Aggregating system statistics, compiling product memories, and fetching intelligence reports.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="upload-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '80vh', justifyContent: 'center', alignItems: 'center' }}>
        <AlertTriangle className="text-critical" size={48} />
        <h3 style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Failed to Load Dashboard</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{error}</p>
        <button onClick={fetchOverviewData} className="submit-btn" style={{ marginTop: '20px', padding: '10px 20px' }}>
          Try Again
        </button>
      </div>
    );
  }
if (!overviewData) {
  return <div>Loading dashboard data...</div>;
}

  const {
    totalProducts,
    totalFeedbacks,
    overallRating,
    sentimentDistribution,
    lastFiveFeedbacks,
    highProblems,
    productsSummary
  } = overviewData;

  // Data for Recharts Pie Chart
  const pieData = [
    { name: 'Positive', value: sentimentDistribution.positiveCount, color: 'var(--sentiment-positive)' },
    { name: 'Neutral', value: sentimentDistribution.neutralCount, color: 'var(--sentiment-neutral)' },
    { name: 'Negative', value: sentimentDistribution.negativeCount, color: 'var(--sentiment-negative)' }
  ].filter(d => d.value > 0); // Only render slices with count > 0

  return (
    <div className="upload-page animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="title">Executive Intelligence Dashboard</h2>
          <p className="subtitle">High-level insights, critical issue alerts, and feedback performance overview across all products.</p>
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

      {/* KPI Cards Grid */}
      <div className="dashboard-kpi-grid">
        {/* Total Products */}
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrap">
            <Package size={22} className="text-cyan" />
          </div>
          <div className="kpi-details">
            <span className="meta-label">Total Products</span>
            <h3 className="kpi-value">{totalProducts}</h3>
            <p className="kpi-subtext">Active catalog items</p>
          </div>
        </div>

        {/* Overall Customer Rating */}
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrap">
            <Star size={22} className="text-amber-500 fill-amber-500" />
          </div>
          <div className="kpi-details">
            <span className="meta-label">Overall Customer Rating</span>
            <div className="flex align-center gap-8">
              <h3 className="kpi-value">{overallRating.toFixed(1)}</h3>
              <span className="rating-stars-dashboard" style={{ display: 'flex' }}>
                {renderStars(overallRating)}
              </span>
            </div>
            <p className="kpi-subtext">Weighted score (out of 5)</p>
          </div>
        </div>

        {/* Total Feedbacks */}
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrap">
            <MessageSquare size={22} className="text-violet" />
          </div>
          <div className="kpi-details">
            <span className="meta-label">Total Feedbacks Received</span>
            <h3 className="kpi-value">{totalFeedbacks}</h3>
            <p className="kpi-subtext">Across all integrations</p>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Row: Sentiment and Critical Issues */}
      <div className="dashboard-charts-row">
        {/* Left: Global Sentiment Distribution */}
        <div className="glass-card chart-container-card">
          <span className="products-list-header" style={{ marginBottom: '16px', display: 'block' }}>Global Sentiment Profile</span>
          {pieData.length === 0 ? (
            <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              No feedback data available for chart.
            </div>
          ) : (
            <div className="sentiment-chart-wrap" style={{ height: '220px', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#0f111a', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend & Statistics */}
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Positive */}
                <div>
                  <div className="flex align-center justify-between" style={{ fontSize: '13px', marginBottom: '4px' }}>
                    <span className="flex align-center gap-8"><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--sentiment-positive)' }}></span> Positive</span>
                    <strong>{sentimentDistribution.positivePercentage}% ({sentimentDistribution.positiveCount})</strong>
                  </div>
                  <div className="progress-track" style={{ height: '4px' }}>
                    <div className="progress-fill positive" style={{ width: `${sentimentDistribution.positivePercentage}%` }}></div>
                  </div>
                </div>
                {/* Neutral */}
                <div>
                  <div className="flex align-center justify-between" style={{ fontSize: '13px', marginBottom: '4px' }}>
                    <span className="flex align-center gap-8"><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--sentiment-neutral)' }}></span> Neutral</span>
                    <strong>{sentimentDistribution.neutralPercentage}% ({sentimentDistribution.neutralCount})</strong>
                  </div>
                  <div className="progress-track" style={{ height: '4px' }}>
                    <div className="progress-fill neutral" style={{ width: `${sentimentDistribution.neutralPercentage}%` }}></div>
                  </div>
                </div>
                {/* Negative */}
                <div>
                  <div className="flex align-center justify-between" style={{ fontSize: '13px', marginBottom: '4px' }}>
                    <span className="flex align-center gap-8"><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--sentiment-negative)' }}></span> Negative</span>
                    <strong>{sentimentDistribution.negativePercentage}% ({sentimentDistribution.negativeCount})</strong>
                  </div>
                  <div className="progress-track" style={{ height: '4px' }}>
                    <div className="progress-fill negative" style={{ width: `${sentimentDistribution.negativePercentage}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: High Problems (Fix Immediately) */}
        <div className="glass-card immediate-action-card">
          <div className="flex align-center gap-8" style={{ marginBottom: '16px' }}>
            <ShieldAlert size={18} className="text-critical" />
            <span className="products-list-header">Immediate Action Required</span>
          </div>

          {highProblems.length === 0 ? (
            <div className="empty-action-state">
              <Sparkles size={20} className="text-emerald" style={{ marginBottom: '8px' }} />
              <p>No critical problems or high-priority complaints found in the database. Excellent!</p>
            </div>
          ) : (
            <div className="immediate-problems-list">
              {highProblems.map((prob) => (
                <div key={prob._id} className="problem-item-card">
                  <div className="problem-header">
                    <span className="problem-product-badge">{prob.productName}</span>
                    <span className={`badge badge-${prob.priority.toLowerCase()}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {prob.priority}
                    </span>
                  </div>
                  <p className="problem-text">"{prob.feedback}"</p>
                  <div className="problem-footer">
                    <span className="problem-theme-tag">{prob.theme}</span>
                    <span>{new Date(prob.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Section: Product Catalog and Recent Activity */}
      <div className="dashboard-details-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px', marginTop: '32px' }}>
        
        {/* Products Summary Directory */}
        <div className="glass-card product-summary-directory">
          <h4 className="products-list-header" style={{ marginBottom: '16px' }}>Product Performance Directory</h4>
          {productsSummary.length === 0 ? (
            <p className="text-muted" style={{ padding: '20px 0' }}>No products found. Navigate to "Products & Analysis" to register your first product!</p>
          ) : (
            <div className="product-summary-list">
              {productsSummary.map((ps) => (
                <div key={ps._id} className="product-summary-item">
                  <div className="summary-item-header">
                    <div>
                      <h5 className="summary-item-name">{ps.name}</h5>
                      {ps.description && <p className="summary-item-desc">{ps.description}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="flex align-center gap-4 justify-end">
                        <span className="summary-item-rating">{ps.overallRating.toFixed(1)}</span>
                        <div style={{ display: 'flex', color: '#f59e0b' }}>
                          {renderStars(ps.overallRating)}
                        </div>
                      </div>
                      <span className="summary-item-count">{ps.totalFeedbacks} feedbacks</span>
                    </div>
                  </div>

                  <div className="summary-item-body">
                    {/* Sentiment Bar */}
                    <div style={{ flexGrow: 1 }}>
                      <div className="flex justify-between" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <span>Sentiment Ratios</span>
                        <span>
                          <span className="text-emerald">{ps.sentimentDistribution.positivePercentage}%</span> / <span className="text-critical">{ps.sentimentDistribution.negativePercentage}%</span>
                        </span>
                      </div>
                      <div className="progress-track-compound">
                        <div className="progress-fill positive" style={{ width: `${ps.sentimentDistribution.positivePercentage}%` }}></div>
                        <div className="progress-fill neutral" style={{ width: `${ps.sentimentDistribution.neutralPercentage}%` }}></div>
                        <div className="progress-fill negative" style={{ width: `${ps.sentimentDistribution.negativePercentage}%` }}></div>
                      </div>
                    </div>

                    {/* Top Theme & Action Button */}
                    <div className="flex align-center justify-between" style={{ gap: '16px' }}>
                      <div className="top-theme-box">
                        <span className="top-theme-label">Top Theme</span>
                        <span className="top-theme-val">{ps.topTheme}</span>
                      </div>
                      <button 
                        className="view-analysis-link"
                        onClick={() => handleViewProduct(ps.name, ps.description)}
                      >
                        View Analysis <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Feedbacks Activity Feed */}
        <div className="glass-card latest-feedbacks-card">
          <h4 className="products-list-header" style={{ marginBottom: '16px' }}>Latest Feedback Activity</h4>
          {lastFiveFeedbacks.length === 0 ? (
            <p className="text-muted" style={{ padding: '20px 0', textAlign: 'center' }}>No feedbacks submitted yet. Go to "Upload Feedback" to get started!</p>
          ) : (
            <div className="latest-activity-feed">
              {lastFiveFeedbacks.map((f) => (
                <div key={f._id} className="activity-feed-item">
                  <div className="feed-item-header">
                    <span className="feed-item-product">{f.productName}</span>
                    <span className={`badge badge-${f.sentiment}`}>
                      {f.sentiment}
                    </span>
                  </div>
                  <p className="feed-item-text">"{f.feedback}"</p>
                  <div className="feed-item-footer">
                    <span className="feed-item-type">{f.type}</span>
                    <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
