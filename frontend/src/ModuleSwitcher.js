import React, { useState } from 'react';
import './ModuleSwitcher.css';

// Import your components
import TTSApp from './TTSApp';
import AIModule from './AIModule';
import CombinedModule from './CombinedModule';

const ModuleSwitcher = () => {
  const [activeModule, setActiveModule] = useState('tts');

  return (
    <div className="module-switcher-container">
      <h1>Multi-Module Application</h1>
      
      <div className="module-tabs">
        <button 
          className={`tab-button ${activeModule === 'tts' ? 'active' : ''}`}
          onClick={() => setActiveModule('tts')}
        >
          Text-to-Speech Module
        </button>
        <button 
          className={`tab-button ${activeModule === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveModule('ai')}
        >
          AI Assistant Module
        </button>
        <button 
          className={`tab-button ${activeModule === 'combined' ? 'active' : ''}`}
          onClick={() => setActiveModule('combined')}
        >
          Combined Mode
        </button>
      </div>
      
      <div className="module-content">
        {activeModule === 'tts' ? (
          <div className="tts-module-wrapper">
            <TTSApp />
          </div>
        ) : activeModule === 'ai' ? (
          <div className="ai-module-wrapper">
            <AIModule />
          </div>
        ) : (
          <div className="combined-module-wrapper">
            <CombinedModule />
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleSwitcher;