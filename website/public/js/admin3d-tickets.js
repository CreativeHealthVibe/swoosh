/**
 * Admin 3D - Ticket Management
 * Client-side JavaScript for the ticket management page
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing tickets page...');
  
  // Initialize server select dropdown
  initServerSelect();
  
  // Initialize event listeners
  initEventListeners();
  
  // Initialize tabs if they exist
  initTabs();
  
  // Handle auto-close checkbox
  handleAutoCloseToggle();
});

/**
 * Initialize the server select dropdown
 */
function initServerSelect() {
  const serverSelect = document.getElementById('server-select');
  
  if (!serverSelect) {
    console.error('Server select element not found!');
    return;
  }
  
  console.log('Initializing server select dropdown...');
  
  // Count options for debugging
  if (serverSelect.options) {
    console.log(`Server select has ${serverSelect.options.length} options`);
    
    // Log options for debugging
    for (let i = 0; i < serverSelect.options.length; i++) {
      const option = serverSelect.options[i];
      console.log(`Option ${i}: ${option.value} - ${option.text}`);
    }
  }
  
  // Apply select2 if available
  if (typeof $.fn.select2 === 'function') {
    $(serverSelect).select2({
      placeholder: 'Select a server',
      allowClear: true,
      theme: 'dark'
    });
  }
  
  // Add change event listener
  serverSelect.addEventListener('change', function() {
    const serverId = this.value;
    if (serverId) {
      loadServerData(serverId);
    }
  });
  
  // Fix select dropdown styling
  console.log('Server select element found, applying fix');
  fixSelect(serverSelect);
  
  if (serverSelect.options) {
    console.log(`Server select has ${serverSelect.options.length} options after fix`);
  }
}

/**
 * Initialize all event listeners
 */
function initEventListeners() {
  // Settings form submission
  const settingsForm = document.getElementById('ticket-settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveTicketSettings();
    });
  }
  
  // Panel form submission
  const panelForm = document.getElementById('panel-form');
  if (panelForm) {
    panelForm.addEventListener('submit', function(e) {
      e.preventDefault();
      createTicketPanel();
    });
  }
  
  // Auto-close checkbox toggle
  const autoCloseCheckbox = document.getElementById('auto-close');
  if (autoCloseCheckbox) {
    autoCloseCheckbox.addEventListener('change', handleAutoCloseToggle);
  }
  
  // Add ticket type button
  const addTicketTypeBtn = document.getElementById('add-ticket-type');
  if (addTicketTypeBtn) {
    addTicketTypeBtn.addEventListener('click', addTicketType);
  }
  
  // Remove ticket type buttons (using event delegation)
  const ticketTypesContainer = document.getElementById('ticket-types-container');
  if (ticketTypesContainer) {
    ticketTypesContainer.addEventListener('click', function(e) {
      if (e.target.closest('.remove-ticket-type')) {
        const row = e.target.closest('.ticket-type-row');
        if (row && ticketTypesContainer.querySelectorAll('.ticket-type-row').length > 1) {
          row.remove();
          // Update indices
          updateTicketTypeIndices();
        }
      }
    });
  }
  
  // Reset settings button
  const resetBtn = document.getElementById('reset-settings');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetTicketSettings);
  }
  
  // Ticket view buttons (using event delegation)
  const ticketListBody = document.getElementById('ticket-list-body');
  if (ticketListBody) {
    ticketListBody.addEventListener('click', function(e) {
      const viewBtn = e.target.closest('.btn-view');
      if (viewBtn) {
        const ticketId = viewBtn.dataset.ticketId;
        if (ticketId) {
          viewTicketDetails(ticketId);
        }
      }
      
      const closeBtn = e.target.closest('.btn-close');
      if (closeBtn) {
        const ticketId = closeBtn.dataset.ticketId;
        if (ticketId) {
          showCloseTicketModal(ticketId);
        }
      }
      
      const transcriptBtn = e.target.closest('.btn-transcript');
      if (transcriptBtn) {
        const ticketId = transcriptBtn.dataset.ticketId;
        if (ticketId) {
          downloadTranscript(ticketId);
        }
      }
    });
  }
  
  // Close ticket confirmation button
  const confirmCloseBtn = document.getElementById('confirm-close-ticket');
  if (confirmCloseBtn) {
    confirmCloseBtn.addEventListener('click', closeTicket);
  }
  
  // Download transcript button in modal
  const downloadTranscriptBtn = document.getElementById('download-transcript');
  if (downloadTranscriptBtn) {
    downloadTranscriptBtn.addEventListener('click', function() {
      const ticketId = this.dataset.ticketId;
      if (ticketId) {
        downloadTranscript(ticketId);
      }
    });
  }
  
  // Close ticket button in modal
  const closeTicketBtn = document.getElementById('close-ticket');
  if (closeTicketBtn) {
    closeTicketBtn.addEventListener('click', function() {
      const ticketId = this.dataset.ticketId;
      if (ticketId) {
        showCloseTicketModal(ticketId);
      }
    });
  }
  
  // Ticket filters
  const statusFilter = document.getElementById('status-filter');
  const typeFilter = document.getElementById('type-filter');
  const searchInput = document.getElementById('search-tickets');
  
  if (statusFilter) {
    statusFilter.addEventListener('change', filterTickets);
  }
  
  if (typeFilter) {
    typeFilter.addEventListener('change', filterTickets);
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', filterTickets);
  }
}

