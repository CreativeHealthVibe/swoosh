/**
 * SWOOSH Bot 3D Admin Dashboard
 * Legacy Version - Compatible with $555K Edition
 * 
 * This version provides compatibility with the new $555K premium edition
 * Only initializes if the premium version is not detected
 */

// Check if we're running alongside the $555K premium version
let isPremiumVersionLoaded = false;

// Initialize Three.js visualizations once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check for the premium version (will be set by the premium JS file if loaded)
  window.setTimeout(() => {
    if (!window.premium555kLoaded) {
      console.log('Premium $555K version not detected, loading legacy version');
      initializeModeration3D();
      setupTabNavigation();
      initializeFormHandlers();
      initializeServerSelector();
    } else {
      console.log('Premium $555K version detected, deferring to premium initialization');
    }
  }, 100); // Small delay to ensure premium JS has time to load if present
});

/**
 * Initialize the server selector with dynamic loading visuals
 */
function initializeServerSelector() {
  const serverSelect = document.getElementById('serverSelect');
  if (!serverSelect) return;
  
  serverSelect.addEventListener('change', function() {
    const serverId = this.value;
    
    // Update hidden form fields
    document.querySelectorAll('[id$="ServerId"]').forEach(input => {
      input.value = serverId;
    });
    
    if (serverId) {
      // Show loading state
      document.querySelectorAll('.empty-state-message').forEach(el => {
        el.innerHTML = '<div class="mod-loading"><i class="fas fa-circle-notch fa-spin"></i><p>Loading data...</p></div>';
      });
      
      // Load server data
      loadServerData(serverId);
    }
  });
}

/**
 * Load server data for moderation
 * @param {string} serverId - Discord server ID
 */
function loadServerData(serverId) {
  // Load bans
  loadBans(serverId);
  
  // Load warnings
  loadWarnings(serverId);
  
  // Load server stats
  loadServerStats(serverId);
  
  // Reset AutoMod tab
  // (This would be implemented in a separate function)
  
  // Update visualization
  updateVisualization(serverId);
}

/**
 * Load and display server statistics
 * @param {string} serverId - Discord server ID
 */
function loadServerStats(serverId) {
  fetch(`/admin3d/server-stats/${serverId}`, {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    // Update stats cards with animation
    updateStatWithAnimation('totalBans', data.bans || 0);
    updateStatWithAnimation('totalWarnings', data.warnings || 0);
    updateStatWithAnimation('automodActions', data.automodActions || 0);
    updateStatWithAnimation('memberCount', data.members || 0);
  })
  .catch(error => {
    console.error('Error loading server stats:', error);
    // Set default values
    document.getElementById('totalBans').textContent = '0';
    document.getElementById('totalWarnings').textContent = '0';
    document.getElementById('automodActions').textContent = '0';
    document.getElementById('memberCount').textContent = '0';
  });
}

/**
 * Update a stat with animation
 * @param {string} elementId - Element ID to update
 * @param {number} value - New value
 */
function updateStatWithAnimation(elementId, value) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const currentValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
  const difference = value - currentValue;
  const duration = 1500; // Animation duration in ms
  const steps = 60; // Number of steps
  const stepTime = duration / steps;
  
  let currentStep = 0;
  
  // Remove any existing animation
  if (element._animationInterval) {
    clearInterval(element._animationInterval);
  }
  
  // Create animation interval
  element._animationInterval = setInterval(() => {
    currentStep++;
    
    if (currentStep >= steps) {
      clearInterval(element._animationInterval);
      element._animationInterval = null;
      element.textContent = value.toLocaleString();
      
      // Add glowing effect when complete
      element.classList.add('stat-updated');
      setTimeout(() => {
        element.classList.remove('stat-updated');
      }, 1000);
      
      return;
    }
    
    // Calculate current value with easing
    const progress = currentStep / steps;
    const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
    const stepValue = currentValue + Math.round(difference * easedProgress);
    
    element.textContent = stepValue.toLocaleString();
  }, stepTime);
}

/**
 * Set up tab navigation
 */
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.mod-nav-btn');
  if (!tabButtons.length) return;
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      
      // Update active button
      document.querySelectorAll('.mod-nav-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      this.classList.add('active');
      
      // Update active tab
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
      });
      document.getElementById(tabId)?.classList.add('active');
      
      // Special case for visualization adaptation based on active tab
      updateVisualizationForTab(tabId);
    });
  });
}

/**
 * Initialize form handlers for interactivity
 */
function initializeFormHandlers() {
  // Ban duration handler
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
  
  // Form submission handlers
  setupFormSubmissionHandlers();
}

/**
 * Setup form submission handlers with animations
 */
function setupFormSubmissionHandlers() {
  // Ban user form submission
  const banUserForm = document.getElementById('banUserForm');
  if (banUserForm) {
    banUserForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const button = this.querySelector('button[type="submit"]');
      if (button) {
        // Show loading state
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
        
        // Submit form data
        const formData = new FormData(this);
        
        fetch(this.action, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
          // Reset button
          button.disabled = false;
          button.innerHTML = originalText;
          
          if (data.success) {
            // Show success notification
            showNotification('success', 'User Banned', data.message || 'The user has been banned successfully.');
            
            // Reset form
            this.reset();
            
            // Refresh the ban list
            const serverId = document.getElementById('serverSelect').value;
            if (serverId) {
              loadBans(serverId);
              updateVisualization(serverId);
              loadServerStats(serverId);
            }
          } else {
            // Show error notification
            showNotification('error', 'Ban Failed', data.message || 'Failed to ban the user.');
          }
        })
        .catch(error => {
          console.error('Ban request error:', error);
          
          // Reset button
          button.disabled = false;
          button.innerHTML = originalText;
          
          // Show error notification
          showNotification('error', 'Ban Request Failed', 'An error occurred while processing your request.');
        });
      }
    });
  }
  
  // Warning form submission (similar pattern)
  const warnUserForm = document.getElementById('warnUserForm');
  if (warnUserForm) {
    warnUserForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const button = this.querySelector('button[type="submit"]');
      if (button) {
        // Show loading state
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
        
        // Submit form data
        const formData = new FormData(this);
        
        fetch(this.action, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
          // Reset button
          button.disabled = false;
          button.innerHTML = originalText;
          
          if (data.success) {
            // Show success notification
            showNotification('success', 'Warning Issued', data.message || 'The warning has been issued successfully.');
            
            // Reset form
            this.reset();
            
            // Refresh the warning list
            const serverId = document.getElementById('serverSelect').value;
            if (serverId) {
              loadWarnings(serverId);
              loadServerStats(serverId);
            }
          } else {
            // Show error notification
            showNotification('error', 'Warning Failed', data.message || 'Failed to issue the warning.');
          }
        })
        .catch(error => {
          console.error('Warning request error:', error);
          
          // Reset button
          button.disabled = false;
          button.innerHTML = originalText;
          
          // Show error notification
          showNotification('error', 'Warning Request Failed', 'An error occurred while processing your request.');
        });
      }
    });
  }
}

/**
 * Load ban list data
 * @param {string} serverId - Discord server ID
 */
function loadBans(serverId) {
  const banListBody = document.getElementById('banListBody');
  if (!banListBody) return;
  
  // Show loading state
  banListBody.innerHTML = `
    <tr class="loading-state">
      <td colspan="5">
        <div class="mod-loading">
          <i class="fas fa-circle-notch fa-spin"></i>
          <p>Loading ban list...</p>
        </div>
      </td>
    </tr>
  `;
  
  // Fetch ban data
  fetch(`/admin3d/direct-bans/list/${serverId}`, {
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to load ban data');
    return response.json();
  })
  .then(data => {
    if (!data.bans || data.bans.length === 0) {
      // Show empty state
      banListBody.innerHTML = `
        <tr class="empty-state">
          <td colspan="5">
            <div class="empty-state-message">
              <i class="fas fa-info-circle"></i>
              <p>No bans found for this server</p>
              <div class="empty-state-description">Users banned from this server will appear here.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    // Fill table with ban data
    banListBody.innerHTML = '';
    
    data.bans.forEach(ban => {
      const tr = document.createElement('tr');
      
      // Format date
      const banDate = new Date(ban.date || Date.now());
      const formattedDate = `${banDate.toLocaleDateString()} ${banDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      
      // Format duration
      let duration = 'Permanent';
      if (ban.duration && !ban.permanent) {
        duration = ban.duration;
      }
      
      tr.innerHTML = `
        <td>
          <div class="user-info">
            <div class="username">${ban.username || 'Unknown User'}</div>
            <div class="user-id">${ban.userId}</div>
          </div>
        </td>
        <td>${ban.reason || 'No reason provided'}</td>
        <td>${formattedDate}</td>
        <td>${duration}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn unban-btn" data-user-id="${ban.userId}" title="Unban User">
              <i class="fas fa-user-check"></i>
            </button>
            <button class="action-btn details-btn" data-user-id="${ban.userId}" title="View Details">
              <i class="fas fa-info-circle"></i>
            </button>
          </div>
        </td>
      `;
      
      banListBody.appendChild(tr);
    });
    
    // Add event listeners to action buttons
    setupBanActionButtons();
  })
  .catch(error => {
    console.error('Error loading bans:', error);
    
    // Show error state
    banListBody.innerHTML = `
      <tr class="error-state">
        <td colspan="5">
          <div class="error-state-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Failed to load ban list</p>
            <button id="retryBanLoad" class="retry-btn">
              <i class="fas fa-sync-alt"></i> Retry
            </button>
          </div>
        </td>
      </tr>
    `;
    
    // Add retry button event listener
    document.getElementById('retryBanLoad')?.addEventListener('click', function() {
      loadBans(serverId);
    });
  });
}

/**
 * Setup ban action buttons
 */
