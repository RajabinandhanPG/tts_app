import React, { useState, useEffect, useRef } from 'react';

const TTSApp = ({ text }) => {
  
  // State variables
  const [activeStep, setActiveStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState('elevenlabs');
  const [apiKeys, setApiKeys] = useState({
    elevenlabs: '',
    lemonfox: '',
  });
  const [saveApiKey, setSaveApiKey] = useState(true);
  const [apiKeyStatus, setApiKeyStatus] = useState({
    elevenlabs: false,
    lemonfox: false
  });
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [inputText, setInputText] = useState(text || '');
  const [voices, setVoices] = useState([]);
  const [filteredVoices, setFilteredVoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [credits, setCredits] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState({
    voices: false,
    credits: false,
    generation: false,
  });
  const [error, setError] = useState({
    step1: '',
    step2: '',
    step3: '',
  });
  
  const audioRef = useRef(null);
  useEffect(() => {
    if (text) {
      setInputText(text);
    }
  }, [text]);
  
  // Load saved API keys on component mount
  useEffect(() => {
    const fetchApiKeyStatus = async () => {
      try {
        const response = await fetch('/api/get-api-keys');
        const data = await response.json();
        
        if (response.ok) {
          setApiKeyStatus(data);
        }
      } catch (err) {
        console.error("Error fetching API key status:", err);
      }
    };
    
    fetchApiKeyStatus();
  }, []);
  
  // Filter voices when search term changes
  useEffect(() => {
    if (voices.length > 0) {
      setFilteredVoices(
        voices.filter(voice => 
          voice.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, voices]);
  
  // Set service in the backend
  const setService = async () => {
    try {
      setError({ ...error, step1: '' });
      const apiKey = apiKeys[selectedProvider] || '';
      
      console.log("Sending request to /api/set-service with:", { 
        service: selectedProvider, 
        save_to_env: saveApiKey,
        api_key: apiKey ? "[API KEY PROVIDED]" : "[NO API KEY]" 
      });
      
      const response = await fetch('/api/set-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service: selectedProvider,
          api_key: apiKey,
          save_to_env: saveApiKey
        })
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Non-JSON response received:", await response.text());
        throw new Error("The server did not return JSON. Check if the Flask server is running correctly.");
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to set service');
      }
      
      // Update API key status if we saved a key
      if (saveApiKey && apiKey) {
        setApiKeyStatus({
          ...apiKeyStatus,
          [selectedProvider]: true
        });
      }
      
      console.log("Service set successfully:", data);
      return true;
    } catch (err) {
      console.error("Error setting service:", err);
      setError({ ...error, step1: err.message });
      return false;
    }
  };
  
  // Load voices from the selected provider
  const loadVoices = async () => {
    try {
      setError({ ...error, step2: '' });
      setLoading({ ...loading, voices: true });
      
      // Set service first
      const success = await setService();
      if (!success) {
        throw new Error('Failed to set service');
      }
      
      const response = await fetch('/api/voices');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch voices');
      }
      
      // Process voices based on provider
      let processedVoices = [];
      
      if (selectedProvider === 'elevenlabs') {
        processedVoices = data.voices.map(voice => ({
          id: voice.voice_id,
          name: voice.name,
          description: voice.description || 'No description available'
        }));
      } else if (selectedProvider === 'edge_tts') {
        processedVoices = data.voices.map(voice => ({
          id: voice.Name,
          name: voice.ShortName,
          description: `${voice.Gender}, ${voice.Locale}`
        }));
      } else if (selectedProvider === 'lemonfox') {
        processedVoices = data.voices.map(voice => ({
          id: voice.id,
          name: voice.name,
          description: voice.description || 'No description available'
        }));
      }
      
      setVoices(processedVoices);
      setFilteredVoices(processedVoices);
      setSelectedVoice(null);
    } catch (err) {
      setError({ ...error, step2: err.message });
    } finally {
      setLoading({ ...loading, voices: false });
    }
  };
  
  // Check remaining credits
  const checkCredits = async () => {
    try {
      setError({ ...error, step1: '' });
      setLoading({ ...loading, credits: true });
      
      // Set service first
      const success = await setService();
      if (!success) {
        throw new Error('Failed to set service');
      }
      
      const response = await fetch('/api/credits');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch credits information');
      }
      
      setCredits(data);
    } catch (err) {
      setError({ ...error, step1: err.message });
    } finally {
      setLoading({ ...loading, credits: false });
    }
  };
  
  // Generate speech from text
  const generateSpeech = async () => {
    try {
      setError({ ...error, step3: '' });
      
      if (!inputText.trim()) {
        throw new Error('Please enter some text');
      }
      
      if (!selectedVoice) {
        throw new Error('Please select a voice first');
      }
      
      setLoading({ ...loading, generation: true });
      
      // Reset audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: inputText,
          voice_id: selectedVoice.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }
      
      // Get audio blob
      const audioBlob = await response.blob();
      
      // Create URL for the audio blob
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Play audio
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (err) {
      setError({ ...error, step3: err.message });
    } finally {
      setLoading({ ...loading, generation: false });
    }
  };
  
  // Handle next button clicks
  const handleNext = async (step) => {
    if (step === 1) {
      // Moving from Step 1 to Step 2
      const success = await setService();
      if (success) {
        setActiveStep(2);
        loadVoices();
      }
    } else if (step === 2) {
      // Moving from Step 2 to Step 3
      if (!selectedVoice) {
        setError({ ...error, step2: 'Please select a voice to continue' });
        return;
      }
      setActiveStep(3);
    }
  };
  
  // Group voices by language
  const groupVoicesByLanguage = (voices) => {
    const grouped = {};
    
    // Language code to full name mapping
    const languageMap = {
      'af': 'Afrikaans',
      'am': 'Amharic',
      'ar': 'Arabic',
      'az': 'Azerbaijani',
      'bg': 'Bulgarian',
      'bn': 'Bengali',
      'ca': 'Catalan',
      'cs': 'Czech',
      'cy': 'Welsh',
      'da': 'Danish',
      'de': 'German',
      'el': 'Greek',
      'en': 'English',
      'es': 'Spanish',
      'et': 'Estonian',
      'eu': 'Basque',
      'fa': 'Persian',
      'fi': 'Finnish',
      'fil': 'Filipino',
      'fr': 'French',
      'ga': 'Irish',
      'gl': 'Galician',
      'gu': 'Gujarati',
      'he': 'Hebrew',
      'hi': 'Hindi',
      'hr': 'Croatian',
      'hu': 'Hungarian',
      'hy': 'Armenian',
      'id': 'Indonesian',
      'is': 'Icelandic',
      'it': 'Italian',
      'ja': 'Japanese',
      'jv': 'Javanese',
      'ka': 'Georgian',
      'kk': 'Kazakh',
      'km': 'Khmer',
      'kn': 'Kannada',
      'ko': 'Korean',
      'lo': 'Lao',
      'lt': 'Lithuanian',
      'lv': 'Latvian',
      'mk': 'Macedonian',
      'ml': 'Malayalam',
      'mn': 'Mongolian',
      'mr': 'Marathi',
      'ms': 'Malay',
      'mt': 'Maltese',
      'my': 'Burmese',
      'nb': 'Norwegian',
      'ne': 'Nepali',
      'nl': 'Dutch',
      'pa': 'Punjabi',
      'pl': 'Polish',
      'ps': 'Pashto',
      'pt': 'Portuguese',
      'ro': 'Romanian',
      'ru': 'Russian',
      'si': 'Sinhala',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'sq': 'Albanian',
      'sr': 'Serbian',
      'su': 'Sundanese',
      'sv': 'Swedish',
      'sw': 'Swahili',
      'ta': 'Tamil',
      'te': 'Telugu',
      'th': 'Thai',
      'tr': 'Turkish',
      'uk': 'Ukrainian',
      'ur': 'Urdu',
      'uz': 'Uzbek',
      'vi': 'Vietnamese',
      'zh': 'Chinese',
      'zu': 'Zulu'
    };
    
    voices.forEach(voice => {
      let category = 'Other';
      
      if (selectedProvider === 'elevenlabs') {
        // For ElevenLabs, we might need to parse the description to find language
        if (voice.description && voice.description.includes('English')) {
          category = 'English';
        } else if (voice.description && voice.description.includes('Spanish')) {
          category = 'Spanish';
        }
        // Add more language detection as needed
      } 
      else if (selectedProvider === 'edge_tts') {
        // Edge TTS includes locale information
        const locale = voice.description.split(', ')[1];
        if (locale) {
          const langCode = locale.split('-')[0].toLowerCase();
          // Use the full language name if available, otherwise use the code
          category = languageMap[langCode] || langCode.toUpperCase();
        }
      }
      else if (selectedProvider === 'lemonfox') {
        // For LemonFox, you'd need to extract language info from their API response
        // This is just a placeholder
        category = voice.language || 'Other';
      }
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(voice);
    });
    
    return grouped;
  };
  
  // Format credits display
  const renderCreditsInfo = () => {
    if (!credits) return null;
    
    if (selectedProvider === 'elevenlabs') {
      return (
        <div className="credits-info">
          <p>Characters Used: {credits.character_count.toLocaleString()}</p>
          <p>Character Limit: {credits.character_limit.toLocaleString()}</p>
          <p className="remaining">Remaining: {credits.remaining_characters.toLocaleString()} characters</p>
        </div>
      );
    } else if (selectedProvider === 'edge_tts') {
      return <p>{credits.message}</p>;
    } else if (selectedProvider === 'lemonfox') {
      return (
        <div className="credits-info">
          <p>Credits Used: {credits.credits_used.toLocaleString()}</p>
          <p>Credits Limit: {credits.credits_limit.toLocaleString()}</p>
          <p className="remaining">Remaining: {credits.remaining_credits.toLocaleString()} credits</p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="container">
      <h1>Multi-Provider TTS Service</h1>
      
      <div className="step-tabs">
        <button 
          className={activeStep === 1 ? 'active' : ''} 
          onClick={() => setActiveStep(1)}
        >
          1. Select Provider
        </button>
        <button 
          className={activeStep === 2 ? 'active' : ''} 
          onClick={() => activeStep >= 2 && setActiveStep(2)}
        >
          2. Select Voice
        </button>
        <button 
          className={activeStep === 3 ? 'active' : ''} 
          onClick={() => activeStep >= 3 && setActiveStep(3)}
        >
          3. Generate Speech
        </button>
      </div>
      
      {activeStep === 1 && (
        <div className="step-content">
          <h2>Select TTS Provider</h2>
          
          <div className="provider-selection">
            <div className="provider-option">
              <div className="radio-option">
                <input 
                  type="radio" 
                  id="elevenlabs" 
                  name="provider" 
                  value="elevenlabs"
                  checked={selectedProvider === 'elevenlabs'}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                />
                <label htmlFor="elevenlabs">ElevenLabs</label>
              </div>
              <div className="api-key-input">
                <input 
                  type="password" 
                  placeholder={apiKeyStatus.elevenlabs ? "API Key saved in .env file" : "ElevenLabs API Key"} 
                  value={apiKeys.elevenlabs} 
                  onChange={(e) => setApiKeys({...apiKeys, elevenlabs: e.target.value})}
                  disabled={selectedProvider !== 'elevenlabs'}
                />
                {apiKeyStatus.elevenlabs && apiKeys.elevenlabs === '' && (
                  <small className="text-success">Using saved API key</small>
                )}
              </div>
            </div>
            
            <div className="provider-option">
              <div className="radio-option">
                <input 
                  type="radio" 
                  id="edge_tts" 
                  name="provider" 
                  value="edge_tts"
                  checked={selectedProvider === 'edge_tts'}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                />
                <label htmlFor="edge_tts">Microsoft Edge TTS (Free)</label>
              </div>
              <input 
                type="password" 
                placeholder="No API Key Required" 
                disabled={true}
              />
            </div>
            
            <div className="provider-option">
              <div className="radio-option">
                <input 
                  type="radio" 
                  id="lemonfox" 
                  name="provider" 
                  value="lemonfox"
                  checked={selectedProvider === 'lemonfox'}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                />
                <label htmlFor="lemonfox">LemonFox.ai</label>
              </div>
              <div className="api-key-input">
                <input 
                  type="password" 
                  placeholder={apiKeyStatus.lemonfox ? "API Key saved in .env file" : "LemonFox API Key"} 
                  value={apiKeys.lemonfox} 
                  onChange={(e) => setApiKeys({...apiKeys, lemonfox: e.target.value})}
                  disabled={selectedProvider !== 'lemonfox'}
                />
                {apiKeyStatus.lemonfox && apiKeys.lemonfox === '' && (
                  <small className="text-success">Using saved API key</small>
                )}
              </div>
            </div>
            
            <div className="save-api-option">
              <input 
                type="checkbox" 
                id="saveApiKey" 
                checked={saveApiKey} 
                onChange={(e) => setSaveApiKey(e.target.checked)} 
              />
              <label htmlFor="saveApiKey">Save API key to .env file</label>
              <small className="save-api-hint">
                API keys will be stored securely in the server's .env file for future use
              </small>
            </div>
          </div>
          
          {credits && (
            <div className="credits-card">
              <h3>Remaining Credits</h3>
              {renderCreditsInfo()}
            </div>
          )}
          
          {error.step1 && (
            <p className="error">{error.step1}</p>
          )}
          
          <div className="button-row">
            <button 
              className="secondary-button" 
              onClick={checkCredits}
              disabled={loading.credits}
            >
              {loading.credits ? 'Checking...' : 'Check Credits'}
            </button>
            <button 
              className="primary-button" 
              onClick={() => handleNext(1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {activeStep === 2 && (
        <div className="step-content">
          <h2>Select Voice</h2>
          
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search voices..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {loading.voices ? (
            <div className="loading">Loading voices...</div>
          ) : filteredVoices.length === 0 ? (
            <p>No voices found matching "{searchTerm}"</p>
          ) : searchTerm ? (
            <div className="voices-grid">
              {filteredVoices.map(voice => (
                <div 
                  key={voice.id} 
                  className={`voice-card ${selectedVoice?.id === voice.id ? 'selected' : ''}`}
                  onClick={() => setSelectedVoice(voice)}
                >
                  <h3>{voice.name}</h3>
                  <p>{voice.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="voice-categories">
              {Object.keys(groupVoicesByLanguage(filteredVoices)).sort().map(category => (
                <div key={category} className="voice-category">
                  <h3 className="category-title">{category}</h3>
                  <div className="voices-grid">
                    {groupVoicesByLanguage(filteredVoices)[category].map(voice => (
                      <div 
                        key={voice.id} 
                        className={`voice-card ${selectedVoice?.id === voice.id ? 'selected' : ''}`}
                        onClick={() => setSelectedVoice(voice)}
                      >
                        <h3>{voice.name}</h3>
                        <p>{voice.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedVoice && (
            <div className="selected-voice">
              Selected: <span className="badge">{selectedVoice.name}</span>
            </div>
          )}
          
          {error.step2 && (
            <p className="error">{error.step2}</p>
          )}
          
          <div className="button-row">
            <button 
              className="secondary-button" 
              onClick={() => setActiveStep(1)}
            >
              Back
            </button>
            <button 
              className="primary-button" 
              onClick={() => {
                if (!selectedVoice) {
                  setError({ ...error, step2: 'Please select a voice to continue' });
                  return;
                }
                setActiveStep(3);
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {activeStep === 3 && (
        <div className="step-content">
          <h2>Generate Speech</h2>
          
          <div className="text-input">
            <label htmlFor="inputText">Text to Convert</label>
            <textarea 
              id="inputText"
              placeholder="Enter text to convert to speech..." 
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
          
          {selectedVoice && (
            <div className="selected-voice">
              Voice: <span className="badge">{selectedVoice.name}</span>
            </div>
          )}
          
          {audioUrl && (
            <div className="audio-output">
              <audio ref={audioRef} controls src={audioUrl} />
              <a 
                href={audioUrl} 
                download="tts-audio.mp3"
                className="download-button"
              >
                Download Audio
              </a>
            </div>
          )}
          
          {error.step3 && (
            <p className="error">{error.step3}</p>
          )}
          
          <div className="button-row">
            <button 
              className="secondary-button" 
              onClick={() => setActiveStep(2)}
            >
              Back
            </button>
            <button 
              className="primary-button" 
              onClick={generateSpeech} 
              disabled={loading.generation}
            >
              {loading.generation ? 'Generating...' : 'Generate Speech'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

};
TTSApp.defaultProps = {
  text: ''
};


export default TTSApp;  