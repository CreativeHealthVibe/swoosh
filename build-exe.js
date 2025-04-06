const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const pkg = require('./package.json');

console.log('Starting build process...');

// Ensure all dependencies are installed
console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to install dependencies:', error);
  process.exit(1);
}

// Create an ICO file if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'images/icon.ico'))) {
  console.log('Creating icon file...');
  try {
    execSync('node create-ico.js', { stdio: 'inherit' });
  } catch (error) {
    console.warn('Failed to create icon file:', error);
    console.log('Continuing with default icon...');
  }
}

// Ensure app directory exists
if (!fs.existsSync(path.join(__dirname, 'app'))) {
  console.log('Creating app directory...');
  fs.mkdirSync(path.join(__dirname, 'app'), { recursive: true });
}

// Run electron-builder
console.log('Building executable...');
try {
  execSync('npx electron-builder build --win', { stdio: 'inherit' });
  console.log('Build completed successfully!');
  console.log(`Your executable is now available in the dist/ directory`);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}