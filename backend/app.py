from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
import json

# Import your existing TTS service
from enhanced_tts_service import EnhancedTTSService

# Create Flask app with static folder pointing to React build
app = Flask(__name__, static_folder='../frontend/build')
CORS(app)  # Enable CORS for all routes
load_dotenv()  # Load environment variables from .env file

# Create instance of your TTS service
tts_service = EnhancedTTSService()

# Your existing TTS routes
@app.route('/api/set-service', methods=['POST'])
def set_service():
    # Your existing code for this endpoint
    data = request.json
    service = data.get('service')
    api_key = data.get('api_key')
    save_to_env = data.get('save_to_env', False)
    
    try:
        result = tts_service.set_service(service, api_key, save_to_env)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/tts', methods=['POST'])
def generate_tts():
    # Your existing code for this endpoint
    data = request.json
    text = data.get('text')
    voice_id = data.get('voice_id')
    
    try:
        audio_file = tts_service.generate_tts(text, voice_id)
        return send_from_directory(
            os.path.dirname(audio_file),
            os.path.basename(audio_file),
            mimetype='audio/mpeg'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/voices', methods=['GET'])
def get_voices():
    # Your existing code for this endpoint
    try:
        voices = tts_service.get_voices()
        return jsonify({"voices": voices})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/credits', methods=['GET'])
def get_credits():
    # Your existing code for this endpoint
    try:
        credits = tts_service.get_credits()
        return jsonify(credits)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/get-api-keys', methods=['GET'])
def get_api_keys():
    # Your existing code for this endpoint
    try:
        return jsonify(tts_service.get_api_key_status())
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# New routes for AI Module
@app.route('/api/ai/openai', methods=['POST'])
def process_openai():
    data = request.json
    if not data or 'prompt' not in data:
        return jsonify({"error": "No prompt provided"}), 400
    
    api_key = data.get('api_key')
    if not api_key:
        return jsonify({"error": "No API key provided"}), 400
    
    prompt = data.get('prompt')
    model = data.get('model', 'gpt-3.5-turbo')
    messages = data.get('messages', [{'role': 'user', 'content': prompt}])
    
    try:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        
        payload = {
            'model': model,
            'messages': messages,
            'temperature': 0.7
        }
        
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            return jsonify({"error": response.json()}), response.status_code
        
        result = response.json()
        return jsonify({
            "text": result['choices'][0]['message']['content']
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai/gemini', methods=['POST'])
def process_gemini():
    data = request.json
    if not data or 'prompt' not in data:
        return jsonify({"error": "No prompt provided"}), 400
    
    api_key = data.get('api_key')
    if not api_key:
        return jsonify({"error": "No API key provided"}), 400
    
    prompt = data.get('prompt')
    
    try:
        headers = {
            'Content-Type': 'application/json'
        }
        
        payload = {
            'contents': [{'parts': [{'text': prompt}]}]
        }
        
        url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}'
        
        response = requests.post(
            url,
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            return jsonify({"error": response.json()}), response.status_code
        
        result = response.json()
        return jsonify({
            "text": result['candidates'][0]['content']['parts'][0]['text']
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# New route for combined workflow (optional)
@app.route('/api/combined/tts-from-ai', methods=['POST'])
def tts_from_ai():
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    # Extract text and TTS parameters
    text = data.get('text')
    voice_id = data.get('voice_id')
    
    # Use your existing TTS service to generate audio
    try:
        audio_file = tts_service.generate_tts(text, voice_id)
        return send_from_directory(
            os.path.dirname(audio_file),
            os.path.basename(audio_file),
            mimetype='audio/mpeg'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Serve React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Get port from environment variable for deployment platforms like Heroku
    port = int(os.environ.get('PORT', 5000))
    # In production, set debug to False
    app.run(host='0.0.0.0', port=port, debug=False)