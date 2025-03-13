# Multi-Module Web Application

A flexible web application that combines AI text generation with Text-to-Speech functionality in a modular architecture. This project allows you to:

1. Generate text using AI (OpenAI GPT & Google Gemini)
2. Convert text to speech using multiple TTS providers (ElevenLabs, Microsoft Edge TTS, LemonFox)
3. Combine both functionalities in a seamless workflow

## Features

### TTS Module
- Multiple TTS provider support (ElevenLabs, Edge TTS, LemonFox)
- Voice browsing organized by language
- Voice search functionality
- API key storage system
- Audio playback and download

### AI Module
- Support for OpenAI (ChatGPT) and Google Gemini
- Prompt template management
- Conversation history tracking
- Local API key storage
- Model selection for OpenAI

### Combined Workflow
- Generate text with AI and automatically send it to TTS
- Single interface for the complete workflow
- Easy switching between modules

## Installation

### Automatic Setup (Recommended)

#### For Linux/macOS:
```bash
# Make the setup script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

#### For Windows:
```
# Run the setup script
setup.bat
```

### Manual Setup

1. **Set up the backend:**
```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt
```

2. **Set up the frontend:**
```bash
cd frontend
npm install
```

## Usage

### Development Mode

1. **Start the backend server:**
```bash
cd backend
python app.py
```

2. **Start the frontend development server:**
```bash
cd frontend
npm start
```

3. Open your browser and navigate to http://localhost:3000

### Production Deployment

1. **Build the frontend:**
```bash
cd frontend
npm run build
```

2. **Start the production server:**
```bash
cd backend
python app.py
```

3. Access the application at http://localhost:5000

## API Keys

To use the full functionality of this application, you'll need to obtain API keys for the services you want to use:

- **ElevenLabs**: Sign up at [ElevenLabs](https://elevenlabs.io/) to get an API key
- **LemonFox**: Sign up at [LemonFox](https://lemonfox.ai/) to get an API key
- **OpenAI**: Sign up at [OpenAI](https://platform.openai.com/) to get an API key
- **Google Gemini**: Sign up at [Google AI Studio](https://makersuite.google.com/) to get an API key

Add these keys to the `.env` file in the backend directory or directly in the application interface.

## Project Structure

```
multimodule-app/
├── backend/
│   ├── app.py                   # Flask server with API endpoints
│   ├── enhanced_tts_service.py  # Core TTS service
│   ├── .env                     # API key storage (auto-generated)
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js               # Main React app container
│   │   ├── ModuleSwitcher.js    # Module selection component
│   │   ├── TTSApp.js            # TTS UI component
│   │   ├── AIModule.js          # AI UI component
│   │   ├── CombinedModule.js    # Combined workflow UI
│   │   └── *.css                # Styling files
│   ├── package.json             # Frontend dependencies
│   └── build/                   # Production build (generated)
├── venv/                        # Python virtual environment
├── setup.sh                     # Setup script for Linux/macOS
├── setup.bat                    # Setup script for Windows
└── README.md                    # This documentation file
```

## Customization

### Adding a New TTS Provider

To add a new TTS provider, you'll need to:

1. Update the `EnhancedTTSService` class in `enhanced_tts_service.py`
2. Add the provider option in the TTS component UI
3. Implement the necessary API endpoints

### Adding a New AI Provider

To add a new AI provider, you'll need to:

1. Create a new API endpoint in `app.py`
2. Add the provider option in the AI component UI
3. Implement the necessary API calls

## Troubleshooting

### Common Issues

1. **API key problems:**
   - Ensure your API keys are correctly entered
   - Check if the provider services are available

2. **Voice listing issues:**
   - Some providers may change their API response format
   - Check the console for detailed error messages

3. **Integration issues:**
   - Ensure the backend server is running when using the frontend
   - Check for CORS issues if running frontend and backend on different ports

### Error Logs

- Backend errors are logged in the terminal running the Flask server
- Frontend errors can be viewed in the browser's developer console (F12)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- ElevenLabs for their TTS API
- OpenAI and Google for their text generation APIs
- The Flask and React communities for their excellent documentation
