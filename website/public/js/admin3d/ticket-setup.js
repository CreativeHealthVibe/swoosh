/**
 * Admin 3D - Ticket Setup JS
 * Handles the ticket setup interface in admin panel
 * Simplified for better performance
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Ticket setup JS loaded');
  
  // Initialize ticket setup immediately without waiting for Three.js
  initTicketSetup();

  // Handle tab switching
  const tabButtons = document.querySelectorAll('.ticket-section-tab');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all tabs
      tabButtons.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Hide all tab content
      document.querySelectorAll('.ticket-section-content').forEach(content => {
        content.style.display = 'none';
      });
      
      // Show selected tab content
      const contentId = this.getAttribute('data-tab');
      document.getElementById(contentId).style.display = 'block';
    });
  });
});

/**
 * Initialize ticket setup
 */
function initTicketSetup() {
  console.log('Initializing ticket setup...');
  
  // Get server ID
  const serverId = document.getElementById('server-id').value;
  if (!serverId) {
    console.error('Server ID not found in form');
    return;
  }
  
  // Fetch available channels
  fetchChannels(serverId);
  
  // Setup form submission handlers
  setupFormHandlers(serverId);
  
  // Load existing ticket panels
  loadTicketPanels(serverId);
}

/**
 * Fetch channels for the server
 * @param {string} serverId - Server ID
 */
function fetchChannels(serverId) {
  console.log(`Fetching channels for server ${serverId}...`);
  
  fetch(`/api/v2/servers/${serverId}/channels`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        populateChannelDropdown(data.channels);
      } else {
        console.error('Error fetching channels:', data.message);
        showError('Could not load channels. Please try again later.');
      }
    })
    .catch(error => {
      console.error('Error fetching channels:', error);
      showError('Could not load channels. Please try again later.');
    });
}

/**
 * Populate channel dropdown with fetched channels
 * @param {Array} channels - Array of channels
 */
function populateChannelDropdown(channels) {
  const dropdown = document.getElementById('ticket-channel');
  if (!dropdown) {
    console.error('Channel dropdown not found');
    return;
  }
  
  // Clear existing options
  dropdown.innerHTML = '<option value="">Select a channel</option>';
  
  // Filter to only text channels and sort alphabetically
  const textChannels = channels
    .filter(channel => channel.type === 'GUILD_TEXT')
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Add channel options
  textChannels.forEach(channel => {
    const option = document.createElement('option');
    option.value = channel.id;
    option.textContent = `#${channel.name}`;
    dropdown.appendChild(option);
  });
  
  console.log(`Populated dropdown with ${textChannels.length} channels`);
}

/**
 * Setup form submission handlers
 * @param {string} serverId - Server ID
 */
function setupFormHandlers(serverId) {
  const ticketForm = document.getElementById('ticket-setup-form');
  if (!ticketForm) {
    console.error('Ticket setup form not found');
    return;
  }
  
  ticketForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Validate form
    if (!validateTicketForm()) {
      return;
    }
    
    // Show loading state
    const submitBtn = ticketForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    
    // Get form data
    const formData = new FormData(ticketForm);
    const ticketData = {
      serverId: serverId,
      channelId: formData.get('ticket-channel'),
      title: formData.get('ticket-title'),
      description: formData.get('ticket-description'),
      color: formData.get('ticket-color')
    };
    
    // Get selected ticket types
    const ticketTypes = [];
    document.querySelectorAll('.ticket-type-checkbox:checked').forEach(checkbox => {
      ticketTypes.push(checkbox.value);
    });
    ticketData.ticketTypes = ticketTypes;
    
    console.log('Creating ticket panel with data:', ticketData);
    
    // Send API request
    fetch('/api/tickets/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    })
    .then(response => response.json())
    .then(data => {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      
      if (data.success) {
        showSuccess('Ticket panel created successfully!');
        ticketForm.reset();
        
        // Refresh ticket panels list
        loadTicketPanels(serverId);
      } else {
        showError(`Failed to create ticket panel: ${data.message}`);
      }
    })
    .catch(error => {
      console.error('Error creating ticket panel:', error);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      showError('An error occurred while creating the ticket panel. Please try again.');
    });
  });
}

/**
 * Validate the ticket setup form
 * @returns {boolean} - Whether the form is valid
 */
