/**
 * Admin3D Moderation Redesign JavaScript
 * Modern, interactive controls for the redesigned moderation interface
 */

document.addEventListener('DOMContentLoaded', function() {
  // Tab navigation functionality
  const tabButtons = document.querySelectorAll('.mod-nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(tab => tab.classList.remove('active'));
      
      // Add active class to current button and tab
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Server selector functionality
  const serverSelect = document.getElementById('serverSelect');
  if (serverSelect) {
    serverSelect.addEventListener('change', function() {
      const serverId = this.value;
      
      // Update hidden inputs with server ID
      document.querySelectorAll('input[name="serverId"]').forEach(input => {
        input.value = serverId;
      });
      
      if (serverId) {
        // Load server data
        loadBanList(serverId);
        loadWarningList(serverId);
        loadAutoModSettings(serverId);
        loadAutoModLogs(serverId);
        loadAutoModFilters(serverId);
        updateServerStats(serverId);
      } else {
        // Clear all data
        clearAllData();
      }
    });
  }
  
  // Custom duration toggle
  const banDuration = document.getElementById('banDuration');
  const customDurationGroup = document.getElementById('customDurationGroup');
  
  if (banDuration && customDurationGroup) {
    banDuration.addEventListener('change', function() {
      if (this.value === 'custom') {
        customDurationGroup.style.display = 'block';
      } else {
        customDurationGroup.style.display = 'none';
      }
    });
  }
  
  // Form submissions with fetch API
  setupFormSubmission('banUserForm', '/admin3d/moderation/ban-user', handleBanResponse);
  setupFormSubmission('warnUserForm', '/admin3d/moderation/warn-user', handleWarnResponse);
  setupFormSubmission('automodSettingsForm', '/admin3d/moderation/automod-settings', handleAutomodSettingsResponse);
  setupFormSubmission('filterBuilderForm', '/admin3d/moderation/save-filter', handleFilterResponse);
  
  // Refresh buttons
  setupRefreshButton('refreshBans', loadBanList);
  setupRefreshButton('refreshWarnings', loadWarningList);
  setupRefreshButton('refreshAutomodLogs', loadAutoModLogs);
  setupRefreshButton('refreshFilters', loadAutoModFilters);
  
  // Search functionality
  setupSearch('banSearchInput', 'banListBody');
  setupSearch('warningSearchInput', 'warningListBody');
  setupSearch('automodSearchInput', 'automodLogsBody');
});

// Form submission helper
function setupFormSubmission(formId, endpoint, responseHandler) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const serverId = document.getElementById('serverSelect').value;
    if (!serverId) {
      showToast('Please select a server first', 'error');
      return;
    }
    
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
      if (responseHandler) {
        responseHandler(data);
      } else {
        if (data.success) {
          showToast(data.message, 'success');
          form.reset();
        } else {
          showToast(data.message, 'error');
        }
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showToast('An error occurred. Please try again.', 'error');
    });
  });
}

// Response handlers
function handleBanResponse(data) {
  if (data.success) {
    showToast(data.message, 'success');
    document.getElementById('banUserForm').reset();
    
    // Refresh ban list
    const serverId = document.getElementById('serverSelect').value;
    setTimeout(() => loadBanList(serverId), 1000);
  } else {
    showToast(data.message, 'error');
  }
}

function handleWarnResponse(data) {
  if (data.success) {
    showToast(data.message, 'success');
    document.getElementById('warnUserForm').reset();
    
    // Refresh warning list
    const serverId = document.getElementById('serverSelect').value;
    setTimeout(() => loadWarningList(serverId), 1000);
  } else {
    showToast(data.message, 'error');
  }
}

function handleAutomodSettingsResponse(data) {
  if (data.success) {
    showToast('Auto-moderation settings saved successfully', 'success');
  } else {
    showToast(data.message || 'Failed to save settings', 'error');
  }
}

function handleFilterResponse(data) {
  if (data.success) {
    showToast('Custom filter added successfully', 'success');
    document.getElementById('filterBuilderForm').reset();
    
    // Refresh filters list
    const serverId = document.getElementById('serverSelect').value;
    setTimeout(() => loadAutoModFilters(serverId), 1000);
  } else {
    showToast(data.message || 'Failed to add filter', 'error');
  }
}