function setupBanActionButtons() {
  // Unban buttons
  document.querySelectorAll('.unban-btn').forEach(button => {
    button.addEventListener('click', function() {
      const userId = this.dataset.userId;
      const serverId = document.getElementById('serverSelect').value;
      
      if (!userId || !serverId) return;
      
      // Confirm unban
      if (confirm(`Are you sure you want to unban User ID: ${userId}?`)) {
        // Show loading state
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
        
        // Process unban request
        fetch(`/admin3d/direct-bans/unban`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            serverId
          }),
          credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Show success notification
            showNotification('success', 'User Unbanned', data.message || 'The user has been unbanned successfully.');
            
            // Refresh the ban list
            loadBans(serverId);
            updateVisualization(serverId);
            loadServerStats(serverId);
          } else {
            // Show error notification
            showNotification('error', 'Unban Failed', data.message || 'Failed to unban the user.');
            
            // Reset button
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-user-check"></i>';
          }
        })
        .catch(error => {
          console.error('Unban request error:', error);
          
          // Show error notification
          showNotification('error', 'Unban Request Failed', 'An error occurred while processing your request.');
          
          // Reset button
          this.disabled = false;
          this.innerHTML = '<i class="fas fa-user-check"></i>';
        });
      }
    });
  });
  
  // Details buttons
  document.querySelectorAll('.details-btn').forEach(button => {
    button.addEventListener('click', function() {
      const userId = this.dataset.userId;
      const serverId = document.getElementById('serverSelect').value;
      
      if (!userId || !serverId) return;
      
      // Show loading state
      this.disabled = true;
      this.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
      
      // Fetch ban details
      fetch(`/admin3d/direct-bans/details/${serverId}/${userId}`, {
        credentials: 'include'
      })
      .then(response => response.json())
      .then(data => {
        // Reset button
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-info-circle"></i>';
        
        if (data.ban) {
          // Show modal with ban details
          showBanDetailsModal(data.ban);
        } else {
          // Show error notification
          showNotification('error', 'Details Unavailable', 'Could not retrieve ban details.');
        }
      })
      .catch(error => {
        console.error('Ban details error:', error);
        
        // Reset button
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-info-circle"></i>';
        
        // Show error notification
        showNotification('error', 'Details Request Failed', 'An error occurred while retrieving ban details.');
      });
    });
  });
}

/**
 * Show a modal with ban details
 * @param {Object} ban - Ban details
 */