/**
 * Initialize tabs functionality
 */
function initTabs() {
  const tabButtons = document.querySelectorAll('.nav-link[data-toggle="tab"]');
  const tabContents = document.querySelectorAll('.tab-pane');
  
  console.log('Initializing tabs...');
  console.log(`Found ${tabButtons.length} regular tab buttons`);
  
  // For regular tabs
  tabButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the target tab content
      const targetId = this.getAttribute('href');
      const targetContent = document.querySelector(targetId);
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => {
        content.classList.remove('show', 'active');
      });
      
      // Add active class to current button and content
      this.classList.add('active');
      if (targetContent) {
        targetContent.classList.add('show', 'active');
      }
    });
  });
  
  // Support for Bootstrap tabs if available
  if (typeof $ === 'function' && typeof $('.nav-tabs a').tab === 'function') {
    $('.nav-tabs a').on('click', function (e) {
      e.preventDefault();
      $(this).tab('show');
    });
  }
}

/**
 * Handle auto-close checkbox toggle
 */
function handleAutoCloseToggle() {
  const autoCloseCheckbox = document.getElementById('auto-close');
  const autoCloseSettings = document.querySelectorAll('.auto-close-settings');
  
  if (autoCloseCheckbox && autoCloseSettings.length) {
    const isChecked = autoCloseCheckbox.checked;
    
    autoCloseSettings.forEach(setting => {
      setting.style.display = isChecked ? 'flex' : 'none';
    });
  }
}

/**
 * Add a new ticket type row
 */
