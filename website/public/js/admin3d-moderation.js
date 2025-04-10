/**
 * Admin 3D Dashboard - Moderation Tools
 * Premium edition with advanced moderation features
 */

// Store the currently selected server and data
let currentServerId = '';
let serverChannels = [];
let banList = [];
let moderationLogs = [];
let autoModSettings = null;

// DOM Elements
const serverSelect = document.getElementById('server-select');
const moderationSection = document.getElementById('moderation-section');
const bansList = document.getElementById('bans-list');
const banSearch = document.getElementById('ban-search');
const refreshBansButton = document.getElementById('refresh-bans');
const moderationLog = document.getElementById('moderation-log');
const logTypeFilter = document.getElementById('log-type-filter');
const refreshLogsButton = document.getElementById('refresh-logs');
const purgeChannel = document.getElementById('purge-channel');
const warningUserIdInput = document.getElementById('warning-user-id');
const checkWarningsButton = document.getElementById('check-warnings');
const warningsList = document.getElementById('warnings-list');
const addWarningForm = document.getElementById('add-warning-form');
const autoModForm = document.getElementById('automod-form');
const antiRaidCheckbox = document.getElementById('anti-raid');
const raidOptions = document.getElementById('raid-options');

// Modals
const banUserModal = document.getElementById('ban-user-modal');
const kickUserModal = document.getElementById('kick-user-modal');
const timeoutUserModal = document.getElementById('timeout-user-modal');
const purgeMessagesModal = document.getElementById('purge-messages-modal');
const banInfoModal = document.getElementById('ban-info-modal');
const confirmModal = document.getElementById('confirm-modal');

/**
 * Initialize the moderation page
 */
function initModerationPage() {
  // Set up server selection
  if (serverSelect) {
    serverSelect.addEventListener('change', handleServerChange);
  }
  
  // Set up ban search
  if (banSearch) {
    banSearch.addEventListener('input', filterBans);
  }
  
  // Set up refresh buttons
  if (refreshBansButton) {
    refreshBansButton.addEventListener('click', () => loadBans());
  }
  
  if (refreshLogsButton) {
    refreshLogsButton.addEventListener('click', () => loadModerationLogs());
  }
  
  // Set up log type filter
  if (logTypeFilter) {
    logTypeFilter.addEventListener('change', filterLogs);
  }
  
  // Set up warnings check
  if (checkWarningsButton) {
    checkWarningsButton.addEventListener('click', () => {
      const userId = warningUserIdInput.value.trim();
      if (userId) {
        loadWarnings(userId);
      } else {
        createNotification('error', 'Error', 'Please enter a user ID');
      }
    });
  }
  
  // Set up add warning form
  if (addWarningForm) {
    addWarningForm.addEventListener('submit', handleAddWarning);
  }
  
  // Set up automod form
  if (autoModForm) {
    autoModForm.addEventListener('submit', handleSaveAutoModSettings);
    
    // Toggle raid options
    if (antiRaidCheckbox) {
      antiRaidCheckbox.addEventListener('change', () => {
        raidOptions.style.display = antiRaidCheckbox.checked ? 'block' : 'none';
      });
    }
  }
  
  // Set up action buttons
  document.querySelectorAll('[data-action="ban-user"]').forEach(button => {
    button.addEventListener('click', () => openBanUserModal());
  });
  
  document.querySelectorAll('[data-action="kick-user"]').forEach(button => {
    button.addEventListener('click', () => openKickUserModal());
  });
  
  document.querySelectorAll('[data-action="timeout-user"]').forEach(button => {
    button.addEventListener('click', () => openTimeoutUserModal());
  });
  
  document.querySelectorAll('[data-action="purge-messages"]').forEach(button => {
    button.addEventListener('click', () => openPurgeMessagesModal());
  });
  
  // Set up modal action buttons
  document.querySelector('#ban-user-modal [data-action="ban"]').addEventListener('click', handleBanUser);
  document.querySelector('#kick-user-modal [data-action="kick"]').addEventListener('click', handleKickUser);
  document.querySelector('#timeout-user-modal [data-action="timeout"]').addEventListener('click', handleTimeoutUser);
  document.querySelector('#purge-messages-modal [data-action="purge"]').addEventListener('click', handlePurgeMessages);
  document.querySelector('#ban-info-modal [data-action="unban"]').addEventListener('click', handleUnbanUser);
  
  // Set up modal close buttons
  document.querySelectorAll('.modal-close, [data-action="cancel"], [data-action="close"]').forEach(button => {
    button.addEventListener('click', closeAllModals);
  });
  
  // Set up confirm modal
  const confirmButton = document.querySelector('#confirm-modal [data-action="confirm"]');
  if (confirmButton) {
    confirmButton.addEventListener('click', handleConfirmAction);
  }
}