function showBanDetailsModal(ban) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('banDetailsModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'banDetailsModal';
    modal.className = 'admin3d-modal';
    document.body.appendChild(modal);
  }
  
  // Format date
  const banDate = new Date(ban.date || Date.now());
  const formattedDate = `${banDate.toLocaleDateString()} ${banDate.toLocaleTimeString()}`;
  
  // Build modal content
  modal.innerHTML = `
    <div class="admin3d-modal-content">
      <div class="admin3d-modal-header">
        <h3>Ban Details</h3>
        <button class="admin3d-modal-close">&times;</button>
      </div>
      <div class="admin3d-modal-body">
        <div class="ban-details-content">
          <div class="ban-detail-item">
            <div class="ban-detail-label">User:</div>
            <div class="ban-detail-value">${ban.username || 'Unknown User'} (${ban.userId})</div>
          </div>
          <div class="ban-detail-item">
            <div class="ban-detail-label">Date:</div>
            <div class="ban-detail-value">${formattedDate}</div>
          </div>
          <div class="ban-detail-item">
            <div class="ban-detail-label">Duration:</div>
            <div class="ban-detail-value">${ban.permanent ? 'Permanent' : (ban.duration || 'Unknown')}</div>
          </div>
          <div class="ban-detail-item">
            <div class="ban-detail-label">Reason:</div>
            <div class="ban-detail-value ban-reason">${ban.reason || 'No reason provided'}</div>
          </div>
          <div class="ban-detail-item">
            <div class="ban-detail-label">Banned By:</div>
            <div class="ban-detail-value">${ban.bannedBy || 'Unknown'}</div>
          </div>
          ${ban.notes ? `
            <div class="ban-detail-item">
              <div class="ban-detail-label">Notes:</div>
              <div class="ban-detail-value ban-notes">${ban.notes}</div>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="admin3d-modal-footer">
        <button class="admin3d-btn admin3d-btn-primary modal-close-btn">Close</button>
      </div>
    </div>
  `;
  
  // Show modal
  modal.style.display = 'flex';
  
  // Add event listeners
  modal.querySelector('.admin3d-modal-close').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  modal.querySelector('.modal-close-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  // Close when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

/**
 * Load warning list data
 * @param {string} serverId - Discord server ID
 */
function loadWarnings(serverId) {
  const warningListBody = document.getElementById('warningListBody');
  if (!warningListBody) return;
  
  // Show loading state
  warningListBody.innerHTML = `
    <tr class="loading-state">
      <td colspan="5">
        <div class="mod-loading">
          <i class="fas fa-circle-notch fa-spin"></i>
          <p>Loading warnings...</p>
        </div>
      </td>
    </tr>
  `;
  
  // Fetch warning data
  fetch(`/admin3d/warnings/list/${serverId}`, {
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to load warning data');
    return response.json();
  })
  .then(data => {
    if (!data.warnings || data.warnings.length === 0) {
      // Show empty state
      warningListBody.innerHTML = `
        <tr class="empty-state">
          <td colspan="5">
            <div class="empty-state-message">
              <i class="fas fa-info-circle"></i>
              <p>No warnings found for this server</p>
              <div class="empty-state-description">Issued warnings will appear here.</div>
            </div>
          </td>
        </tr>
      `;
      
      // Also update warning stats if available
      updateWarningStats(data.stats || {});
      return;
    }
    
    // Fill table with warning data
    warningListBody.innerHTML = '';
    
    data.warnings.forEach(warning => {
      const tr = document.createElement('tr');
      
      // Format date
      const warningDate = new Date(warning.date || Date.now());
      const formattedDate = `${warningDate.toLocaleDateString()} ${warningDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      
      // Determine status
      const isActive = warning.active !== false;
      const statusClass = isActive ? 'status-active' : 'status-expired';
      const statusText = isActive ? 'Active' : 'Expired';
      
      tr.innerHTML = `
        <td>
          <div class="user-info">
            <div class="username">${warning.username || 'Unknown User'}</div>
            <div class="user-id">${warning.userId}</div>
          </div>
        </td>
        <td>${warning.reason || 'No reason provided'}</td>
        <td>${formattedDate}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <div class="action-buttons">
            ${isActive ? `
              <button class="action-btn revoke-btn" data-warning-id="${warning.id}" title="Revoke Warning">
                <i class="fas fa-undo"></i>
              </button>
            ` : ''}
            <button class="action-btn warning-details-btn" data-warning-id="${warning.id}" title="View Details">
              <i class="fas fa-info-circle"></i>
            </button>
          </div>
        </td>
      `;
      
      warningListBody.appendChild(tr);
    });
    
    // Add event listeners to action buttons
    setupWarningActionButtons();
    
    // Update warning stats if available
    updateWarningStats(data.stats || {});
  })
  .catch(error => {
    console.error('Error loading warnings:', error);
    
    // Show error state
    warningListBody.innerHTML = `
      <tr class="error-state">
        <td colspan="5">
          <div class="error-state-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Failed to load warnings</p>
            <button id="retryWarningLoad" class="retry-btn">
              <i class="fas fa-sync-alt"></i> Retry
            </button>
          </div>
        </td>
      </tr>
    `;
    
    // Add retry button event listener
    document.getElementById('retryWarningLoad')?.addEventListener('click', function() {
      loadWarnings(serverId);
    });
  });
}

/**
 * Update warning statistics
 * @param {Object} stats - Warning statistics
 */
function updateWarningStats(stats) {
  // Update UI elements with warning stats
  document.getElementById('totalServerWarnings')?.textContent = stats.total || '0';
  document.getElementById('activeWarnings')?.textContent = stats.active || '0';
  document.getElementById('warnedUsers')?.textContent = stats.users || '0';
  document.getElementById('avgWarningsPerUser')?.textContent = stats.average || '0';
}

/**
 * Setup warning action buttons
 */
function setupWarningActionButtons() {
  // Implementation similar to ban action buttons
  // Would handle revoke and details functionalities
}

/**
 * Show a notification
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
function showNotification(type, title, message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `admin3d-notification ${type}`;
  
  // Set icon based on type
  let icon = 'info-circle';
  if (type === 'error') icon = 'exclamation-triangle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'warning') icon = 'exclamation-circle';
  
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-${icon}"></i>
    </div>
    <div class="notification-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Add close button functionality
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.classList.add('notification-hiding');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('notification-hiding');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
  
  // Animate in
  setTimeout(() => {
    notification.classList.add('notification-visible');
  }, 10);
}

/**
 * Update visualization based on active tab
 * @param {string} tabId - Active tab ID
 */
function updateVisualizationForTab(tabId) {
  const container = document.getElementById('moderation-three-container');
  if (!container) return;
  
  // Set visualization style based on tab
  switch (tabId) {
    case 'ban-management':
      container.setAttribute('data-mode', 'bans');
      break;
    case 'warning-system':
      container.setAttribute('data-mode', 'warnings');
      break;
    case 'auto-moderation':
      container.setAttribute('data-mode', 'automod');
      break;
    case 'advanced-filters':
      container.setAttribute('data-mode', 'filters');
      break;
    default:
      container.setAttribute('data-mode', 'default');
  }
}

/**
 * Update the visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updateVisualization(serverId) {
  const container = document.getElementById('moderation-three-container');
  if (!container || !serverId) return;
  
  // Get current mode
  const mode = container.getAttribute('data-mode') || 'default';
  
  // Update based on mode and serverId
  switch (mode) {
    case 'bans':
      updateBanVisualization(serverId);
      break;
    case 'warnings':
      updateWarningVisualization(serverId);
      break;
    case 'automod':
      updateAutomodVisualization(serverId);
      break;
    case 'filters':
      updateFilterVisualization(serverId);
      break;
    default:
      updateDefaultVisualization(serverId);
  }
}

/**
 * Initialize Three.js visualization for the moderation page
 */
function initializeModeration3D() {
  try {
    // Only initialize if the container exists
    const container = document.getElementById('moderation-three-container');
    if (!container) return;
    
    // Check if THREE.js is available
    if (typeof THREE === 'undefined' || window.threeJSLoaded === false) {
      console.warn('THREE.js not available, visualization will be disabled');
      // Add a fallback background gradient instead
      container.style.background = 'linear-gradient(135deg, rgba(157, 0, 255, 0.1) 0%, rgba(0, 0, 0, 0) 100%)';
      return;
    }
    
    // Set up Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0c18);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      60, 
      container.clientWidth / container.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 15;
    
    // Create renderer with better quality
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404080, 1);
    scene.add(ambientLight);
    
    // Add directional light with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Add a point light
    const pointLight = new THREE.PointLight(0x9d00ff, 1, 20);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);
    
    // Add particles for background atmosphere
    addBackgroundParticles(scene);
    
    // Create groups for different visualizations
    const banGroup = new THREE.Group();
    const warningGroup = new THREE.Group();
    const automodGroup = new THREE.Group();
    const filterGroup = new THREE.Group();
    
    scene.add(banGroup);
    scene.add(warningGroup);
    scene.add(automodGroup);
    scene.add(filterGroup);
    
    // Store all groups in scene.userData for access
    scene.userData = {
      banGroup,
      warningGroup,
      automodGroup,
      filterGroup,
      activeGroup: banGroup // default
    };
    
    // Make all groups invisible except the active one
    warningGroup.visible = false;
    automodGroup.visible = false;
    filterGroup.visible = false;
    
    // Create default elements
    createDefaultSphere(banGroup);
    createDefaultSphere(warningGroup);
    createDefaultSphere(automodGroup);
    createDefaultSphere(filterGroup);
    
    // Create orbit controls for camera
    if (typeof THREE.OrbitControls !== 'undefined') {
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      scene.userData.controls = controls;
    }
    
    // Resize handler
    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Rotate the active group
      const activeGroup = scene.userData.activeGroup;
      if (activeGroup) {
        activeGroup.rotation.y += 0.002;
      }
      
      // Update controls
      if (scene.userData.controls) {
        scene.userData.controls.update();
      }
      
      // Update any animated materials
      scene.traverse(object => {
        if (object.material && object.material.userData && object.material.userData.animated) {
          object.material.userData.time = (object.material.userData.time || 0) + 0.01;
          
          if (object.material.uniforms && object.material.uniforms.time) {
            object.material.uniforms.time.value = object.material.userData.time;
          }
        }
      });
      
      renderer.render(scene, camera);
    }
    
    // Start the animation
    animate();
    
    // Store scene and renderer in container's userData for access
    container.userData = {
      scene,
      camera,
      renderer
    };
    
    // Event listener for server changes
    document.getElementById('serverSelect')?.addEventListener('change', function() {
      const serverId = this.value;
      if (serverId) {
        updateVisualization(serverId);
      }
    });
    
    // Event listener for tab changes
    document.querySelectorAll('.mod-nav-btn').forEach(button => {
      button.addEventListener('click', function() {
        const tabId = this.dataset.tab;
        
        // Switch active group based on tab
        switch (tabId) {
          case 'ban-management':
            scene.userData.activeGroup = banGroup;
            banGroup.visible = true;
            warningGroup.visible = false;
            automodGroup.visible = false;
            filterGroup.visible = false;
            break;
          case 'warning-system':
            scene.userData.activeGroup = warningGroup;
            banGroup.visible = false;
            warningGroup.visible = true;
            automodGroup.visible = false;
            filterGroup.visible = false;
            break;
          case 'auto-moderation':
            scene.userData.activeGroup = automodGroup;
            banGroup.visible = false;
            warningGroup.visible = false;
            automodGroup.visible = true;
            filterGroup.visible = false;
            break;
          case 'advanced-filters':
            scene.userData.activeGroup = filterGroup;
            banGroup.visible = false;
            warningGroup.visible = false;
            automodGroup.visible = false;
            filterGroup.visible = true;
            break;
        }
      });
    });
    
  } catch (error) {
    console.error('Error initializing 3D visualization:', error);
    // If there's an error, add a fallback background
    const container = document.getElementById('moderation-three-container');
    if (container) {
      container.style.background = 'linear-gradient(135deg, rgba(157, 0, 255, 0.1) 0%, rgba(0, 0, 0, 0) 100%)';
    }
  }
}

/**
 * Add background particles for atmosphere
 * @param {THREE.Scene} scene - The Three.js scene
 */
