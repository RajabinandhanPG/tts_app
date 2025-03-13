# TTS and AI Module Web Application

## Overview
This web application combines Text-to-Speech (TTS) functionality with AI text generation in a modular architecture. Users can generate speech using multiple TTS providers, create text using AI models, or combine both functionalities.

## Features
- **TTS Module**: Convert text to speech using ElevenLabs, Microsoft Edge TTS, or LemonFox
- **AI Module**: Generate text using OpenAI GPT or Google Gemini
- **Combined Mode**: Create text with AI and automatically convert it to speech

## Installation

### Prerequisites
- Python 3.6 or newer
- Node.js and npm
- Git (optional, for version control)

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the backend directory with your API keys:
   ```
   ELEVENLABS_API_KEY=your_key_here
   LEMONFOX_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   GEMINI_API_KEY=your_key_here
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install Node.js dependencies:
   ```
   npm install
   ```

3. Build the frontend for production:
   ```
   npm run build
   ```

## Running the Application

### Development Mode
1. Start the backend server:
   ```
   cd backend
   python app.py
   ```

2. In a separate terminal, start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Access the application at http://localhost:3000

### Production Mode
1. Build the frontend (if not already built):
   ```
   cd frontend
   npm run build
   ```

2. Start the backend server:
   ```
   cd backend
   python app.py
   ```

3. Access the application at http://localhost:5000

## Using the Application
1. Select the desired module using the tabs at the top:
   - Text-to-Speech Module
   - AI Assistant Module
   - Combined Mode

2. For TTS Module:
   - Choose a TTS provider
   - Enter your API key (if required)
   - Select a voice
   - Enter text to convert to speech

3. For AI Module:
   - Choose an AI provider
   - Enter your API key
   - Type your prompt
   - Generate text

4. For Combined Mode:
   - Generate text with AI
   - The text will be sent to the TTS module
   - Convert to speech using your preferred voice

## Troubleshooting
- If you encounter issues with API keys, ensure they are correctly entered and valid
- Check browser console (F12) for frontend errors
- Review terminal output for backend errors
- For Windows PowerShell users with npm errors, run: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

## License
This project is available for personal and commercial use. 
