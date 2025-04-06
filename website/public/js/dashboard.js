/**
 * Dashboard initialization and WebSocket handler
 * Manages real-time metrics, gauges, and charts
 */

document.addEventListener('DOMContentLoaded', function() {
  // Set up WebSocket connection for real-time updates
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  let socket;
  
  // Connection status indicator
  let connectionLost = false;
  
  // Initialize gauges and charts
  const gauges = initGauges();
  initCommandChart();
  
  // Connect to WebSocket
  connectWebSocket();
  
  function connectWebSocket() {
    socket = new WebSocket(wsUrl);
    
    // Handle WebSocket opening
    socket.onopen = () => {
      console.log('WebSocket connection established');
      if (connectionLost) {
        // Reconnection successful, update UI
        document.querySelector('.last-updated').classList.remove('disconnected');
        document.querySelector('.last-updated').innerHTML = '<i class="fas fa-sync-alt"></i> Live updates every 2 seconds';
        connectionLost = false;
      }
    };
    
    // Handle incoming messages
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      updateDashboard(data);
    };
    
    // Handle WebSocket closing
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      if (!connectionLost) {
        // Show disconnected status
        document.querySelector('.last-updated').classList.add('disconnected');
        document.querySelector('.last-updated').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Connection lost. Attempting to reconnect...';
        connectionLost = true;
      }
      
      // Try to reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000);
    };
    
    // Handle WebSocket errors
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  // Initialize command usage chart
  function initCommandChart() {
    const ctx = document.getElementById('commands-chart').getContext('2d');
    
    window.commandChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [], // Will be populated with command names
        datasets: [{
          label: 'Command Usage',
          data: [], // Will be populated with command counts
          backgroundColor: [
            'rgba(156, 77, 255, 0.7)',
            'rgba(124, 58, 205, 0.7)',
            'rgba(183, 110, 255, 0.7)',
            'rgba(94, 44, 165, 0.7)',
            'rgba(209, 156, 255, 0.7)',
            'rgba(66, 31, 114, 0.7)'
          ],
          borderColor: [
            'rgba(156, 77, 255, 1)',
            'rgba(124, 58, 205, 1)',
            'rgba(183, 110, 255, 1)',
            'rgba(94, 44, 165, 1)',
            'rgba(209, 156, 255, 1)',
            'rgba(66, 31, 114, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }
        }
      }
    });
  }
  
  // Update dashboard with new data
  function updateDashboard(data) {
    // Update gauges
    if (gauges) {
      gauges.updateAll(data);
    }
    
    // Update load average
    const loadAvgElement = document.getElementById('load-avg');
    if (loadAvgElement && data.loadAverage) {
      loadAvgElement.textContent = data.loadAverage.map(load => load.toFixed(2)).join(', ');
    }
    
    // Update used memory
    const usedMemoryElement = document.getElementById('used-memory');
    if (usedMemoryElement && data.usedMemory) {
      const usedMemoryGB = (data.usedMemory / (1024 * 1024 * 1024)).toFixed(2);
      usedMemoryElement.textContent = `${usedMemoryGB} GB`;
    }
    
    // Update uptime
    const days = Math.floor(data.uptime / 86400);
    const hours = Math.floor((data.uptime % 86400) / 3600);
    const minutes = Math.floor((data.uptime % 3600) / 60);
    const seconds = Math.floor(data.uptime % 60);
    
    const uptimeDaysElement = document.getElementById('uptime-days');
    if (uptimeDaysElement) {
      uptimeDaysElement.textContent = days;
    }
    
    const uptimeTimeElement = document.getElementById('uptime-time');
    if (uptimeTimeElement) {
      uptimeTimeElement.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Update Discord stats
    updateElementText('server-count', data.servers);
    updateElementText('user-count', data.users);
    updateElementText('channel-count', data.channels || 0);
    updateElementText('ping-value', `${data.ping} ms`);
    
    // Update system info
    updateElementText('node-version', data.nodeVersion || 'N/A');
    updateElementText('discord-version', data.discordVersion || 'N/A');
    
    // Update command usage chart
    if (data.commandUsage && window.commandChart) {
      const commands = Object.keys(data.commandUsage);
      const counts = Object.values(data.commandUsage);
      
      window.commandChart.data.labels = commands;
      window.commandChart.data.datasets[0].data = counts;
      window.commandChart.update();
    }
  }
  
  // Helper to update element text if element exists
  function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
    }
  }
  
  // Start Three.js background
  if (typeof initThreeBackground === 'function') {
    initThreeBackground({
      color: 0x9c4dff,
      density: 80,
      size: 1.5,
      speed: 0.3,
      depth: 100
    });
  }
});