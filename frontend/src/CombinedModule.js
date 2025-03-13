import React, { useState, useEffect } from 'react';
import './CombinedModule.css';

// Import your components - uncomment the TTSApp import
import TTSApp from './TTSApp';
import AIModule from './AIModule';

const CombinedModule = () => {
  const [aiOutput, setAiOutput] = useState('');
  const [showTTS, setShowTTS] = useState(false);
  
  // Handle output from AI module
  const handleAIOutput = (text) => {
    setAiOutput(text);
    setShowTTS(true);
  };
  
  return (
    <div className="combined-module-container">
      <h2>Combined AI + TTS Module</h2>
      
      <div className="module-description">
        <p>This module allows you to generate text with AI and then convert it to speech using TTS.</p>
      </div>
      
      <div className="workflow-steps">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-text">Generate text using AI</div>
        </div>
        <div className="step-arrow">→</div>
        <div className="step">
          <div className="step-number">2</div>
          <div className="step-text">Convert to speech using TTS</div>
        </div>
      </div>
      
      <div className="modules-container">
        <div className="ai-section">
          <h3>AI Text Generation</h3>
          <AIModule onOutputGenerated={handleAIOutput} />
        </div>
        
        {showTTS && (
          <div className="tts-section">
            <h3>Text-to-Speech Conversion</h3>
            <div className="tts-content">
              <h4>Text to Convert:</h4>
              <div className="ai-output-preview">
                {aiOutput}
              </div>
              
              {/* Your TTS component properly integrated */}
              <TTSApp text={aiOutput} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedModule;