/**
 * Admin 3D Dashboard - Blacklist Management
 * Premium edition with 3D visualizations and advanced blacklist management
 */

// Initialize variables
let blacklistData = [];
let currentPage = 1;
const itemsPerPage = 10;

// DOM elements
const blacklistTableBody = document.getElementById('blacklist-table-body');
const filterSelect = document.getElementById('blacklist-filter');
const searchInput = document.getElementById('blacklist-search');
const addBlacklistForm = document.querySelector('form[action="/admin3d/blacklist/add"]');
const editBlacklistForm = document.getElementById('edit-blacklist-form');
const editModal = document.getElementById('edit-blacklist-modal');
const confirmModal = document.getElementById('confirm-modal');

/**
 * Initialize the blacklist page
 */
async function initBlacklistPage() {
  // Set up form submission
  if (addBlacklistForm) {
    addBlacklistForm.addEventListener('submit', handleAddToBlacklist);
  }
  
  // Set up filter change
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      applyFilters();
    });
  }
  
  // Set up search input
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFilters();
    });
  }
  
  // Set up modal close buttons
  document.querySelectorAll('.modal-close, [data-action="cancel"]').forEach(button => {
    button.addEventListener('click', closeAllModals);
  });
  
  // Set up edit save button
  const saveButton = document.querySelector('#edit-blacklist-modal [data-action="save"]');
  if (saveButton) {
    saveButton.addEventListener('click', handleSaveBlacklistChanges);
  }
  
  // Set up confirm button
  const confirmButton = document.querySelector('#confirm-modal [data-action="confirm"]');
  if (confirmButton) {
    confirmButton.addEventListener('click', handleConfirmAction);
  }
  
  // Load blacklist data
  await loadBlacklistData();
}

/**
 * Load blacklist data from API
 */
async function loadBlacklistData() {
  try {
    // Show loading indicator
    blacklistTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading blacklist data...</td></tr>';
    
    // Fetch data from API
    const response = await fetch('/api/blacklist');
    const data = await response.json();
    
    if (data.success) {
      blacklistData = data.blacklist || [];
      renderBlacklistTable();
    } else {
      blacklistTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-error">Error: ${data.message || 'Failed to load blacklist data'}</td></tr>`;
    }
  } catch (error) {
    console.error('Error loading blacklist data:', error);
    blacklistTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-error">Error: ${error.message || 'Failed to load blacklist data'}</td></tr>`;
  }
}

/**
 * Render the blacklist table with current data
 */
