import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sparkles, RefreshCw, Loader2, AlertTriangle, ShieldAlert, 
  Zap, ThumbsUp, ThumbsDown, Target, HelpCircle, Calendar, 
  Copy, Download, CheckCircle2, ChevronRight, ListCollapse
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function GlobalAIRecommendations() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  async function fetchReport() {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/dashboard/recommendations`);
      if (response.data && response.data.data) {
        setReport(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load global AI recommendations:', err);
      setError(err.response?.data?.error || 'Failed to retrieve global strategic report.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/dashboard/recommendations/regenerate`);
      if (response.data && response.data.data) {
        setReport(response.data.data);
      }
    } catch (err) {
      console.error('Failed to regenerate global report:', err);
      alert('Failed to update strategic report. Make sure you have product and theme database records.');
    } finally {
      setRegenerating(false);
    }
  }

  // Format utility to copy report text
  const getMarkdownText = () => {
    if (!report) return '';
    return `# InsightFlow AI - Global Strategic Intelligence Report
Generated: ${new Date(report.lastUpdated).toLocaleString()}

## Executive Summary
${report.executiveOverview}

## SWOT Analysis

### Key Strengths
${report.globalSWOT.strengths.map(s => `- ${s}`).join('\n')}

### Key Weaknesses
${report.globalSWOT.weaknesses.map(w => `- ${w}`).join('\n')}

### Strategic Opportunities
${report.globalSWOT.opportunities.map(o => `- ${o}`).join('\n')}

### Strategic Threats
${report.globalSWOT.threats.map(t => `- ${t}`).join('\n')}

## Proposed Product Roadmap
${report.roadmapSuggestions.map((item, index) => `${index + 1}. **${item.item}** [Priority: ${item.priority}]\n   *Reasoning:* ${item.reason}`).join('\n\n')}

## Emerging Risks & Alerts
${report.riskAlerts.map(r => `- ${r}`).join('\n')}

## Suggested Action Plan
${report.suggestedActions}
`;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(getMarkdownText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const text = getMarkdownText();
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `InsightFlow_Global_Strategic_Report_${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="upload-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '80vh', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="spinner text-violet" size={48} />
        <h3 style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Compiling AI Recommendations...</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Aggregating cross-product sentiments and evaluating historical theme trends.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="upload-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '80vh', justifyContent: 'center', alignItems: 'center' }}>
        <AlertTriangle className="text-critical" size={48} />
        <h3 style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Failed to Load Report</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{error}</p>
        <button onClick={fetchReport} className="submit-btn" style={{ marginTop: '20px', padding: '10px 20px' }}>
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
          <h2 className="title">Strategic AI Recommendations</h2>
          <p className="subtitle">CPO-level cross-product analysis, strategic SWOT, suggested roadmap, and risk mitigations.</p>
        </div>
        
        <div className="flex align-center gap-8">
          {report && (
            <>
              <button 
                onClick={handleCopyToClipboard} 
                className="submit-btn" 
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: '8px' }}
              >
                {copied ? <CheckCircle2 size={14} className="text-emerald" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Markdown'}
              </button>
              
              <button 
                onClick={handleDownloadFile} 
                className="submit-btn" 
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: '8px' }}
              >
                <Download size={14} />
                Download .md
              </button>
            </>
          )}

          <button 
            className="submit-btn" 
            onClick={handleRegenerate} 
            disabled={regenerating}
            style={{ padding: '8px 14px', borderRadius: '8px' }}
          >
            {regenerating ? (
              <>
                <Loader2 className="spinner" size={14} />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                Update Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {!report ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <Sparkles className="glow-icon" size={24} />
            </div>
            <h3>Report Awaiting Data</h3>
            <p>No feedback or theme memory records are compiled in the database yet. Submit product and feedback entries to generate global CPO briefings.</p>
          </div>
        </div>
      ) : (
        <div className="report-workspace-body animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Executive Summary Narrative */}
          <div className="glass-card report-summary-box" style={{ background: 'rgba(139, 92, 246, 0.02)', padding: '24px' }}>
            <div className="flex align-center gap-8" style={{ marginBottom: '12px' }}>
              <Sparkles className="text-violet" size={18} />
              <strong style={{ fontSize: '16px' }}>Executive Strategic Overview</strong>
            </div>
            <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
              {report.executiveOverview}
            </p>
          </div>

          {/* SWOT 2x2 Grid */}
          <div className="global-swot-section">
            <h4 className="products-list-header" style={{ marginBottom: '16px' }}>Global SWOT Analysis</h4>
            <div className="swot-2x2-grid">
              {/* Strengths */}
              <div className="glass-card swot-box swot-strengths">
                <div className="swot-box-header text-emerald">
                  <ThumbsUp size={16} />
                  <span>Strengths</span>
                </div>
                {report.globalSWOT.strengths.length === 0 ? (
                  <p className="swot-box-empty">No strengths recorded.</p>
                ) : (
                  <ul className="swot-box-list">
                    {report.globalSWOT.strengths.map((s, i) => (
                      <li key={i}><ChevronRight size={12} className="text-emerald" /> {s}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Weaknesses */}
              <div className="glass-card swot-box swot-weaknesses">
                <div className="swot-box-header text-critical">
                  <ThumbsDown size={16} />
                  <span>Weaknesses</span>
                </div>
                {report.globalSWOT.weaknesses.length === 0 ? (
                  <p className="swot-box-empty">No weaknesses recorded.</p>
                ) : (
                  <ul className="swot-box-list">
                    {report.globalSWOT.weaknesses.map((w, i) => (
                      <li key={i}><ChevronRight size={12} className="text-critical" /> {w}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Opportunities */}
              <div className="glass-card swot-box swot-opportunities">
                <div className="swot-box-header text-cyan">
                  <Target size={16} />
                  <span>Opportunities</span>
                </div>
                {report.globalSWOT.opportunities.length === 0 ? (
                  <p className="swot-box-empty">No opportunities recorded.</p>
                ) : (
                  <ul className="swot-box-list">
                    {report.globalSWOT.opportunities.map((o, i) => (
                      <li key={i}><ChevronRight size={12} className="text-cyan" /> {o}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Threats */}
              <div className="glass-card swot-box swot-threats">
                <div className="swot-box-header" style={{ color: '#f59e0b' }}>
                  <HelpCircle size={16} />
                  <span>Threats (Risks)</span>
                </div>
                {report.globalSWOT.threats.length === 0 ? (
                  <p className="swot-box-empty">No threats recorded.</p>
                ) : (
                  <ul className="swot-box-list">
                    {report.globalSWOT.threats.map((t, i) => (
                      <li key={i}><ChevronRight size={12} style={{ color: '#f59e0b' }} /> {t}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Suggested Roadmap */}
          <div className="roadmap-suggestions-section">
            <h4 className="products-list-header" style={{ marginBottom: '16px' }}>AI Prioritized Product Roadmap</h4>
            <div className="roadmap-suggestions-list">
              {report.roadmapSuggestions.map((item, idx) => (
                <div key={idx} className="glass-card roadmap-card-item">
                  <div className="roadmap-num-indicator">{idx + 1}</div>
                  <div className="roadmap-card-details">
                    <div className="flex align-center gap-16 justify-between">
                      <h5 className="roadmap-item-title">{item.item}</h5>
                      <span className={`badge badge-${item.priority.toLowerCase()}`}>
                        {item.priority} Priority
                      </span>
                    </div>
                    <p className="roadmap-item-reason">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risks Alerts & Action Plan Grid */}
          <div className="dashboard-charts-row" style={{ marginTop: '16px' }}>
            {/* Emerging Risks */}
            <div className="glass-card immediate-action-card">
              <div className="flex align-center gap-8" style={{ marginBottom: '16px' }}>
                <ShieldAlert size={18} className="text-critical" />
                <span className="products-list-header">Emerging Strategic Risks</span>
              </div>
              <div className="immediate-problems-list">
                {report.riskAlerts.map((alert, index) => (
                  <div key={index} className="problem-item-card" style={{ borderLeftColor: 'var(--priority-critical)' }}>
                    <p style={{ fontSize: '13px', lineHeight: '1.5', fontStyle: 'normal' }}>
                      {alert}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Action Plan */}
            <div className="glass-card swot-card action-plan" style={{ borderTopWidth: '3px', borderTopStyle: 'solid', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="swot-title text-cyan" style={{ fontSize: '16px', fontWeight: '600' }}>
                <Zap size={18} /> Strategic Executive Action Plan
              </div>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)', marginTop: '8px', flexGrow: 1 }}>
                {report.suggestedActions}
              </p>
            </div>
          </div>

          {/* Timestamp footer */}
          <div className="report-footer flex align-center gap-8 justify-between">
            <div className="flex align-center gap-8">
              <Calendar size={14} />
              <span>Report Last Compiled: {new Date(report.lastUpdated).toLocaleString()}</span>
            </div>
            <div className="flex align-center gap-4 text-violet">
              <Sparkles size={14} className="glow-icon" />
              <span>Powered by Groq LLM Intelligence Engine</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
