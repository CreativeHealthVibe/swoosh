/**
 * Advanced Auto-Moderation Dashboard JavaScript
 * Controls the auto-moderation settings interface on the admin3d moderation page
 */

// Global state
let currentServerId = null;
let autoModSettings = null;
let autoModFilters = [];
let autoModLogs = [];
let logChannels = [];
let isSavingSettings = false;
let isSavingFilter = false;
let isDeletingFilter = false;

// DOM Elements
const serverSelect = document.getElementById('serverSelect');
const autoModForm = document.getElementById('automod-settings-form');
const logActionsCheckbox = document.getElementById('logActions');
const logChannelSelect = document.getElementById('logChannel');
const filterProfanityCheckbox = document.getElementById('filterProfanity');
const filterLinksCheckbox = document.getElementById('filterLinks');
const filterInvitesCheckbox = document.getElementById('filterInvites');
const filterMassMentionsCheckbox = document.getElementById('filterMassMentions');
const mentionThresholdInput = document.getElementById('mentionThreshold');
const antiSpamCheckbox = document.getElementById('antiSpam');
const spamThresholdInput = document.getElementById('spamThreshold');
const spamTimeWindowInput = document.getElementById('spamTimeWindow');
const antiCapsCheckbox = document.getElementById('antiCaps');
const capsThresholdInput = document.getElementById('capsThreshold');
const defaultActionSelect = document.getElementById('defaultAction');
const muteTimeInput = document.getElementById('muteTime');
const muteTimeUnitSelect = document.getElementById('muteTimeUnit');
const escalateRepeatedCheckbox = document.getElementById('escalateRepeated');
const maxViolationsInput = document.getElementById('maxViolations');
// New tier-based escalation selectors
const tier1ActionSelect = document.getElementById('tier1Action');
const tier2ActionSelect = document.getElementById('tier2Action');
const tier3ActionSelect = document.getElementById('tier3Action');
const tier4ActionSelect = document.getElementById('tier4Action');
const escalationTiersContainer = document.getElementById('escalation-tiers-container');
const enableAutomodCheckbox = document.getElementById('enableAutomod');
const filtersListBody = document.getElementById('filtersListBody');
const automodLogsBody = document.getElementById('automodLogsBody');
const customFilterForm = document.getElementById('customFilterForm');
const filterTypeSelect = document.getElementById('filterType');
const filterContentInput = document.getElementById('filterContent');
const filterActionSelect = document.getElementById('filterAction');
const filterServerIdInput = document.getElementById('filterServerId');
const resetAutomodSettingsButton = document.getElementById('resetAutomodSettings');
const automodServerIdInput = document.getElementById('automod-server-selector');

// Initialize the auto-moderation interface
function initAutoModeration() {
  if (!serverSelect) {
    console.error('Server select element not found');
    return;
  }

  // Set up event listeners
  serverSelect.addEventListener('change', handleServerChange);
  
  if (autoModForm) {
    autoModForm.addEventListener('submit', handleSettingsSave);
  }
  
  if (customFilterForm) {
    customFilterForm.addEventListener('submit', handleFilterSave);
  }
  
  if (resetAutomodSettingsButton) {
    resetAutomodSettingsButton.addEventListener('click', resetSettings);
  }
  
  // Toggle dependent fields based on checkbox states
  setupDependentFieldToggles();
  
  // Initial load
  if (serverSelect.value) {
    currentServerId = serverSelect.value;
    loadAutoModData(currentServerId);
  }
}