function renderBlacklistTable() {
  // If no data, show message
  if (!blacklistData || blacklistData.length === 0) {
    blacklistTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No blacklisted users found</td></tr>';
    return;
  }
  
  // Apply filters to the data
  const filteredData = applyFilters();
  
  // If no filtered data, show message
  if (filteredData.length === 0) {
    blacklistTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No results found for current filters</td></tr>';
    return;
  }
  
  // Clear the table
  blacklistTableBody.innerHTML = '';
  
  // Render each row
  filteredData.forEach(entry => {
    // Create row
    const row = document.createElement('tr');
    
    // Format duration and expiry
    let durationText = 'Permanent';
    let expiryText = 'Never';
    
    if (entry.duration) {
      // Convert milliseconds to human-readable duration
      const durationDays = Math.floor(entry.duration / (1000 * 60 * 60 * 24));
      if (durationDays >= 30) {
        durationText = `${Math.floor(durationDays / 30)} Month${Math.floor(durationDays / 30) > 1 ? 's' : ''}`;
      } else if (durationDays >= 7) {
        durationText = `${Math.floor(durationDays / 7)} Week${Math.floor(durationDays / 7) > 1 ? 's' : ''}`;
      } else if (durationDays >= 1) {
        durationText = `${durationDays} Day${durationDays > 1 ? 's' : ''}`;
      } else {
        const durationHours = Math.floor(entry.duration / (1000 * 60 * 60));
        durationText = `${durationHours} Hour${durationHours > 1 ? 's' : ''}`;
      }
      
      // Calculate expiry if timestamp exists
      if (entry.timestamp) {
        const expiryTime = entry.timestamp + entry.duration;
        const now = Date.now();
        
        if (expiryTime <= now) {
          expiryText = 'Expired';
        } else {
          const timeLeft = expiryTime - now;
          const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          
          if (daysLeft > 0) {
            expiryText = `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`;
          } else {
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            expiryText = `${hoursLeft} hour${hoursLeft > 1 ? 's' : ''} left`;
          }
        }
      }
    }
    
    // Map restriction level to readable text
    let restrictionText = 'Commands Only';
    if (entry.level === 'message_filter') {
      restrictionText = 'Message Filter';
    } else if (entry.level === 'all') {
      restrictionText = 'Complete Restriction';
    }
    
    // Create table cells
    row.innerHTML = `
      <td>
        <div class="user-info">
          <div class="user-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="user-details">
            <div class="user-name">${entry.user ? entry.user.tag : 'Unknown User'}</div>
            <div class="user-id">${entry.userId}</div>
          </div>
        </div>
      </td>
      <td>${entry.adminId ? entry.adminId : 'System'}</td>
      <td>${entry.reason}</td>
      <td>${durationText}</td>
      <td>${restrictionText}</td>
      <td>${expiryText}</td>
      <td>
        <div class="table-actions">
          <button class="admin3d-btn admin3d-btn-secondary btn-sm" data-action="edit" data-id="${entry.userId}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="admin3d-btn admin3d-btn-danger btn-sm" data-action="remove" data-id="${entry.userId}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    // Add click handlers for the buttons
    const editButton = row.querySelector('[data-action="edit"]');
    if (editButton) {
      editButton.addEventListener('click', () => openEditModal(entry.userId));
    }
    
    const removeButton = row.querySelector('[data-action="remove"]');
    if (removeButton) {
      removeButton.addEventListener('click', () => openConfirmModal('remove', entry.userId));
    }
    
    // Add the row to the table
    blacklistTableBody.appendChild(row);
  });
}

/**
 * Apply filters to the blacklist data
 * @returns {Array} - Filtered blacklist data
 */
function applyFilters() {
  if (!blacklistData || !Array.isArray(blacklistData)) {
    return [];
  }
  
  const filter = filterSelect ? filterSelect.value : 'all';
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  
  return blacklistData.filter(entry => {
    let showEntry = true;
    
    // Apply type filter
    if (filter !== 'all') {
      if (filter === 'permanent' && entry.duration) {
        showEntry = false;
      } else if (filter === 'temporary' && !entry.duration) {
        showEntry = false;
      } else if (filter === 'expired' && entry.duration && entry.timestamp) {
        const expiryTime = entry.timestamp + entry.duration;
        if (expiryTime > Date.now()) {
          showEntry = false;
        }
      }
    }
    
    // Apply search filter
    if (search && showEntry) {
      const userId = entry.userId.toLowerCase();
      const username = (entry.user && entry.user.tag) ? entry.user.tag.toLowerCase() : '';
      const reason = entry.reason ? entry.reason.toLowerCase() : '';
      
      if (!userId.includes(search) && !username.includes(search) && !reason.includes(search)) {
        showEntry = false;
      }
    }
    
    return showEntry;
  });
}

/**
 * Handle adding a user to the blacklist
 * @param {Event} event - Form submit event
 */
async function handleAddToBlacklist(event) {
  event.preventDefault();
  
  // Get form data
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  try {
    // Disable submit button
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    }
    
    // Send request to API
    const response = await fetch('/admin3d/blacklist/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    // Re-enable submit button
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-ban"></i> Add to Blacklist';
    }
    
    if (result.success) {
      // Show success message
      showNotification('success', 'Success', result.message || 'User added to blacklist successfully');
      
      // Reset form
      if (form.hasAttribute('data-reset') && form.getAttribute('data-reset') === 'true') {
        form.reset();
      }
      
      // Reload blacklist data
      await loadBlacklistData();
    } else {
      // Show error message
      showNotification('error', 'Error', result.message || 'Failed to add user to blacklist');
    }
  } catch (error) {
    console.error('Error adding to blacklist:', error);
    showNotification('error', 'Error', error.message || 'Failed to add user to blacklist');
    
    // Re-enable submit button
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-ban"></i> Add to Blacklist';
    }
  }
}

/**
 * Open the edit modal for a blacklist entry
 * @param {string} userId - The user ID to edit
 */
function openEditModal(userId) {
  // Find the entry
  const entry = blacklistData.find(e => e.userId === userId);
  if (!entry) {
    showNotification('error', 'Error', 'User not found in blacklist');
    return;
  }
  
  // Set form data
  document.getElementById('edit-user-id').value = userId;
  
  // Set duration dropdown
  const durationSelect = document.getElementById('edit-duration');
  if (durationSelect) {
    if (!entry.duration) {
      durationSelect.value = 'permanent';
    } else {
      // Calculate duration from milliseconds
      const days = Math.floor(entry.duration / (1000 * 60 * 60 * 24));
      if (days >= 30 && durationSelect.querySelector('option[value="30d"]')) {
        durationSelect.value = '30d';
      } else if (days >= 14 && durationSelect.querySelector('option[value="14d"]')) {
        durationSelect.value = '14d';
      } else if (days >= 7 && durationSelect.querySelector('option[value="7d"]')) {
        durationSelect.value = '7d';
      } else if (days >= 3 && durationSelect.querySelector('option[value="3d"]')) {
        durationSelect.value = '3d';
      } else if (days >= 1 && durationSelect.querySelector('option[value="1d"]')) {
        durationSelect.value = '1d';
      } else {
        const hours = Math.floor(entry.duration / (1000 * 60 * 60));
        if (hours >= 12 && durationSelect.querySelector('option[value="12h"]')) {
          durationSelect.value = '12h';
        } else if (hours >= 6 && durationSelect.querySelector('option[value="6h"]')) {
          durationSelect.value = '6h';
        } else {
          durationSelect.value = '1h';
        }
      }
    }
  }
  
  // Set level dropdown
  const levelSelect = document.getElementById('edit-level');
  if (levelSelect) {
    levelSelect.value = entry.level || 'commands';
  }
  
  // Set reason textarea
  const reasonTextarea = document.getElementById('edit-reason');
  if (reasonTextarea) {
    reasonTextarea.value = entry.reason || '';
  }
  
  // Show the modal
  editModal.classList.add('active');
}

/**
 * Open the confirmation modal
 * @param {string} action - The action to confirm (e.g., 'remove')
 * @param {string} userId - The user ID to perform the action on
 */
function openConfirmModal(action, userId) {
  // Set modal data
  confirmModal.setAttribute('data-action', action);
  confirmModal.setAttribute('data-user-id', userId);
  
  // Set confirm message
  const confirmMessage = document.getElementById('confirm-message');
  if (confirmMessage) {
    if (action === 'remove') {
      confirmMessage.textContent = 'Are you sure you want to remove this user from the blacklist?';
    } else {
      confirmMessage.textContent = 'Are you sure you want to perform this action?';
    }
  }
  
  // Show the modal
  confirmModal.classList.add('active');
}

/**
 * Handle saving changes to a blacklist entry
 */
async function handleSaveBlacklistChanges() {
  // Get form data
  const userId = document.getElementById('edit-user-id').value;
  const duration = document.getElementById('edit-duration').value;
  const level = document.getElementById('edit-level').value;
  const reason = document.getElementById('edit-reason').value;
  
  if (!userId || !reason) {
    showNotification('error', 'Error', 'User ID and reason are required');
    return;
  }
  
  try {
    // Show loading state
    const saveButton = document.querySelector('#edit-blacklist-modal [data-action="save"]');
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    
    // Send request to API
    const response = await fetch(`/api/blacklist/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ duration, level, reason })
    });
    
    const result = await response.json();
    
    // Restore button state
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.innerHTML = 'Save Changes';
    }
    
    if (result.success) {
      // Close modal
      closeAllModals();
      
      // Show success message
      showNotification('success', 'Success', result.message || 'Blacklist entry updated successfully');
      
      // Reload blacklist data
      await loadBlacklistData();
    } else {
      // Show error message
      showNotification('error', 'Error', result.message || 'Failed to update blacklist entry');
    }
  } catch (error) {
    console.error('Error updating blacklist entry:', error);
    showNotification('error', 'Error', error.message || 'Failed to update blacklist entry');
    
    // Restore button state
    const saveButton = document.querySelector('#edit-blacklist-modal [data-action="save"]');
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.innerHTML = 'Save Changes';
    }
  }
}

