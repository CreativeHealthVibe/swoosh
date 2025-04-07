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
  console.log('WebSocket data received:', data);
  
  // Handle dashboard stats on welcome page
  updateDashboardStats(data);
  
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
      // Process general server stats
      updateStatsDisplay(data);
  }
}

/**
 * Update dashboard statistics on the welcome page
 * @param {Object} data - Stats data
 */
function updateDashboardStats(data) {
  // Check if we're on the welcome page by looking for these elements
  const serverCountElement = document.getElementById('server-count');
  const userCountElement = document.getElementById('user-count');
  const ticketCountElement = document.getElementById('ticket-count');
  const uptimeElement = document.getElementById('uptime');
  
  if (serverCountElement) {
    serverCountElement.textContent = data.servers || '0';
  }
  
  if (userCountElement) {
    userCountElement.textContent = data.users || '0';
  }
  
  if (ticketCountElement) {
    ticketCountElement.textContent = data.tickets || '0';
  }
  
  if (uptimeElement && data.uptime) {
    uptimeElement.textContent = formatUptime(data.uptime);
  }
  
  // Update activity log
  updateActivityLog(data.recentActivity);
  
  // Update command usage
  updateCommandUsage(data.commandUsage);
}

/**
 * Format uptime seconds into a readable string
 * @param {number} seconds - Uptime in seconds
 * @returns {string} - Formatted uptime string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * Update activity log on the welcome page
 * @param {Array} activities - Recent activity data
 */
function updateActivityLog(activities) {
  const activityLogList = document.getElementById('activity-log-list');
  if (!activityLogList || !activities || !Array.isArray(activities)) return;
  
  // Clear placeholder
  activityLogList.innerHTML = '';
  
  activities.forEach(activity => {
    if (!activity) return;
    
    const li = document.createElement('li');
    li.className = 'activity-item';
    
    const iconClass = getActivityIcon(activity.action);
    
    li.innerHTML = `
      <span class="activity-icon"><i class="${iconClass}"></i></span>
      <div class="activity-content">
        <div class="activity-title">${activity.action || 'Unknown Activity'}</div>
        <div class="activity-user">${activity.user || 'System'}</div>
        <div class="activity-time">${getRelativeTime(activity.timestamp)}</div>
      </div>
    `;
    
    activityLogList.appendChild(li);
  });
  
  // If no activities, show message
  if (activities.length === 0) {
    const li = document.createElement('li');
    li.className = 'placeholder-item';
    li.textContent = 'No recent activity';
    activityLogList.appendChild(li);
  }
}

/**
 * Update command usage chart on welcome page
 * @param {Object} commandUsage - Command usage data
 */
function updateCommandUsage(commandUsage) {
  const commandUsageChart = document.getElementById('command-usage-chart');
  if (!commandUsageChart || !commandUsage) return;
  
  // Clear placeholder
  commandUsageChart.innerHTML = '';
  
  // Get top commands by usage
  const commands = Object.entries(commandUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (commands.length === 0) {
    const placeholder = document.createElement('p');
    placeholder.className = 'placeholder-text';
    placeholder.textContent = 'No command usage data available';
    commandUsageChart.appendChild(placeholder);
    return;
  }
  
  // Get maximum usage for scaling bars
  const maxUsage = Math.max(...commands.map(cmd => cmd[1]));
  
  // Create bar chart
  commands.forEach(([command, count]) => {
    const percentage = Math.round((count / maxUsage) * 100);
    
    const cmdDiv = document.createElement('div');
    cmdDiv.className = 'command-bar';
    
    cmdDiv.innerHTML = `
      <div class="command-name">${command}</div>
      <div class="command-bar-container">
        <div class="command-bar-fill" style="width: ${percentage}%;"></div>
        <span class="command-count">${count}</span>
      </div>
    `;
    
    commandUsageChart.appendChild(cmdDiv);
  });
}

/**
 * Get icon class for activity type
 * @param {string} action - Activity action
 * @returns {string} - Font Awesome icon class
 */
function getActivityIcon(action) {
  if (!action) return 'fas fa-info-circle';
  
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('ban') || actionLower.includes('blacklist')) return 'fas fa-ban';
  if (actionLower.includes('login') || actionLower.includes('auth')) return 'fas fa-sign-in-alt';
  if (actionLower.includes('ticket')) return 'fas fa-ticket-alt';
  if (actionLower.includes('command')) return 'fas fa-terminal';
  if (actionLower.includes('warn')) return 'fas fa-exclamation-triangle';
  if (actionLower.includes('delete')) return 'fas fa-trash-alt';
  if (actionLower.includes('create')) return 'fas fa-plus-circle';
  if (actionLower.includes('kick')) return 'fas fa-user-slash';
  if (actionLower.includes('mute')) return 'fas fa-microphone-slash';
  if (actionLower.includes('error')) return 'fas fa-exclamation-circle';
  
  return 'fas fa-cog';
}

/**
 * Format relative time
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Relative time string
 */
function getRelativeTime(timestamp) {
  if (!timestamp) return 'Just now';
  
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 120) return '1 minute ago';
  if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
  if (seconds < 7200) return '1 hour ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
  if (seconds < 172800) return 'Yesterday';
  
  return date.toLocaleDateString();
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