// Set up toggles for dependent fields
function setupDependentFieldToggles() {
  // Log actions toggle
  if (logActionsCheckbox && logChannelSelect) {
    logActionsCheckbox.addEventListener('change', () => {
      logChannelSelect.disabled = !logActionsCheckbox.checked;
    });
  }
  
  // Mass mentions filter toggle
  if (filterMassMentionsCheckbox && mentionThresholdInput) {
    filterMassMentionsCheckbox.addEventListener('change', () => {
      mentionThresholdInput.disabled = !filterMassMentionsCheckbox.checked;
    });
  }
  
  // Anti-spam toggle
  if (antiSpamCheckbox && spamThresholdInput && spamTimeWindowInput) {
    antiSpamCheckbox.addEventListener('change', () => {
      spamThresholdInput.disabled = !antiSpamCheckbox.checked;
      spamTimeWindowInput.disabled = !antiSpamCheckbox.checked;
    });
  }
  
  // Anti-caps toggle
  if (antiCapsCheckbox && capsThresholdInput) {
    antiCapsCheckbox.addEventListener('change', () => {
      capsThresholdInput.disabled = !antiCapsCheckbox.checked;
    });
  }
  
  // Default action toggle for mute time inputs
  if (defaultActionSelect && muteTimeInput && muteTimeUnitSelect) {
    defaultActionSelect.addEventListener('change', () => {
      const isMute = defaultActionSelect.value === 'mute';
      muteTimeInput.disabled = !isMute;
      muteTimeUnitSelect.disabled = !isMute;
    });
  }
  
  // Escalate repeated violations toggle
  if (escalateRepeatedCheckbox && maxViolationsInput) {
    escalateRepeatedCheckbox.addEventListener('change', () => {
      maxViolationsInput.disabled = !escalateRepeatedCheckbox.checked;
      
      // Toggle escalation tiers container visibility
      if (escalationTiersContainer) {
        escalationTiersContainer.style.display = escalateRepeatedCheckbox.checked ? 'block' : 'none';
        
        // Enable/disable tier action selects
        if (tier1ActionSelect) tier1ActionSelect.disabled = !escalateRepeatedCheckbox.checked;
        if (tier2ActionSelect) tier2ActionSelect.disabled = !escalateRepeatedCheckbox.checked;
        if (tier3ActionSelect) tier3ActionSelect.disabled = !escalateRepeatedCheckbox.checked;
        if (tier4ActionSelect) tier4ActionSelect.disabled = !escalateRepeatedCheckbox.checked;
      }
    });
  }
  
  // Main automod enable toggle
  if (enableAutomodCheckbox) {
    enableAutomodCheckbox.addEventListener('change', () => {
      const enabled = enableAutomodCheckbox.checked;
      toggleAllSettings(enabled);
    });
  }
}

// Toggle all settings based on enabled status
function toggleAllSettings(enabled) {
  if (!autoModForm) return;

  const inputs = autoModForm.querySelectorAll('input:not(#enableAutomod), select, button');
  inputs.forEach(input => {
    // Skip the save and reset buttons
    if (input.type === 'submit' || input.id === 'resetAutomodSettings') {
      return;
    }
    
    input.disabled = !enabled;
  });
  
  // Re-apply specific disabling logic if enabled
  if (enabled) {
    if (logChannelSelect && logActionsCheckbox) {
      logChannelSelect.disabled = !logActionsCheckbox.checked;
    }
    
    if (mentionThresholdInput && filterMassMentionsCheckbox) {
      mentionThresholdInput.disabled = !filterMassMentionsCheckbox.checked;
    }
    
    if (spamThresholdInput && spamTimeWindowInput && antiSpamCheckbox) {
      spamThresholdInput.disabled = !antiSpamCheckbox.checked;
      spamTimeWindowInput.disabled = !antiSpamCheckbox.checked;
    }
    
    if (capsThresholdInput && antiCapsCheckbox) {
      capsThresholdInput.disabled = !antiCapsCheckbox.checked;
    }
    
    if (muteTimeInput && muteTimeUnitSelect && defaultActionSelect) {
      const isMute = defaultActionSelect.value === 'mute';
      muteTimeInput.disabled = !isMute;
      muteTimeUnitSelect.disabled = !isMute;
    }
    
    if (maxViolationsInput && escalateRepeatedCheckbox) {
      maxViolationsInput.disabled = !escalateRepeatedCheckbox.checked;
    }
  }
  
  // Toggle custom filter form
  if (customFilterForm) {
    const filterInputs = customFilterForm.querySelectorAll('input, select, button');
    filterInputs.forEach(input => {
      if (input.type !== 'hidden') {
        input.disabled = !enabled;
      }
    });
  }
}

// Handle server change
function handleServerChange(event) {
  currentServerId = event.target.value;
  
  // Update hidden server ID fields
  if (automodServerIdInput) {
    automodServerIdInput.value = currentServerId;
  }
  
  if (filterServerIdInput) {
    filterServerIdInput.value = currentServerId;
  }
  
  // Load data for the selected server
  loadAutoModData(currentServerId);
}

