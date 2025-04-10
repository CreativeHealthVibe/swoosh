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
  
  // Update server ID in automod form when server is selected
  if (serverSelect && document.getElementById('serverId')) {
    serverSelect.addEventListener('change', function() {
      document.getElementById('serverId').value = this.value;
      
      if (this.value) {
        loadServerData(this.value);
      }
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
    
    // For demo purposes, we'll just show some sample data
    // In a real application, you would fetch this from an API
    setTimeout(() => {
      const sampleBans = [
        {
          userId: '123456789012345678',
          username: 'User1#1234',
          reason: 'Spamming in multiple channels',
          date: '2025-04-08',
          duration: 'Permanent',
          avatar: 'https://cdn.discordapp.com/embed/avatars/0.png'
        },
        {
          userId: '234567890123456789',
          username: 'User2#5678',
          reason: 'Posting inappropriate content',
          date: '2025-04-07',
          duration: '7 days',
          avatar: 'https://cdn.discordapp.com/embed/avatars/1.png'
        },
        {
          userId: '345678901234567890',
          username: 'User3#9012',
          reason: 'Harassment of other members',
          date: '2025-04-05',
          duration: '30 days',
          avatar: 'https://cdn.discordapp.com/embed/avatars/2.png'
        }
      ];
      
      if (sampleBans.length === 0) {
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
      } else {
        banListBody.innerHTML = '';
        
        sampleBans.forEach(ban => {
          banListBody.innerHTML += `
            <tr>
              <td>
                <div class="user-info">
                  <div class="user-avatar">
                    <img src="${ban.avatar}" alt="${ban.username}'s avatar">
                  </div>
                  <div class="user-details">
                    <div class="user-name">${ban.username}</div>
                    <div class="user-id">${ban.userId}</div>
                  </div>
                </div>
              </td>
              <td>${ban.reason}</td>
              <td>${ban.date}</td>
              <td>${ban.duration}</td>
              <td>
                <div class="table-actions">
                  <button class="admin3d-btn admin3d-btn-sm admin3d-btn-secondary" title="View Details">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="admin3d-btn admin3d-btn-sm admin3d-btn-primary" title="Unban User">
                    <i class="fas fa-user-check"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        });
      }
    }, 1000);
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
    
    // For demo purposes, we'll just show some sample data
    // In a real application, you would fetch this from an API
    setTimeout(() => {
      const sampleWarnings = [
        {
          userId: '123456789012345678',
          username: 'User1#1234',
          reason: 'Excessive caps in messages',
          severity: 'Low',
          date: '2025-04-08',
          status: 'Active',
          avatar: 'https://cdn.discordapp.com/embed/avatars/0.png'
        },
        {
          userId: '234567890123456789',
          username: 'User2#5678',
          reason: 'Minor spam in #general',
          severity: 'Medium',
          date: '2025-04-06',
          status: 'Active',
          avatar: 'https://cdn.discordapp.com/embed/avatars/1.png'
        },
        {
          userId: '345678901234567890',
          username: 'User3#9012',
          reason: 'Disrespectful behavior towards moderators',
          severity: 'High',
          date: '2025-04-02',
          status: 'Expired',
          avatar: 'https://cdn.discordapp.com/embed/avatars/2.png'
        }
      ];
      
      if (sampleWarnings.length === 0) {
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
      } else {
        warningListBody.innerHTML = '';
        
        sampleWarnings.forEach(warning => {
          let severityClass = '';
          switch (warning.severity) {
            case 'Low': severityClass = 'severity-low'; break;
            case 'Medium': severityClass = 'severity-medium'; break;
            case 'High': severityClass = 'severity-high'; break;
            case 'Critical': severityClass = 'severity-critical'; break;
          }
          
          let statusClass = warning.status === 'Active' ? 'status-active' : 'status-expired';
          
          warningListBody.innerHTML += `
            <tr>
              <td>
                <div class="user-info">
                  <div class="user-avatar">
                    <img src="${warning.avatar}" alt="${warning.username}'s avatar">
                  </div>
                  <div class="user-details">
                    <div class="user-name">${warning.username}</div>
                    <div class="user-id">${warning.userId}</div>
                  </div>
                </div>
              </td>
              <td>${warning.reason}</td>
              <td><span class="severity-badge ${severityClass}">${warning.severity}</span></td>
              <td>${warning.date}</td>
              <td><span class="status-badge ${statusClass}">${warning.status}</span></td>
              <td>
                <div class="table-actions">
                  <button class="admin3d-btn admin3d-btn-sm admin3d-btn-secondary" title="View Details">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="admin3d-btn admin3d-btn-sm admin3d-btn-danger" title="Remove Warning">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        });
      }
    }, 1000);
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
    
    // For demo purposes, we'll just show some sample data
    // In a real application, you would fetch this from an API
    setTimeout(() => {
      const sampleLogs = [
        {
          time: '2025-04-10 14:32:05',
          username: 'User1#1234',
          userId: '123456789012345678',
          violation: 'Profanity Filter',
          action: 'Message Deleted',
          details: 'Message contained prohibited words',
          avatar: 'https://cdn.discordapp.com/embed/avatars/0.png'
        },
        {
          time: '2025-04-10 13:18:42',
          username: 'User2#5678',
          userId: '234567890123456789',
          violation: 'Spam Detection',
          action: 'User Warned',
          details: '5 messages in 3 seconds',
          avatar: 'https://cdn.discordapp.com/embed/avatars/1.png'
        },
        {
          time: '2025-04-09 22:51:17',
          username: 'User3#9012',
          userId: '345678901234567890',
          violation: 'Discord Invite',
          action: 'Message Deleted',
          details: 'Message contained Discord invite link',
          avatar: 'https://cdn.discordapp.com/embed/avatars/2.png'
        }
      ];
      
      if (sampleLogs.length === 0) {
        automodLogBody.innerHTML = `
          <tr class="empty-state">
            <td colspan="5">
              <div class="empty-state-message">
                <i class="fas fa-info-circle"></i>
                <p>No auto-moderation logs found</p>
              </div>
            </td>
          </tr>
        `;
      } else {
        automodLogBody.innerHTML = '';
        
        sampleLogs.forEach(log => {
          automodLogBody.innerHTML += `
            <tr>
              <td>${log.time}</td>
              <td>
                <div class="user-info">
                  <div class="user-avatar small">
                    <img src="${log.avatar}" alt="${log.username}'s avatar">
                  </div>
                  <div class="user-details">
                    <div class="user-name">${log.username}</div>
                  </div>
                </div>
              </td>
              <td>${log.violation}</td>
              <td>${log.action}</td>
              <td>${log.details}</td>
            </tr>
          `;
        });
      }
    }, 1000);
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        reason,
        deleteDays,
        serverId
      })
    })
    .then(response => response.json())
    .then(data => {
      // Hide loading state
      document.querySelector('.loading-overlay').style.display = 'none';
      
      if (data.success) {
        showNotification(`User ${userId} banned successfully`, 'success');
        hideAllModals();
        refreshBansList();
        refreshModerationLog();
      } else {
        showNotification(`Error: ${data.error || 'Failed to ban user'}`, 'error');
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
        'Content-Type': 'application/json'
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
    const bansList = document.getElementById('bans-list');
    
    if (!serverId || !bansList) return;
    
    // Show loading state
    bansList.innerHTML = `
      <div class="bans-loading">
        <div class="spinner"></div>
        <p>Loading bans...</p>
      </div>
    `;
    
    // Make API request
    fetch(`/api/moderation/bans?serverId=${serverId}`)
      .then(response => response.json())
      .then(data => {
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
    const moderationLog = document.getElementById('moderation-log');
    const logTypeFilter = document.getElementById('log-type-filter')?.value || 'all';
    
    if (!serverId || !moderationLog) return;
    
    // Show loading state
    moderationLog.innerHTML = `
      <div class="log-loading">
        <div class="spinner"></div>
        <p>Loading moderation logs...</p>
      </div>
    `;
    
    // Make API request
    fetch(`/api/moderation/logs?serverId=${serverId}&type=${logTypeFilter}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.logs) {
          if (data.logs.length === 0) {
            moderationLog.innerHTML = `<p class="empty-message">No logs found</p>`;
            return;
          }
          
          // Clear loading state
          moderationLog.innerHTML = '';
          
          // Add each log to the list
          data.logs.forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = `log-item log-${log.type}`;
            
            // Format the date
            const logDate = new Date(log.timestamp || Date.now());
            const formattedDate = logDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric'
            });
            
            logItem.innerHTML = `
              <div class="log-icon">
                <i class="fas fa-${getLogIcon(log.type)}"></i>
              </div>
              <div class="log-content">
                <div class="log-header">
                  <span class="log-type">${capitalizeFirstLetter(log.type)}</span>
                  <span class="log-time">${formattedDate}</span>
                </div>
                <div class="log-message">
                  ${log.message || 'No details provided'}
                </div>
                <div class="log-executor">
                  <span>By: ${log.executor?.username || 'Unknown'}</span>
                </div>
              </div>
            `;
            
            moderationLog.appendChild(logItem);
          });
        } else {
          moderationLog.innerHTML = `<p class="error-message">Error: ${data.error || 'Failed to load logs'}</p>`;
        }
      })
      .catch(error => {
        moderationLog.innerHTML = `<p class="error-message">Error: ${error.message || 'Failed to load logs'}</p>`;
      });
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
    fetch(`/api/moderation/warnings?userId=${userId}&serverId=${serverId}`)
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
        'Content-Type': 'application/json'
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
        'Content-Type': 'application/json'
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
        'Content-Type': 'application/json'
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
        'Content-Type': 'application/json'
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
  function loadServerData(serverId) {
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
    fetch(`/api/moderation/automod?serverId=${serverId}`)
      .then(response => response.json())
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