function addBackgroundParticles(scene) {
  // Create particle material
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });
  
  // Create particle geometry
  const particleCount = 1000;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 50;
    positions[i3 + 1] = (Math.random() - 0.5) * 50;
    positions[i3 + 2] = (Math.random() - 0.5) * 50;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  // Create particle system
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
  
  // Store for animation
  scene.userData.backgroundParticles = particles;
}

/**
 * Create a default sphere for visualization when no data is available
 * @param {THREE.Group} group - Three.js group to add the sphere to
 */
function createDefaultSphere(group) {
  // First, clear the group
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    
    // Properly dispose of geometries and materials
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(material => material.dispose());
      } else {
        child.material.dispose();
      }
    }
  }
  
  // Create main sphere
  const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x9d00ff,
    roughness: 0.7,
    metalness: 0.2,
    transparent: true,
    opacity: 0.1,
    wireframe: true
  });
  
  const mainSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  group.add(mainSphere);
  
  // Add inner sphere with glow
  const innerGeometry = new THREE.SphereGeometry(3.5, 24, 24);
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: 0x9d00ff,
    roughness: 0.4,
    metalness: 0.6,
    transparent: true,
    opacity: 0.2,
    emissive: 0x9d00ff,
    emissiveIntensity: 0.2
  });
  
  const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
  group.add(innerSphere);
  
  // Add orbiting particles
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const orbitRadius = 5 + Math.random() * 3;
    const particleSize = 0.1 + Math.random() * 0.2;
    
    const x = Math.cos(angle) * orbitRadius;
    const y = (Math.random() - 0.5) * 6;
    const z = Math.sin(angle) * orbitRadius;
    
    const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
    const particleMaterial = new THREE.MeshStandardMaterial({
      color: 0x9d00ff,
      emissive: 0x9d00ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.set(x, y, z);
    
    // Store initial position for animation
    particle.userData = {
      initialX: x,
      initialY: y,
      initialZ: z,
      orbitSpeed: 0.003 + Math.random() * 0.003,
      orbitRadius: orbitRadius,
      orbitAngle: angle,
      orbitHeight: y
    };
    
    group.add(particle);
  }
  
  // Add animated update function to group
  group.userData = {
    update: (delta) => {
      // Animate particles
      group.children.forEach(child => {
        if (child.userData && child.userData.orbitSpeed) {
          child.userData.orbitAngle += child.userData.orbitSpeed;
          
          const x = Math.cos(child.userData.orbitAngle) * child.userData.orbitRadius;
          const z = Math.sin(child.userData.orbitAngle) * child.userData.orbitRadius;
          
          child.position.x = x;
          child.position.z = z;
        }
      });
      
      // Animate innerSphere
      if (innerSphere) {
        innerSphere.rotation.y += 0.005;
        innerSphere.rotation.z += 0.003;
      }
    }
  };
}

/**
 * Update ban visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updateBanVisualization(serverId) {
  const container = document.getElementById('moderation-three-container');
  if (!container || !container.userData || !container.userData.scene) return;
  
  const scene = container.userData.scene;
  const banGroup = scene.userData.banGroup;
  
  // Clear existing visualization
  while (banGroup.children.length) {
    const child = banGroup.children[0];
    banGroup.remove(child);
    
    // Properly dispose of geometries and materials
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(material => material.dispose());
      } else {
        child.material.dispose();
      }
    }
  }
  
  // Show loading state
  createLoadingVisualization(banGroup);
  
  // Fetch ban data
  fetch(`/admin3d/direct-bans/list/${serverId}`, {
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to load ban data for visualization');
    return response.json();
  })
  .then(data => {
    console.log('Visualization data loaded:', data);
    
    // Clear loading state
    while (banGroup.children.length) {
      const child = banGroup.children[0];
      banGroup.remove(child);
      
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    
    if (!data.bans || data.bans.length === 0) {
      // Create empty state visualization
      createEmptyStateVisualization(banGroup, 'No bans found');
      return;
    }
    
    // Create visualization based on bans data
    createBanVisualization(data.bans, banGroup);
  })
  .catch(error => {
    console.error('Error loading visualization data:', error);
    
    // Clear loading state
    while (banGroup.children.length) {
      const child = banGroup.children[0];
      banGroup.remove(child);
      
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    
    // Create error state visualization
    createErrorStateVisualization(banGroup);
  });
}

/**
 * Create a loading visualization
 * @param {THREE.Group} group - Three.js group to add visualization to
 */
function createLoadingVisualization(group) {
  // Create a rotating ring
  const ringGeometry = new THREE.TorusGeometry(5, 0.3, 16, 100);
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x9d00ff,
    emissive: 0x9d00ff,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.7
  });
  
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  
  // Create a second ring
  const ring2Geometry = new THREE.TorusGeometry(4, 0.2, 16, 80);
  const ring2Material = new THREE.MeshStandardMaterial({
    color: 0x00e6ff,
    emissive: 0x00e6ff,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.7
  });
  
  const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
  ring2.rotation.x = Math.PI / 3;
  ring2.rotation.y = Math.PI / 3;
  group.add(ring2);
  
  // Create a third ring
  const ring3Geometry = new THREE.TorusGeometry(3, 0.1, 16, 60);
  const ring3Material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.5
  });
  
  const ring3 = new THREE.Mesh(ring3Geometry, ring3Material);
  ring3.rotation.x = Math.PI / 4;
  ring3.rotation.z = Math.PI / 4;
  group.add(ring3);
  
  // Store animation info
  group.userData = {
    loading: true,
    update: (delta) => {
      ring.rotation.z += 0.02;
      ring2.rotation.z -= 0.015;
      ring3.rotation.z += 0.025;
    }
  };
}