// Load all auto-moderation data for a server
function loadAutoModData(serverId) {
  if (!serverId) return;
  
  // Show loading state
  showLoadingState(true);
  
  // Load settings
  fetch(`/admin3d/moderation/automod-settings/${serverId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        autoModSettings = data.settings;
        updateSettingsForm(autoModSettings);
      } else {
        showMessage('error', `Error loading settings: ${data.message}`);
      }
    })
    .catch(error => {
      console.error('Error loading auto-moderation settings:', error);
      showMessage('error', 'Failed to load auto-moderation settings');
    });
  
  // Load filters
  fetch(`/admin3d/moderation/automod-filters/${serverId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        autoModFilters = data.filters;
        updateFiltersTable(autoModFilters);
      } else {
        showMessage('error', `Error loading filters: ${data.message}`);
      }
    })
    .catch(error => {
      console.error('Error loading auto-moderation filters:', error);
      showMessage('error', 'Failed to load custom filters');
    });
  
  // Load logs
  fetch(`/admin3d/moderation/automod-logs/${serverId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        autoModLogs = data.logs;
        updateLogsTable(autoModLogs);
      } else {
        showMessage('error', `Error loading logs: ${data.message}`);
      }
    })
    .catch(error => {
      console.error('Error loading auto-moderation logs:', error);
      showMessage('error', 'Failed to load auto-moderation logs');
    });
  
  // Load log channels
  fetch(`/admin3d/moderation/log-channels/${serverId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        logChannels = data.channels;
        updateLogChannelOptions(logChannels);
      } else {
        showMessage('error', `Error loading log channels: ${data.message}`);
      }
    })
    .catch(error => {
      console.error('Error loading log channels:', error);
      showMessage('error', 'Failed to load log channels');
    })
    .finally(() => {
      // Hide loading state when all requests are done
      showLoadingState(false);
    });
}

// Update the settings form with loaded settings
function updateSettingsForm(settings) {
  if (!settings) return;
  
  // Set form fields
  if (enableAutomodCheckbox) {
    enableAutomodCheckbox.checked = settings.enabled;
  }
  
  if (logActionsCheckbox) {
    logActionsCheckbox.checked = settings.logActions;
  }
  
  if (logChannelSelect && settings.logChannel) {
    logChannelSelect.value = settings.logChannel;
  }
  
  // Content filters
  if (filterProfanityCheckbox && settings.filters) {
    filterProfanityCheckbox.checked = settings.filters.profanity;
  }
  
  if (filterLinksCheckbox && settings.filters) {
    filterLinksCheckbox.checked = settings.filters.links;
  }
  
  if (filterInvitesCheckbox && settings.filters) {
    filterInvitesCheckbox.checked = settings.filters.invites;
  }
  
  if (filterMassMentionsCheckbox && settings.filters) {
    filterMassMentionsCheckbox.checked = settings.filters.massMentions;
  }
  
  if (mentionThresholdInput) {
    mentionThresholdInput.value = settings.mentionThreshold || 5;
  }
  
  // Anti-spam settings
  if (antiSpamCheckbox && settings.antiSpam) {
    antiSpamCheckbox.checked = settings.antiSpam.enabled;
  }
  
  if (spamThresholdInput && settings.antiSpam) {
    spamThresholdInput.value = settings.antiSpam.messageThreshold || 5;
  }
  
  if (spamTimeWindowInput && settings.antiSpam) {
    spamTimeWindowInput.value = settings.antiSpam.timeWindow || 5;
  }
  
  // Anti-caps settings
  if (antiCapsCheckbox && settings.filters) {
    antiCapsCheckbox.checked = settings.filters.caps;
  }
  
  if (capsThresholdInput) {
    capsThresholdInput.value = settings.capsThreshold || 70;
  }
  
  // Action settings
  if (defaultActionSelect) {
    defaultActionSelect.value = settings.defaultAction || 'delete';
  }
  
  // Mute time parsing (e.g., "10m" to ["10", "m"])
  if (muteTimeInput && muteTimeUnitSelect && settings.muteTime) {
    const match = settings.muteTime.match(/^(\d+)([hmd])$/);
    if (match) {
      muteTimeInput.value = match[1];
      muteTimeUnitSelect.value = match[2];
    } else {
      muteTimeInput.value = 10;
      muteTimeUnitSelect.value = 'm';
    }
  }
  
  if (escalateRepeatedCheckbox) {
    escalateRepeatedCheckbox.checked = settings.escalateRepeated;
  }
  
  if (maxViolationsInput) {
    maxViolationsInput.value = settings.maxViolations || 5;
  }
  
  // Toggle visibility based on enabled status
  toggleAllSettings(settings.enabled);
}