function addTicketType() {
  const container = document.getElementById('ticket-types-container');
  if (!container) return;
  
  // Get current count of ticket types
  const currentCount = container.querySelectorAll('.ticket-type-row').length;
  const index = currentCount;
  
  // Create new row
  const newRow = document.createElement('div');
  newRow.className = 'ticket-type-row';
  newRow.dataset.index = index;
  newRow.innerHTML = `
    <div class="row">
      <div class="col-4">
        <input type="text" class="form-control type-label" 
               name="ticketTypes[${index}][label]" placeholder="Label" required>
      </div>
      <div class="col-2">
        <input type="text" class="form-control type-emoji" 
               name="ticketTypes[${index}][emoji]" placeholder="Emoji" required>
      </div>
      <div class="col-5">
        <input type="text" class="form-control type-description" 
               name="ticketTypes[${index}][description]" placeholder="Description">
      </div>
      <div class="col-1">
        <button type="button" class="btn btn-danger btn-sm remove-ticket-type">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;
  
  container.appendChild(newRow);
}

/**
 * Update ticket type indices after removing a row
 */
function updateTicketTypeIndices() {
  const container = document.getElementById('ticket-types-container');
  if (!container) return;
  
  const rows = container.querySelectorAll('.ticket-type-row');
  
  rows.forEach((row, index) => {
    row.dataset.index = index;
    
    const labelInput = row.querySelector('.type-label');
    const emojiInput = row.querySelector('.type-emoji');
    const descInput = row.querySelector('.type-description');
    
    if (labelInput) labelInput.name = `ticketTypes[${index}][label]`;
    if (emojiInput) emojiInput.name = `ticketTypes[${index}][emoji]`;
    if (descInput) descInput.name = `ticketTypes[${index}][description]`;
  });
}

/**
 * Fix select element styles
 */
function fixSelect(selectElement) {
  if (!selectElement) return;
  
  // Add custom styling
  selectElement.style.backgroundColor = '#2a2a2a';
  selectElement.style.color = '#fff';
  selectElement.style.border = '1px solid #444';
  selectElement.style.borderRadius = '4px';
  selectElement.style.padding = '8px';
  selectElement.style.width = '100%';
  
  // Set option styling
  for (let i = 0; i < selectElement.options.length; i++) {
    selectElement.options[i].style.backgroundColor = '#2a2a2a';
    selectElement.options[i].style.color = '#fff';
  }
}

/**
 * Load data for the selected server
 */
function loadServerData(serverId) {
  if (!serverId) return;
  
  // Show loading state
  setLoadingState(true);
  
  // Load tickets
  loadTickets(serverId)
    .then(() => loadTicketConfig(serverId))
    .then(() => loadServerChannels(serverId))
    .then(() => loadServerRoles(serverId))
    .then(() => setLoadingState(false))
    .catch(error => {
      console.error('Error loading server data:', error);
      setLoadingState(false);
      showError('Failed to load server data. Please try again.');
    });
}

/**
 * Load tickets for a server
 */
function loadTickets(serverId) {
  return fetch(`/api/v2/servers/${serverId}/tickets`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        displayTickets(data.tickets, data.stats);
      } else {
        console.error('Error loading tickets:', data.message);
        showError('Failed to load tickets: ' + data.message);
      }
      return data;
    });
}

/**
 * Load ticket configuration for a server
 */
function loadTicketConfig(serverId) {
  return fetch(`/api/v2/servers/${serverId}/ticket-config`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        populateTicketConfig(data.config);
      } else {
        // If no config found, it's not necessarily an error
        if (data.code === 'CONFIG_NOT_FOUND') {
          resetTicketSettings();
        } else {
          console.error('Error loading ticket config:', data.message);
          showError('Failed to load ticket configuration: ' + data.message);
        }
      }
      return data;
    });
}

/**
 * Load channels for a server
 */
function loadServerChannels(serverId) {
  return fetch(`/api/v2/servers/${serverId}/channels`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        populateChannelDropdowns(data.channels, data.categories);
      } else {
        console.error('Error loading channels:', data.message);
        showError('Failed to load channels: ' + data.message);
      }
      return data;
    });
}

/**
 * Load roles for a server
 */
function loadServerRoles(serverId) {
  return fetch(`/api/v2/servers/${serverId}/roles`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        populateRoleDropdown(data.roles);
      } else {
        console.error('Error loading roles:', data.message);
        showError('Failed to load roles: ' + data.message);
      }
      return data;
    });
}

/**
 * Display tickets in the table
 */
function displayTickets(tickets, stats) {
  const ticketListBody = document.getElementById('ticket-list-body');
  const totalTicketsEl = document.getElementById('total-tickets');
  const openTicketsEl = document.getElementById('open-tickets');
  const closedTicketsEl = document.getElementById('closed-tickets');
  const avgResponseTimeEl = document.getElementById('avg-response-time');
  
  // Update stats
  if (totalTicketsEl) totalTicketsEl.textContent = stats.total;
  if (openTicketsEl) openTicketsEl.textContent = stats.open;
  if (closedTicketsEl) closedTicketsEl.textContent = stats.closed;
  
  // Format average response time
  if (avgResponseTimeEl) {
    if (stats.avgResponseTime) {
      const minutes = Math.floor(stats.avgResponseTime / 60);
      avgResponseTimeEl.textContent = `${minutes} min`;
    } else {
      avgResponseTimeEl.textContent = 'N/A';
    }
  }
  
  // Clear existing tickets
  if (ticketListBody) {
    ticketListBody.innerHTML = '';
    
    // If no tickets, show message
    if (!tickets || tickets.length === 0) {
      ticketListBody.innerHTML = `
        <tr class="no-tickets-row">
          <td colspan="6" class="text-center">No tickets found for this server.</td>
        </tr>
      `;
      return;
    }
    
    // Populate ticket list
    tickets.forEach(ticket => {
      const row = document.createElement('tr');
      row.dataset.ticketId = ticket.id;
      row.dataset.status = ticket.status.toLowerCase();
      row.dataset.type = ticket.type || 'unknown';
      row.dataset.creator = ticket.creator ? ticket.creator.username : 'Unknown';
      
      // Format creation date
      const createdDate = new Date(ticket.createdAt);
      const formattedDate = `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`;
      
      row.innerHTML = `
        <td>${ticket.number || ticket.id.substring(0, 8)}</td>
        <td>${ticket.creator ? ticket.creator.username : 'Unknown'}</td>
        <td>${ticket.type || 'General'}</td>
        <td>${formattedDate}</td>
        <td>
          <span class="ticket-status status-${ticket.status.toLowerCase()}">
            ${ticket.status}
          </span>
        </td>
        <td class="ticket-actions">
          <button class="btn btn-view" data-ticket-id="${ticket.id}">
            <i class="fas fa-eye"></i> View
          </button>
          ${ticket.status.toLowerCase() === 'open' ? `
            <button class="btn btn-close" data-ticket-id="${ticket.id}">
              <i class="fas fa-lock"></i> Close
            </button>
          ` : ''}
          <button class="btn btn-transcript" data-ticket-id="${ticket.id}">
            <i class="fas fa-file-alt"></i> Transcript
          </button>
        </td>
      `;
      
      ticketListBody.appendChild(row);
    });
    
    // Populate type filter
    populateTypeFilter(tickets);
  }
}

/**
 * Populate ticket type filter dropdown
 */
function populateTypeFilter(tickets) {
  const typeFilter = document.getElementById('type-filter');
  if (!typeFilter) return;
  
  // Clear existing options (except the first one)
  while (typeFilter.options.length > 1) {
    typeFilter.remove(1);
  }
  
  // Get unique ticket types
  const types = new Set();
  tickets.forEach(ticket => {
    if (ticket.type) types.add(ticket.type);
  });
  
  // Add options for each type
  types.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    typeFilter.appendChild(option);
  });
}

/**
 * Filter tickets based on status, type, and search
 */
function filterTickets() {
  const statusFilter = document.getElementById('status-filter');
  const typeFilter = document.getElementById('type-filter');
  const searchInput = document.getElementById('search-tickets');
  const ticketRows = document.querySelectorAll('#ticket-list-body tr:not(.no-tickets-row)');
  
  if (!ticketRows.length) return;
  
  const status = statusFilter ? statusFilter.value : 'all';
  const type = typeFilter ? typeFilter.value : 'all';
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  
  ticketRows.forEach(row => {
    let visible = true;
    
    // Filter by status
    if (status !== 'all' && row.dataset.status !== status) {
      visible = false;
    }
    
    // Filter by type
    if (type !== 'all' && row.dataset.type !== type) {
      visible = false;
    }
    
    // Filter by search term
    if (search && !row.textContent.toLowerCase().includes(search)) {
      visible = false;
    }
    
    // Toggle visibility
    row.style.display = visible ? '' : 'none';
  });
  
  // Show "no results" message if all rows are hidden
  const visibleRows = Array.from(ticketRows).filter(row => row.style.display !== 'none');
  const noTicketsRow = document.querySelector('.no-tickets-row');
  
  if (visibleRows.length === 0 && !noTicketsRow) {
    const ticketListBody = document.getElementById('ticket-list-body');
    if (ticketListBody) {
      const noResultsRow = document.createElement('tr');
      noResultsRow.className = 'no-tickets-row';
      noResultsRow.innerHTML = `
        <td colspan="6" class="text-center">No tickets match your filters.</td>
      `;
      ticketListBody.appendChild(noResultsRow);
    }
  } else if (visibleRows.length > 0 && noTicketsRow) {
    noTicketsRow.remove();
  }
}

/**
 * Populate channel dropdowns
 */
function populateChannelDropdowns(channels, categories) {
  // Populate category dropdown
  const categorySelect = document.getElementById('category-id');
  if (categorySelect) {
    // Clear options (except the first one)
    while (categorySelect.options.length > 1) {
      categorySelect.remove(1);
    }
    
    // Add categories
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  }
  
  // Populate log channel dropdown
  const logChannelSelect = document.getElementById('log-channel-id');
  if (logChannelSelect) {
    // Clear options (except the first one)
    while (logChannelSelect.options.length > 1) {
      logChannelSelect.remove(1);
    }
    
    // Add channels
    channels.forEach(channel => {
      const option = document.createElement('option');
      option.value = channel.id;
      option.textContent = channel.name;
      logChannelSelect.appendChild(option);
    });
  }
  
  // Populate panel channel dropdown
  const panelChannelSelect = document.getElementById('panel-channel-id');
  if (panelChannelSelect) {
    // Clear options (except the first one)
    while (panelChannelSelect.options.length > 1) {
      panelChannelSelect.remove(1);
    }
    
    // Add channels
    channels.forEach(channel => {
      const option = document.createElement('option');
      option.value = channel.id;
      option.textContent = channel.name;
      panelChannelSelect.appendChild(option);
    });
  }
}

/**
 * Populate role dropdown
 */
function populateRoleDropdown(roles) {
  // Populate support role dropdown
  const roleSelect = document.getElementById('support-role-id');
  if (roleSelect) {
    // Clear options (except the first one)
    while (roleSelect.options.length > 1) {
      roleSelect.remove(1);
    }
    
    // Add roles
    roles.forEach(role => {
      const option = document.createElement('option');
      option.value = role.id;
      option.textContent = role.name;
      option.style.color = role.color;
      roleSelect.appendChild(option);
    });
  }
}

/**
 * Populate ticket configuration form
 */
function populateTicketConfig(config) {
  if (!config) return;
  
  // Fill in form fields
  const fields = [
    { id: 'category-id', value: config.categoryId },
    { id: 'support-role-id', value: config.supportRoleId },
    { id: 'log-channel-id', value: config.logChannelId },
    { id: 'max-tickets', value: config.maxTickets || 1 },
    { id: 'cooldown', value: config.cooldown || 60 },
    { id: 'inactive-hours', value: config.inactiveHours || 24 },
    { id: 'auto-close-message', value: config.autoCloseMessage },
    { id: 'welcome-message', value: config.welcomeMessage },
    { id: 'close-message', value: config.closeMessage }
  ];
  
  fields.forEach(field => {
    const element = document.getElementById(field.id);
    if (element) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.value = field.value || '';
      } else if (element.tagName === 'SELECT') {
        if (field.value) {
          element.value = field.value;
        }
      }
    }
  });
  
  // Set checkboxes
  const checkboxes = [
    { id: 'auto-transcript', checked: config.autoTranscript },
    { id: 'auto-close', checked: config.autoClose },
    { id: 'require-topic', checked: config.requireTopic },
    { id: 'use-threads', checked: config.useThreads }
  ];
  
  checkboxes.forEach(checkbox => {
    const element = document.getElementById(checkbox.id);
    if (element) {
      element.checked = !!checkbox.checked;
    }
  });
  
  // Show/hide auto-close settings
  handleAutoCloseToggle();
}

/**
 * Reset ticket configuration form to defaults
 */
function resetTicketSettings() {
  // Reset form fields
  const settingsForm = document.getElementById('ticket-settings-form');
  if (settingsForm) {
    settingsForm.reset();
  }
  
  // Reset number inputs
  document.getElementById('max-tickets').value = 1;
  document.getElementById('cooldown').value = 60;
  document.getElementById('inactive-hours').value = 24;
  
  // Reset text areas
  document.getElementById('auto-close-message').value = 'This ticket has been automatically closed due to inactivity.';
  document.getElementById('welcome-message').value = 'Thanks for creating a ticket! The support team will assist you shortly. Please describe your issue in detail.';
  document.getElementById('close-message').value = 'This ticket is now closed. If you need further assistance, please open a new ticket.';
  
  // Reset checkboxes
  document.getElementById('auto-transcript').checked = false;
  document.getElementById('auto-close').checked = false;
  document.getElementById('require-topic').checked = false;
  document.getElementById('use-threads').checked = false;
  
  // Hide auto-close settings
  handleAutoCloseToggle();
}

/**
 * Save ticket configuration
 */
function saveTicketSettings() {
  const serverSelect = document.getElementById('server-select');
  if (!serverSelect || !serverSelect.value) {
    showError('Please select a server first.');
    return;
  }
  
  const serverId = serverSelect.value;
  
  // Create FormData from form
  const form = document.getElementById('ticket-settings-form');
  const formData = new FormData(form);
  
  // Convert to JSON
  const data = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });
  
  // Convert checkboxes
  data.autoTranscript = !!formData.get('autoTranscript');
  data.autoClose = !!formData.get('autoClose');
  data.requireTopic = !!formData.get('requireTopic');
  data.useThreads = !!formData.get('useThreads');
  
  // Send to API
  fetch(`/api/v2/servers/${serverId}/ticket-config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showSuccess('Ticket configuration saved successfully.');
    } else {
      showError('Failed to save configuration: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Error saving ticket configuration:', error);
    showError('Failed to save configuration. Please try again.');
  });
}

