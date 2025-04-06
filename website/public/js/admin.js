/**
 * Admin Dashboard JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
  // Set up WebSocket connection for real-time updates
  setupWebSocket();
  
  // Initialize any interactive components
  initializeComponents();
});

/**
 * Set up WebSocket connection
 */
function setupWebSocket() {
  // Check if WebSocket is supported
  if (!window.WebSocket) {
    console.error('WebSocket is not supported by your browser.');
    return;
  }
  
  // Create WebSocket connection
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = function() {
    console.log('WebSocket connection established');
  };
  
  ws.onmessage = function(event) {
    // Parse the message data
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  ws.onclose = function() {
    console.log('WebSocket connection closed');
    // Attempt to reconnect after a delay
    setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      setupWebSocket();
    }, 5000);
  };
  
  ws.onerror = function(error) {
    console.error('WebSocket error:', error);
  };
}

/**
 * Handle WebSocket messages
 * @param {Object} data - The message data
 */
function handleWebSocketMessage(data) {
  // Handle different message types
  switch (data.type) {
    case 'stats':
      updateStatsDisplay(data);
      break;
    case 'log':
      handleLogMessage(data);
      break;
    case 'blacklist':
      handleBlacklistUpdate(data);
      break;
    default:
      console.log('Received message:', data);
  }
}

/**
 * Update stats display with real-time data
 * @param {Object} data - Stats data
 */
function updateStatsDisplay(data) {
  // Update bot stats if they exist
  if (data.bot) {
    updateElementText('bot-status', data.bot.status === 'online' ? 'Online' : 'Offline');
    updateElementText('bot-uptime', data.bot.uptime);
    updateElementText('bot-servers', data.bot.guilds);
    updateElementText('bot-users', data.bot.users);
    updateElementText('bot-channels', data.bot.channels);
    updateElementText('bot-ping', data.bot.ping + ' ms');
  }
  
  // Update system stats if they exist
  if (data.system) {
    updateElementText('sys-cpu', data.system.cpuUsage + '%');
    updateElementText('sys-memory-percent', data.system.memoryUsage.percentage + '%');
    updateElementText('sys-memory-used', data.system.memoryUsage.used);
    updateElementText('sys-memory-total', data.system.memoryUsage.total);
  }
}

/**
 * Handle log message
 * @param {Object} data - Log data
 */
function handleLogMessage(data) {
  const logContainer = document.getElementById('live-logs');
  if (!logContainer) return;
  
  // Create log entry
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${data.level}`;
  logEntry.innerHTML = `
    <span class="log-timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
    <span class="log-level">${data.level.toUpperCase()}</span>
    <span class="log-message">${data.message}</span>
  `;
  
  // Add to the container
  logContainer.prepend(logEntry);
  
  // Limit the number of log entries to prevent performance issues
  const maxEntries = 100;
  const entries = logContainer.querySelectorAll('.log-entry');
  if (entries.length > maxEntries) {
    for (let i = maxEntries; i < entries.length; i++) {
      logContainer.removeChild(entries[i]);
    }
  }
}

/**
 * Handle blacklist update
 * @param {Object} data - Blacklist update data
 */
function handleBlacklistUpdate(data) {
  // If we're on the blacklist page, update the UI
  const blacklistTable = document.getElementById('blacklistTable');
  if (!blacklistTable) return;
  
  if (data.action === 'add') {
    addBlacklistEntry(data.user, blacklistTable);
  } else if (data.action === 'remove') {
    removeBlacklistEntry(data.userId, blacklistTable);
  }
  
  // Update the count
  updateBlacklistCount();
}

/**
 * Add blacklist entry to the table
 * @param {Object} user - User data
 * @param {HTMLElement} table - Table element
 */
function addBlacklistEntry(user, table) {
  // Check if user is already in the table
  const existingRow = table.querySelector(`tr[data-user-id="${user.userId}"]`);
  if (existingRow) return;
  
  // Create row
  const row = document.createElement('tr');
  row.setAttribute('data-user-id', user.userId);
  
  // Create cells
  row.innerHTML = `
    <td>${user.userId}</td>
    <td>${user.username}</td>
    <td>${user.reason}</td>
    <td>${user.moderatorTag}</td>
    <td>${new Date(user.timestamp).toLocaleString()}</td>
    <td>
      <button class="admin-btn admin-btn-sm admin-btn-danger remove-blacklist" data-user-id="${user.userId}">
        <i class="fas fa-trash-alt"></i>
      </button>
    </td>
  `;
  
  // Add to table
  table.prepend(row);
  
  // Add event listener to the remove button
  const removeButton = row.querySelector('.remove-blacklist');
  removeButton.addEventListener('click', handleBlacklistRemove);
}

/**
 * Remove blacklist entry from the table
 * @param {string} userId - User ID
 * @param {HTMLElement} table - Table element
 */
function removeBlacklistEntry(userId, table) {
  const row = table.querySelector(`tr[data-user-id="${userId}"]`);
  if (row) {
    row.remove();
  }
}

/**
 * Update the blacklist count
 */
function updateBlacklistCount() {
  const countElement = document.getElementById('blacklistCount');
  if (!countElement) return;
  
  const table = document.getElementById('blacklistTable');
  const rowCount = table ? table.querySelectorAll('tr').length : 0;
  
  countElement.textContent = `${rowCount} Users`;
  
  // Show empty state if no rows
  if (rowCount === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="admin-empty-state">
            <i class="fas fa-ban admin-empty-icon"></i>
            <p>No users are currently blacklisted</p>
          </div>
        </td>
      </tr>
    `;
  }
}

/**
 * Handle blacklist remove button click
 */
function handleBlacklistRemove() {
  const userId = this.getAttribute('data-user-id');
  
  if (confirm('Are you sure you want to remove this user from the blacklist?')) {
    fetch('/admin/blacklist/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Remove the row
        const row = document.querySelector(`tr[data-user-id="${userId}"]`);
        if (row) {
          row.remove();
          updateBlacklistCount();
        }
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error removing from blacklist:', error);
      alert('An error occurred while removing from the blacklist.');
    });
  }
}

/**
 * Initialize interactive components
 */
function initializeComponents() {
  // Add event listeners to collapsible sections
  const collapsibles = document.querySelectorAll('.admin-collapsible-header');
  collapsibles.forEach(header => {
    header.addEventListener('click', function() {
      this.parentElement.classList.toggle('collapsed');
    });
  });
  
  // Initialize tooltips
  const tooltips = document.querySelectorAll('[data-tooltip]');
  tooltips.forEach(tooltip => {
    tooltip.addEventListener('mouseenter', function() {
      const text = this.getAttribute('data-tooltip');
      const tooltipEl = document.createElement('div');
      tooltipEl.className = 'admin-tooltip';
      tooltipEl.textContent = text;
      document.body.appendChild(tooltipEl);
      
      // Position the tooltip
      const rect = this.getBoundingClientRect();
      tooltipEl.style.top = (rect.top - tooltipEl.offsetHeight - 10) + 'px';
      tooltipEl.style.left = (rect.left + (rect.width / 2) - (tooltipEl.offsetWidth / 2)) + 'px';
      tooltipEl.style.opacity = '1';
    });
    
    tooltip.addEventListener('mouseleave', function() {
      const tooltipEl = document.querySelector('.admin-tooltip');
      if (tooltipEl) {
        tooltipEl.remove();
      }
    });
  });
}

/**
 * Update element text content
 * @param {string} id - Element ID
 * @param {string} text - New text content
 */
function updateElementText(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
}