// Update the custom filters table
function updateFiltersTable(filters) {
  if (!filtersListBody) return;
  
  // Clear the table
  filtersListBody.innerHTML = '';
  
  // Add filters to the table
  if (filters && filters.length > 0) {
    filters.forEach((filter) => {
      const row = document.createElement('tr');
      
      // Type cell
      const typeCell = document.createElement('td');
      typeCell.textContent = getReadableFilterType(filter.type);
      row.appendChild(typeCell);
      
      // Content cell
      const contentCell = document.createElement('td');
      contentCell.textContent = filter.content;
      row.appendChild(contentCell);
      
      // Action cell
      const actionCell = document.createElement('td');
      actionCell.textContent = capitalizeFirstLetter(filter.action || 'delete');
      row.appendChild(actionCell);
      
      // Delete button cell
      const deleteCell = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger btn-sm';
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.title = 'Delete Filter';
      deleteBtn.addEventListener('click', () => handleFilterDelete(filter.id));
      deleteCell.appendChild(deleteBtn);
      row.appendChild(deleteCell);
      
      filtersListBody.appendChild(row);
    });
  } else {
    // No filters - show empty message
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.className = 'text-center';
    cell.textContent = 'No custom filters created yet';
    row.appendChild(cell);
    filtersListBody.appendChild(row);
  }
}

// Update the logs table
function updateLogsTable(logs) {
  if (!automodLogsBody) return;
  
  // Clear the table
  automodLogsBody.innerHTML = '';
  
  // Add logs to the table
  if (logs && logs.length > 0) {
    logs.forEach((log) => {
      const row = document.createElement('tr');
      
      // User cell
      const userCell = document.createElement('td');
      userCell.innerHTML = `<strong>${escapeHtml(log.username)}</strong><br><span class="text-muted">${log.userId}</span>`;
      row.appendChild(userCell);
      
      // Violation cell
      const violationCell = document.createElement('td');
      violationCell.textContent = log.violation;
      row.appendChild(violationCell);
      
      // Action cell
      const actionCell = document.createElement('td');
      actionCell.textContent = capitalizeFirstLetter(log.action);
      row.appendChild(actionCell);
      
      // Date cell
      const dateCell = document.createElement('td');
      dateCell.textContent = new Date(log.timestamp).toLocaleString();
      row.appendChild(dateCell);
      
      automodLogsBody.appendChild(row);
    });
  } else {
    // No logs - show empty message
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.className = 'text-center';
    cell.textContent = 'No auto-moderation logs yet';
    row.appendChild(cell);
    automodLogsBody.appendChild(row);
  }
}

// Update log channel options
function updateLogChannelOptions(channels) {
  if (!logChannelSelect) return;
  
  // Save current value
  const currentValue = logChannelSelect.value;
  
  // Clear options
  logChannelSelect.innerHTML = '';
  
  // Add empty option
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = '-- Select a channel --';
  logChannelSelect.appendChild(emptyOption);
  
  // Add channels
  if (channels && channels.length > 0) {
    channels.forEach((channel) => {
      const option = document.createElement('option');
      option.value = channel.id;
      option.textContent = `#${channel.name}`;
      logChannelSelect.appendChild(option);
    });
  } else {
    // No channels - add a message
    const noChannelsOption = document.createElement('option');
    noChannelsOption.value = '';
    noChannelsOption.textContent = 'No available channels';
    noChannelsOption.disabled = true;
    logChannelSelect.appendChild(noChannelsOption);
  }
  
  // Restore value if it exists in the new options
  const hasValue = Array.from(logChannelSelect.options).some(option => option.value === currentValue);
  if (hasValue) {
    logChannelSelect.value = currentValue;
  }
}