/**
 * Create a ticket panel
 */
function createTicketPanel() {
  const serverSelect = document.getElementById('server-select');
  if (!serverSelect || !serverSelect.value) {
    showError('Please select a server first.');
    return;
  }
  
  const serverId = serverSelect.value;
  
  // Get ticket types
  const ticketTypes = [];
  const ticketTypeRows = document.querySelectorAll('.ticket-type-row');
  ticketTypeRows.forEach((row, index) => {
    const label = row.querySelector('.type-label').value;
    const emoji = row.querySelector('.type-emoji').value;
    const description = row.querySelector('.type-description').value;
    
    if (label && emoji) {
      ticketTypes.push({
        id: `type_${index}`,
        label,
        emoji,
        description: description || ''
      });
    }
  });
  
  // Create panel data
  const panelData = {
    channelId: document.getElementById('panel-channel-id').value,
    panelTitle: document.getElementById('panel-title').value,
    panelDescription: document.getElementById('panel-description').value,
    panelColor: document.getElementById('panel-color').value,
    panelImage: document.getElementById('panel-image').value,
    ticketTypes: JSON.stringify(ticketTypes)
  };
  
  // Validate required fields
  if (!panelData.channelId) {
    showError('Please select a channel to send the panel to.');
    return;
  }
  
  // Send to API
  fetch(`/api/v2/servers/${serverId}/ticket-panel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(panelData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showSuccess('Ticket panel created and sent to the channel.');
    } else {
      showError('Failed to create panel: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Error creating ticket panel:', error);
    showError('Failed to create panel. Please try again.');
  });
}

/**
 * View ticket details
 */
function viewTicketDetails(ticketId) {
  const serverSelect = document.getElementById('server-select');
  if (!serverSelect || !serverSelect.value) {
    showError('Server ID not found.');
    return;
  }
  
  const serverId = serverSelect.value;
  
  // Show loading state
  setLoadingState(true);
  
  // Get ticket details
  fetch(`/api/v2/servers/${serverId}/tickets/${ticketId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        displayTicketDetails(data.ticket);
        
        // Show modal
        $('#ticket-modal').modal('show');
      } else {
        showError('Failed to get ticket details: ' + data.message);
      }
      setLoadingState(false);
    })
    .catch(error => {
      console.error('Error getting ticket details:', error);
      showError('Failed to get ticket details. Please try again.');
      setLoadingState(false);
    });
}

