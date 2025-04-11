/**
 * SWOOSH BOT - Premium Administration Dashboard
 * Moderation Interface Controller
 * 
 * This script handles the enhanced moderation interface functionality
 * and integrates with the 3D visualization system.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Add premium edition class to body for enhanced styling
  document.body.classList.add('premium-edition');
  
  // DOM Elements
  const serverSelect = document.getElementById('serverSelect');
  const tabButtons = document.querySelectorAll('.mod-nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Ban Management Elements
  const banUserForm = document.getElementById('banUserForm');
  const banDuration = document.getElementById('banDuration');
  const customDurationGroup = document.getElementById('customDurationGroup');
  const banRefreshBtn = document.querySelector('.mod-refresh-btn');
  const banList = document.getElementById('banList');
  const banListBody = document.getElementById('banListBody');
  
  // Warning Management Elements
  const warnUserForm = document.getElementById('warnUserForm');
  const warningSearchInput = document.getElementById('warningSearchInput');
  const warningFilterSelect = document.getElementById('warningFilterSelect');
  const warningListBody = document.getElementById('warningListBody');
  
  // Auto-Moderation Elements
  const automodSettingsForm = document.getElementById('automodSettingsForm');
  const profanityFilter = document.getElementById('profanityFilter');
  const profanityFilterLevel = document.getElementById('profanityFilterLevel');
  const customWordListGroup = document.getElementById('customWordListGroup');
  const antiSpam = document.getElementById('antiSpam');
  const antiRaid = document.getElementById('antiRaid');
  const automodLogBody = document.getElementById('automodLogBody');
  
  // Initialize tabs functionality
  if (tabButtons && tabContents) {
    // Set first tab as active if not already done
    if (!document.querySelector('.tab-btn.active') && tabButtons.length > 0) {
      tabButtons[0].classList.add('active');
    }
    
    if (!document.querySelector('.tab-content.active') && tabContents.length > 0) {
      tabContents[0].classList.add('active');
    }
    
    // Add click event listeners to tab buttons
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId)?.classList.add('active');
      });
    });
  }
  
  // Initialize custom duration toggle for ban form
  if (banDuration && customDurationGroup) {
    banDuration.addEventListener('change', function() {
      if (this.value === 'custom') {
        customDurationGroup.style.display = 'block';
      } else {
        customDurationGroup.style.display = 'none';
      }
    });
  }
  
  // Initialize custom word list toggle for profanity filter
  if (profanityFilterLevel && customWordListGroup) {
    profanityFilterLevel.addEventListener('change', function() {
      if (this.value === 'custom') {
        customWordListGroup.style.display = 'block';
      } else {
        customWordListGroup.style.display = 'none';
      }
    });
  }
  
  // Update server ID in forms when server is selected
  if (serverSelect) {
    serverSelect.addEventListener('change', function() {
      // Set server ID in all form hidden fields
      if (document.getElementById('serverId')) {
        document.getElementById('serverId').value = this.value;
      }
      
      if (document.getElementById('banServerId')) {
        document.getElementById('banServerId').value = this.value;
      }
      
      if (document.getElementById('warnServerId')) {
        document.getElementById('warnServerId').value = this.value;
      }
      
      if (this.value) {
        loadServerData(this.value);
      }
    });
  }
  
  // Add event listener for refresh buttons
  if (banRefreshBtn) {
    banRefreshBtn.addEventListener('click', function() {
      const serverId = serverSelect.value;
      if (serverId) {
        console.log('Manually refreshing ban list...');
        loadBanList(serverId);
      }
    });
  }
  
  // Ban User Form Submission
  if (banUserForm) {
    banUserForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const serverId = document.getElementById('banServerId').value;
      if (!serverId) {
        alert('Please select a server first');
        return;
      }
      
      const userId = document.getElementById('userId').value.trim();
      const banReason = document.getElementById('banReason').value.trim();
      const banDuration = document.getElementById('banDuration').value;
      const deleteMessages = document.getElementById('deleteMessages').checked;
      const addToBlacklist = document.getElementById('addToBlacklist').checked;
      
      // Get custom duration if applicable
      let finalDuration = banDuration;
      if (banDuration === 'custom') {
        const customDuration = document.getElementById('customDuration').value;
        const customDurationUnit = document.getElementById('customDurationUnit').value;
        finalDuration = `${customDuration}${customDurationUnit}`;
      }
      
      // Create form data
      const formData = {
        serverId,
        userId,
        banReason,
        banDuration: finalDuration,
        deleteMessages,
        addToBlacklist
      };
      
      // Show loading state
      const submitBtn = document.getElementById('banUserBtn');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
      
      // Submit the ban request
      fetch('/api/moderation/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(formData)
      })
        .then(response => {
          // Check for 401 Unauthorized or 403 Forbidden responses
          if (response.status === 401 || response.status === 403) {
            return response.json().then(errorData => {
              console.error('Authentication error:', errorData);
              // Check if we need to redirect to login
              if (errorData.redirectTo) {
                window.location.href = errorData.redirectTo;
                return Promise.reject(new Error('Authentication required. Redirecting to login...'));
              } else {
                throw new Error(errorData.message || 'Authentication failed');
              }
            });
          }
          
          if (!response.ok) {
            throw new Error('Failed to submit ban request');
          }
          return response.json();
        })
        .then(data => {
          if (!data.success) {
            throw new Error(data.message || 'Failed to ban user');
          }
          
          // Show success message
          alert(data.message || 'User has been banned successfully');
          
          // Reset form
          banUserForm.reset();
          
          // Refresh ban list
          loadBanList(serverId);
        })
        .catch(error => {
          console.error('Error banning user:', error);
          alert(`Error: ${error.message}`);
        })
        .finally(() => {
          // Reset button state
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        });
    });
  }
  
  // Warning User Form Submission
  if (warnUserForm) {
    warnUserForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const serverId = document.getElementById('warnServerId').value;
      if (!serverId) {
        alert('Please select a server first');
        return;
      }
      
      const warnUserId = document.getElementById('warnUserId').value.trim();
      const warnReason = document.getElementById('warnReason').value.trim();
      const warningSeverity = document.getElementById('warningSeverity').value;
      const warningDuration = document.getElementById('warningDuration').value;
      const notifyUser = document.getElementById('notifyUser').checked;
      
      // Create form data
      const formData = {
        serverId,
        warnUserId,
        warnReason,
        warningSeverity,
        warningDuration,
        notifyUser
      };
      
      // Show loading state
      const submitBtn = document.getElementById('warnUserBtn');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
      
      // Submit the warning request
      fetch('/api/moderation/warn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(formData)
      })
        .then(response => {
          // Check for 401 Unauthorized or 403 Forbidden responses
          if (response.status === 401 || response.status === 403) {
            return response.json().then(errorData => {
              console.error('Authentication error:', errorData);
              // Check if we need to redirect to login
              if (errorData.redirectTo) {
                window.location.href = errorData.redirectTo;
                return Promise.reject(new Error('Authentication required. Redirecting to login...'));
              } else {
                throw new Error(errorData.message || 'Authentication failed');
              }
            });
          }
          
          if (!response.ok) {
            throw new Error('Failed to submit warning');
          }
          return response.json();
        })
        .then(data => {
          if (!data.success) {
            throw new Error(data.message || 'Failed to warn user');
          }
          
          // Show success message
          alert(data.message || 'Warning has been issued successfully');
          
          // Reset form
          warnUserForm.reset();
          
          // Refresh warning list
          loadWarningList(serverId);
        })
        .catch(error => {
          console.error('Error warning user:', error);
          alert(`Error: ${error.message}`);
        })
        .finally(() => {
          // Reset button state
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        });
    });
  }
  
  /**
   * Load server data for moderation
   * @param {string} serverId - Discord server ID
   */
  function loadServerData(serverId) {
    if (!serverId) return;
    
    // Update empty state messages
    updateEmptyState(`Loading data for server ${serverId}...`);
    
    // Load ban list
    loadBanList(serverId);
    
    // Load warning list
    loadWarningList(serverId);
    
    // Load automod log
    loadAutomodLog(serverId);
    
    // Load automod settings
    loadAutomodSettings(serverId);
  }
  
  /**
   * Update empty state messages in tables
   * @param {string} message - Message to display
   */
  function updateEmptyState(message) {
    const emptyStates = document.querySelectorAll('.empty-state-message p');
    emptyStates.forEach(elem => {
      elem.textContent = message;
    });
  }
  
  /**
   * Load ban list for a server
   * @param {string} serverId - Discord server ID
   */
  function loadBanList(serverId) {
    if (!banListBody) return;
    
    // Show loading state
    banListBody.innerHTML = `
      <tr class="loading-state">
        <td colspan="5">
          <div class="loading-state-message">
            <i class="fas fa-circle-notch fa-spin"></i>
            <p>Loading ban list...</p>
          </div>
        </td>
      </tr>
    `;
    
    // Fetch ban data from our API
    console.log(`Fetching ban data for server: ${serverId}`);
    fetch(`/api/moderation/bans/${serverId}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(response => {
        // Check for 401 Unauthorized or 403 Forbidden responses
        if (response.status === 401 || response.status === 403) {
          return response.json().then(errorData => {
            console.error('Authentication error:', errorData);
            // Check if we need to redirect to login
            if (errorData.redirectTo) {
              window.location.href = errorData.redirectTo;
              return Promise.reject(new Error('Authentication required. Redirecting to login...'));
            } else {
              throw new Error(errorData.message || 'Authentication failed');
            }
          });
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch ban list');
        }
        return response.json();
      })
      .then(data => {
        // Log the response for debugging
        console.log('Ban list API response:', data);
        // Update stats
        if (document.getElementById('totalBans')) {
          document.getElementById('totalBans').textContent = data.total || 0;
        }
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to load ban list');
        }
        
        const bans = data.bans || [];
        
        if (bans.length === 0) {
          banListBody.innerHTML = `
            <tr class="empty-state">
              <td colspan="5">
                <div class="empty-state-message">
                  <i class="fas fa-info-circle"></i>
                  <p>No bans found for this server</p>
                </div>
              </td>
            </tr>
          `;
          return;
        }
        
        banListBody.innerHTML = '';
        
        bans.forEach(ban => {
          // Format the date
          const banDate = new Date(ban.bannedAt);
          const formattedDate = banDate.toLocaleDateString() + ' ' + banDate.toLocaleTimeString();
          
          // Determine duration text
          let durationText = ban.permanent ? 'Permanent' : (ban.duration || 'Permanent');
          
          banListBody.innerHTML += `
            <tr>
              <td>
                <div class="user-info">
                  <div class="user-avatar">
                    <img src="${ban.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="${ban.username || ban.tag}'s avatar">
                  </div>
                  <div class="user-details">
                    <div class="user-name">${ban.username || ban.tag || 'Unknown User'}</div>
                    <div class="user-id">${ban.id}</div>
                  </div>
                </div>
              </td>
              <td>${ban.reason || 'No reason provided'}</td>
              <td>${formattedDate}</td>
              <td>${durationText}</td>
              <td>
                <div class="table-actions">
                  <button class="admin3d-btn admin3d-btn-sm admin3d-btn-secondary view-ban-details" data-userid="${ban.id}" title="View Details">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="admin3d-btn admin3d-btn-sm admin3d-btn-primary unban-user" data-userid="${ban.id}" title="Unban User">
                    <i class="fas fa-user-check"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        });
        
        // Add event listeners for actions
        document.querySelectorAll('.unban-user').forEach(button => {
          button.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');
            if (confirm(`Are you sure you want to unban user ${userId}?`)) {
              // Implement unban functionality here
              console.log(`Unban user ${userId}`);
            }
          });
        });
        
        document.querySelectorAll('.view-ban-details').forEach(button => {
          button.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');
            // Implement view details functionality here
            console.log(`View details for user ${userId}`);
          });
        });
      })
      .catch(error => {
        console.error('Error loading ban list:', error);
        banListBody.innerHTML = `
          <tr class="error-state">
            <td colspan="5">
              <div class="error-state-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading ban list: ${error.message}</p>
              </div>
            </td>
          </tr>
        `;
      });
  }
  
  /**
   * Load warning list for a server
   * @param {string} serverId - Discord server ID
   */
  function loadWarningList(serverId) {
    if (!warningListBody) return;
    
    // Show loading state
    warningListBody.innerHTML = `
      <tr class="loading-state">
        <td colspan="6">
          <div class="loading-state-message">
            <i class="fas fa-circle-notch fa-spin"></i>
            <p>Loading warning history...</p>
          </div>
        </td>
      </tr>
    `;
    
    // Fetch warning data from our API
    fetch(`/api/moderation/warnings/${serverId}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(response => {
        // Check for 401 Unauthorized or 403 Forbidden responses
        if (response.status === 401 || response.status === 403) {
          return response.json().then(errorData => {
            console.error('Authentication error:', errorData);
            // Check if we need to redirect to login
            if (errorData.redirectTo) {
              window.location.href = errorData.redirectTo;
              return Promise.reject(new Error('Authentication required. Redirecting to login...'));
            } else {
              throw new Error(errorData.message || 'Authentication failed');
            }
          });
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch warnings list');
        }
        return response.json();
      })
      .then(data => {
        // Update stats
        if (document.getElementById('totalWarnings')) {
          document.getElementById('totalWarnings').textContent = data.total || 0;
        }
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to load warnings list');
        }
        
        const warnings = data.warnings || [];
        
        if (warnings.length === 0) {
          warningListBody.innerHTML = `
            <tr class="empty-state">
              <td colspan="6">
                <div class="empty-state-message">
                  <i class="fas fa-info-circle"></i>
                  <p>No warnings found for this server</p>
                </div>
              </td>
            </tr>
          `;
          return;
        }
        
        warningListBody.innerHTML = '';
        
        warnings.forEach(warning => {
          // Format the date
          const warningDate = new Date(warning.issuedAt);
          const formattedDate = warningDate.toLocaleDateString() + ' ' + warningDate.toLocaleTimeString();
          
          // Normalize severity for display
          let severityDisplay = warning.severity || 'medium';
          if (typeof severityDisplay === 'string') {
            severityDisplay = severityDisplay.charAt(0).toUpperCase() + severityDisplay.slice(1);
          }
          
          // Determine severity class
          let severityClass = '';
          switch (severityDisplay.toLowerCase()) {
            case 'low': severityClass = 'severity-low'; break;
            case 'medium': severityClass = 'severity-medium'; break;
            case 'high': severityClass = 'severity-high'; break;
            case 'critical': severityClass = 'severity-critical'; break;
            default: severityClass = 'severity-medium'; break;
          }
          
          // Status display
          const statusDisplay = warning.status || 'Active';
          const statusClass = statusDisplay === 'Active' ? 'status-active' : 'status-expired';
          
          warningListBody.innerHTML += `
            <tr>
              <td>
                <div class="user-info">
                  <div class="user-avatar">
                    <img src="${warning.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="${warning.username || 'Unknown User'}'s avatar">
                  </div>
                  <div class="user-details">
                    <div class="user-name">${warning.username || 'Unknown User'}</div>
                    <div class="user-id">${warning.userId}</div>
                  </div>
                </div>
              </td>
              <td>${warning.reason || 'No reason provided'}</td>
              <td><span class="severity-badge ${severityClass}">${severityDisplay}</span></td>
              <td>${formattedDate}</td>
              <td><span class="status-badge ${statusClass}">${statusDisplay}</span></td>
              <td>
                <div class="table-actions">
                  <button class="admin3d-btn admin3d-btn-sm admin3d-btn-secondary view-warning-details" data-id="${warning.id}" data-userid="${warning.userId}" title="View Details">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="admin3d-btn admin3d-btn-sm admin3d-btn-danger remove-warning" data-id="${warning.id}" data-userid="${warning.userId}" title="Remove Warning">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        });
        
        // Add event listeners for actions
        document.querySelectorAll('.remove-warning').forEach(button => {
          button.addEventListener('click', function() {
            const warningId = this.getAttribute('data-id');
            const userId = this.getAttribute('data-userid');
            if (confirm(`Are you sure you want to remove warning ${warningId} for user ${userId}?`)) {
              // Implement remove warning functionality here
              console.log(`Remove warning ${warningId} for user ${userId}`);
            }
          });
        });
        
        document.querySelectorAll('.view-warning-details').forEach(button => {
          button.addEventListener('click', function() {
            const warningId = this.getAttribute('data-id');
            const userId = this.getAttribute('data-userid');
            // Implement view details functionality here
            console.log(`View warning details for warning ${warningId}, user ${userId}`);
          });
        });
      })
      .catch(error => {
        console.error('Error loading warnings list:', error);
        warningListBody.innerHTML = `
          <tr class="error-state">
            <td colspan="6">
              <div class="error-state-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading warnings: ${error.message}</p>
              </div>
            </td>
          </tr>
        `;
      });
  }
  
  /**
   * Load automod log for a server
   * @param {string} serverId - Discord server ID
   */
  function loadAutomodLog(serverId) {
    if (!automodLogBody) return;
    
    // Show loading state
    automodLogBody.innerHTML = `
      <tr class="loading-state">
        <td colspan="5">
          <div class="loading-state-message">
            <i class="fas fa-circle-notch fa-spin"></i>
            <p>Loading auto-moderation logs...</p>
          </div>
        </td>
      </tr>
    `;
    
    // Fetch moderation history from our API
    fetch(`/api/moderation/history/${serverId}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(response => {
        // Check for 401 Unauthorized or 403 Forbidden responses
        if (response.status === 401 || response.status === 403) {
          return response.json().then(errorData => {
            console.error('Authentication error:', errorData);
            // Check if we need to redirect to login
            if (errorData.redirectTo) {
              window.location.href = errorData.redirectTo;
              return Promise.reject(new Error('Authentication required. Redirecting to login...'));
            } else {
              throw new Error(errorData.message || 'Authentication failed');
            }
          });
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch moderation history');
        }
        return response.json();
      })
      .then(data => {
        // Update stats
        if (document.getElementById('automodActions')) {
          // Filter only automod actions (message-delete, etc.)
          const automodEvents = data.history ? data.history.filter(
            item => item.type === 'message-delete' || 
                  item.type === 'mute' || 
                  item.type.includes('auto')
          ) : [];
          document.getElementById('automodActions').textContent = automodEvents.length || 0;
        }
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to load moderation history');
        }
        
        // Get all history, but highlight automod actions
        const history = data.history || [];
        
        if (history.length === 0) {
          automodLogBody.innerHTML = `
            <tr class="empty-state">
              <td colspan="5">
                <div class="empty-state-message">
                  <i class="fas fa-info-circle"></i>
                  <p>No moderation history found for this server</p>
                </div>
              </td>
            </tr>
          `;
          return;
        }
        
        // Limit to 50 most recent actions to avoid overloading the UI
        const recentHistory = history.slice(0, 50);
        
        automodLogBody.innerHTML = '';
        
        recentHistory.forEach(log => {
          // Format the date
          const actionDate = new Date(log.actionAt);
          const formattedDate = actionDate.toLocaleDateString() + ' ' + actionDate.toLocaleTimeString();
          
          // Determine action type display
          let actionType = 'Other';
          let actionDisplay = 'Other Action';
          
          switch(log.type) {
            case 'ban':
              actionType = 'Ban';
              actionDisplay = 'User Banned';
              break;
            case 'unban':
              actionType = 'Unban';
              actionDisplay = 'User Unbanned';
              break;
            case 'kick':
              actionType = 'Kick';
              actionDisplay = 'User Kicked';
              break;
            case 'mute':
              actionType = 'Mute';
              actionDisplay = 'User Muted';
              break;
            case 'warning':
              actionType = 'Warning';
              actionDisplay = 'Warning Issued';
              break;
            case 'message-delete':
              actionType = 'Message Deletion';
              actionDisplay = 'Message Deleted';
              break;
            default:
              actionType = log.type.charAt(0).toUpperCase() + log.type.slice(1);
              actionDisplay = actionType;
          }
          
          // Construct details 
          let details = log.reason || 'No details';
          if (log.details) {
            if (typeof log.details === 'object') {
              // Try to format object details nicely
              details = '';
              for (const [key, value] of Object.entries(log.details)) {
                if (key !== 'reason') { // Reason is already shown
                  details += `${key}: ${value}, `;
                }
              }
              details = details.replace(/, $/, '');
            } else {
              details = log.details;
            }
          }
          
          // Get avatar URL
          const avatarURL = 'https://cdn.discordapp.com/embed/avatars/0.png';
          
          automodLogBody.innerHTML += `
            <tr>
              <td>${formattedDate}</td>
              <td>
                <div class="user-info">
                  <div class="user-avatar small">
                    <img src="${avatarURL}" alt="${log.username || 'Unknown User'}'s avatar">
                  </div>
                  <div class="user-details">
                    <div class="user-name">${log.username || 'Unknown User'}</div>
                  </div>
                </div>
              </td>
              <td>${actionType}</td>
              <td>${actionDisplay}</td>
              <td>${details}</td>
            </tr>
          `;
        });
      })
      .catch(error => {
        console.error('Error loading moderation history:', error);
        automodLogBody.innerHTML = `
          <tr class="error-state">
            <td colspan="5">
              <div class="error-state-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading moderation history: ${error.message}</p>
              </div>
            </td>
          </tr>
        `;
      });
  }
  
  /**
   * Load automod settings for a server
   * @param {string} serverId - Discord server ID
   */
  function loadAutomodSettings(serverId) {
    if (!automodSettingsForm) return;
    
    // For demo purposes, we'll just simulate loading settings
    // In a real application, you would fetch this from an API
    setTimeout(() => {
      // Set default values for the form (this would come from the API)
      document.getElementById('profanityFilter').checked = true;
      document.getElementById('profanityFilterLevel').value = 'medium';
      document.getElementById('linkFilter').checked = true;
      document.getElementById('inviteBlocker').checked = true;
      document.getElementById('antiSpam').checked = true;
      document.getElementById('antiMention').checked = true;
      document.getElementById('antiRaid').checked = false;
      document.getElementById('messageThreshold').value = 5;
      document.getElementById('timeThreshold').value = 5;
      document.getElementById('violationAction').value = 'warn';
      document.getElementById('spamAction').value = 'mute';
      document.getElementById('muteDuration').value = '30m';
      document.getElementById('logActions').checked = true;
      document.getElementById('notifyUsers').checked = true;
      
      // Update UI based on settings
      if (document.getElementById('profanityFilterLevel').value === 'custom') {
        document.getElementById('customWordListGroup').style.display = 'block';
      } else {
        document.getElementById('customWordListGroup').style.display = 'none';
      }
    }, 800);
  }
  
  // Initialize server selector
  if (serverSelect) {
    serverSelect.addEventListener('change', () => {
      const serverId = serverSelect.value;
      
      if (serverId) {
        // Show moderation section
        moderationSection.style.display = 'block';
        
        // Load server data
        loadServerData(serverId);
        
        // Add a premium animation effect for selection
        applyPremiumAnimation();
      } else {
        moderationSection.style.display = 'none';
      }
    });
  }
  
  // Add hover effects to all premium badges
  addPremiumBadges();
  
  // Initialize action buttons
  if (actionButtons) {
    actionButtons.forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        const action = button.getAttribute('data-action');
        
        // Handle different actions
        handleAction(action);
      });
    });
  }
  
  // Initialize modal cancel buttons
  if (modalCancelButtons) {
    modalCancelButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Hide all modals
        hideAllModals();
      });
    });
  }
  
  // Initialize refresh buttons
  if (refreshBansButton) {
    refreshBansButton.addEventListener('click', event => {
      event.preventDefault();
      refreshBansList();
    });
  }
  
  if (refreshLogsButton) {
    refreshLogsButton.addEventListener('click', event => {
      event.preventDefault();
      refreshModerationLog();
    });
  }
  
  // Initialize warning system
  if (checkWarningsButton) {
    checkWarningsButton.addEventListener('click', event => {
      event.preventDefault();
      const userId = document.getElementById('warning-user-id').value;
      
      if (userId) {
        fetchUserWarnings(userId);
      } else {
        showNotification('Please enter a user ID', 'error');
      }
    });
  }
  
  // Initialize warning form
  if (addWarningForm) {
    addWarningForm.addEventListener('submit', event => {
      event.preventDefault();
      
      const formData = new FormData(addWarningForm);
      const warningData = {
        userId: formData.get('userId'),
        reason: formData.get('reason'),
        severity: formData.get('severity')
      };
      
      if (warningData.userId && warningData.reason) {
        addUserWarning(warningData);
      } else {
        showNotification('Please fill in all required fields', 'error');
      }
    });
  }
  
  // Initialize automod form
  if (automodForm) {
    automodForm.addEventListener('submit', event => {
      event.preventDefault();
      
      const formData = new FormData(automodForm);
      const automodData = {
        filterProfanity: formData.get('filterProfanity') === 'on',
        filterSpam: formData.get('filterSpam') === 'on',
        filterInvites: formData.get('filterInvites') === 'on',
        antiRaid: formData.get('antiRaid') === 'on',
        raidThreshold: formData.get('raidThreshold'),
        raidAction: formData.get('raidAction'),
        warningThreshold: formData.get('warningThreshold'),
        warningAction: formData.get('warningAction')
      };
      
      saveAutomodSettings(automodData);
    });
  }
  
  // Initialize raid options toggle
  if (antiRaidCheckbox && raidOptions) {
    antiRaidCheckbox.addEventListener('change', () => {
      raidOptions.style.display = antiRaidCheckbox.checked ? 'block' : 'none';
    });
  }
  
  // Check for initial server ID in URL
  const urlParams = new URLSearchParams(window.location.search);
  const initialServerId = urlParams.get('serverId');
  
  if (initialServerId && serverSelect) {
    // Set the server select value
    serverSelect.value = initialServerId;
    
    // Trigger change event
    const event = new Event('change');
    serverSelect.dispatchEvent(event);
  }
  
  // Start WebSocket connection for real-time stats
  initializeWebSocket();
  
  /**
   * Add badges to action cards
   */
  function addPremiumBadges() {
    const premiumCards = document.querySelectorAll('[data-premium="true"]');
    
    premiumCards.forEach(card => {
      const badgeSpan = document.createElement('span');
      badgeSpan.className = 'premium-item-badge';
      badgeSpan.textContent = '';
      
      card.appendChild(badgeSpan);
    });
  }
  
  /**
   * Apply animation effect to the moderation section
   */
  function applyPremiumAnimation() {
    // Add reveal class to each card in sequence
    const cards = moderationSection.querySelectorAll('.admin3d-card, .admin3d-action-card');
    
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('admin3d-card-reveal');
      }, 100 * index);
    });
  }
  
  /**
   * Handle button actions
   * @param {string} action - Action to perform
   */
  function handleAction(action) {
    switch (action) {
      case 'ban-user':
        showModal(banUserModal);
        document.getElementById('ban-user-id')?.focus();
        break;
        
      case 'kick-user':
        showModal(kickUserModal);
        document.getElementById('kick-user-id')?.focus();
        break;
        
      case 'timeout-user':
        showModal(timeoutUserModal);
        document.getElementById('timeout-user-id')?.focus();
        break;
        
      case 'purge-messages':
        showModal(purgeMessagesModal);
        document.getElementById('purge-channel-id')?.focus();
        break;
        
      case 'ban':
        executeBanUser();
        break;
        
      case 'kick':
        executeKickUser();
        break;
        
      case 'timeout':
        executeTimeoutUser();
        break;
        
      case 'purge':
        executePurgeMessages();
        break;
        
      default:
        console.log(`Unknown action: ${action}`);
    }
  }
  
  /**
   * Show a modal dialog
   * @param {HTMLElement} modal - Modal element to show
   */
  function showModal(modal) {
    // Hide all other modals first
    hideAllModals();
    
    // Show the requested modal
    if (modal) {
      modal.classList.add('modal-visible');
      
      // Add premium animation effect
      if (modal.classList.contains('ultra-premium-modal-overlay')) {
        const modalContent = modal.querySelector('.ultra-premium-modal');
        if (modalContent) {
          modalContent.classList.add('premium-animation');
          
          // Add a particle effect for enhanced visuals
          addModalParticles(modal);
        }
      }
    }
  }
  
  /**
   * Add particle effects to modals
   * @param {HTMLElement} modal - Modal element
   */
  function addModalParticles(modal) {
    // Only add if we have the premium particles
    if (typeof createParticleEffect === 'undefined') return;
    
    // Remove any existing particle container
    const existingParticles = modal.querySelector('.modal-particles');
    if (existingParticles) {
      existingParticles.remove();
    }
    
    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'modal-particles';
    particleContainer.style.position = 'absolute';
    particleContainer.style.top = '0';
    particleContainer.style.left = '0';
    particleContainer.style.width = '100%';
    particleContainer.style.height = '100%';
    particleContainer.style.pointerEvents = 'none';
    particleContainer.style.zIndex = '1';
    
    // Add to modal
    const modalContent = modal.querySelector('.ultra-premium-modal');
    if (modalContent) {
      modalContent.appendChild(particleContainer);
      
      // Create particles
      createParticleEffect(particleContainer, {
        count: 10,
        size: [3, 6],
        speed: [0.3, 0.7],
        colors: ['rgba(157, 0, 255, 0.7)', 'rgba(0, 204, 255, 0.7)'],
        opacity: [0.2, 0.5],
        lifetime: [2000, 5000]
      });
    }
  }
  
  /**
   * Hide all modal dialogs
   */
  function hideAllModals() {
    const modals = document.querySelectorAll('.modal-overlay, .ultra-premium-modal-overlay');
    
    modals.forEach(modal => {
      modal.classList.remove('modal-visible');
    });
  }
  
  /**
   * Execute ban user action
   */
  function executeBanUser() {
    const userId = document.getElementById('ban-user-id')?.value;
    const reason = document.getElementById('ban-reason')?.value;
    const deleteDays = document.getElementById('ban-delete-days')?.value;
    const serverId = serverSelect?.value;
    
    if (!userId || !reason || !serverId) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Show loading state
    document.querySelector('.loading-overlay').style.display = 'flex';
    
    // Make API request
    fetch(`/api/moderation/ban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        userId,
        reason,
        deleteDays,
        serverId
      })
    })
    .then(response => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      // Check for 401 Unauthorized or 403 Forbidden responses
      if (response.status === 401 || response.status === 403) {
        return response.json().then(errorData => {
          console.error('Authentication error:', errorData);
          // Check if we need to redirect to login
          if (errorData.redirectTo) {
            window.location.href = errorData.redirectTo;
            return Promise.reject(new Error('Authentication required. Redirecting to login...'));
          } else {
            throw new Error(errorData.message || 'Authentication failed');
          }
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to ban user');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        showNotification(`User ${userId} banned successfully`, 'success');
        hideAllModals();
        refreshBansList();
        refreshModerationLog();
      } else {
        showNotification(`Error: ${data.message || 'Failed to ban user'}`, 'error');
      }
    })
    .catch(error => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      showNotification(`Error: ${error.message || 'Failed to ban user'}`, 'error');
    });
  }
  
  /**
   * Execute kick user action
   */
  function executeKickUser() {
    const userId = document.getElementById('kick-user-id')?.value;
    const reason = document.getElementById('kick-reason')?.value;
    const serverId = serverSelect?.value;
    
    if (!userId || !reason || !serverId) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Show loading state
    document.querySelector('.loading-overlay').style.display = 'flex';
    
    // Make API request
    fetch(`/api/moderation/kick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        userId,
        reason,
        serverId
      })
    })
    .then(response => response.json())
    .then(data => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      if (data.success) {
        showNotification(`User ${userId} kicked successfully`, 'success');
        hideAllModals();
        refreshModerationLog();
      } else {
        showNotification(`Error: ${data.error || 'Failed to kick user'}`, 'error');
      }
    })
    .catch(error => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      showNotification(`Error: ${error.message || 'Failed to kick user'}`, 'error');
    });
  }
  
  /**
   * Execute timeout user action
   */
  function executeTimeoutUser() {
    const userId = document.getElementById('timeout-user-id')?.value;
    const reason = document.getElementById('timeout-reason')?.value;
    const duration = document.getElementById('timeout-duration')?.value;
    const serverId = serverSelect?.value;
    
    if (!userId || !reason || !duration || !serverId) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Show loading state
    document.querySelector('.loading-overlay').style.display = 'flex';
    
    // Make API request
    fetch(`/api/moderation/timeout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        reason,
        duration,
        serverId
      })
    })
    .then(response => response.json())
    .then(data => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      if (data.success) {
        showNotification(`User ${userId} timed out successfully`, 'success');
        hideAllModals();
        refreshModerationLog();
      } else {
        showNotification(`Error: ${data.error || 'Failed to timeout user'}`, 'error');
      }
    })
    .catch(error => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      showNotification(`Error: ${error.message || 'Failed to timeout user'}`, 'error');
    });
  }
  
  /**
   * Execute purge messages action
   */
  function executePurgeMessages() {
    const channelId = document.getElementById('purge-channel')?.value;
    const amount = document.getElementById('purge-amount')?.value;
    const serverId = serverSelect?.value;
    
    if (!channelId || !amount || !serverId) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Show loading state
    document.querySelector('.loading-overlay').style.display = 'flex';
    
    // Make API request
    fetch(`/api/moderation/purge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channelId,
        amount,
        serverId
      })
    })
    .then(response => response.json())
    .then(data => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      if (data.success) {
        showNotification(`Purged ${data.purgedCount} messages successfully`, 'success');
        hideAllModals();
        refreshModerationLog();
      } else {
        showNotification(`Error: ${data.error || 'Failed to purge messages'}`, 'error');
      }
    })
    .catch(error => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      showNotification(`Error: ${error.message || 'Failed to purge messages'}`, 'error');
    });
  }
  
  /**
   * Refresh the bans list
   */
  function refreshBansList() {
    const serverId = serverSelect?.value;
    
    if (!serverId) return;
    
    // Call the loadBanList function with the server ID
    loadBanList(serverId);
  }
  /* Removed code */
  /*    .then(data => {
        if (data.success && data.bans) {
          if (data.bans.length === 0) {
            bansList.innerHTML = `<p class="empty-message">No bans found</p>`;
            return;
          }
          
          // Clear loading state
          bansList.innerHTML = '';
          
          // Add each ban to the list
          data.bans.forEach(ban => {
            const banItem = document.createElement('div');
            banItem.className = 'ban-item';
            
            // Format the date
            const banDate = new Date(ban.createdAt || Date.now());
            const formattedDate = banDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
            
            banItem.innerHTML = `
              <div class="ban-user-col">
                <div class="ban-user">
                  <div class="ban-user-avatar">
                    <img src="${ban.avatar || '/images/default-avatar.png'}" alt="${ban.username || 'Unknown User'}">
                  </div>
                  <div class="ban-user-info">
                    <span class="ban-user-name">${ban.username || 'Unknown User'}</span>
                    <span class="ban-user-id">${ban.userId}</span>
                  </div>
                </div>
              </div>
              <div class="ban-reason-col">
                <p>${ban.reason || 'No reason provided'}</p>
              </div>
              <div class="ban-date-col">
                <span>${formattedDate}</span>
              </div>
              <div class="ban-actions-col">
                <button class="admin3d-btn admin3d-btn-primary unban-btn" data-user-id="${ban.userId}">
                  <i class="fas fa-undo"></i> Unban
                </button>
              </div>
            `;
            
            // Add unban functionality
            const unbanButton = banItem.querySelector('.unban-btn');
            unbanButton.addEventListener('click', () => {
              unbanUser(ban.userId);
            });
            
            bansList.appendChild(banItem);
          });
        } else {
          bansList.innerHTML = `<p class="error-message">Error: ${data.error || 'Failed to load bans'}</p>`;
        }
      })
      .catch(error => {
        bansList.innerHTML = `<p class="error-message">Error: ${error.message || 'Failed to load bans'}</p>`;
      });
  }
  
  /**
   * Refresh the moderation log
   */
  function refreshModerationLog() {
    const serverId = serverSelect?.value;
    
    if (!serverId) return;
    
    // Call the loadAutomodLog function with the server ID
    loadAutomodLog(serverId);
  }
  
  /**
   * Fetch warnings for a user
   * @param {string} userId - Discord user ID
   */
  function fetchUserWarnings(userId) {
    const serverId = serverSelect?.value;
    const warningsList = document.getElementById('warnings-list');
    
    if (!serverId || !warningsList) return;
    
    // Show loading state
    warningsList.innerHTML = `
      <div class="warnings-loading">
        <div class="spinner"></div>
        <p>Loading warnings...</p>
      </div>
    `;
    
    // Make API request
    fetch(`/api/moderation/warnings?userId=${userId}&serverId=${serverId}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.success && data.warnings) {
          if (data.warnings.length === 0) {
            warningsList.innerHTML = `<p class="empty-message">No warnings found for this user</p>`;
            return;
          }
          
          // Clear loading state
          warningsList.innerHTML = '';
          
          // Add each warning to the list
          data.warnings.forEach(warning => {
            const warningItem = document.createElement('div');
            warningItem.className = `warning-item ${warning.severity || 'low'}`;
            
            // Format the date
            const warningDate = new Date(warning.timestamp || Date.now());
            const formattedDate = warningDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
            
            warningItem.innerHTML = `
              <div class="warning-header">
                <span class="warning-severity">${capitalizeFirstLetter(warning.severity || 'low')}</span>
                <span class="warning-date">${formattedDate}</span>
              </div>
              <div class="warning-reason">
                <p>${warning.reason || 'No reason provided'}</p>
              </div>
              <div class="warning-issuer">
                <span>Issued by: ${warning.issuer?.username || 'Unknown'}</span>
              </div>
              <div class="warning-actions">
                <button class="admin3d-btn admin3d-btn-danger remove-warning-btn" data-warning-id="${warning.id}">
                  <i class="fas fa-trash"></i> Remove
                </button>
              </div>
            `;
            
            // Add remove functionality
            const removeButton = warningItem.querySelector('.remove-warning-btn');
            removeButton.addEventListener('click', () => {
              removeWarning(warning.id);
            });
            
            warningsList.appendChild(warningItem);
          });
        } else {
          warningsList.innerHTML = `<p class="error-message">Error: ${data.error || 'Failed to load warnings'}</p>`;
        }
      })
      .catch(error => {
        warningsList.innerHTML = `<p class="error-message">Error: ${error.message || 'Failed to load warnings'}</p>`;
      });
  }
  
  /**
   * Add a warning to a user
   * @param {Object} warningData - Warning data
   */
  function addUserWarning(warningData) {
    const serverId = serverSelect?.value;
    
    if (!serverId) {
      showNotification('Please select a server first', 'error');
      return;
    }
    
    // Show loading state
    document.querySelector('.loading-overlay').style.display = 'flex';
    
    // Make API request
    fetch(`/api/moderation/warnings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        ...warningData,
        serverId
      })
    })
    .then(response => response.json())
    .then(data => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      if (data.success) {
        showNotification(`Warning added to user ${warningData.userId}`, 'success');
        
        // Reset form
        document.getElementById('add-warning-form').reset();
        
        // Refresh warnings if same user
        const checkUserId = document.getElementById('warning-user-id').value;
        if (checkUserId === warningData.userId) {
          fetchUserWarnings(warningData.userId);
        }
        
        // Refresh logs
        refreshModerationLog();
      } else {
        showNotification(`Error: ${data.error || 'Failed to add warning'}`, 'error');
      }
    })
    .catch(error => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      showNotification(`Error: ${error.message || 'Failed to add warning'}`, 'error');
    });
  }
  
  /**
   * Remove a warning
   * @param {string} warningId - Warning ID
   */
  function removeWarning(warningId) {
    const serverId = serverSelect?.value;
    
    if (!serverId) {
      showNotification('Please select a server first', 'error');
      return;
    }
    
    // Show loading state
    document.querySelector('.loading-overlay').style.display = 'flex';
    
    // Make API request
    fetch(`/api/moderation/warnings/${warningId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        serverId
      })
    })
    .then(response => response.json())
    .then(data => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      if (data.success) {
        showNotification(`Warning removed successfully`, 'success');
        
        // Refresh warnings
        const userId = document.getElementById('warning-user-id').value;
        if (userId) {
          fetchUserWarnings(userId);
        }
        
        // Refresh logs
        refreshModerationLog();
      } else {
        showNotification(`Error: ${data.error || 'Failed to remove warning'}`, 'error');
      }
    })
    .catch(error => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      showNotification(`Error: ${error.message || 'Failed to remove warning'}`, 'error');
    });
  }
  
  /**
   * Unban a user
   * @param {string} userId - User ID to unban
   */
  function unbanUser(userId) {
    const serverId = serverSelect?.value;
    
    if (!serverId) {
      showNotification('Please select a server first', 'error');
      return;
    }
    
    // Show loading state
    document.querySelector('.loading-overlay').style.display = 'flex';
    
    // Make API request
    fetch(`/api/moderation/unban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        userId,
        serverId
      })
    })
    .then(response => response.json())
    .then(data => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      if (data.success) {
        showNotification(`User ${userId} unbanned successfully`, 'success');
        
        // Refresh ban list
        refreshBansList();
        
        // Refresh logs
        refreshModerationLog();
      } else {
        showNotification(`Error: ${data.error || 'Failed to unban user'}`, 'error');
      }
    })
    .catch(error => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      showNotification(`Error: ${error.message || 'Failed to unban user'}`, 'error');
    });
  }
  
  /**
   * Save automod settings
   * @param {Object} settings - Automod settings
   */
  function saveAutomodSettings(settings) {
    const serverId = serverSelect?.value;
    
    if (!serverId) {
      showNotification('Please select a server first', 'error');
      return;
    }
    
    // Show loading state
    document.querySelector('.loading-overlay').style.display = 'flex';
    
    // Make API request
    fetch(`/api/moderation/automod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        ...settings,
        serverId
      })
    })
    .then(response => response.json())
    .then(data => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      if (data.success) {
        showNotification(`Auto-moderation settings saved successfully`, 'success');
      } else {
        showNotification(`Error: ${data.error || 'Failed to save settings'}`, 'error');
      }
    })
    .catch(error => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      showNotification(`Error: ${error.message || 'Failed to save settings'}`, 'error');
    });
  }
  
  /**
   * Load server data when a server is selected
   * @param {string} serverId - Selected server ID
   */
  /**
   * Refresh all server data
   * @param {string} serverId - Discord server ID
   */
  function refreshServerData(serverId) {
    // Refresh ban list
    refreshBansList();
    
    // Refresh moderation log
    refreshModerationLog();
    
    // Load automod settings
    loadAutomodSettings(serverId);
  }
  
  /**
   * Load automod settings for a server
   * @param {string} serverId - Server ID
   */
  function loadAutomodSettings(serverId) {
    // Make API request
    fetch(`/api/moderation/automod?serverId=${serverId}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(response => {
        // Check for 401 Unauthorized or 403 Forbidden responses
        if (response.status === 401 || response.status === 403) {
          return response.json().then(errorData => {
            console.error('Authentication error:', errorData);
            // Check if we need to redirect to login
            if (errorData.redirectTo) {
              window.location.href = errorData.redirectTo;
              return Promise.reject(new Error('Authentication required. Redirecting to login...'));
            } else {
              throw new Error(errorData.message || 'Authentication failed');
            }
          });
        }
        
        if (!response.ok) {
          throw new Error('Failed to load automod settings');
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.settings) {
          const settings = data.settings;
          
          // Set form values
          document.getElementById('filter-profanity').checked = settings.filterProfanity;
          document.getElementById('filter-spam').checked = settings.filterSpam;
          document.getElementById('filter-invites').checked = settings.filterInvites;
          document.getElementById('anti-raid').checked = settings.antiRaid;
          
          // Set raid options
          if (settings.antiRaid) {
            document.getElementById('raid-options').style.display = 'block';
            document.getElementById('raid-threshold').value = settings.raidThreshold;
            
            const raidActionRadios = document.getElementsByName('raidAction');
            for (const radio of raidActionRadios) {
              radio.checked = radio.value === settings.raidAction;
            }
          } else {
            document.getElementById('raid-options').style.display = 'none';
          }
          
          // Set warning threshold
          document.getElementById('warning-threshold').value = settings.warningThreshold;
          
          // Set warning action
          const warningActionRadios = document.getElementsByName('warningAction');
          for (const radio of warningActionRadios) {
            radio.checked = radio.value === settings.warningAction;
          }
        }
      })
      .catch(error => {
        console.error('Error loading automod settings:', error);
      });
  }
  
  /**
   * Initialize WebSocket connection for real-time stats
   */
  function initializeWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/stats`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = function() {
      console.log('WebSocket connection established');
    };
    
    socket.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        updateStats(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onclose = function() {
      console.log('WebSocket connection closed');
      
      // Reconnect after a delay
      setTimeout(initializeWebSocket, 5000);
    };
    
    socket.onerror = function(error) {
      console.error('WebSocket error:', error);
    };
  }
  
  /**
   * Update statistics display with WebSocket data
   * @param {Object} data - Stats data
   */
  function updateStats(data) {
    // Update the stats in the 3D scene header if it exists
    const userCountElement = document.getElementById('user-count');
    const serverCountElement = document.getElementById('server-count');
    const cpuUsageElement = document.getElementById('cpu-usage');
    const memoryUsageElement = document.getElementById('memory-usage');
    
    if (userCountElement && data.users) {
      userCountElement.textContent = data.users.toLocaleString();
    }
    
    if (serverCountElement && data.servers) {
      serverCountElement.textContent = data.servers.toLocaleString();
    }
    
    if (cpuUsageElement && data.cpuUsage) {
      cpuUsageElement.textContent = `${data.cpuUsage.toFixed(1)}%`;
    }
    
    if (memoryUsageElement && data.memoryUsage) {
      memoryUsageElement.textContent = `${(data.memoryUsage / 1024 / 1024).toFixed(1)} MB`;
    }
  }
  
  /**
   * Show a notification message
   * @param {string} message - Message to display
   * @param {string} type - Notification type (success, error, warning, info)
   */
  function showNotification(message, type = 'info') {
    const notificationArea = document.querySelector('.notification-area');
    
    if (!notificationArea) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="fas fa-${getNotificationIcon(type)}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    notificationArea.appendChild(notification);
    
    // Add close button listener
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.add('notification-closing');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('notification-closing');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('notification-visible');
    }, 10);
  }
  
  /**
   * Get the appropriate icon for a notification type
   * @param {string} type - Notification type
   * @returns {string} - Icon name
   */
  function getNotificationIcon(type) {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'exclamation-circle';
      case 'warning':
        return 'exclamation-triangle';
      case 'info':
      default:
        return 'info-circle';
    }
  }
  
  /**
   * Get the appropriate icon for a log type
   * @param {string} type - Log type
   * @returns {string} - Icon name
   */
  function getLogIcon(type) {
    switch (type.toLowerCase()) {
      case 'ban':
        return 'ban';
      case 'unban':
        return 'user-check';
      case 'kick':
        return 'user-times';
      case 'mute':
      case 'timeout':
        return 'volume-mute';
      case 'warn':
        return 'exclamation-triangle';
      case 'purge':
        return 'broom';
      default:
        return 'history';
    }
  }
  
  /**
   * Capitalize the first letter of a string
   * @param {string} string - String to capitalize
   * @returns {string} - Capitalized string
   */
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
});