// Data loading functions
function loadBanList(serverId) {
  if (!serverId) {
    serverId = document.getElementById('serverSelect').value;
  }
  
  if (!serverId) {
    return;
  }
  
  const banListBody = document.getElementById('banListBody');
  if (!banListBody) return;
  
  // Show loading state
  banListBody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center">
        <div class="loading-spinner"></div>
        <p>Loading ban list...</p>
      </td>
    </tr>
  `;
  
  fetch(`/admin3d/bans/${serverId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.bans && data.bans.length > 0) {
        // Update ban count
        document.getElementById('totalBans').innerText = data.bans.length;
        
        // Generate ban list HTML
        let html = '';
        data.bans.forEach(ban => {
          const date = new Date(ban.createdAt || Date.now()).toLocaleString();
          html += `
            <tr>
              <td>
                <div class="user-info">
                  <img src="${ban.user.avatar || '/images/default-avatar.png'}" alt="User Avatar" class="user-avatar">
                  <div>
                    <div class="user-name">${ban.user.tag || 'Unknown User'}</div>
                    <div class="user-id">${ban.user.id}</div>
                  </div>
                </div>
              </td>
              <td>${ban.reason || 'No reason provided'}</td>
              <td>${date}</td>
              <td>${ban.duration || 'Permanent'}</td>
              <td>
                <button class="mod-action-btn unban-btn" data-user-id="${ban.user.id}" data-server-id="${serverId}">
                  <i class="fas fa-undo"></i> Unban
                </button>
              </td>
            </tr>
          `;
        });
        banListBody.innerHTML = html;
        
        // Add event listeners to unban buttons
        document.querySelectorAll('.unban-btn').forEach(button => {
          button.addEventListener('click', handleUnban);
        });
      } else {
        // No bans or error
        banListBody.innerHTML = `
          <tr class="empty-state">
            <td colspan="5">
              <div class="empty-state-message">
                <i class="fas fa-check-circle"></i>
                <p>${data.message || 'No banned users found'}</p>
              </div>
            </td>
          </tr>
        `;
        document.getElementById('totalBans').innerText = '0';
      }
    })
    .catch(error => {
      console.error('Error loading bans:', error);
      banListBody.innerHTML = `
        <tr class="empty-state">
          <td colspan="5">
            <div class="empty-state-message">
              <i class="fas fa-exclamation-circle"></i>
              <p>Failed to load ban list. Please try again.</p>
            </div>
          </td>
        </tr>
      `;
    });
}

function loadWarningList(serverId) {
  if (!serverId) {
    serverId = document.getElementById('serverSelect').value;
  }
  
  if (!serverId) {
    return;
  }
  
  const warningListBody = document.getElementById('warningListBody');
  if (!warningListBody) return;
  
  // Show loading state
  warningListBody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center">
        <div class="loading-spinner"></div>
        <p>Loading warnings...</p>
      </td>
    </tr>
  `;
  
  fetch(`/admin3d/warnings/${serverId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.warnings && data.warnings.length > 0) {
        // Update warning stats
        updateWarningStats(data.warnings);
        
        // Generate warning list HTML
        let html = '';
        data.warnings.forEach(warning => {
          const date = new Date(warning.timestamp || Date.now()).toLocaleString();
          const status = warning.active ? 'Active' : 'Expired';
          const statusClass = warning.active ? 'status-active' : 'status-expired';
          
          html += `
            <tr>
              <td>
                <div class="user-info">
                  <img src="${warning.user.avatar || '/images/default-avatar.png'}" alt="User Avatar" class="user-avatar">
                  <div>
                    <div class="user-name">${warning.user.tag || 'Unknown User'}</div>
                    <div class="user-id">${warning.user.id}</div>
                  </div>
                </div>
              </td>
              <td>${warning.reason || 'No reason provided'}</td>
              <td>${date}</td>
              <td><span class="status-badge ${statusClass}">${status}</span></td>
              <td>
                <button class="mod-action-btn revoke-btn" data-warning-id="${warning.id}" data-server-id="${serverId}">
                  <i class="fas fa-trash-alt"></i> Revoke
                </button>
              </td>
            </tr>
          `;
        });
        warningListBody.innerHTML = html;
        
        // Add event listeners to revoke buttons
        document.querySelectorAll('.revoke-btn').forEach(button => {
          button.addEventListener('click', handleRevokeWarning);
        });
      } else {
        // No warnings or error
        warningListBody.innerHTML = `
          <tr class="empty-state">
            <td colspan="5">
              <div class="empty-state-message">
                <i class="fas fa-check-circle"></i>
                <p>${data.message || 'No warnings found'}</p>
              </div>
            </td>
          </tr>
        `;
        clearWarningStats();
      }
    })
    .catch(error => {
      console.error('Error loading warnings:', error);
      warningListBody.innerHTML = `
        <tr class="empty-state">
          <td colspan="5">
            <div class="empty-state-message">
              <i class="fas fa-exclamation-circle"></i>
              <p>Failed to load warnings. Please try again.</p>
            </div>
          </td>
        </tr>
      `;
    });
}

