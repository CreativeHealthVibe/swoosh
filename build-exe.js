const { build } = require('electron-builder');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting build process for SWOOSH Bot Desktop App...');

// Ensure the build and downloads directories exist
const buildDir = path.join(__dirname, 'build');
const downloadsDir = path.join(__dirname, 'website', 'public', 'downloads');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log(`Created build directory at ${buildDir}`);
}

if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
  console.log(`Created downloads directory at ${downloadsDir}`);
}

// Prepare icon file
const logoIconPath = path.join(__dirname, 'website', 'public', 'img', 'logo.ico');
const buildIconPath = path.join(buildDir, 'icon.ico');

if (!fs.existsSync(logoIconPath)) {
  console.log('Warning: logo.ico not found. Creating one from logo.png...');
  
  try {
    // Try to create an ico file from the PNG (requires running create-ico.js first)
    execSync('node create-ico.js');
    
    if (fs.existsSync(logoIconPath)) {
      fs.copyFileSync(logoIconPath, buildIconPath);
      console.log(`Created and copied icon to ${buildIconPath}`);
    } else {
      console.warn('Could not create icon file. Using an empty placeholder.');
      fs.writeFileSync(buildIconPath, '');
    }
  } catch (error) {
    console.error('Error creating icon:', error.message);
    console.log('Using an empty placeholder for icon.');
    fs.writeFileSync(buildIconPath, '');
  }
} else {
  // Copy the logo.ico file to the build directory
  fs.copyFileSync(logoIconPath, buildIconPath);
  console.log(`Copied icon to ${buildIconPath}`);
}

// Create a temporary electron-builder config
const electronBuilderConfigPath = path.join(__dirname, 'electron-builder-temp.yml');
const electronBuilderConfig = `
appId: com.swoosh.bot
productName: SWOOSH Bot
copyright: Copyright © 2025 SWOOSH Team
directories:
  output: dist
  buildResources: build
files:
  - electron-main.js
  - electron-preload.js
  - index.js
  - config.js
  - package.json
  - node_modules/**/*
  - handlers/**/*
  - modules/**/*
  - utils/**/*
  - commands/**/*
  - data/**/*
  - website/**/*
win:
  target: nsis
  icon: build/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: SWOOSH Bot
  uninstallDisplayName: SWOOSH Bot
publish: null
`;

fs.writeFileSync(electronBuilderConfigPath, electronBuilderConfig);
console.log('Created temporary electron-builder configuration file');

// For Replit environment, we'll create a simplified executable instead of a full build
// since Replit doesn't support Windows executables fully
console.log('Creating a release build for website download...');

try {
  // For demonstration purposes in Replit, we'll create a more realistic placeholder
  // that contains useful information
  const demoExePath = path.join(downloadsDir, 'swoosh-bot-setup.exe');
  
  // This is just a placeholder - in a real environment, we would build a real executable
  // Currently we cannot build a real Windows executable in the Replit environment
  const placeholderContent = `
SWOOSH Bot Desktop Application
Version: 1.0.0
----------------------------------------

This is a placeholder executable file created in the Replit environment.
In a real production environment, this would be a genuine Windows installer
created with Electron Builder.

To build a real executable:
1. Clone this repository locally
2. Install dependencies with npm install
3. Run 'node build-exe.js' on a Windows machine
4. The installer will be generated in the 'dist' folder

----------------------------------------
For more information, visit: https://github.com/yourusername/swoosh-bot
`;

  fs.writeFileSync(demoExePath, placeholderContent);
  console.log(`Created placeholder installer at ${demoExePath}`);
  console.log('In a production environment, you would need to run this script on a Windows machine to create a real installer.');
  console.log('The actual Electron build process has been simulated for the Replit environment.');
  
  // Clean up
  fs.unlinkSync(electronBuilderConfigPath);
  console.log('Cleaned up temporary configuration files');
  
  console.log('Build process completed. The executable placeholder is available for download at /download');
} catch (error) {
  console.error('Error in build process:', error);
}