// Handle settings form submission
function handleSettingsSave(event) {
  event.preventDefault();
  
  if (!currentServerId) {
    showMessage('error', 'No server selected');
    return;
  }
  
  // Check if we're already saving
  if (isSavingSettings) return;
  
  // Set saving state
  isSavingSettings = true;
  const submitButton = autoModForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Restore after saving
    setTimeout(() => {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }, 2000);
  }
  
  // Construct form data
  const formData = new FormData(autoModForm);
  formData.append('serverId', currentServerId);
  
  // Send post request
  fetch('/admin3d/moderation/automod-settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(formData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showMessage('success', 'Auto-moderation settings saved successfully');
      // Update settings in memory
      autoModSettings = data.settings;
    } else {
      showMessage('error', `Failed to save settings: ${data.message}`);
    }
  })
  .catch(error => {
    console.error('Error saving auto-moderation settings:', error);
    showMessage('error', 'An error occurred while saving settings');
  })
  .finally(() => {
    // Reset saving state
    isSavingSettings = false;
    if (submitButton) {
      submitButton.disabled = false;
    }
  });
}

// Reset settings to default
function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to default?')) {
    return;
  }
  
  // Apply default values
  updateSettingsForm({
    enabled: false,
    logActions: true,
    logChannel: '',
    filters: {
      profanity: false,
      links: false,
      invites: false,
      massMentions: false,
      caps: false
    },
    mentionThreshold: 5,
    antiSpam: {
      enabled: false,
      messageThreshold: 5,
      timeWindow: 5
    },
    capsThreshold: 70,
    defaultAction: 'delete',
    muteTime: '10m',
    escalateRepeated: false,
    maxViolations: 5
  });
}

// Handle custom filter form submission
function handleFilterSave(event) {
  event.preventDefault();
  
  if (!currentServerId) {
    showMessage('error', 'No server selected');
    return;
  }
  
  // Check if we're already saving
  if (isSavingFilter) return;
  
  // Get form values
  const filterType = filterTypeSelect ? filterTypeSelect.value : 'word';
  const filterContent = filterContentInput ? filterContentInput.value : '';
  const filterAction = filterActionSelect ? filterActionSelect.value : 'delete';
  
  // Validate
  if (!filterContent.trim()) {
    showMessage('error', 'Filter content cannot be empty');
    return;
  }
  
  // Set saving state
  isSavingFilter = true;
  const submitButton = customFilterForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Restore after saving
    setTimeout(() => {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }, 2000);
  }
  
  // Send post request
  fetch('/admin3d/moderation/save-filter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      serverId: currentServerId,
      filterType,
      filterContent,
      filterAction
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showMessage('success', 'Custom filter saved successfully');
      
      // Add the new filter to the list
      if (data.filter) {
        autoModFilters.push(data.filter);
        updateFiltersTable(autoModFilters);
      }
      
      // Reset form
      if (filterContentInput) {
        filterContentInput.value = '';
      }
    } else {
      showMessage('error', `Failed to save filter: ${data.message}`);
    }
  })
  .catch(error => {
    console.error('Error saving custom filter:', error);
    showMessage('error', 'An error occurred while saving the filter');
  })
  .finally(() => {
    // Reset saving state
    isSavingFilter = false;
    if (submitButton) {
      submitButton.disabled = false;
    }
  });
}

// Handle filter deletion
function handleFilterDelete(filterId) {
  if (!currentServerId || !filterId) {
    showMessage('error', 'Invalid filter');
    return;
  }
  
  // Check if we're already deleting
  if (isDeletingFilter) return;
  
  // Confirm deletion
  if (!confirm('Are you sure you want to delete this filter?')) {
    return;
  }
  
  // Set deleting state
  isDeletingFilter = true;
  
  // Send delete request
  fetch(`/admin3d/moderation/delete-filter/${currentServerId}/${filterId}`, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showMessage('success', 'Filter removed successfully');
      
      // Remove the filter from the list
      autoModFilters = autoModFilters.filter(filter => filter.id !== filterId);
      updateFiltersTable(autoModFilters);
    } else {
      showMessage('error', `Failed to remove filter: ${data.message}`);
    }
  })
  .catch(error => {
    console.error('Error removing filter:', error);
    showMessage('error', 'An error occurred while removing the filter');
  })
  .finally(() => {
    // Reset deleting state
    isDeletingFilter = false;
  });
}

