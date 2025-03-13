@echo off
setlocal enabledelayedexpansion

echo === Multi-Module Web Application Setup ===
echo This script will set up all necessary dependencies for the application.
echo.

:: Check for Python
echo Checking for Python...
where python >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
    echo !PYTHON_VERSION!
    if "!PYTHON_VERSION:~0,8!"=="Python 3" (
        echo Python 3 found!
        set PYTHON_CMD=python
    ) else (
        echo Python 2 detected. This application requires Python 3.
        exit /b 1
    )
) else (
    where python3 >nul 2>&1
    if %errorlevel% equ 0 (
        echo Python 3 found!
        set PYTHON_CMD=python3
    ) else (
        echo Python not found. Please install Python 3.6 or higher.
        exit /b 1
    )
)

:: Check for pip
echo Checking for pip...
where pip >nul 2>&1
if %errorlevel% equ 0 (
    echo pip found!
    set PIP_CMD=pip
) else (
    where pip3 >nul 2>&1
    if %errorlevel% equ 0 (
        echo pip3 found!
        set PIP_CMD=pip3
    ) else (
        echo pip not found. Attempting to install pip...
        %PYTHON_CMD% -m ensurepip --upgrade
        if %errorlevel% neq 0 (
            echo Failed to install pip. Please install pip manually.
            exit /b 1
        )
        set PIP_CMD=pip
    )
)

:: Check for Node.js and npm
echo Checking for Node.js and npm...
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo Node.js found!
    node --version
    where npm >nul 2>&1
    if %errorlevel% equ 0 (
        echo npm found!
        npm --version
    ) else (
        echo npm not found. Please install npm.
        exit /b 1
    )
) else (
    echo Node.js not found. Please install Node.js and npm.
    exit /b 1
)

:: Set up a Python virtual environment
echo Setting up Python virtual environment...
%PIP_CMD% install virtualenv
if %errorlevel% neq 0 (
    echo Failed to install virtualenv.
    exit /b 1
)

:: Create virtual environment
virtualenv venv
if %errorlevel% neq 0 (
    echo Failed to create virtual environment. Trying with built-in venv module...
    %PYTHON_CMD% -m venv venv
    if %errorlevel% neq 0 (
        echo Failed to create virtual environment. Please check your Python installation.
        exit /b 1
    )
)

echo Virtual environment created successfully!

:: Activate virtual environment
call venv\Scripts\activate
if %errorlevel% neq 0 (
    echo Failed to activate virtual environment. Please activate it manually:
    echo venv\Scripts\activate
    exit /b 1
)

echo Virtual environment activated!

:: Install backend dependencies
echo Installing backend dependencies...
if not exist backend mkdir backend
cd backend

:: Create requirements.txt if it doesn't exist
if not exist requirements.txt (
    echo Creating requirements.txt...
    (
        echo flask==2.2.3
        echo flask-cors==3.0.10
        echo requests==2.28.2
        echo python-dotenv==1.0.0
        echo edge-tts==6.1.5
        echo aiofiles==23.1.0
        echo gunicorn==20.1.0
    ) > requirements.txt
)

%PIP_CMD% install -r requirements.txt
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies. Please check the requirements.txt file.
    exit /b 1
)

echo Backend dependencies installed successfully!

:: Install frontend dependencies
echo Setting up frontend...
cd ..
if not exist frontend mkdir frontend
cd frontend

:: Check if package.json exists, if not create a basic one
if not exist package.json (
    echo package.json not found. Setting up a new React application...
    cd ..
    call npx create-react-app frontend
    if %errorlevel% neq 0 (
        echo Failed to create React application. Please check your Node.js and npm installation.
        exit /b 1
    )
    cd frontend
    
    :: Add proxy to package.json - this is a simplified approach, might need adjustments
    echo Adding proxy to package.json...
    type package.json > temp.json
    powershell -Command "(Get-Content temp.json) -replace '\"private\": true,', '\"private\": true,\n  \"proxy\": \"http://localhost:5000\",' | Set-Content package.json"
    del temp.json
) else (
    :: Just install dependencies if package.json exists
    echo Installing frontend dependencies from existing package.json...
    call npm install
)

echo Frontend dependencies installed successfully!

:: Create .env file for API keys
cd ..
echo Creating .env file for API keys...
cd backend
if not exist .env (
    (
        echo # API Keys
        echo ELEVENLABS_API_KEY=
        echo LEMONFOX_API_KEY=
        echo # Add other API keys here
    ) > .env
    echo .env file created. You'll need to add your API keys to this file.
) else (
    echo .env file already exists.
)

:: Final instructions
cd ..
echo.
echo === Setup Complete! ===
echo To start the application:
echo 1. Activate the virtual environment (if not already activated):
echo    venv\Scripts\activate
echo 2. Start the backend:
echo    cd backend ^& python app.py
echo 3. In a new terminal, start the frontend:
echo    cd frontend ^& npm start
echo 4. Access the application at http://localhost:3000
echo.
echo For production deployment, build the frontend with 'npm run build' and configure the backend to serve the static files.

endlocal
