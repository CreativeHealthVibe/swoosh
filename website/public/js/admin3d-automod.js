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
let isFilterFormVisible = false;
let isSavingSettings = false;
let isSavingFilter = false;
let isDeletingFilter = false;

// DOM Elements
const autoModEnabledSwitch = document.getElementById('enable-automod');
const autoModServerSelector = document.getElementById('automod-server-selector');
const autoModForm = document.getElementById('automod-settings-form');
const logActionsCheckbox = document.getElementById('log-actions');
const logChannelSelect = document.getElementById('log-channel');
const filtersSection = document.getElementById('filters-section');
const filterProfanityCheckbox = document.getElementById('filter-profanity');
const filterLinksCheckbox = document.getElementById('filter-links');
const filterInvitesCheckbox = document.getElementById('filter-invites');
const filterMassMentionsCheckbox = document.getElementById('filter-mass-mentions');
const mentionThresholdInput = document.getElementById('mention-threshold');
const antiSpamCheckbox = document.getElementById('anti-spam');
const spamThresholdInput = document.getElementById('spam-threshold');
const spamTimeWindowInput = document.getElementById('spam-time-window');
const antiCapsCheckbox = document.getElementById('anti-caps');
const capsThresholdInput = document.getElementById('caps-threshold');
const defaultActionSelect = document.getElementById('default-action');
const muteTimeInput = document.getElementById('mute-time');
const muteTimeUnitSelect = document.getElementById('mute-time-unit');
const escalateRepeatedCheckbox = document.getElementById('escalate-repeated');
const maxViolationsInput = document.getElementById('max-violations');
const customFiltersContainer = document.getElementById('custom-filters-container');
const filtersTable = document.getElementById('custom-filters-table');
const filtersTableBody = document.getElementById('custom-filters-table-body');
const newFilterButton = document.getElementById('add-new-filter-btn');
const newFilterForm = document.getElementById('new-filter-form');
const filterTypeSelect = document.getElementById('filter-type');
const filterContentInput = document.getElementById('filter-content');
const filterActionSelect = document.getElementById('filter-action');
const saveFilterButton = document.getElementById('save-filter-btn');
const cancelFilterButton = document.getElementById('cancel-filter-btn');
const automodLogsContainer = document.getElementById('automod-logs-container');
const automodLogsBody = document.getElementById('automod-logs-body');
const saveSettingsButton = document.getElementById('save-automod-settings');

// Initialize the auto-moderation interface
function initAutoModeration() {
  // Set up event listeners
  autoModServerSelector.addEventListener('change', handleServerChange);
  autoModForm.addEventListener('submit', handleSettingsSave);
  newFilterButton.addEventListener('click', showFilterForm);
  newFilterForm.addEventListener('submit', handleFilterSave);
  cancelFilterButton.addEventListener('click', hideFilterForm);
  
  // Toggle dependent fields based on checkbox states
  setupDependentFieldToggles();
  
  // Initialize with the current server
  if (autoModServerSelector && autoModServerSelector.value) {
    currentServerId = autoModServerSelector.value;
    loadAutoModData(currentServerId);
  }
}

// Set up toggles for dependent fields
function setupDependentFieldToggles() {
  // Log actions toggle
  if (logActionsCheckbox) {
    logActionsCheckbox.addEventListener('change', () => {
      if (logChannelSelect) {
        logChannelSelect.disabled = !logActionsCheckbox.checked;
      }
    });
  }
  
  // Mass mentions filter toggle
  if (filterMassMentionsCheckbox) {
    filterMassMentionsCheckbox.addEventListener('change', () => {
      if (mentionThresholdInput) {
        mentionThresholdInput.disabled = !filterMassMentionsCheckbox.checked;
      }
    });
  }
  
  // Anti-spam toggle
  if (antiSpamCheckbox) {
    antiSpamCheckbox.addEventListener('change', () => {
      if (spamThresholdInput && spamTimeWindowInput) {
        spamThresholdInput.disabled = !antiSpamCheckbox.checked;
        spamTimeWindowInput.disabled = !antiSpamCheckbox.checked;
      }
    });
  }
  
  // Anti-caps toggle
  if (antiCapsCheckbox) {
    antiCapsCheckbox.addEventListener('change', () => {
      if (capsThresholdInput) {
        capsThresholdInput.disabled = !antiCapsCheckbox.checked;
      }
    });
  }
  
  // Default action toggle for mute time inputs
  if (defaultActionSelect) {
    defaultActionSelect.addEventListener('change', () => {
      const isMute = defaultActionSelect.value === 'mute';
      if (muteTimeInput && muteTimeUnitSelect) {
        muteTimeInput.disabled = !isMute;
        muteTimeUnitSelect.disabled = !isMute;
      }
    });
  }
  
  // Escalate repeated violations toggle
  if (escalateRepeatedCheckbox) {
    escalateRepeatedCheckbox.addEventListener('change', () => {
      if (maxViolationsInput) {
        maxViolationsInput.disabled = !escalateRepeatedCheckbox.checked;
      }
    });
  }
  
  // Main automod enable toggle
  if (autoModEnabledSwitch) {
    autoModEnabledSwitch.addEventListener('change', () => {
      const enabled = autoModEnabledSwitch.checked;
      toggleAllSettings(enabled);
    });
  }
}