// Show/hide loading state
function showLoadingState(isLoading) {
  // Disable all form elements while loading
  if (autoModForm) {
    const inputs = autoModForm.querySelectorAll('input, select, button');
    inputs.forEach(input => {
      input.disabled = isLoading;
    });
  }
  
  if (customFilterForm) {
    const inputs = customFilterForm.querySelectorAll('input, select, button');
    inputs.forEach(input => {
      if (input.type !== 'hidden') {
        input.disabled = isLoading;
      }
    });
  }
}

// Show a status message
function showMessage(type, message) {
  // Try to use the admin toast if available
  if (window.showAdminToast) {
    window.showAdminToast(type === 'error' ? 'danger' : 'success', message);
    return;
  }
  
  // Fallback to alert
  if (type === 'error') {
    alert(`Error: ${message}`);
  } else {
    alert(`Success: ${message}`);
  }
}

// Helper function to get readable filter type
function getReadableFilterType(type) {
  switch (type) {
    case 'word':
      return 'Word/Phrase';
    case 'regex':
      return 'Regular Expression';
    case 'domain':
      return 'Domain';
    default:
      return capitalizeFirstLetter(type || 'Unknown');
  }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get server and automod tab elements
  const autoModSection = document.querySelector('.mod-automod-section');
  
  // Update server ID when the main server selector changes
  if (serverSelect) {
    serverSelect.addEventListener('change', function() {
      if (currentServerId !== this.value) {
        currentServerId = this.value;
        
        // Update server ID fields
        if (automodServerIdInput) {
          automodServerIdInput.value = currentServerId;
        }
        
        if (filterServerIdInput) {
          filterServerIdInput.value = currentServerId;
        }
        
        // Load data if automod section is visible
        if (autoModSection && autoModSection.offsetParent !== null) {
          loadAutoModData(currentServerId);
        }
      }
    });
    
    // Set initial server ID
    if (serverSelect.value) {
      currentServerId = serverSelect.value;
      
      if (automodServerIdInput) {
        automodServerIdInput.value = currentServerId;
      }
      
      if (filterServerIdInput) {
        filterServerIdInput.value = currentServerId;
      }
    }
  }
  
  // Check for tabs
  const autoModTab = document.querySelector('a[href="#automod-tab"]') || 
                     document.querySelector('a[data-tab="automod-tab"]') ||
                     document.querySelector('a[data-target="#automod-tab"]');
  
  if (autoModTab) {
    // Initialize when the tab is shown
    autoModTab.addEventListener('click', function() {
      if (!autoModSettings && currentServerId) {
        initAutoModeration();
      }
    });
    
    // If auto-mod tab is active on load, initialize immediately
    if (autoModTab.classList.contains('active')) {
      initAutoModeration();
    }
  } else {
    // No tab, initialize immediately if the section is visible
    if (autoModSection && autoModSection.offsetParent !== null) {
      initAutoModeration();
    }
  }
  
  // Add refresh button functionality
  const refreshFiltersBtn = document.getElementById('refreshFilters');
  if (refreshFiltersBtn) {
    refreshFiltersBtn.addEventListener('click', function() {
      if (currentServerId) {
        fetch(`/admin3d/moderation/automod-filters/${currentServerId}`)
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              autoModFilters = data.filters;
              updateFiltersTable(autoModFilters);
              showMessage('success', 'Filters refreshed');
            }
          })
          .catch(error => {
            console.error('Error refreshing filters:', error);
          });
      }
    });
  }
  
  const refreshLogsBtn = document.getElementById('refreshAutomodLogs');
  if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener('click', function() {
      if (currentServerId) {
        fetch(`/admin3d/moderation/automod-logs/${currentServerId}`)
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              autoModLogs = data.logs;
              updateLogsTable(autoModLogs);
              showMessage('success', 'Logs refreshed');
            }
          })
          .catch(error => {
            console.error('Error refreshing logs:', error);
          });
      }
    });
  }
});