function loadAutoModSettings(serverId) {
  if (!serverId) {
    serverId = document.getElementById('serverSelect').value;
  }
  
  if (!serverId) {
    return;
  }
  
  fetch(`/admin3d/moderation/automod-settings/${serverId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.settings) {
        const settings = data.settings;
        
        // Update form fields
        document.getElementById('enableAutomod').checked = settings.enabled;
        document.getElementById('logActions').checked = settings.logActions;
        
        // Update filters
        if (settings.filters) {
          document.getElementById('filterProfanity').checked = settings.filters.profanity;
          document.getElementById('filterLinks').checked = settings.filters.links;
          document.getElementById('filterInvites').checked = settings.filters.invites;
          document.getElementById('filterMassMentions').checked = settings.filters.massMentions;
        }
        
        // Load available log channels
        loadLogChannels(serverId, settings.logChannel);
      }
    })
    .catch(error => {
      console.error('Error loading automod settings:', error);
    });
}

function loadLogChannels(serverId, selectedChannel) {
  fetch(`/admin3d/moderation/log-channels/${serverId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.channels) {
        const logChannelSelect = document.getElementById('logChannel');
        logChannelSelect.innerHTML = '<option value="">Select a channel</option>';
        
        data.channels.forEach(channel => {
          const option = document.createElement('option');
          option.value = channel.id;
          option.textContent = `#${channel.name}`;
          if (channel.id === selectedChannel) {
            option.selected = true;
          }
          logChannelSelect.appendChild(option);
        });
      }
    })
    .catch(error => {
      console.error('Error loading log channels:', error);
    });
}

function loadAutoModLogs(serverId) {
  if (!serverId) {
    serverId = document.getElementById('serverSelect').value;
  }
  
  if (!serverId) {
    return;
  }
  
  const logsBody = document.getElementById('automodLogsBody');
  if (!logsBody) return;
  
  // Show loading state
  logsBody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center">
        <div class="loading-spinner"></div>
        <p>Loading auto-moderation logs...</p>
      </td>
    </tr>
  `;
  
  fetch(`/admin3d/moderation/automod-logs/${serverId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.logs && data.logs.length > 0) {
        // Update automod actions count
        document.getElementById('automodActions').innerText = data.logs.length;
        
        // Generate logs HTML
        let html = '';
        data.logs.forEach(log => {
          const date = new Date(log.timestamp || Date.now()).toLocaleString();
          html += `
            <tr>
              <td>
                <div class="user-info">
                  <div class="user-name">${log.user?.tag || 'Unknown User'}</div>
                  <div class="user-id">${log.userId || 'Unknown ID'}</div>
                </div>
              </td>
              <td>${log.action || 'Unknown'}</td>
              <td>${log.trigger || 'Unknown'}</td>
              <td>${date}</td>
              <td>
                <button class="mod-action-btn view-details-btn" data-log-id="${log.id}">
                  <i class="fas fa-info-circle"></i> Details
                </button>
              </td>
            </tr>
          `;
        });
        logsBody.innerHTML = html;
      } else {
        // No logs or error
        logsBody.innerHTML = `
          <tr class="empty-state">
            <td colspan="5">
              <div class="empty-state-message">
                <i class="fas fa-check-circle"></i>
                <p>${data.message || 'No auto-moderation logs found'}</p>
              </div>
            </td>
          </tr>
        `;
        document.getElementById('automodActions').innerText = '0';
      }
    })
    .catch(error => {
      console.error('Error loading automod logs:', error);
      logsBody.innerHTML = `
        <tr class="empty-state">
          <td colspan="5">
            <div class="empty-state-message">
              <i class="fas fa-exclamation-circle"></i>
              <p>Failed to load auto-moderation logs. Please try again.</p>
            </div>
          </td>
        </tr>
      `;
    });
}

