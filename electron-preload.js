const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    getWebSocketPort: () => ipcRenderer.sendSync('get-ws-port'),
    startBot: () => ipcRenderer.send('start-bot'),
    stopBot: () => ipcRenderer.send('stop-bot'),
    restartBot: () => ipcRenderer.send('restart-bot'),
    openAbout: () => ipcRenderer.send('open-about'),
    onBotLog: (callback) => ipcRenderer.on('bot-log', (_, ...args) => callback(...args)),
    onBotError: (callback) => ipcRenderer.on('bot-error', (_, ...args) => callback(...args)),
    onBotStopped: (callback) => ipcRenderer.on('bot-stopped', (_, ...args) => callback(...args))
  }
);