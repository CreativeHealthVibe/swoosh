const { ipcRenderer, contextBridge } = require('electron');

// Expose a limited set of functions to the renderer process
window.addEventListener('DOMContentLoaded', () => {
  window.ipcRenderer = ipcRenderer;
  
  // Add event listeners to update UI based on bot status
  ipcRenderer.on('bot-log', (event, message) => {
    const logContainer = document.getElementById('bot-logs');
    if (logContainer) {
      const logElement = document.createElement('div');
      logElement.className = 'log-message';
      logElement.textContent = message;
      logContainer.appendChild(logElement);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });
  
  ipcRenderer.on('bot-error', (event, message) => {
    const logContainer = document.getElementById('bot-logs');
    if (logContainer) {
      const logElement = document.createElement('div');
      logElement.className = 'log-message error';
      logElement.textContent = message;
      logContainer.appendChild(logElement);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });
  
  ipcRenderer.on('bot-status', (event, status) => {
    const statusIndicator = document.getElementById('bot-status-indicator');
    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${status}`;
      statusIndicator.setAttribute('data-status', status);
    }
  });
});