#!/bin/bash

# Color codes for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  echo -e "${2}$1${NC}"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

print_message "=== Multi-Module Web Application Setup ===" $BLUE
print_message "This script will set up all necessary dependencies for the application." $BLUE
echo

# Check for Python
print_message "Checking for Python..." $YELLOW
if command_exists python3; then
  PYTHON_CMD="python3"
  print_message "Python 3 found!" $GREEN
  $PYTHON_CMD --version
elif command_exists python; then
  PYTHON_CMD="python"
  py_version=$(python --version 2>&1)
  if [[ $py_version == *"Python 3"* ]]; then
    print_message "Python 3 found!" $GREEN
    $PYTHON_CMD --version
  else
    print_message "Python 2 detected. This application requires Python 3." $RED
    exit 1
  fi
else
  print_message "Python not found. Please install Python 3.6 or higher." $RED
  exit 1
fi

# Check for pip
print_message "Checking for pip..." $YELLOW
if command_exists pip3; then
  PIP_CMD="pip3"
  print_message "pip3 found!" $GREEN
elif command_exists pip; then
  PIP_CMD="pip"
  print_message "pip found!" $GREEN
else
  print_message "pip not found. Attempting to install pip..." $YELLOW
  $PYTHON_CMD -m ensurepip --upgrade
  if [ $? -ne 0 ]; then
    print_message "Failed to install pip. Please install pip manually." $RED
    exit 1
  fi
  PIP_CMD="pip3"
  if ! command_exists pip3; then
    PIP_CMD="pip"
  fi
fi

# Check for Node.js and npm
print_message "Checking for Node.js and npm..." $YELLOW
if command_exists node; then
  print_message "Node.js found!" $GREEN
  node --version
  if command_exists npm; then
    print_message "npm found!" $GREEN
    npm --version
  else
    print_message "npm not found. Please install npm." $RED
    exit 1
  fi
else
  print_message "Node.js not found. Please install Node.js and npm." $RED
  exit 1
fi

# Set up a Python virtual environment
print_message "Setting up Python virtual environment..." $YELLOW
if ! command_exists virtualenv; then
  print_message "Installing virtualenv..." $BLUE
  $PIP_CMD install virtualenv
fi

# Create and activate virtual environment
virtualenv venv
if [ $? -ne 0 ]; then
  print_message "Failed to create virtual environment. Trying with built-in venv module..." $YELLOW
  $PYTHON_CMD -m venv venv
  if [ $? -ne 0 ]; then
    print_message "Failed to create virtual environment. Please check your Python installation." $RED
    exit 1
  fi
fi

print_message "Virtual environment created successfully!" $GREEN

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows
  source venv/Scripts/activate
else
  # Unix/Linux/MacOS
  source venv/bin/activate
fi

if [ $? -ne 0 ]; then
  print_message "Failed to activate virtual environment. Please activate it manually before continuing:" $RED
  print_message "source venv/bin/activate (Linux/Mac) or venv\\Scripts\\activate (Windows)" $YELLOW
  exit 1
fi

print_message "Virtual environment activated!" $GREEN

# Install backend dependencies
print_message "Installing backend dependencies..." $YELLOW
cd backend 2>/dev/null || mkdir -p backend

# Create requirements.txt if it doesn't exist
if [ ! -f "requirements.txt" ]; then
  print_message "Creating requirements.txt..." $BLUE
  cat > requirements.txt << EOF
flask==2.2.3
flask-cors==3.0.10
requests==2.28.2
python-dotenv==1.0.0
edge-tts==6.1.5
aiofiles==23.1.0
gunicorn==20.1.0
EOF
fi

$PIP_CMD install -r requirements.txt
if [ $? -ne 0 ]; then
  print_message "Failed to install backend dependencies. Please check the requirements.txt file." $RED
  exit 1
fi

print_message "Backend dependencies installed successfully!" $GREEN

# Install frontend dependencies
print_message "Setting up frontend..." $YELLOW
cd .. 2>/dev/null
cd frontend 2>/dev/null || mkdir -p frontend

# Check if package.json exists, if not create a basic one
if [ ! -f "package.json" ]; then
  print_message "package.json not found. Setting up a new React application..." $BLUE
  cd ..
  npx create-react-app frontend
  if [ $? -ne 0 ]; then
    print_message "Failed to create React application. Please check your Node.js and npm installation." $RED
    exit 1
  fi
  cd frontend
  
  # Add proxy to package.json
  # Using temporary file because 'sed' behaves differently on macOS and Linux
  grep -v "\"private\"" package.json > temp.json
  echo "  \"private\": true," >> temp.json
  echo "  \"proxy\": \"http://localhost:5000\"," >> temp.json
  grep -v "^{" temp.json | grep -v "^}$" > temp2.json
  echo "{" > package.json
  cat temp2.json >> package.json
  echo "}" >> package.json
  rm temp.json temp2.json
else
  # Just install dependencies if package.json exists
  print_message "Installing frontend dependencies from existing package.json..." $BLUE
  npm install
fi

print_message "Frontend dependencies installed successfully!" $GREEN

# Create .env file for API keys
cd ..
print_message "Creating .env file for API keys..." $YELLOW
cd backend
if [ ! -f ".env" ]; then
  cat > .env << EOF
# API Keys
ELEVENLABS_API_KEY=
LEMONFOX_API_KEY=
# Add other API keys here
EOF
  print_message ".env file created. You'll need to add your API keys to this file." $BLUE
else
  print_message ".env file already exists." $BLUE
fi

# Final instructions
cd ..
print_message "\n=== Setup Complete! ===" $GREEN
print_message "To start the application:" $BLUE
print_message "1. Activate the virtual environment (if not already activated):" $YELLOW
print_message "   source venv/bin/activate (Linux/Mac) or venv\\Scripts\\activate (Windows)" $NC
print_message "2. Start the backend:" $YELLOW
print_message "   cd backend && python app.py" $NC
print_message "3. In a new terminal, start the frontend:" $YELLOW
print_message "   cd frontend && npm start" $NC
print_message "4. Access the application at http://localhost:3000" $NC
print_message "\nFor production deployment, build the frontend with 'npm run build' and configure the backend to serve the static files." $BLUE
