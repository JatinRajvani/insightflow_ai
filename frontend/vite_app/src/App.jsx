import React, { useState } from 'react';
import { UploadCloud, BarChart3, BrainCircuit, FileText, LayoutDashboard, Database } from 'lucide-react';
import DashboardOverview from './components/DashboardOverview';
import FeedbackUpload from './components/FeedbackUpload';
import ProductsManager from './components/ProductsManager';
import ThemeMemoryDashboard from './components/ThemeMemoryDashboard';
import GlobalAIRecommendations from './components/GlobalAIRecommendations';
import FeedbackExplorer from './components/FeedbackExplorer';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <BrainCircuit className="brand-icon" size={26} />
          <span className="brand-name">InsightFlow AI</span>
        </div>

        <nav className="nav-menu">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard className="nav-icon" size={18} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
          >
            <UploadCloud className="nav-icon" size={18} />
            <span>Upload Feedback</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
          >
            <BarChart3 className="nav-icon" size={18} />
            <span>Products & Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`nav-item ${activeTab === 'themes' ? 'active' : ''}`}
          >
            <BrainCircuit className="nav-icon" size={18} />
            <span>Theme Memory</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          >
            <FileText className="nav-icon" size={18} />
            <span>AI Recommendations</span>
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`nav-item ${activeTab === 'explorer' ? 'active' : ''}`}
          >
            <Database className="nav-icon" size={18} />
            <span>Feedback Explorer</span>
          </button>
        </nav>
      </aside>

      {/* Main Panel Content Area */}
      <main className="content-area">
        {activeTab === 'dashboard' && (
          <DashboardOverview 
            setActiveTab={setActiveTab} 
            setSelectedProduct={setSelectedProduct} 
          />
        )}
        {activeTab === 'upload' && <FeedbackUpload />}
        {activeTab === 'products' && (
          <ProductsManager 
            selectedProduct={selectedProduct} 
            setSelectedProduct={setSelectedProduct} 
          />
        )}
        {activeTab === 'themes' && <ThemeMemoryDashboard />}
        {activeTab === 'reports' && <GlobalAIRecommendations />}
        {activeTab === 'explorer' && <FeedbackExplorer />}
      </main>
    </div>
  );
}

export default App;
