import React, { useState, useEffect, useRef } from 'react';
import './AIModule.css';

const AIModule = ({ onOutputGenerated }) => {
  // Original state variables from previous implementation
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [saveOpenaiKey, setSaveOpenaiKey] = useState(false);
  const [saveGeminiKey, setSaveGeminiKey] = useState(false);
  const [openaiKeySaved, setOpenaiKeySaved] = useState(false);
  const [geminiKeySaved, setGeminiKeySaved] = useState(false);
  const [selectedAPI, setSelectedAPI] = useState('openai');
  const [inputText, setInputText] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New state variables for enhanced features
  const [conversationHistory, setConversationHistory] = useState([]);
  const [modelSelection, setModelSelection] = useState('gpt-3.5-turbo');
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const outputRef = useRef(null);
  
  // Check for saved API keys and prompts on component mount
  useEffect(() => {
    const savedOpenaiKey = localStorage.getItem('openai_api_key');
    const savedGeminiKey = localStorage.getItem('gemini_api_key');
    const savedPromptsList = JSON.parse(localStorage.getItem('saved_prompts') || '[]');
    
    if (savedOpenaiKey) {
      setOpenaiKey(savedOpenaiKey);
      setOpenaiKeySaved(true);
    }
    
    if (savedGeminiKey) {
      setGeminiKey(savedGeminiKey);
      setGeminiKeySaved(true);
    }
    
    if (savedPromptsList.length > 0) {
      setSavedPrompts(savedPromptsList);
    }
  }, []);

  // Scroll to bottom of output when new response is generated
  useEffect(() => {
    if (outputRef.current && outputText) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputText]);
  
  // Handler for saving API keys
  const handleSaveKeys = () => {
    if (saveOpenaiKey && openaiKey) {
      localStorage.setItem('openai_api_key', openaiKey);
      setOpenaiKeySaved(true);
    }
    
    if (saveGeminiKey && geminiKey) {
      localStorage.setItem('gemini_api_key', geminiKey);
      setGeminiKeySaved(true);
    }
  };

  // Handler for clearing saved API keys
  const handleClearKeys = () => {
    if (openaiKeySaved) {
      localStorage.removeItem('openai_api_key');
      setOpenaiKeySaved(false);
    }
    
    if (geminiKeySaved) {
      localStorage.removeItem('gemini_api_key');
      setGeminiKeySaved(false);
    }
  };
  
  // Handler for saving current prompt template
  const handleSavePrompt = () => {
    if (promptTemplate.trim()) {
      const newSavedPrompts = [...savedPrompts, promptTemplate];
      setSavedPrompts(newSavedPrompts);
      localStorage.setItem('saved_prompts', JSON.stringify(newSavedPrompts));
    }
  };
  
  // Handler for loading a saved prompt
  const handleLoadPrompt = (prompt) => {
    setPromptTemplate(prompt);
  };
  
  // Handler for clearing conversation history
  const handleClearHistory = () => {
    setConversationHistory([]);
    setOutputText('');
  };

  // Handler for submitting to AI API
  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Prepare the complete prompt using template and input
      const completePrompt = promptTemplate 
        ? `${promptTemplate}\n\n${inputText}` 
        : inputText;
      
      let response;
      
      // Add user message to conversation
      const newMessage = { role: 'user', content: inputText };
      setConversationHistory([...conversationHistory, newMessage]);
      
      if (selectedAPI === 'openai') {
        if (!openaiKey) {
          throw new Error('OpenAI API key is required');
        }
        response = await fetchOpenAIResponse(completePrompt, openaiKey);
      } else {
        if (!geminiKey) {
          throw new Error('Gemini API key is required');
        }
        response = await fetchGeminiResponse(completePrompt, geminiKey);
      }
      
      // Add assistant response to conversation
      const assistantMessage = { role: 'assistant', content: response };
      const updatedHistory = [...conversationHistory, newMessage, assistantMessage];
      setConversationHistory(updatedHistory);
      
      setOutputText(response);
      
      // Call the callback if provided (for integration with TTS)
      if (onOutputGenerated && typeof onOutputGenerated === 'function') {
        onOutputGenerated(response);
      }
      
      // Clear input for next message
      setInputText('');
    } catch (err) {
      setError(err.message);
      console.error('Error processing request:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to call OpenAI API
  const fetchOpenAIResponse = async (prompt, apiKey) => {
    // For a real conversation, include the history
    const messages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the current message
    messages.push({ role: 'user', content: prompt });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelSelection,
        messages: messages,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get response from OpenAI');
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response generated';
  };

  // Function to call Gemini API
  const fetchGeminiResponse = async (prompt, apiKey) => {
    // Simple implementation - could be enhanced to handle conversation history
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get response from Gemini');
    }
    
    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
  };

  // Function to send output to TTS
  const handleSendToTTS = () => {
    if (outputText && onOutputGenerated) {
      onOutputGenerated(outputText);
    }
  };

  return (
    <div className="ai-module-container">
      <h2>AI Assistant Module</h2>
      
      {/* API Selection and Configuration */}
      <div className="api-selection">
        <div className="radio-group">
          <label>
            <input 
              type="radio" 
              value="openai" 
              checked={selectedAPI === 'openai'} 
              onChange={() => setSelectedAPI('openai')} 
            />
            OpenAI (ChatGPT)
          </label>
          <label>
            <input 
              type="radio" 
              value="gemini" 
              checked={selectedAPI === 'gemini'} 
              onChange={() => setSelectedAPI('gemini')} 
            />
            Gemini
          </label>
        </div>
        
        {/* Model Selection for OpenAI */}
        {selectedAPI === 'openai' && (
          <div className="model-selection">
            <label>
              Model:
              <select 
                value={modelSelection} 
                onChange={(e) => setModelSelection(e.target.value)}
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </label>
          </div>
        )}
        
        {/* API Key Management */}
        <div className="api-keys">
          {selectedAPI === 'openai' && (
            <div className="api-key-input">
              <label>
                OpenAI API Key:
                <input 
                  type="password" 
                  value={openaiKey} 
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={openaiKeySaved ? "API key saved" : "Enter OpenAI API key"}
                />
              </label>
              <label className="save-key-checkbox">
                <input 
                  type="checkbox" 
                  checked={saveOpenaiKey} 
                  onChange={(e) => setSaveOpenaiKey(e.target.checked)} 
                />
                Save key locally
              </label>
              {openaiKeySaved && <span className="key-saved-indicator">✓ Key saved</span>}
            </div>
          )}
          
          {selectedAPI === 'gemini' && (
            <div className="api-key-input">
              <label>
                Gemini API Key:
                <input 
                  type="password" 
                  value={geminiKey} 
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder={geminiKeySaved ? "API key saved" : "Enter Gemini API key"}
                />
              </label>
              <label className="save-key-checkbox">
                <input 
                  type="checkbox" 
                  checked={saveGeminiKey} 
                  onChange={(e) => setSaveGeminiKey(e.target.checked)} 
                />
                Save key locally
              </label>
              {geminiKeySaved && <span className="key-saved-indicator">✓ Key saved</span>}
            </div>
          )}
          
          <div className="key-actions">
            <button onClick={handleSaveKeys}>Save Keys</button>
            <button onClick={handleClearKeys}>Clear Saved Keys</button>
          </div>
        </div>
      </div>
      
      {/* Prompt Management */}
      <div className="prompt-management">
        <div className="saved-prompts">
          <h3>Saved Prompts</h3>
          <div className="prompt-list">
            {savedPrompts.length > 0 ? (
              savedPrompts.map((prompt, index) => (
                <div key={index} className="saved-prompt-item">
                  <button onClick={() => handleLoadPrompt(prompt)}>
                    {prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt}
                  </button>
                </div>
              ))
            ) : (
              <p className="no-prompts">No saved prompts yet</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Input Area */}
      <div className="input-area">
        <div className="prompt-template">
          <label>
            Prompt Template (Optional):
            <textarea 
              value={promptTemplate} 
              onChange={(e) => setPromptTemplate(e.target.value)}
              placeholder="Enter a system prompt or instructions here..."
              rows={3}
            />
            <button 
              className="save-prompt-button" 
              onClick={handleSavePrompt}
              disabled={!promptTemplate.trim()}
            >
              Save Prompt
            </button>
          </label>
        </div>
        
        <div className="user-input">
          <label>
            Your Message:
            <textarea 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter your message here..."
              rows={5}
            />
          </label>
        </div>
        
        <button 
          className="submit-button" 
          onClick={handleSubmit}
          disabled={isLoading || (!inputText.trim())}
        >
          {isLoading ? 'Processing...' : 'Submit'}
        </button>
      </div>
      
      {/* Output Area */}
      <div className="output-area">
        <div className="output-header">
          <h3>Response:</h3>
          <div className="output-actions">
            <button onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
            <button onClick={handleClearHistory}>Clear History</button>
            <button onClick={handleSendToTTS} disabled={!outputText}>
              Send to TTS
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {showHistory ? (
          <div className="conversation-history" ref={outputRef}>
            {conversationHistory.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-header">{message.role === 'user' ? 'You' : 'AI'}</div>
                <div className="message-content">{message.content}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="output-text" ref={outputRef}>
            {isLoading ? (
              <div className="loading-indicator">Generating response...</div>
            ) : (
              outputText ? (
                <pre>{outputText}</pre>
              ) : (
                <p className="placeholder">Response will appear here</p>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIModule;