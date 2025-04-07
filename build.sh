#!/bin/bash

echo "Starting SWOOSH Bot desktop app build process"
echo "---------------------------------------------"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in your PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed or not in your PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Create logo.ico if it doesn't exist
if [ ! -f "website/public/img/logo.ico" ]; then
    echo "Creating icon file..."
    node create-ico.js
    if [ $? -ne 0 ]; then
        echo "WARNING: Failed to create icon file"
    fi
fi

# Run the build script
echo "Running Electron builder..."
node build-exe.js
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed"
    exit 1
fi

echo "Build completed successfully!"
echo "The executable is available in the dist folder"
echo "---------------------------------------------"

exit 0