/**
 * Handle confirming an action in the confirm modal
 */
async function handleConfirmAction() {
  const action = confirmModal.getAttribute('data-action');
  const userId = confirmModal.getAttribute('data-user-id');
  
  if (!action || !userId) {
    closeAllModals();
    return;
  }
  
  try {
    // Show loading state
    const confirmButton = document.querySelector('#confirm-modal [data-action="confirm"]');
    if (confirmButton) {
      confirmButton.disabled = true;
      confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    if (action === 'remove') {
      // Send request to API
      const response = await fetch(`/api/blacklist/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Removed by admin' })
      });
      
      const result = await response.json();
      
      // Restore button state
      if (confirmButton) {
        confirmButton.disabled = false;
        confirmButton.innerHTML = 'Confirm';
      }
      
      if (result.success) {
        // Close modal
        closeAllModals();
        
        // Show success message
        showNotification('success', 'Success', result.message || 'User removed from blacklist successfully');
        
        // Reload blacklist data
        await loadBlacklistData();
      } else {
        // Show error message
        showNotification('error', 'Error', result.message || 'Failed to remove user from blacklist');
      }
    }
  } catch (error) {
    console.error('Error performing action:', error);
    showNotification('error', 'Error', error.message || 'Failed to perform action');
    
    // Restore button state
    const confirmButton = document.querySelector('#confirm-modal [data-action="confirm"]');
    if (confirmButton) {
      confirmButton.disabled = false;
      confirmButton.innerHTML = 'Confirm';
    }
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
 * Show a notification
 * @param {string} type - The type of notification ('success', 'error', 'info', 'warning')
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 */
function showNotification(type, title, message) {
  // Check if the notification system is available
  if (typeof createNotification === 'function') {
    createNotification(type, title, message);
  } else {
    // Fallback to alert
    alert(`${title}: ${message}`);
  }
}

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initBlacklistPage);