/**
 * Display ticket details in modal
 */
function displayTicketDetails(ticket) {
  // Set ticket data in modal
  document.getElementById('modal-ticket-id').textContent = ticket.id;
  document.getElementById('modal-ticket-user').textContent = ticket.creator ? ticket.creator.username : 'Unknown';
  document.getElementById('modal-ticket-type').textContent = ticket.type || 'General';
  
  // Format creation date
  const createdDate = new Date(ticket.createdAt);
  document.getElementById('modal-ticket-created').textContent = `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`;
  
  // Set status badge
  const statusEl = document.getElementById('modal-ticket-status');
  statusEl.textContent = ticket.status;
  statusEl.className = `badge status-${ticket.status.toLowerCase()}`;
  
  // Set channel ID
  document.getElementById('modal-ticket-channel').textContent = ticket.channelId;
  
  // Set ticket content
  document.getElementById('modal-ticket-content').innerHTML = ticket.content || 'No content available.';
  
  // Set transcript preview
  document.getElementById('modal-transcript-preview').innerHTML = 'Loading transcript...';
  
  // Load transcript preview
  fetchTranscriptPreview(ticket.id);
  
  // Set ticket ID for modal action buttons
  document.getElementById('download-transcript').dataset.ticketId = ticket.id;
  document.getElementById('close-ticket').dataset.ticketId = ticket.id;
  
  // Hide close button if ticket is already closed
  document.getElementById('close-ticket').style.display = 
    ticket.status.toLowerCase() === 'closed' ? 'none' : 'inline-block';
}

