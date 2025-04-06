const { app, BrowserWindow, Tray, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');
const http = require('http');

// Keep a global reference of window and tray objects
let mainWindow;
let tray;
let botProcess;
let serverProcess;

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'website/public/img/logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'electron-preload.js')
    }
  });

  // Start the bot and express server process
  startBot();

  // Load the web page once the local server is running
  mainWindow.loadURL('http://localhost:5000/electron');

  // Create system tray icon
  createTray();

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Hide window to tray when closed
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    return true;
  });
}

// Create system tray icon and menu
function createTray() {
  tray = new Tray(path.join(__dirname, 'website/public/img/logo.png'));
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open Dashboard', 
      click: () => {
        mainWindow.show();
      } 
    },
    { 
      label: 'Restart Bot', 
      click: () => {
        restartBot();
      } 
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.isQuitting = true;
        stopBot();
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('SWOOSH Discord Bot');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

// Start the bot process
function startBot() {
  // Start the bot process
  botProcess = spawn('node', ['index.js'], {
    stdio: 'pipe',
    env: process.env
  });

  botProcess.stdout.on('data', (data) => {
    console.log(`Bot output: ${data}`);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('bot-log', data.toString());
    }
  });

  botProcess.stderr.on('data', (data) => {
    console.error(`Bot error: ${data}`);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('bot-error', data.toString());
    }
  });

  botProcess.on('close', (code) => {
    console.log(`Bot process exited with code ${code}`);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('bot-status', 'offline');
    }
  });
}

// Stop the bot process
function stopBot() {
  if (botProcess) {
    botProcess.kill();
    botProcess = null;
  }
}

// Restart the bot process
function restartBot() {
  stopBot();
  startBot();
  
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('bot-status', 'restarting');
  }
}

// App events
app.on('ready', createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

// IPC events
ipcMain.on('restart-bot', () => {
  restartBot();
});

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});