function loadAutoModFilters(serverId) {
  if (!serverId) {
    serverId = document.getElementById('serverSelect').value;
  }
  
  if (!serverId) {
    return;
  }
  
  const filtersBody = document.getElementById('filtersListBody');
  if (!filtersBody) return;
  
  // Show loading state
  filtersBody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center">
        <div class="loading-spinner"></div>
        <p>Loading custom filters...</p>
      </td>
    </tr>
  `;
  
  fetch(`/admin3d/moderation/automod-filters/${serverId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.filters && data.filters.length > 0) {
        // Generate filters HTML
        let html = '';
        data.filters.forEach(filter => {
          html += `
            <tr>
              <td>${filter.type || 'Unknown'}</td>
              <td>${filter.content || 'Empty'}</td>
              <td>${filter.action || 'delete'}</td>
              <td>
                <button class="mod-action-btn delete-filter-btn" data-filter-id="${filter.id}" data-server-id="${serverId}">
                  <i class="fas fa-trash-alt"></i> Delete
                </button>
              </td>
            </tr>
          `;
        });
        filtersBody.innerHTML = html;
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-filter-btn').forEach(button => {
          button.addEventListener('click', handleDeleteFilter);
        });
      } else {
        // No filters or error
        filtersBody.innerHTML = `
          <tr class="empty-state">
            <td colspan="4">
              <div class="empty-state-message">
                <i class="fas fa-filter"></i>
                <p>${data.message || 'No custom filters found'}</p>
              </div>
            </td>
          </tr>
        `;
      }
    })
    .catch(error => {
      console.error('Error loading filters:', error);
      filtersBody.innerHTML = `
        <tr class="empty-state">
          <td colspan="4">
            <div class="empty-state-message">
              <i class="fas fa-exclamation-circle"></i>
              <p>Failed to load custom filters. Please try again.</p>
            </div>
          </td>
        </tr>
      `;
    });
}

// Handle action button clicks
function handleUnban(event) {
  const button = event.currentTarget;
  const userId = button.getAttribute('data-user-id');
  const serverId = button.getAttribute('data-server-id');
  
  if (!userId || !serverId) {
    showToast('Missing user or server ID', 'error');
    return;
  }
  
  if (confirm(`Are you sure you want to unban this user?`)) {
    fetch(`/admin3d/unban/${serverId}/${userId}`, {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showToast(data.message, 'success');
        // Refresh ban list
        setTimeout(() => loadBanList(serverId), 1000);
      } else {
        showToast(data.message, 'error');
      }
    })
    .catch(error => {
      console.error('Error unbanning user:', error);
      showToast('An error occurred. Please try again.', 'error');
    });
  }
}

function handleRevokeWarning(event) {
  const button = event.currentTarget;
  const warningId = button.getAttribute('data-warning-id');
  const serverId = button.getAttribute('data-server-id');
  
  if (!warningId || !serverId) {
    showToast('Missing warning or server ID', 'error');
    return;
  }
  
  if (confirm(`Are you sure you want to revoke this warning?`)) {
    fetch(`/admin3d/warnings/revoke/${serverId}/${warningId}`, {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showToast(data.message, 'success');
        // Refresh warning list
        setTimeout(() => loadWarningList(serverId), 1000);
      } else {
        showToast(data.message, 'error');
      }
    })
    .catch(error => {
      console.error('Error revoking warning:', error);
      showToast('An error occurred. Please try again.', 'error');
    });
  }
}

function handleDeleteFilter(event) {
  const button = event.currentTarget;
  const filterId = button.getAttribute('data-filter-id');
  const serverId = button.getAttribute('data-server-id');
  
  if (!filterId || !serverId) {
    showToast('Missing filter or server ID', 'error');
    return;
  }
  
  if (confirm(`Are you sure you want to delete this filter?`)) {
    fetch(`/admin3d/moderation/delete-filter/${serverId}/${filterId}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showToast(data.message, 'success');
        // Refresh filters list
        setTimeout(() => loadAutoModFilters(serverId), 1000);
      } else {
        showToast(data.message, 'error');
      }
    })
    .catch(error => {
      console.error('Error deleting filter:', error);
      showToast('An error occurred. Please try again.', 'error');
    });
  }
}

// Utility functions
function updateServerStats(serverId) {
  if (!serverId) return;
  
  fetch(`/admin3d/server-stats/${serverId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        document.getElementById('memberCount').innerText = data.memberCount || '0';
      }
    })
    .catch(error => {
      console.error('Error loading server stats:', error);
    });
}