/**
 * Create an empty state visualization
 * @param {THREE.Group} group - Three.js group to add visualization to
 * @param {string} message - Message to display
 */
function createEmptyStateVisualization(group, message) {
  // Create default visualization
  createDefaultSphere(group);
}

/**
 * Create an error state visualization
 * @param {THREE.Group} group - Three.js group to add visualization to
 */
function createErrorStateVisualization(group) {
  // Create a red warning sphere
  const sphereGeometry = new THREE.SphereGeometry(4, 32, 32);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    roughness: 0.7,
    metalness: 0.3,
    transparent: true,
    opacity: 0.2,
    wireframe: true
  });
  
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  group.add(sphere);
  
  // Create exclamation mark
  const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 16);
  const cylinderMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    emissive: 0xff3333,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.7
  });
  
  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  cylinder.position.y = 1;
  group.add(cylinder);
  
  const dotGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const dotMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    emissive: 0xff3333,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.7
  });
  
  const dot = new THREE.Mesh(dotGeometry, dotMaterial);
  dot.position.y = -1.5;
  group.add(dot);
  
  // Store animation info
  group.userData = {
    error: true,
    update: (delta) => {
      sphere.rotation.y += 0.01;
      sphere.rotation.z += 0.005;
      
      // Pulse animation
      const time = Date.now() * 0.001; // time in seconds
      const scale = 1 + 0.1 * Math.sin(time * 2);
      cylinder.scale.set(scale, 1, scale);
      dot.scale.set(scale, scale, scale);
    }
  };
}

/**
 * Create a visualization of ban data
 * @param {Array} bans - Array of ban objects
 * @param {THREE.Group} group - Three.js group to add visualization to
 */