/**
 * Fetch transcript preview
 */
function fetchTranscriptPreview(ticketId) {
  const serverSelect = document.getElementById('server-select');
  if (!serverSelect || !serverSelect.value) {
    document.getElementById('modal-transcript-preview').innerHTML = 'Server ID not found.';
    return;
  }
  
  const serverId = serverSelect.value;
  
  // Get transcript
  fetch(`/api/v2/servers/${serverId}/tickets/${ticketId}/transcript`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Display preview of transcript
        const transcriptPreview = document.getElementById('modal-transcript-preview');
        
        if (data.transcript && data.transcript.content) {
          // Show a preview of the transcript content
          const previewContent = data.transcript.content.substring(0, 300);
          transcriptPreview.innerHTML = `${previewContent}...<br><em>(Partial preview - download for full transcript)</em>`;
        } else {
          transcriptPreview.innerHTML = 'No transcript available for this ticket.';
        }
      } else {
        document.getElementById('modal-transcript-preview').innerHTML = 'Failed to load transcript: ' + data.message;
      }
    })
    .catch(error => {
      console.error('Error getting transcript preview:', error);
      document.getElementById('modal-transcript-preview').innerHTML = 'Failed to load transcript. Please try again.';
    });
}

/**
 * Show close ticket confirmation modal
 */