// Toggle all settings based on enabled status
function toggleAllSettings(enabled) {
  const inputs = autoModForm.querySelectorAll('input:not(#enable-automod), select, button');
  inputs.forEach(input => {
    // Don't disable the save button
    if (input !== saveSettingsButton) {
      input.disabled = !enabled;
    }
    
    // Re-apply specific disabling logic
    if (enabled) {
      if (logChannelSelect) {
        logChannelSelect.disabled = !logActionsCheckbox.checked;
      }
      if (mentionThresholdInput) {
        mentionThresholdInput.disabled = !filterMassMentionsCheckbox.checked;
      }
      if (spamThresholdInput && spamTimeWindowInput) {
        spamThresholdInput.disabled = !antiSpamCheckbox.checked;
        spamTimeWindowInput.disabled = !antiSpamCheckbox.checked;
      }
      if (capsThresholdInput) {
        capsThresholdInput.disabled = !antiCapsCheckbox.checked;
      }
      if (muteTimeInput && muteTimeUnitSelect) {
        const isMute = defaultActionSelect.value === 'mute';
        muteTimeInput.disabled = !isMute;
        muteTimeUnitSelect.disabled = !isMute;
      }
      if (maxViolationsInput) {
        maxViolationsInput.disabled = !escalateRepeatedCheckbox.checked;
      }
    }
  });
  
  // Toggle filter form visibility
  if (newFilterButton) {
    newFilterButton.disabled = !enabled;
  }
}

// Handle server change
function handleServerChange(event) {
  currentServerId = event.target.value;
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
  if (autoModEnabledSwitch) {
    autoModEnabledSwitch.checked = settings.enabled;
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
  if (!filtersTableBody) return;
  
  // Clear the table
  filtersTableBody.innerHTML = '';
  
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
      
      filtersTableBody.appendChild(row);
    });
    
    // Show the table
    if (filtersTable) {
      filtersTable.classList.remove('d-none');
    }
  } else {
    // No filters - show empty message
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.className = 'text-center';
    cell.textContent = 'No custom filters created yet';
    row.appendChild(cell);
    filtersTableBody.appendChild(row);
    
    // Show the table
    if (filtersTable) {
      filtersTable.classList.remove('d-none');
    }
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
      
      // Date cell
      const dateCell = document.createElement('td');
      dateCell.textContent = new Date(log.timestamp).toLocaleString();
      row.appendChild(dateCell);
      
      // User cell
      const userCell = document.createElement('td');
      userCell.innerHTML = `<strong>${escapeHtml(log.username)}</strong><br><span class="text-muted">${log.userId}</span>`;
      row.appendChild(userCell);
      
      // Channel cell
      const channelCell = document.createElement('td');
      channelCell.textContent = `#${log.channelName}`;
      row.appendChild(channelCell);
      
      // Violation cell
      const violationCell = document.createElement('td');
      violationCell.textContent = log.violation;
      row.appendChild(violationCell);
      
      // Action cell
      const actionCell = document.createElement('td');
      actionCell.textContent = capitalizeFirstLetter(log.action);
      row.appendChild(actionCell);
      
      // Message cell
      const messageCell = document.createElement('td');
      messageCell.textContent = truncateText(log.messageContent, 50);
      messageCell.title = log.messageContent;
      row.appendChild(messageCell);
      
      automodLogsBody.appendChild(row);
    });
    
    // Show the logs container
    if (automodLogsContainer) {
      automodLogsContainer.classList.remove('d-none');
    }
  } else {
    // No logs - show empty message
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.className = 'text-center';
    cell.textContent = 'No auto-moderation logs yet';
    row.appendChild(cell);
    automodLogsBody.appendChild(row);
    
    // Show the logs container
    if (automodLogsContainer) {
      automodLogsContainer.classList.remove('d-none');
    }
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
  if (saveSettingsButton) {
    saveSettingsButton.disabled = true;
    saveSettingsButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
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
    if (saveSettingsButton) {
      saveSettingsButton.disabled = false;
      saveSettingsButton.innerHTML = 'Save Settings';
    }
  });
}

// Show the filter form
function showFilterForm() {
  if (!newFilterForm) return;
  
  isFilterFormVisible = true;
  newFilterForm.style.display = 'block';
  if (newFilterButton) {
    newFilterButton.style.display = 'none';
  }
  
  // Reset form
  if (filterTypeSelect) filterTypeSelect.value = 'word';
  if (filterContentInput) filterContentInput.value = '';
  if (filterActionSelect) filterActionSelect.value = 'delete';
}

// Hide the filter form
function hideFilterForm() {
  if (!newFilterForm) return;
  
  isFilterFormVisible = false;
  newFilterForm.style.display = 'none';
  if (newFilterButton) {
    newFilterButton.style.display = 'block';
  }
}

// Handle filter form submission
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
  if (saveFilterButton) {
    saveFilterButton.disabled = true;
    saveFilterButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
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
      
      // Hide the form
      hideFilterForm();
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
    if (saveFilterButton) {
      saveFilterButton.disabled = false;
      saveFilterButton.innerHTML = 'Save Filter';
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
}

// Show a status message
function showMessage(type, message) {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'bg-danger' : 'bg-success'} text-white`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  toast.innerHTML = `
    <div class="toast-header ${type === 'error' ? 'bg-danger' : 'bg-success'} text-white">
      <strong class="me-auto">${type === 'error' ? 'Error' : 'Success'}</strong>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  
  // Add to document
  const toastContainer = document.getElementById('toast-container');
  if (toastContainer) {
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove after hidden
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  } else {
    // Fallback to alert if toast container not found
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else {
      alert(`Success: ${message}`);
    }
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

// Helper function to truncate text
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
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
  // Find the automod tab
  const autoModTab = document.querySelector('a[href="#automod-tab"]');
  if (autoModTab) {
    // Initialize when the tab is shown
    autoModTab.addEventListener('shown.bs.tab', function() {
      if (!autoModSettings) {
        initAutoModeration();
      }
    });
    
    // If auto-mod tab is active on load, initialize immediately
    if (autoModTab.classList.contains('active')) {
      initAutoModeration();
    }
  } else {
    // No tab, initialize immediately
    initAutoModeration();
  }
});