/**
 * Handle server selection change
 */
async function handleServerChange() {
  const serverId = serverSelect.value;
  
  if (!serverId) {
    moderationSection.style.display = 'none';
    return;
  }
  
  currentServerId = serverId;
  moderationSection.style.display = 'block';
  
  // Load server data
  await Promise.all([
    loadChannels(),
    loadBans(),
    loadModerationLogs(),
    loadAutoModSettings()
  ]);
}

/**
 * Load channels for the selected server
 */
async function loadChannels() {
  if (!currentServerId) return;
  
  try {
    // Fetch channels from API
    const response = await fetch(`/api/v2/servers/${currentServerId}/channels`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load channels');
    }
    
    // Store channels
    serverChannels = data.channels || [];
    
    // Populate purge channel select
    if (purgeChannel) {
      purgeChannel.innerHTML = '<option value="">Select a channel</option>';
      
      serverChannels.sort((a, b) => a.name.localeCompare(b.name)).forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = `#${channel.name}`;
        purgeChannel.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading channels:', error);
    createNotification('error', 'Error', `Failed to load channels: ${error.message}`);
  }
}

/**
 * Load bans for the selected server
 */
async function loadBans() {
  if (!currentServerId) return;
  
  // Show loading state
  bansList.innerHTML = `
    <div class="bans-loading">
      <div class="spinner"></div>
      <p>Loading bans...</p>
    </div>
  `;
  
  try {
    // Fetch bans from API
    const response = await fetch(`/api/v2/servers/${currentServerId}/bans`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load bans');
    }
    
    // Store bans
    banList = data.bans || [];
    
    // Render bans
    renderBansList();
  } catch (error) {
    console.error('Error loading bans:', error);
    bansList.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading bans: ${error.message}</p>
      </div>
    `;
    createNotification('error', 'Error', `Failed to load bans: ${error.message}`);
  }
}

/**
 * Load moderation logs for the selected server
 */
async function loadModerationLogs() {
  if (!currentServerId) return;
  
  // Show loading state
  moderationLog.innerHTML = `
    <div class="log-loading">
      <div class="spinner"></div>
      <p>Loading moderation logs...</p>
    </div>
  `;
  
  try {
    // Fetch logs from API
    const response = await fetch(`/api/v2/servers/${currentServerId}/moderation-logs`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load moderation logs');
    }
    
    // Store logs
    moderationLogs = data.logs || [];
    
    // Render logs
    renderModerationLogs();
  } catch (error) {
    console.error('Error loading moderation logs:', error);
    moderationLog.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading logs: ${error.message}</p>
      </div>
    `;
  }
}

/**
 * Load warnings for a specific user
 */
async function loadWarnings(userId) {
  if (!currentServerId || !userId) return;
  
  // Show loading state
  warningsList.innerHTML = `
    <div class="log-loading">
      <div class="spinner"></div>
      <p>Loading warnings...</p>
    </div>
  `;
  
  try {
    // Fetch warnings from API
    const response = await fetch(`/api/v2/servers/${currentServerId}/warnings/${userId}`);
    const data = await response.json();
    
    if (!data.success) {
      // If user has no warnings, don't throw error
      if (data.code === 'NO_WARNINGS') {
        warningsList.innerHTML = `<p class="empty-message">No warnings found for this user</p>`;
        return;
      }
      
      throw new Error(data.message || 'Failed to load warnings');
    }
    
    // Render warnings
    const warnings = data.warnings || [];
    
    if (warnings.length === 0) {
      warningsList.innerHTML = `<p class="empty-message">No warnings found for this user</p>`;
      return;
    }
    
    // Clear the list
    warningsList.innerHTML = '';
    
    // Render each warning
    warnings.forEach(warning => {
      const warningItem = document.createElement('div');
      warningItem.className = 'warning-item';
      
      // Format date
      const date = new Date(warning.timestamp);
      const dateFormatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      
      warningItem.innerHTML = `
        <div class="warning-header">
          <div class="warning-id">Warning #${warning.id}</div>
          <div class="warning-date">${dateFormatted}</div>
        </div>
        <div class="warning-reason">${escapeHTML(warning.reason)}</div>
        <div class="warning-severity ${warning.severity}">${warning.severity.charAt(0).toUpperCase() + warning.severity.slice(1)}</div>
      `;
      
      warningsList.appendChild(warningItem);
    });
    
    // Also update the add warning form user ID
    document.getElementById('warning-user-id-add').value = userId;
  } catch (error) {
    console.error('Error loading warnings:', error);
    warningsList.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading warnings: ${error.message}</p>
      </div>
    `;
    createNotification('error', 'Error', `Failed to load warnings: ${error.message}`);
  }
}

/**
 * Load auto-moderation settings for the selected server
 */
async function loadAutoModSettings() {
  if (!currentServerId) return;
  
  try {
    // Fetch settings from API
    const response = await fetch(`/api/v2/servers/${currentServerId}/automod`);
    const data = await response.json();
    
    if (!data.success) {
      // If no settings, don't throw error
      if (data.code === 'NO_SETTINGS') {
        return;
      }
      
      throw new Error(data.message || 'Failed to load auto-moderation settings');
    }
    
    // Store settings
    autoModSettings = data.settings || {};
    
    // Update form
    if (autoModSettings) {
      // Content filtering
      document.getElementById('filter-profanity').checked = autoModSettings.filterProfanity || false;
      document.getElementById('filter-spam').checked = autoModSettings.filterSpam || false;
      document.getElementById('filter-invites').checked = autoModSettings.filterInvites || false;
      
      // Raid protection
      document.getElementById('anti-raid').checked = autoModSettings.antiRaid || false;
      document.getElementById('raid-threshold').value = autoModSettings.raidThreshold || '10';
      document.getElementById('raid-options').style.display = autoModSettings.antiRaid ? 'block' : 'none';
      
      // Set raid action radio
      if (autoModSettings.raidAction) {
        document.querySelector(`input[name="raidAction"][value="${autoModSettings.raidAction}"]`).checked = true;
      }
      
      // Warning thresholds
      document.getElementById('warning-threshold').value = autoModSettings.warningThreshold || '3';
      
      // Set warning action radio
      if (autoModSettings.warningAction) {
        document.querySelector(`input[name="warningAction"][value="${autoModSettings.warningAction}"]`).checked = true;
      }
    }
  } catch (error) {
    console.error('Error loading auto-moderation settings:', error);
    createNotification('error', 'Error', `Failed to load auto-moderation settings: ${error.message}`);
  }
}

/**
 * Render the bans list
 */
function renderBansList() {
  if (!banList || banList.length === 0) {
    bansList.innerHTML = '<p class="empty-message">No bans found for this server</p>';
    return;
  }
  
  // Clear the list
  bansList.innerHTML = '';
  
  // Render each ban
  banList.forEach(ban => {
    const banItem = document.createElement('div');
    banItem.className = 'ban-item';
    
    // Format date if available
    let dateFormatted = 'Unknown';
    if (ban.createdAt) {
      const date = new Date(ban.createdAt);
      dateFormatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }
    
    // Create avatar element
    const avatar = ban.user && ban.user.avatar ? 
      `<img src="${ban.user.avatar}" alt="${escapeHTML(ban.user.username)}">` : 
      `<i class="fas fa-user"></i>`;
    
    banItem.innerHTML = `
      <div class="ban-user">
        <div class="ban-user-avatar">
          ${avatar}
        </div>
        <div class="ban-user-details">
          <div class="ban-user-name">${escapeHTML(ban.user ? ban.user.username : 'Unknown User')}</div>
          <div class="ban-user-id">${ban.user ? ban.user.id : ban.id}</div>
        </div>
      </div>
      <div class="ban-reason">${escapeHTML(ban.reason || 'No reason provided')}</div>
      <div class="ban-date">${dateFormatted}</div>
      <div class="ban-actions">
        <button class="admin3d-btn admin3d-btn-sm admin3d-btn-info" data-action="view-ban" data-ban-id="${ban.user ? ban.user.id : ban.id}">
          <i class="fas fa-eye"></i>
        </button>
        <button class="admin3d-btn admin3d-btn-sm admin3d-btn-danger" data-action="unban-user" data-ban-id="${ban.user ? ban.user.id : ban.id}">
          <i class="fas fa-undo"></i>
        </button>
      </div>
    `;
    
    // Add event listeners
    const viewButton = banItem.querySelector('[data-action="view-ban"]');
    if (viewButton) {
      viewButton.addEventListener('click', () => {
        const banId = viewButton.getAttribute('data-ban-id');
        openBanInfoModal(banId);
      });
    }
    
    const unbanButton = banItem.querySelector('[data-action="unban-user"]');
    if (unbanButton) {
      unbanButton.addEventListener('click', () => {
        const banId = unbanButton.getAttribute('data-ban-id');
        openConfirmModal('unban', banId);
      });
    }
    
    bansList.appendChild(banItem);
  });
}

/**
 * Filter the bans list
 */
function filterBans() {
  const searchTerm = banSearch.value.toLowerCase();
  
  // If no search term, show all bans
  if (!searchTerm) {
    document.querySelectorAll('#bans-list .ban-item').forEach(item => {
      item.style.display = '';
    });
    return;
  }
  
  // Filter bans
  document.querySelectorAll('#bans-list .ban-item').forEach(item => {
    const username = item.querySelector('.ban-user-name').textContent.toLowerCase();
    const userId = item.querySelector('.ban-user-id').textContent.toLowerCase();
    const reason = item.querySelector('.ban-reason').textContent.toLowerCase();
    
    if (username.includes(searchTerm) || userId.includes(searchTerm) || reason.includes(searchTerm)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

/**
 * Render the moderation logs
 */
function renderModerationLogs() {
  if (!moderationLogs || moderationLogs.length === 0) {
    moderationLog.innerHTML = '<p class="empty-message">No moderation logs found for this server</p>';
    return;
  }
  
  // Clear the list
  moderationLog.innerHTML = '';
  
  // Sort logs by timestamp (newest first)
  moderationLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Render each log
  moderationLogs.forEach(log => {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.setAttribute('data-type', log.type);
    
    // Format date
    const date = new Date(log.timestamp);
    const dateFormatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    // Format title based on type
    let title = 'Unknown Action';
    let iconClass = 'fas fa-question';
    switch (log.type) {
      case 'ban':
        title = 'User Banned';
        iconClass = 'fas fa-ban';
        break;
      case 'unban':
        title = 'User Unbanned';
        iconClass = 'fas fa-undo';
        break;
      case 'kick':
        title = 'User Kicked';
        iconClass = 'fas fa-sign-out-alt';
        break;
      case 'timeout':
        title = 'User Timed Out';
        iconClass = 'fas fa-stopwatch';
        break;
      case 'warn':
        title = 'User Warned';
        iconClass = 'fas fa-exclamation-triangle';
        break;
      case 'purge':
        title = 'Messages Purged';
        iconClass = 'fas fa-broom';
        break;
    }
    
    logEntry.innerHTML = `
      <div class="log-icon ${log.type}">
        <i class="${iconClass}"></i>
      </div>
      <div class="log-content">
        <div class="log-header">
          <div class="log-title">${title}</div>
          <div class="log-time">${dateFormatted}</div>
        </div>
        <div class="log-details">
          ${log.user ? `<span class="log-user">User: ${escapeHTML(log.user.username || 'Unknown')}</span>` : ''}
          ${log.executor ? `<span class="log-executor">By: ${escapeHTML(log.executor.username || 'Unknown')}</span>` : ''}
          ${log.channel ? `<span class="log-channel">Channel: #${escapeHTML(log.channel.name || 'Unknown')}</span>` : ''}
          ${log.amount ? `<span class="log-amount">Amount: ${log.amount}</span>` : ''}
          ${log.duration ? `<span class="log-duration">Duration: ${formatDuration(log.duration)}</span>` : ''}
        </div>
        <div class="log-reason">${escapeHTML(log.reason || 'No reason provided')}</div>
      </div>
    `;
    
    moderationLog.appendChild(logEntry);
  });
  
  // Apply current filter
  filterLogs();
}

/**
 * Filter the moderation logs
 */
function filterLogs() {
  const filterType = logTypeFilter.value;
  
  // If 'all', show all logs
  if (filterType === 'all') {
    document.querySelectorAll('#moderation-log .log-entry').forEach(entry => {
      entry.style.display = '';
    });
    return;
  }
  
  // Filter logs by type
  document.querySelectorAll('#moderation-log .log-entry').forEach(entry => {
    if (entry.getAttribute('data-type') === filterType) {
      entry.style.display = '';
    } else {
      entry.style.display = 'none';
    }
  });
}

/**
 * Open the ban user modal
 */
function openBanUserModal() {
  // Reset form
  document.getElementById('ban-user-form').reset();
  
  // Show the modal
  banUserModal.classList.add('active');
}

/**
 * Open the kick user modal
 */
function openKickUserModal() {
  // Reset form
  document.getElementById('kick-user-form').reset();
  
  // Show the modal
  kickUserModal.classList.add('active');
}

/**
 * Open the timeout user modal
 */
function openTimeoutUserModal() {
  // Reset form
  document.getElementById('timeout-user-form').reset();
  
  // Show the modal
  timeoutUserModal.classList.add('active');
}

/**
 * Open the purge messages modal
 */
function openPurgeMessagesModal() {
  // Reset form
  document.getElementById('purge-messages-form').reset();
  
  // Show the modal
  purgeMessagesModal.classList.add('active');
}

/**
 * Open the ban info modal
 * @param {string} banId - The ban ID (user ID)
 */
function openBanInfoModal(banId) {
  // Find ban in list
  const ban = banList.find(b => (b.user ? b.user.id : b.id) === banId);
  
  if (!ban) {
    createNotification('error', 'Error', 'Ban not found');
    return;
  }
  
  // Set ban ID
  banInfoModal.setAttribute('data-ban-id', banId);
  
  // Update modal content
  const avatar = ban.user && ban.user.avatar ? 
    `<img src="${ban.user.avatar}" alt="${escapeHTML(ban.user.username)}">` : 
    `<i class="fas fa-user"></i>`;
  
  document.getElementById('ban-info-avatar').innerHTML = avatar;
  document.getElementById('ban-info-name').textContent = ban.user ? ban.user.username : 'Unknown User';
  document.getElementById('ban-info-id').textContent = ban.user ? ban.user.id : ban.id;
  document.getElementById('ban-info-executor').textContent = ban.executor ? ban.executor.username : 'Unknown';
  
  // Format date if available
  let dateFormatted = 'Unknown';
  if (ban.createdAt) {
    const date = new Date(ban.createdAt);
    dateFormatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }
  document.getElementById('ban-info-date').textContent = dateFormatted;
  
  document.getElementById('ban-info-reason').textContent = ban.reason || 'No reason provided';
  
  // Show the modal
  banInfoModal.classList.add('active');
}

/**
 * Open the confirmation modal
 * @param {string} action - The action to confirm
 * @param {string} id - The ID associated with the action
 */
function openConfirmModal(action, id) {
  // Set modal data
  confirmModal.setAttribute('data-action', action);
  confirmModal.setAttribute('data-id', id);
  
  // Set confirm message
  const confirmMessage = document.getElementById('confirm-message');
  
  switch (action) {
    case 'unban':
      confirmMessage.textContent = `Are you sure you want to unban this user?`;
      break;
    default:
      confirmMessage.textContent = 'Are you sure you want to perform this action?';
  }
  
  // Show the modal
  confirmModal.classList.add('active');
}

/**
 * Handle banning a user
 */
async function handleBanUser() {
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  // Get form data
  const userId = document.getElementById('ban-user-id').value.trim();
  const reason = document.getElementById('ban-reason').value.trim();
  const deleteDays = parseInt(document.getElementById('ban-delete-days').value);
  
  if (!userId) {
    createNotification('error', 'Error', 'Please enter a user ID');
    return;
  }
  
  try {
    // Show loading state
    const banButton = banUserModal.querySelector('[data-action="ban"]');
    banButton.disabled = true;
    banButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Banning...';
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/bans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        reason,
        deleteDays
      })
    });
    
    const data = await response.json();
    
    // Reset button state
    banButton.disabled = false;
    banButton.innerHTML = 'Ban User';
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to ban user');
    }
    
    // Show success notification
    createNotification('success', 'Success', 'User banned successfully');
    
    // Close modal
    closeAllModals();
    
    // Reload bans and logs
    await Promise.all([
      loadBans(),
      loadModerationLogs()
    ]);
  } catch (error) {
    console.error('Error banning user:', error);
    createNotification('error', 'Error', `Failed to ban user: ${error.message}`);
    
    // Reset button state
    const banButton = banUserModal.querySelector('[data-action="ban"]');
    banButton.disabled = false;
    banButton.innerHTML = 'Ban User';
  }
}

/**
 * Handle kicking a user
 */
async function handleKickUser() {
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  // Get form data
  const userId = document.getElementById('kick-user-id').value.trim();
  const reason = document.getElementById('kick-reason').value.trim();
  
  if (!userId) {
    createNotification('error', 'Error', 'Please enter a user ID');
    return;
  }
  
  try {
    // Show loading state
    const kickButton = kickUserModal.querySelector('[data-action="kick"]');
    kickButton.disabled = true;
    kickButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kicking...';
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/kicks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        reason
      })
    });
    
    const data = await response.json();
    
    // Reset button state
    kickButton.disabled = false;
    kickButton.innerHTML = 'Kick User';
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to kick user');
    }
    
    // Show success notification
    createNotification('success', 'Success', 'User kicked successfully');
    
    // Close modal
    closeAllModals();
    
    // Reload logs
    await loadModerationLogs();
  } catch (error) {
    console.error('Error kicking user:', error);
    createNotification('error', 'Error', `Failed to kick user: ${error.message}`);
    
    // Reset button state
    const kickButton = kickUserModal.querySelector('[data-action="kick"]');
    kickButton.disabled = false;
    kickButton.innerHTML = 'Kick User';
  }
}

/**
 * Handle timing out a user
 */
async function handleTimeoutUser() {
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  // Get form data
  const userId = document.getElementById('timeout-user-id').value.trim();
  const duration = parseInt(document.getElementById('timeout-duration').value);
  const reason = document.getElementById('timeout-reason').value.trim();
  
  if (!userId) {
    createNotification('error', 'Error', 'Please enter a user ID');
    return;
  }
  
  try {
    // Show loading state
    const timeoutButton = timeoutUserModal.querySelector('[data-action="timeout"]');
    timeoutButton.disabled = true;
    timeoutButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Timing Out...';
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/timeouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        duration,
        reason
      })
    });
    
    const data = await response.json();
    
    // Reset button state
    timeoutButton.disabled = false;
    timeoutButton.innerHTML = 'Timeout User';
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to timeout user');
    }
    
    // Show success notification
    createNotification('success', 'Success', 'User timed out successfully');
    
    // Close modal
    closeAllModals();
    
    // Reload logs
    await loadModerationLogs();
  } catch (error) {
    console.error('Error timing out user:', error);
    createNotification('error', 'Error', `Failed to timeout user: ${error.message}`);
    
    // Reset button state
    const timeoutButton = timeoutUserModal.querySelector('[data-action="timeout"]');
    timeoutButton.disabled = false;
    timeoutButton.innerHTML = 'Timeout User';
  }
}

/**
 * Handle purging messages
 */
async function handlePurgeMessages() {
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  // Get form data
  const channelId = document.getElementById('purge-channel').value;
  const amount = parseInt(document.getElementById('purge-amount').value);
  const reason = document.getElementById('purge-reason').value.trim();
  const onlyUsers = document.getElementById('purge-only-users').checked;
  const withImages = document.getElementById('purge-with-images').checked;
  const withLinks = document.getElementById('purge-with-links').checked;
  
  if (!channelId) {
    createNotification('error', 'Error', 'Please select a channel');
    return;
  }
  
  if (isNaN(amount) || amount < 1 || amount > 100) {
    createNotification('error', 'Error', 'Amount must be between 1 and 100');
    return;
  }
  
  try {
    // Show loading state
    const purgeButton = purgeMessagesModal.querySelector('[data-action="purge"]');
    purgeButton.disabled = true;
    purgeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Purging...';
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/purge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channelId,
        amount,
        reason,
        filters: {
          onlyUsers,
          withImages,
          withLinks
        }
      })
    });
    
    const data = await response.json();
    
    // Reset button state
    purgeButton.disabled = false;
    purgeButton.innerHTML = 'Purge Messages';
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to purge messages');
    }
    
    // Show success notification
    createNotification('success', 'Success', `Purged ${data.purgedCount || 'multiple'} messages successfully`);
    
    // Close modal
    closeAllModals();
    
    // Reload logs
    await loadModerationLogs();
  } catch (error) {
    console.error('Error purging messages:', error);
    createNotification('error', 'Error', `Failed to purge messages: ${error.message}`);
    
    // Reset button state
    const purgeButton = purgeMessagesModal.querySelector('[data-action="purge"]');
    purgeButton.disabled = false;
    purgeButton.innerHTML = 'Purge Messages';
  }
}

/**
 * Handle unbanning a user
 * @param {string} userId - The user ID to unban
 */
async function handleUnbanUser(userId) {
  // If no userId provided, get it from the modal
  if (!userId) {
    userId = banInfoModal.getAttribute('data-ban-id');
  }
  
  if (!currentServerId || !userId) {
    createNotification('error', 'Error', 'Invalid server or user ID');
    return;
  }
  
  try {
    // Show loading state
    let unbanButton;
    if (document.activeElement.getAttribute('data-action') === 'unban') {
      unbanButton = document.activeElement;
      unbanButton.disabled = true;
      unbanButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Unbanning...';
    }
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/bans/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: 'Unbanned via admin panel'
      })
    });
    
    const data = await response.json();
    
    // Reset button state
    if (unbanButton) {
      unbanButton.disabled = false;
      unbanButton.innerHTML = 'Unban User';
    }
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to unban user');
    }
    
    // Show success notification
    createNotification('success', 'Success', 'User unbanned successfully');
    
    // Close modal
    closeAllModals();
    
    // Reload bans and logs
    await Promise.all([
      loadBans(),
      loadModerationLogs()
    ]);
  } catch (error) {
    console.error('Error unbanning user:', error);
    createNotification('error', 'Error', `Failed to unban user: ${error.message}`);
    
    // Reset button state
    if (document.activeElement.getAttribute('data-action') === 'unban') {
      const unbanButton = document.activeElement;
      unbanButton.disabled = false;
      unbanButton.innerHTML = 'Unban User';
    }
  }
}

/**
 * Handle adding a warning
 * @param {Event} e - Form submit event
 */
async function handleAddWarning(e) {
  e.preventDefault();
  
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  // Get form data
  const formData = new FormData(addWarningForm);
  const userId = formData.get('userId').trim();
  const reason = formData.get('reason').trim();
  const severity = formData.get('severity');
  
  if (!userId) {
    createNotification('error', 'Error', 'Please enter a user ID');
    return;
  }
  
  if (!reason) {
    createNotification('error', 'Error', 'Please enter a reason');
    return;
  }
  
  try {
    // Show loading state
    const submitButton = addWarningForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/warnings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        reason,
        severity
      })
    });
    
    const data = await response.json();
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-exclamation-circle"></i> Add Warning';
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to add warning');
    }
    
    // Show success notification
    createNotification('success', 'Success', 'Warning added successfully');
    
    // Reset form
    addWarningForm.reset();
    
    // Reload warnings
    await loadWarnings(userId);
    
    // Reload logs
    await loadModerationLogs();
  } catch (error) {
    console.error('Error adding warning:', error);
    createNotification('error', 'Error', `Failed to add warning: ${error.message}`);
    
    // Reset button state
    const submitButton = addWarningForm.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-exclamation-circle"></i> Add Warning';
  }
}

/**
 * Handle saving auto-moderation settings
 * @param {Event} e - Form submit event
 */
async function handleSaveAutoModSettings(e) {
  e.preventDefault();
  
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  // Get form data
  const formData = new FormData(autoModForm);
  
  // Prepare settings object
  const settings = {
    // Content filtering
    filterProfanity: formData.get('filterProfanity') === 'on',
    filterSpam: formData.get('filterSpam') === 'on',
    filterInvites: formData.get('filterInvites') === 'on',
    
    // Raid protection
    antiRaid: formData.get('antiRaid') === 'on',
    raidThreshold: formData.get('raidThreshold'),
    raidAction: formData.get('raidAction'),
    
    // Warning thresholds
    warningThreshold: formData.get('warningThreshold'),
    warningAction: formData.get('warningAction')
  };
  
  try {
    // Show loading state
    const submitButton = autoModForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/automod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    
    const data = await response.json();
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-save"></i> Save Auto-Mod Settings';
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to save auto-moderation settings');
    }
    
    // Update settings
    autoModSettings = settings;
    
    // Show success notification
    createNotification('success', 'Success', 'Auto-moderation settings saved successfully');
  } catch (error) {
    console.error('Error saving auto-moderation settings:', error);
    createNotification('error', 'Error', `Failed to save auto-moderation settings: ${error.message}`);
    
    // Reset button state
    const submitButton = autoModForm.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-save"></i> Save Auto-Mod Settings';
  }
}

/**
 * Handle confirm modal actions
 */
async function handleConfirmAction() {
  const action = confirmModal.getAttribute('data-action');
  const id = confirmModal.getAttribute('data-id');
  
  if (!action || !id) {
    closeAllModals();
    return;
  }
  
  // Disable confirm button
  const confirmButton = confirmModal.querySelector('[data-action="confirm"]');
  confirmButton.disabled = true;
  confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  try {
    switch (action) {
      case 'unban':
        await handleUnbanUser(id);
        break;
      default:
        console.error('Unknown action:', action);
    }
    
    // Close modal
    closeAllModals();
  } catch (error) {
    console.error(`Error performing action ${action}:`, error);
    
    // Reset button state
    confirmButton.disabled = false;
    confirmButton.innerHTML = 'Confirm';
  }
}

/**
 * Close all open modals
 */
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('active');
  });
}

/**
 * Format duration in seconds to human-readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHTML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initModerationPage);