function showCloseTicketModal(ticketId) {
  // Set ticket ID in close form
  document.getElementById('confirm-close-ticket').dataset.ticketId = ticketId;
  
  // Clear previous reason
  document.getElementById('close-reason').value = '';
  
  // Show modal
  $('#close-ticket-modal').modal('show');
}

/**
 * Close a ticket
 */
function closeTicket() {
  const ticketId = this.dataset.ticketId;
  if (!ticketId) {
    showError('Ticket ID not found.');
    return;
  }
  
  const serverSelect = document.getElementById('server-select');
  if (!serverSelect || !serverSelect.value) {
    showError('Server ID not found.');
    return;
  }
  
  const serverId = serverSelect.value;
  const reason = document.getElementById('close-reason').value;
  
  // Show loading state
  setLoadingState(true);
  
  // Close ticket
  fetch(`/api/v2/servers/${serverId}/tickets/${ticketId}/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showSuccess('Ticket closed successfully.');
        
        // Hide close modal
        $('#close-ticket-modal').modal('hide');
        
        // Update UI
        refreshTickets(serverId);
      } else {
        showError('Failed to close ticket: ' + data.message);
      }
      setLoadingState(false);
    })
    .catch(error => {
      console.error('Error closing ticket:', error);
      showError('Failed to close ticket. Please try again.');
      setLoadingState(false);
    });
}

/**
 * Download transcript for a ticket
 */
function downloadTranscript(ticketId) {
  const serverSelect = document.getElementById('server-select');
  if (!serverSelect || !serverSelect.value) {
    showError('Server ID not found.');
    return;
  }
  
  const serverId = serverSelect.value;
  
  // Create download link
  const downloadLink = document.createElement('a');
  downloadLink.href = `/api/v2/servers/${serverId}/tickets/${ticketId}/transcript/download`;
  downloadLink.target = '_blank';
  downloadLink.download = `transcript-${ticketId}.html`;
  
  // Append link and trigger click
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

/**
 * Refresh tickets for a server
 */
function refreshTickets(serverId) {
  if (!serverId) {
    const serverSelect = document.getElementById('server-select');
    if (!serverSelect || !serverSelect.value) {
      return;
    }
    serverId = serverSelect.value;
  }
  
  // Load tickets
  loadTickets(serverId);
}

/**
 * Set loading state
 */
function setLoadingState(isLoading) {
  // Add loading indicator if needed
  if (isLoading) {
    document.body.classList.add('loading');
  } else {
    document.body.classList.remove('loading');
  }
}

/**
 * Show success message
 */
function showSuccess(message) {
  // Create success alert if it doesn't exist
  if (!document.querySelector('.alert-success')) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    alert.style.maxWidth = '400px';
    
    document.body.appendChild(alert);
  }
  
  // Set message and show
  const alert = document.querySelector('.alert-success');
  alert.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  alert.style.display = 'block';
  
  // Hide after delay
  setTimeout(() => {
    alert.style.display = 'none';
  }, 5000);
}

/**
 * Show error message
 */
function showError(message) {
  // Create error alert if it doesn't exist
  if (!document.querySelector('.alert-danger')) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    alert.style.maxWidth = '400px';
    
    document.body.appendChild(alert);
  }
  
  // Set message and show
  const alert = document.querySelector('.alert-danger');
  alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  alert.style.display = 'block';
  
  // Hide after delay
  setTimeout(() => {
    alert.style.display = 'none';
  }, 5000);
}

console.log('Fix-select script loaded');

// Apply fix to all select elements
document.addEventListener('DOMContentLoaded', function() {
  const selects = document.querySelectorAll('select');
  selects.forEach(fixSelect);
});