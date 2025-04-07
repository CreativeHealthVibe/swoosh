@echo off
echo Starting SWOOSH Bot desktop app build process
echo ---------------------------------------------

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in your PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed or not in your PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        exit /b 1
    )
)

REM Create logo.ico if it doesn't exist
if not exist website\public\img\logo.ico (
    echo Creating icon file...
    call node create-ico.js
    if %ERRORLEVEL% NEQ 0 (
        echo WARNING: Failed to create icon file
    )
)

REM Run the build script
echo Running Electron builder...
call node build-exe.js
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed
    exit /b 1
)

echo Build completed successfully!
echo The executable is available in the dist folder
echo ---------------------------------------------

exit /b 0