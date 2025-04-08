// Static page script to prevent WebSocket connection
document.addEventListener('DOMContentLoaded', function() {
  console.log('Static page script loaded - preventing WebSocket connection');
  
  // Create a global flag to prevent WebSocket initialization
  window.DISABLE_WEBSOCKET = true;
  
  // Add static flag element to the DOM
  const staticFlag = document.createElement('div');
  staticFlag.id = 'static-page-flag';
  staticFlag.style.display = 'none';
  document.body.appendChild(staticFlag);
});