function updateWarningStats(warnings) {
  if (!warnings || !warnings.length) {
    clearWarningStats();
    return;
  }
  
  const totalWarnings = warnings.length;
  const activeWarnings = warnings.filter(w => w.active).length;
  
  // Count unique users
  const uniqueUsers = new Set();
  warnings.forEach(warning => {
    if (warning.userId) {
      uniqueUsers.add(warning.userId);
    }
  });
  const warnedUsers = uniqueUsers.size;
  
  // Calculate average warnings per user
  const avgWarnings = warnedUsers > 0 ? (totalWarnings / warnedUsers).toFixed(1) : '0';
  
  // Update statistics
  document.getElementById('totalWarnings').innerText = totalWarnings;
  document.getElementById('totalServerWarnings').innerText = totalWarnings;
  document.getElementById('activeWarnings').innerText = activeWarnings;
  document.getElementById('warnedUsers').innerText = warnedUsers;
  document.getElementById('avgWarningsPerUser').innerText = avgWarnings;
}

function clearWarningStats() {
  document.getElementById('totalWarnings').innerText = '0';
  document.getElementById('totalServerWarnings').innerText = '-';
  document.getElementById('activeWarnings').innerText = '-';
  document.getElementById('warnedUsers').innerText = '-';
  document.getElementById('avgWarningsPerUser').innerText = '-';
}

function clearAllData() {
  // Clear ban list
  const banListBody = document.getElementById('banListBody');
  if (banListBody) {
    banListBody.innerHTML = `
      <tr class="empty-state">
        <td colspan="5">
          <div class="empty-state-message">
            <i class="fas fa-info-circle"></i>
            <p>Please select a server to view ban list</p>
          </div>
        </td>
      </tr>
    `;
  }
  
  // Clear warning list
  const warningListBody = document.getElementById('warningListBody');
  if (warningListBody) {
    warningListBody.innerHTML = `
      <tr class="empty-state">
        <td colspan="5">
          <div class="empty-state-message">
            <i class="fas fa-info-circle"></i>
            <p>Please select a server to view warnings</p>
          </div>
        </td>
      </tr>
    `;
  }
  
  // Clear automod logs
  const automodLogsBody = document.getElementById('automodLogsBody');
  if (automodLogsBody) {
    automodLogsBody.innerHTML = `
      <tr class="empty-state">
        <td colspan="5">
          <div class="empty-state-message">
            <i class="fas fa-info-circle"></i>
            <p>Please select a server to view automod logs</p>
          </div>
        </td>
      </tr>
    `;
  }
  
  // Clear filters
  const filtersListBody = document.getElementById('filtersListBody');
  if (filtersListBody) {
    filtersListBody.innerHTML = `
      <tr class="empty-state">
        <td colspan="4">
          <div class="empty-state-message">
            <i class="fas fa-info-circle"></i>
            <p>Please select a server to view custom filters</p>
          </div>
        </td>
      </tr>
    `;
  }
  
  // Reset statistics
  document.getElementById('totalBans').innerText = '0';
  clearWarningStats();
  document.getElementById('automodActions').innerText = '0';
  document.getElementById('memberCount').innerText = '0';
}

function setupRefreshButton(buttonId, refreshFunction) {
  const button = document.getElementById(buttonId);
  if (button) {
    button.addEventListener('click', function() {
      const serverId = document.getElementById('serverSelect').value;
      if (serverId) {
        // Add spinning animation
        button.classList.add('spinning');
        
        // Call the refresh function
        refreshFunction(serverId);
        
        // Remove spinning animation after a delay
        setTimeout(() => {
          button.classList.remove('spinning');
        }, 1000);
      } else {
        showToast('Please select a server first', 'error');
      }
    });
  }
}

function setupSearch(inputId, tableBodyId) {
  const searchInput = document.getElementById(inputId);
  const tableBody = document.getElementById(tableBodyId);
  
  if (!searchInput || !tableBody) return;
  
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = tableBody.querySelectorAll('tr:not(.empty-state)');
    
    if (rows.length === 0) return;
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      if (text.includes(searchTerm)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  });
}

// Toast notification system
function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="toast-icon fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span class="toast-message">${message}</span>
    </div>
    <button class="toast-close">×</button>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Add close button functionality
  const closeButton = toast.querySelector('.toast-close');
  closeButton.addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  });
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    if (toastContainer.contains(toast)) {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toastContainer.contains(toast)) {
          toastContainer.removeChild(toast);
        }
      }, 300);
    }
  }, 5000);
}