function validateTicketForm() {
  const channelId = document.getElementById('ticket-channel').value;
  if (!channelId) {
    showError('Please select a channel for the ticket panel');
    return false;
  }
  
  // Ensure at least one ticket type is selected
  const ticketTypes = document.querySelectorAll('.ticket-type-checkbox:checked');
  if (ticketTypes.length === 0) {
    showError('Please select at least one ticket type');
    return false;
  }
  
  return true;
}

/**
 * Load existing ticket panels
 * @param {string} serverId - Server ID
 */
function loadTicketPanels(serverId) {
  console.log(`Loading ticket panels for server ${serverId}...`);
  
  fetch(`/api/tickets/setup/${serverId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        displayTicketPanels(data.panels);
      } else {
        console.error('Error loading ticket panels:', data.message);
        showError('Could not load existing ticket panels. Please try again later.');
      }
    })
    .catch(error => {
      console.error('Error loading ticket panels:', error);
      document.getElementById('ticket-panels-list').innerHTML = 
        '<div class="error-message">Could not load ticket panels. Please try again later.</div>';
    });
}

/**
 * Display ticket panels in the UI
 * @param {Array} panels - Array of ticket panels
 */
function displayTicketPanels(panels) {
  const panelsList = document.getElementById('ticket-panels-list');
  if (!panelsList) {
    console.error('Ticket panels list container not found');
    return;
  }
  
  // Clear existing panels
  panelsList.innerHTML = '';
  
  if (!panels || panels.length === 0) {
    panelsList.innerHTML = '<div class="no-data-message">No ticket panels have been created yet.</div>';
    return;
  }
  
  // Sort panels by creation date (newest first)
  panels.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Create panel cards
  panels.forEach(panel => {
    const panelCard = document.createElement('div');
    panelCard.className = 'ticket-panel-card luxurious-card';
    panelCard.setAttribute('data-panel-id', panel.id);
    
    // Format creation date
    const createdDate = new Date(panel.createdAt);
    const formattedDate = createdDate.toLocaleDateString() + ' ' + 
                          createdDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Create card content
    panelCard.innerHTML = `
      <div class="panel-header">
        <h3 class="panel-title">${panel.options.title || 'Ticket Panel'}</h3>
        <div class="panel-badge">${formatChannelName(panel.channelId)}</div>
      </div>
      <div class="panel-content">
        <p class="panel-description">${panel.options.description || 'No description provided'}</p>
        <div class="panel-details">
          <div class="panel-detail">
            <span class="detail-label">Created:</span>
            <span class="detail-value">${formattedDate}</span>
          </div>
          <div class="panel-detail">
            <span class="detail-label">Ticket Types:</span>
            <span class="detail-value">${formatTicketTypes(panel.options.ticketTypes)}</span>
          </div>
        </div>
      </div>
    `;
    
    panelsList.appendChild(panelCard);
  });
  
  console.log(`Displayed ${panels.length} ticket panels`);
}

/**
 * Format ticket types for display
 * @param {Array} types - Array of ticket types
 * @returns {string} - Formatted ticket types
 */
function formatTicketTypes(types) {
  if (!types || types.length === 0) {
    return 'All types';
  }
  
  if (types.length <= 3) {
    return types.join(', ');
  }
  
  return `${types.slice(0, 2).join(', ')} +${types.length - 2} more`;
}

/**
 * Format channel name for display
 * @param {string} channelId - Channel ID
 * @returns {string} - Formatted channel name
 */
function formatChannelName(channelId) {
  // Try to find channel name from cache
  const channels = document.getElementById('ticket-channel').options;
  for (let i = 0; i < channels.length; i++) {
    if (channels[i].value === channelId) {
      return channels[i].textContent;
    }
  }
  
  // Fallback to just showing the ID
  return `#${channelId.substring(0, 8)}...`;
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  const alertElement = document.createElement('div');
  alertElement.className = 'success-alert';
  alertElement.textContent = message;
  
  document.body.appendChild(alertElement);
  
  // Add show class for animation
  setTimeout(() => alertElement.classList.add('show'), 10);
  
  // Remove after 5 seconds
  setTimeout(() => {
    alertElement.classList.remove('show');
    setTimeout(() => alertElement.remove(), 500);
  }, 5000);
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const alertElement = document.createElement('div');
  alertElement.className = 'error-alert';
  alertElement.textContent = message;
  
  document.body.appendChild(alertElement);
  
  // Add show class for animation
  setTimeout(() => alertElement.classList.add('show'), 10);
  
  // Remove after 5 seconds
  setTimeout(() => {
    alertElement.classList.remove('show');
    setTimeout(() => alertElement.remove(), 500);
  }, 5000);
}