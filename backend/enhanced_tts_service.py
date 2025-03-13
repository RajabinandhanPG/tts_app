import os
import requests
import json
import uuid
import edge_tts
import asyncio
import aiofiles
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedTTSService:
    """A wrapper for multiple text-to-speech services"""
    
    def __init__(self):
        """Initialize the TTS service"""
        # Default service is edge_tts as it doesn't need an API key
        self.service_name = "edge_tts"
        self.output_dir = Path("temp_audio")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Load API keys from environment variables
        self.elevenlabs_api_key = os.environ.get("ELEVENLABS_API_KEY", "")
        self.lemonfox_api_key = os.environ.get("LEMONFOX_API_KEY", "")
        
        # Define base URLs
        self.elevenlabs_base_url = "https://api.elevenlabs.io/v1"
        self.lemonfox_base_url = "https://api.lemonfox.ai/v1"
        
        # Default voice IDs
        self.default_voices = {
            "elevenlabs": "21m00Tcm4TlvDq8ikWAM",
            "edge_tts": "en-US-ChristopherNeural",
            "lemonfox": "charles"
        }
    
    def set_service(self, service, api_key=None, save_to_env=False):
        """
        Configure the TTS service provider and API key.
        
        Args:
            service (str): The service provider to use ('elevenlabs', 'edge_tts', or 'lemonfox')
            api_key (str, optional): API key for the service
            save_to_env (bool): Whether to save the API key to the .env file
            
        Returns:
            dict: Status information about the configuration
        """
        # Validate service
        if service not in ['elevenlabs', 'edge_tts', 'lemonfox']:
            raise ValueError(f"Unsupported service: {service}")
        
        # Set the active service
        self.service_name = service
        
        # Handle API key
        if api_key:
            if service == 'elevenlabs':
                self.elevenlabs_api_key = api_key
            elif service == 'lemonfox':
                self.lemonfox_api_key = api_key
        
        # Save API key to .env file if requested
        if save_to_env and api_key and service != 'edge_tts':
            env_var_name = f"{service.upper()}_API_KEY"
            
            # Read existing .env file
            env_path = os.path.join(os.path.dirname(__file__), '.env')
            env_exists = os.path.exists(env_path)
            env_content = {}
            
            if env_exists:
                with open(env_path, 'r') as f:
                    for line in f:
                        if '=' in line:
                            key, value = line.strip().split('=', 1)
                            env_content[key] = value
            
            # Update or add the API key
            env_content[env_var_name] = api_key
            
            # Write back to .env file
            with open(env_path, 'w') as f:
                for key, value in env_content.items():
                    f.write(f"{key}={value}\n")
                    
            # Update the environment variable
            os.environ[env_var_name] = api_key
        
        return {
            "status": "success",
            "message": f"Service set to {service}",
            "service": service
        }
    
    def get_headers(self):
        """Get appropriate headers for the current service"""
        if self.service_name == "elevenlabs":
            return {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.elevenlabs_api_key
            }
        elif self.service_name == "lemonfox":
            return {
                "Authorization": f"Bearer {self.lemonfox_api_key}",
                "Content-Type": "application/json"
            }
        else:
            return {"Content-Type": "application/json"}
    
    def get_api_key_status(self):
        """Check which API keys are saved in the .env file"""
        return {
            "elevenlabs": bool(self.elevenlabs_api_key),
            "lemonfox": bool(self.lemonfox_api_key)
        }
    
    async def text_to_speech_async(self, text, voice_id=None, output_path=None):
        """Async version of text_to_speech for Edge TTS"""
        if not voice_id:
            voice_id = self.default_voices[self.service_name]
            
        if not output_path:
            output_path = self.output_dir / f"{uuid.uuid4()}.mp3"
        else:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if self.service_name == "edge_tts":
            communicate = edge_tts.Communicate(text, voice_id)
            try:
                async with aiofiles.open(output_path, "wb") as file:
                    async for chunk in communicate.stream():
                        if chunk["type"] == "audio":
                            await file.write(chunk["data"])
                return str(output_path)
            except Exception as e:
                logger.error(f"Edge TTS error: {e}")
                raise
        else:
            # For non-async services, just call the regular method
            return self.text_to_speech(text, voice_id, str(output_path))
    
    def generate_tts(self, text, voice_id=None):
        """Public method to generate TTS (compatible with Flask app)"""
        return self.text_to_speech(text, voice_id)
    
    def text_to_speech(self, text, voice_id=None, output_path=None):
        """Convert text to speech and save to file
        
        Args:
            text: The text to convert to speech
            voice_id: The voice ID to use (defaults to service default)
            output_path: Path to save the audio file
            
        Returns:
            Path to the saved audio file
        """
        if not voice_id:
            voice_id = self.default_voices[self.service_name]
            
        if not output_path:
            output_path = str(self.output_dir / f"{uuid.uuid4()}.mp3")
        
        # Make sure output directory exists
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        if self.service_name == "elevenlabs":
            return self._elevenlabs_tts(text, voice_id, output_path)
        elif self.service_name == "edge_tts":
            # Run the async method in a new event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(self.text_to_speech_async(text, voice_id, output_path))
            finally:
                loop.close()
        elif self.service_name == "lemonfox":
            return self._lemonfox_tts(text, voice_id, output_path)
        else:
            raise ValueError(f"Service {self.service_name} not supported")
    
    def _elevenlabs_tts(self, text, voice_id, output_path):
        """ElevenLabs-specific implementation"""
        if not self.elevenlabs_api_key:
            raise ValueError("ElevenLabs API key is not set")
            
        url = f"{self.elevenlabs_base_url}/text-to-speech/{voice_id}"
        
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        
        response = requests.post(url, json=data, headers=self.get_headers())
        
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            return output_path
        else:
            error_message = f"ElevenLabs error: {response.status_code}, {response.text}"
            logger.error(error_message)
            raise Exception(error_message)
    
    def _lemonfox_tts(self, text, voice_id, output_path):
        """LemonFox-specific implementation"""
        if not self.lemonfox_api_key:
            raise ValueError("LemonFox API key is not set")
            
        url = f"{self.lemonfox_base_url}/tts"
        
        data = {
            "text": text,
            "voice": voice_id,
            "format": "mp3"
        }
        
        response = requests.post(url, json=data, headers=self.get_headers())
        
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            return output_path
        else:
            error_message = f"LemonFox error: {response.status_code}, {response.text}"
            logger.error(error_message)
            raise Exception(error_message)
    
    def get_voices(self):
        """List available voices for the selected service (compatible with Flask app)"""
        return self.list_voices().get("voices", [])
    
    def list_voices(self):
        """List available voices for the selected service"""
        if self.service_name == "elevenlabs":
            if not self.elevenlabs_api_key:
                raise ValueError("ElevenLabs API key is not set")
                
            url = f"{self.elevenlabs_base_url}/voices"
            response = requests.get(url, headers=self.get_headers())
            
            if response.status_code == 200:
                return response.json()
            else:
                error_message = f"ElevenLabs error: {response.status_code}, {response.text}"
                logger.error(error_message)
                raise Exception(error_message)
                
        elif self.service_name == "edge_tts":
            # Edge TTS voices are available without an API call
            # Get voices asynchronously
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                voices = loop.run_until_complete(edge_tts.list_voices())
                return {"voices": voices}
            finally:
                loop.close()
                
        elif self.service_name == "lemonfox":
            if not self.lemonfox_api_key:
                raise ValueError("LemonFox API key is not set")
                
            url = f"{self.lemonfox_base_url}/voices"
            response = requests.get(url, headers=self.get_headers())
            
            if response.status_code == 200:
                return response.json()
            else:
                error_message = f"LemonFox error: {response.status_code}, {response.text}"
                logger.error(error_message)
                raise Exception(error_message)
        else:
            raise ValueError(f"Service {self.service_name} not supported")
    
    def get_credits(self):
        """Get remaining credits for the service (compatible with Flask app)"""
        return self.get_remaining_credits()
    
    def get_remaining_credits(self):
        """Get remaining credits for the service (if applicable)"""
        if self.service_name == "elevenlabs":
            if not self.elevenlabs_api_key:
                raise ValueError("ElevenLabs API key is not set")
                
            url = f"{self.elevenlabs_base_url}/user/subscription"
            response = requests.get(url, headers=self.get_headers())
            
            if response.status_code == 200:
                data = response.json()
                # Return formatted credit information
                return {
                    "character_count": data.get("character_count", 0),
                    "character_limit": data.get("character_limit", 0),
                    "remaining_characters": data.get("character_limit", 0) - data.get("character_count", 0)
                }
            else:
                error_message = f"ElevenLabs error: {response.status_code}, {response.text}"
                logger.error(error_message)
                raise Exception(error_message)
                
        elif self.service_name == "edge_tts":
            # Edge TTS is free and has no credit system
            return {"message": "Edge TTS is free to use with no credit system"}
            
        elif self.service_name == "lemonfox":
            if not self.lemonfox_api_key:
                raise ValueError("LemonFox API key is not set")
                
            url = f"{self.lemonfox_base_url}/account"
            response = requests.get(url, headers=self.get_headers())
            
            if response.status_code == 200:
                data = response.json()
                # Return formatted credit information (adjust based on actual API response)
                return {
                    "credits_used": data.get("credits_used", 0),
                    "credits_limit": data.get("credits_limit", 0),
                    "remaining_credits": data.get("credits_limit", 0) - data.get("credits_used", 0)
                }
            else:
                error_message = f"LemonFox error: {response.status_code}, {response.text}"
                logger.error(error_message)
                raise Exception(error_message)
        else:
            raise ValueError(f"Service {self.service_name} not supported")