function createBanVisualization(bans, group) {
  const banCount = bans.length;
  
  // Create center point
  const centerGeometry = new THREE.SphereGeometry(2, 32, 32);
  const centerMaterial = new THREE.MeshStandardMaterial({
    color: 0x9d00ff,
    roughness: 0.3,
    metalness: 0.7,
    emissive: 0x9d00ff,
    emissiveIntensity: 0.3
  });
  
  const centerSphere = new THREE.Mesh(centerGeometry, centerMaterial);
  group.add(centerSphere);
  
  // Create orbits
  const orbitCount = 3;
  const orbitGeometries = [];
  
  for (let i = 0; i < orbitCount; i++) {
    const orbitRadius = 4 + i * 2.5;
    const orbitGeometry = new THREE.TorusGeometry(orbitRadius, 0.05, 8, 100);
    const orbitMaterial = new THREE.MeshStandardMaterial({
      color: 0x9d00ff,
      emissive: 0x9d00ff,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.4 - (i * 0.1)
    });
    
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    orbit.rotation.y = i * (Math.PI / orbitCount);
    group.add(orbit);
    
    orbitGeometries.push(orbitGeometry);
  }
  
  // Create a sphere to represent each ban
  bans.forEach((ban, index) => {
    // Calculate which orbit to place this on
    const orbitIndex = index % orbitCount;
    const orbitRadius = 4 + orbitIndex * 2.5;
    
    // Calculate position on orbit
    const angleOffset = (index / banCount) * Math.PI * 2;
    const angle = ((index / Math.max(1, Math.ceil(banCount / orbitCount))) * Math.PI * 2) + (orbitIndex * (Math.PI / orbitCount));
    
    const x = Math.cos(angle) * orbitRadius;
    const y = (Math.random() - 0.5) * 2; // Small random y-offset
    const z = Math.sin(angle) * orbitRadius;
    
    // Create geometry (size based on ban reason length)
    const reasonLength = ban.reason ? ban.reason.length : 10;
    const size = 0.3 + (Math.min(reasonLength, 100) / 100) * 0.7;
    
    // Create material (color based on ban duration)
    let color;
    if (ban.permanent) {
      color = 0xff3333; // Red for permanent bans
    } else if (ban.duration && ban.duration.includes('d')) {
      const days = parseInt(ban.duration);
      if (days > 14) {
        color = 0xff6600; // Orange for long bans
      } else {
        color = 0xffaa00; // Yellow for shorter bans
      }
    } else {
      color = 0x00e6ff; // Cyan for other bans
    }
    
    // Create ban particle
    let particle;
    
    // For some bans, use cube geometry for variety
    if (index % 5 === 0) {
      const geometry = new THREE.BoxGeometry(size * 1.2, size * 1.2, size * 1.2);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.4,
        metalness: 0.6,
        emissive: color,
        emissiveIntensity: 0.3
      });
      
      particle = new THREE.Mesh(geometry, material);
    } else {
      // Use sphere geometry for most bans
      const geometry = new THREE.SphereGeometry(size, 16, 16);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.5,
        metalness: 0.5,
        emissive: color,
        emissiveIntensity: 0.2
      });
      
      particle = new THREE.Mesh(geometry, material);
    }
    
    particle.position.set(x, y, z);
    
    // Set random rotation
    particle.rotation.x = Math.random() * Math.PI * 2;
    particle.rotation.y = Math.random() * Math.PI * 2;
    particle.rotation.z = Math.random() * Math.PI * 2;
    
    // Store original position and orbit data for animation
    particle.userData = {
      orbitRadius: orbitRadius,
      orbitAngle: angle,
      orbitSpeed: 0.002 + (Math.random() * 0.002),
      orbitY: y,
      originalX: x,
      originalY: y,
      originalZ: z,
      ban: ban // Store ban data for potential interaction
    };
    
    group.add(particle);
    
    // Add a connecting line to the center
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(x, y, z)
    ]);
    
    const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3
    });
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.userData = {
      startPoint: new THREE.Vector3(0, 0, 0),
      endPoint: particle, // Reference to the ban particle
      update: function() {
        // Update line end position to match particle
        const positions = this.geometry.attributes.position.array;
        positions[3] = this.endPoint.position.x;
        positions[4] = this.endPoint.position.y;
        positions[5] = this.endPoint.position.z;
        this.geometry.attributes.position.needsUpdate = true;
      }
    };
    
    group.add(line);
  });
  
  // Store animation info in the group
  group.userData = {
    update: (delta) => {
      // Animate center sphere
      centerSphere.rotation.y += 0.005;
      centerSphere.rotation.x += 0.003;
      
      // Animate each ban particle
      group.children.forEach(child => {
        if (child.userData && child.userData.orbitAngle !== undefined) {
          // Update orbit angle
          child.userData.orbitAngle += child.userData.orbitSpeed;
          
          // Calculate new position
          const x = Math.cos(child.userData.orbitAngle) * child.userData.orbitRadius;
          const z = Math.sin(child.userData.orbitAngle) * child.userData.orbitRadius;
          
          // Update position
          child.position.x = x;
          child.position.z = z;
          
          // Add subtle rotation
          child.rotation.x += 0.01;
          child.rotation.y += 0.005;
        }
        
        // Update connecting lines
        if (child.userData && child.userData.update && typeof child.userData.update === 'function') {
          child.userData.update();
        }
      });
    }
  };
}

/**
 * Update warning visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updateWarningVisualization(serverId) {
  // Similar to updateBanVisualization but for warnings
  // Would fetch warning data and create visualization
}

/**
 * Update automod visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updateAutomodVisualization(serverId) {
  // Would create a visualization for automod settings and actions
}

/**
 * Update filter visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updateFilterVisualization(serverId) {
  // Would create a visualization for filter settings
}

/**
 * Update default visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updateDefaultVisualization(serverId) {
  // Default visualization for when no specific tab is selected
}

// Ban search functionality
document.getElementById('banSearchInput')?.addEventListener('input', function() {
  const searchValue = this.value.toLowerCase();
  const rows = document.querySelectorAll('#banListBody tr:not(.empty-state):not(.error-state):not(.loading-state)');
  
  rows.forEach(row => {
    const username = row.querySelector('.username')?.textContent.toLowerCase() || '';
    const userId = row.querySelector('.user-id')?.textContent.toLowerCase() || '';
    const reason = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
    
    if (username.includes(searchValue) || userId.includes(searchValue) || reason.includes(searchValue)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
});

// Warning search functionality
document.getElementById('warningSearchInput')?.addEventListener('input', function() {
  const searchValue = this.value.toLowerCase();
  const rows = document.querySelectorAll('#warningListBody tr:not(.empty-state):not(.error-state):not(.loading-state)');
  
  rows.forEach(row => {
    const username = row.querySelector('.username')?.textContent.toLowerCase() || '';
    const userId = row.querySelector('.user-id')?.textContent.toLowerCase() || '';
    const reason = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
    
    if (username.includes(searchValue) || userId.includes(searchValue) || reason.includes(searchValue)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
});

// Ban search functionality
document.getElementById('banSearchInput')?.addEventListener('input', function() {
  const searchValue = this.value.toLowerCase();
  const rows = document.querySelectorAll('#banListBody tr:not(.empty-state):not(.error-state):not(.loading-state)');
  
  rows.forEach(row => {
    const username = row.querySelector('.username')?.textContent.toLowerCase() || '';
    const userId = row.querySelector('.user-id')?.textContent.toLowerCase() || '';
    const reason = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
    
    if (username.includes(searchValue) || userId.includes(searchValue) || reason.includes(searchValue)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
});