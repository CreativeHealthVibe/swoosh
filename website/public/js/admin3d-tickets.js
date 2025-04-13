/**
 * Admin 3D Dashboard - Ticket Management
 * Premium edition with advanced ticket features
 */

// Store the currently selected server and data
let currentServerId = '';
let serverChannels = [];
let serverCategories = [];
let serverRoles = [];
let tickets = [];
let ticketConfig = null;

// DOM Elements
const serverSelect = document.getElementById('server-select');
const ticketSection = document.getElementById('ticket-section');
const totalTicketsEl = document.getElementById('total-tickets');
const openTicketsEl = document.getElementById('open-tickets');
const closedTicketsEl = document.getElementById('closed-tickets');
const avgResponseTimeEl = document.getElementById('avg-response-time');
const ticketsList = document.getElementById('tickets-list');
const ticketStatusFilter = document.getElementById('ticket-status-filter');
const refreshTicketsButton = document.getElementById('refresh-tickets');
const categoryIdSelect = document.getElementById('category-id');
const supportRoleIdSelect = document.getElementById('support-role-id');
const logChannelIdSelect = document.getElementById('log-channel-id');
const panelChannelSelect = document.getElementById('panel-channel');
const ticketConfigForm = document.getElementById('ticket-config-form');
const ticketPanelForm = document.getElementById('ticket-panel-form');
const autoCloseCheckbox = document.getElementById('auto-close');
const autoCloseOptions = document.getElementById('auto-close-options');

// Modals
const ticketInfoModal = document.getElementById('ticket-info-modal');
const closeTicketModal = document.getElementById('close-ticket-modal');

/**
 * Initialize the tickets page
 */
function initTicketsPage() {
  console.log('Initializing tickets page...');
  
  // Load server list first
  loadServerList();
  
  // Set up server selection
  if (serverSelect) {
    serverSelect.addEventListener('change', handleServerChange);
  }
  
  // Set up ticket status filter
  if (ticketStatusFilter) {
    ticketStatusFilter.addEventListener('change', filterTickets);
  }
  
  // Set up refresh button
  if (refreshTicketsButton) {
    refreshTicketsButton.addEventListener('click', () => loadTickets());
  }
  
  // Set up auto-close checkbox
  if (autoCloseCheckbox) {
    autoCloseCheckbox.addEventListener('change', () => {
      autoCloseOptions.style.display = autoCloseCheckbox.checked ? 'block' : 'none';
    });
  }
  
  // Set up ticket config form
  if (ticketConfigForm) {
    ticketConfigForm.addEventListener('submit', handleSaveConfig);
  }
  
  // Set up ticket panel form
  if (ticketPanelForm) {
    ticketPanelForm.addEventListener('submit', handleSendPanel);
  }
  
  // Set up modal close buttons
  document.querySelectorAll('.modal-close, [data-action="close-modal"], [data-action="cancel"]').forEach(button => {
    button.addEventListener('click', closeAllModals);
  });
  
  // Set up close ticket button
  const closeTicketButton = document.querySelector('[data-action="close-ticket"]');
  if (closeTicketButton) {
    closeTicketButton.addEventListener('click', () => {
      const ticketId = ticketInfoModal.getAttribute('data-ticket-id');
      if (ticketId) {
        openCloseTicketModal(ticketId);
      }
    });
  }
  
  // Set up download transcript button
  const downloadTranscriptButton = document.querySelector('[data-action="download-transcript"]');
  if (downloadTranscriptButton) {
    downloadTranscriptButton.addEventListener('click', () => {
      const ticketId = ticketInfoModal.getAttribute('data-ticket-id');
      if (ticketId) {
        downloadTranscript(ticketId);
      }
    });
  }
  
  // Set up confirm close button
  const confirmCloseButton = document.querySelector('[data-action="confirm-close"]');
  if (confirmCloseButton) {
    confirmCloseButton.addEventListener('click', handleCloseTicket);
  }
}

/**
 * Initialize the server select dropdown
 * The server list is already populated through EJS in the HTML template
 */
function loadServerList() {
  console.log('Initializing server select dropdown...');
  
  // Check if dropdown has options and is properly populated
  if (serverSelect) {
    // Get number of options
    const optionCount = serverSelect.options.length;
    console.log(`Server select has ${optionCount} options`);
    
    // If we only have the default "Select a server" option, show error
    if (optionCount <= 1) {
      console.error('No servers found in server select dropdown');
      serverSelect.innerHTML = '<option value="" disabled selected>No servers found</option>';
      createNotification('warning', 'No Servers', 'No Discord servers were found. Make sure the bot is invited to your servers.');
    }
  } else {
    console.error('Server select element not found');
  }
}

/**
 * Handle server selection change
 */
async function handleServerChange() {
  console.log('Server selection changed!');
  const serverId = serverSelect.value;
  
  console.log('Selected server ID:', serverId);
  
  if (!serverId) {
    console.log('No server selected, hiding ticket section');
    ticketSection.style.display = 'none';
    return;
  }
  
  currentServerId = serverId;
  console.log('Current server ID set to:', currentServerId);
  ticketSection.style.display = 'block';
  
  console.log('Loading server data, tickets, and ticket configuration...');
  
  try {
    // Load server data
    await Promise.all([
      loadServerData(),
      loadTickets(),
      loadTicketConfig()
    ]);
    console.log('Server data loaded successfully');
  } catch (error) {
    console.error('Error loading server data:', error);
    createNotification('error', 'Error', 'Failed to load server data: ' + error.message);
  }
}

/**
 * Load server data (channels, categories, roles)
 */
async function loadServerData() {
  if (!currentServerId) return;
  
  try {
    // Fetch channels and categories
    const channelsResponse = await fetch(`/api/v2/servers/${currentServerId}/channels`);
    const channelsData = await channelsResponse.json();
    
    if (!channelsData.success) {
      throw new Error(channelsData.message || 'Failed to load channels');
    }
    
    // Store channels and categories
    serverChannels = channelsData.channels || [];
    serverCategories = channelsData.categories || [];
    
    // Fetch roles
    const rolesResponse = await fetch(`/api/v2/servers/${currentServerId}/roles`);
    const rolesData = await rolesResponse.json();
    
    if (!rolesData.success) {
      throw new Error(rolesData.message || 'Failed to load roles');
    }
    
    // Store roles
    serverRoles = rolesData.roles || [];
    
    // Populate dropdowns
    populateChannelSelect(logChannelIdSelect, serverChannels);
    populateChannelSelect(panelChannelSelect, serverChannels);
    populateCategorySelect(categoryIdSelect, serverCategories);
    populateRoleSelect(supportRoleIdSelect, serverRoles);
  } catch (error) {
    console.error('Error loading server data:', error);
    createNotification('error', 'Error', `Failed to load server data: ${error.message}`);
  }
}

/**
 * Load tickets for the selected server
 */
async function loadTickets() {
  if (!currentServerId) return;
  
  // Show loading state
  ticketsList.innerHTML = `
    <div class="tickets-loading">
      <div class="spinner"></div>
      <p>Loading tickets...</p>
    </div>
  `;
  
  // Reset analytics
  totalTicketsEl.textContent = '0';
  openTicketsEl.textContent = '0';
  closedTicketsEl.textContent = '0';
  avgResponseTimeEl.textContent = '--';
  
  try {
    // Fetch tickets from API
    const response = await fetch(`/api/v2/servers/${currentServerId}/tickets`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load tickets');
    }
    
    // Store tickets
    tickets = data.tickets || [];
    
    // Update analytics
    if (data.stats) {
      totalTicketsEl.textContent = data.stats.total || '0';
      openTicketsEl.textContent = data.stats.open || '0';
      closedTicketsEl.textContent = data.stats.closed || '0';
      
      if (data.stats.avgResponseTime) {
        avgResponseTimeEl.textContent = formatDuration(data.stats.avgResponseTime);
      } else {
        avgResponseTimeEl.textContent = '--';
      }
    }
    
    // Render tickets
    renderTickets();
  } catch (error) {
    console.error('Error loading tickets:', error);
    ticketsList.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading tickets: ${error.message}</p>
      </div>
    `;
    createNotification('error', 'Error', `Failed to load tickets: ${error.message}`);
  }
}

/**
 * Load ticket configuration for the selected server
 */
async function loadTicketConfig() {
  if (!currentServerId) return;
  
  try {
    // Fetch ticket config from API
    const response = await fetch(`/api/v2/servers/${currentServerId}/ticket-config`);
    const data = await response.json();
    
    if (!data.success) {
      // If no config found, don't show error
      if (data.code === 'CONFIG_NOT_FOUND') {
        ticketConfig = null;
        resetConfigForm();
        return;
      }
      
      throw new Error(data.message || 'Failed to load ticket configuration');
    }
    
    // Store config
    ticketConfig = data.config || null;
    
    // Update form
    if (ticketConfig) {
      updateConfigForm(ticketConfig);
    } else {
      resetConfigForm();
    }
  } catch (error) {
    console.error('Error loading ticket configuration:', error);
    createNotification('error', 'Error', `Failed to load ticket configuration: ${error.message}`);
  }
}

/**
 * Render tickets list
 */
function renderTickets() {
  if (!tickets || tickets.length === 0) {
    ticketsList.innerHTML = '<p class="empty-message">No tickets found for this server</p>';
    return;
  }
  
  // Apply current filter
  filterTickets();
}

/**
 * Filter tickets based on status
 */
function filterTickets() {
  const filterValue = ticketStatusFilter.value;
  
  // Clear the list
  ticketsList.innerHTML = '';
  
  // Filter tickets
  let filteredTickets = tickets;
  if (filterValue !== 'all') {
    filteredTickets = tickets.filter(ticket => ticket.status.toLowerCase() === filterValue.toLowerCase());
  }
  
  if (filteredTickets.length === 0) {
    ticketsList.innerHTML = '<p class="empty-message">No tickets match the selected filter</p>';
    return;
  }
  
  // Sort tickets (newest first)
  filteredTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Render each ticket
  filteredTickets.forEach(ticket => {
    const ticketItem = document.createElement('div');
    ticketItem.className = 'ticket-item';
    
    // Format date
    const date = new Date(ticket.createdAt);
    const dateFormatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    // Create avatar element
    const avatar = ticket.user && ticket.user.avatar ? 
      `<img src="${ticket.user.avatar}" alt="${escapeHTML(ticket.user.username)}">` : 
      `<i class="fas fa-user"></i>`;
    
    ticketItem.innerHTML = `
      <div class="ticket-id">${escapeHTML(ticket.id || `#${ticket.number}`)}</div>
      <div class="ticket-user">
        <div class="ticket-user-avatar">
          ${avatar}
        </div>
        <div class="ticket-user-details">
          <div class="ticket-user-name">${escapeHTML(ticket.user ? ticket.user.username : 'Unknown User')}</div>
          <div class="ticket-user-id">${ticket.user ? ticket.user.id : 'Unknown'}</div>
        </div>
      </div>
      <div class="ticket-topic">${escapeHTML(ticket.topic || 'No topic')}</div>
      <div class="ticket-status ${ticket.status.toLowerCase()}">${ticket.status}</div>
      <div class="ticket-created">${dateFormatted}</div>
      <div class="ticket-actions">
        <button class="admin3d-btn admin3d-btn-sm admin3d-btn-info" data-action="view-ticket" data-ticket-id="${ticket.id}">
          <i class="fas fa-eye"></i>
        </button>
        ${ticket.status.toLowerCase() === 'open' ? `
          <button class="admin3d-btn admin3d-btn-sm admin3d-btn-danger" data-action="close-ticket" data-ticket-id="${ticket.id}">
            <i class="fas fa-times"></i>
          </button>
        ` : ''}
      </div>
    `;
    
    // Add event listeners
    const viewButton = ticketItem.querySelector('[data-action="view-ticket"]');
    if (viewButton) {
      viewButton.addEventListener('click', () => {
        const ticketId = viewButton.getAttribute('data-ticket-id');
        openTicketInfoModal(ticketId);
      });
    }
    
    const closeButton = ticketItem.querySelector('[data-action="close-ticket"]');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        const ticketId = closeButton.getAttribute('data-ticket-id');
        openCloseTicketModal(ticketId);
      });
    }
    
    ticketsList.appendChild(ticketItem);
  });
}

/**
 * Update config form with values from config
 * @param {Object} config - Ticket configuration
 */
function updateConfigForm(config) {
  if (!config) return;
  
  // Basic settings
  if (config.categoryId) {
    document.getElementById('category-id').value = config.categoryId;
  }
  
  if (config.supportRoleId) {
    document.getElementById('support-role-id').value = config.supportRoleId;
  }
  
  if (config.logChannelId) {
    document.getElementById('log-channel-id').value = config.logChannelId;
  }
  
  if (config.maxTickets) {
    document.getElementById('max-tickets').value = config.maxTickets;
  }
  
  if (config.cooldown !== undefined) {
    document.getElementById('cooldown').value = config.cooldown;
  }
  
  // Advanced settings
  document.getElementById('auto-transcript').checked = config.autoTranscript !== false;
  document.getElementById('auto-close').checked = !!config.autoClose;
  document.getElementById('require-topic').checked = config.requireTopic !== false;
  document.getElementById('use-threads').checked = !!config.useThreads;
  
  autoCloseOptions.style.display = !!config.autoClose ? 'block' : 'none';
  
  if (config.inactiveHours) {
    document.getElementById('inactive-hours').value = config.inactiveHours;
  }
  
  if (config.autoCloseMessage) {
    document.getElementById('auto-close-message').value = config.autoCloseMessage;
  }
  
  // Messages
  if (config.welcomeMessage) {
    document.getElementById('welcome-message').value = config.welcomeMessage;
  }
  
  if (config.closeMessage) {
    document.getElementById('close-message').value = config.closeMessage;
  }
}

/**
 * Reset config form to default values
 */
function resetConfigForm() {
  // Reset dropdowns
  document.getElementById('category-id').value = '';
  document.getElementById('support-role-id').value = '';
  document.getElementById('log-channel-id').value = '';
  
  // Reset inputs
  document.getElementById('max-tickets').value = '1';
  document.getElementById('cooldown').value = '5';
  
  // Reset checkboxes
  document.getElementById('auto-transcript').checked = true;
  document.getElementById('auto-close').checked = false;
  document.getElementById('require-topic').checked = true;
  document.getElementById('use-threads').checked = false;
  
  // Hide auto-close options
  autoCloseOptions.style.display = 'none';
  
  // Reset auto-close options
  document.getElementById('inactive-hours').value = '24';
  document.getElementById('auto-close-message').value = '';
  
  // Reset messages
  document.getElementById('welcome-message').value = '';
  document.getElementById('close-message').value = '';
}

/**
 * Open ticket info modal
 * @param {string} ticketId - Ticket ID
 */
async function openTicketInfoModal(ticketId) {
  // Find ticket in list
  const ticket = tickets.find(t => t.id === ticketId);
  
  if (!ticket) {
    createNotification('error', 'Error', 'Ticket not found');
    return;
  }
  
  // Set ticket ID
  ticketInfoModal.setAttribute('data-ticket-id', ticketId);
  
  // Update modal content
  const avatar = ticket.user && ticket.user.avatar ? 
    `<img src="${ticket.user.avatar}" alt="${escapeHTML(ticket.user.username)}">` : 
    `<i class="fas fa-user"></i>`;
  
  document.getElementById('ticket-info-avatar').innerHTML = avatar;
  document.getElementById('ticket-info-name').textContent = ticket.user ? ticket.user.username : 'Unknown User';
  document.getElementById('ticket-info-id').textContent = ticket.user ? ticket.user.id : 'Unknown';
  
  const statusEl = document.getElementById('ticket-info-status');
  statusEl.textContent = ticket.status;
  statusEl.className = `ticket-status-badge ${ticket.status.toLowerCase()}`;
  
  document.getElementById('ticket-info-ticket-id').textContent = ticket.id || `#${ticket.number}`;
  
  // Format date
  const date = new Date(ticket.createdAt);
  const dateFormatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  document.getElementById('ticket-info-created').textContent = dateFormatted;
  
  document.getElementById('ticket-info-topic').textContent = ticket.topic || 'No topic';
  document.getElementById('ticket-info-channel').textContent = ticket.channelName ? `#${ticket.channelName}` : ticket.channelId || 'Unknown';
  
  // Load messages
  const messagesContainer = document.getElementById('ticket-messages');
  messagesContainer.innerHTML = `
    <div class="ticket-messages-loading">
      <div class="spinner"></div>
      <p>Loading messages...</p>
    </div>
  `;
  
  try {
    const response = await fetch(`/api/v2/servers/${currentServerId}/tickets/${ticketId}/transcript-preview`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load messages');
    }
    
    const messages = data.messages || [];
    
    if (messages.length === 0) {
      messagesContainer.innerHTML = '<p class="empty-message">No messages found</p>';
    } else {
      messagesContainer.innerHTML = '';
      
      // Render each message
      messages.forEach(message => {
        const messageEl = document.createElement('div');
        messageEl.className = `ticket-message ${message.author.isBot ? 'ticket-message-bot' : ''}`;
        
        // Format date
        const date = new Date(message.timestamp);
        const timeFormatted = date.toLocaleTimeString();
        
        // Create avatar element
        const avatar = message.author.avatar ? 
          `<img src="${message.author.avatar}" alt="${escapeHTML(message.author.username)}">` : 
          `<i class="fas fa-user"></i>`;
        
        messageEl.innerHTML = `
          <div class="ticket-message-avatar">
            ${avatar}
          </div>
          <div class="ticket-message-content">
            <div class="ticket-message-header">
              <span class="ticket-message-author">${escapeHTML(message.author.username)}</span>
              <span class="ticket-message-time">${timeFormatted}</span>
            </div>
            <div class="ticket-message-text">${escapeHTML(message.content)}</div>
          </div>
        `;
        
        messagesContainer.appendChild(messageEl);
      });
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    messagesContainer.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading messages: ${error.message}</p>
      </div>
    `;
  }
  
  // Show modal
  ticketInfoModal.classList.add('active');
}

/**
 * Open close ticket modal
 * @param {string} ticketId - Ticket ID
 */
function openCloseTicketModal(ticketId) {
  // Find ticket in list
  const ticket = tickets.find(t => t.id === ticketId);
  
  if (!ticket) {
    createNotification('error', 'Error', 'Ticket not found');
    return;
  }
  
  // Set ticket ID
  closeTicketModal.setAttribute('data-ticket-id', ticketId);
  
  // Update modal content
  document.getElementById('close-ticket-name').textContent = ticket.user ? ticket.user.username : 'Unknown User';
  document.getElementById('close-ticket-id').textContent = ticket.id || `#${ticket.number}`;
  
  // Show modal
  closeTicketModal.classList.add('active');
}

/**
 * Handle close ticket confirmation
 */
async function handleCloseTicket() {
  const ticketId = closeTicketModal.getAttribute('data-ticket-id');
  
  if (!ticketId) {
    createNotification('error', 'Error', 'Invalid ticket ID');
    return;
  }
  
  // Get reason
  const reason = document.getElementById('close-reason').value;
  
  // Disable button to prevent multiple submissions
  const confirmButton = document.querySelector('[data-action="confirm-close"]');
  confirmButton.disabled = true;
  confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Closing...';
  
  try {
    // Submit close request
    const response = await fetch(`/api/v2/servers/${currentServerId}/tickets/${ticketId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to close ticket');
    }
    
    // Show success notification
    createNotification('success', 'Success', 'Ticket closed successfully');
    
    // Close modal
    closeAllModals();
    
    // Reload tickets
    loadTickets();
  } catch (error) {
    console.error('Error closing ticket:', error);
    createNotification('error', 'Error', `Failed to close ticket: ${error.message}`);
  } finally {
    // Re-enable button
    confirmButton.disabled = false;
    confirmButton.innerHTML = 'Close Ticket';
  }
}

/**
 * Handle save ticket configuration
 * @param {Event} event - Form submit event
 */
async function handleSaveConfig(event) {
  event.preventDefault();
  
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  // Disable submit button
  const submitButton = event.target.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  
  try {
    // Gather form data
    const formData = new FormData(event.target);
    const config = {
      categoryId: formData.get('category-id'),
      supportRoleId: formData.get('support-role-id'),
      logChannelId: formData.get('log-channel-id'),
      maxTickets: parseInt(formData.get('max-tickets'), 10),
      cooldown: parseInt(formData.get('cooldown'), 10),
      autoTranscript: formData.get('auto-transcript') === 'on',
      autoClose: formData.get('auto-close') === 'on',
      requireTopic: formData.get('require-topic') === 'on',
      useThreads: formData.get('use-threads') === 'on',
      inactiveHours: parseInt(formData.get('inactive-hours'), 10),
      autoCloseMessage: formData.get('auto-close-message'),
      welcomeMessage: formData.get('welcome-message'),
      closeMessage: formData.get('close-message')
    };
    
    // Submit config
    const response = await fetch(`/api/v2/servers/${currentServerId}/ticket-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to save ticket configuration');
    }
    
    // Update stored config
    ticketConfig = data.config;
    
    // Show success notification
    createNotification('success', 'Success', 'Ticket configuration saved successfully');
  } catch (error) {
    console.error('Error saving ticket configuration:', error);
    createNotification('error', 'Error', `Failed to save ticket configuration: ${error.message}`);
  } finally {
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.innerHTML = 'Save Configuration';
  }
}

/**
 * Handle send ticket panel
 * @param {Event} event - Form submit event
 */
async function handleSendPanel(event) {
  event.preventDefault();
  
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  // Disable submit button
  const submitButton = event.target.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  
  try {
    // Gather form data
    const formData = new FormData(event.target);
    const panelData = {
      channelId: formData.get('panel-channel'),
      title: formData.get('panel-title'),
      description: formData.get('panel-description'),
      buttonLabel: formData.get('panel-button-label')
    };
    
    // Submit panel
    const response = await fetch(`/api/v2/servers/${currentServerId}/ticket-panel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(panelData)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to send ticket panel');
    }
    
    // Show success notification
    createNotification('success', 'Success', 'Ticket panel sent successfully');
    
    // Reset form
    event.target.reset();
  } catch (error) {
    console.error('Error sending ticket panel:', error);
    createNotification('error', 'Error', `Failed to send ticket panel: ${error.message}`);
  } finally {
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.innerHTML = 'Send Panel';
  }
}

/**
 * Download ticket transcript
 * @param {string} ticketId - Ticket ID
 */
function downloadTranscript(ticketId) {
  if (!currentServerId || !ticketId) {
    createNotification('error', 'Error', 'Invalid server or ticket ID');
    return;
  }
  
  // Create link and click it
  const link = document.createElement('a');
  link.href = `/api/v2/servers/${currentServerId}/tickets/${ticketId}/transcript-download`;
  link.download = `ticket-${ticketId}.html`;
  link.click();
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
 * Populate channel select dropdown
 * @param {HTMLElement} selectEl - Select element
 * @param {Array} channels - Channels list
 */
function populateChannelSelect(selectEl, channels) {
  if (!selectEl) return;
  
  // Clear dropdown
  selectEl.innerHTML = '<option value="" disabled selected>Select a channel</option>';
  
  // Sort channels
  const sortedChannels = [...channels].sort((a, b) => {
    // Sort by category first
    if (a.parentId !== b.parentId) {
      return a.parentId ? (b.parentId ? 0 : -1) : 1;
    }
    
    // Then sort by position
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    
    // Finally sort by name
    return a.name.localeCompare(b.name);
  });
  
  // Add channels to dropdown
  sortedChannels.forEach(channel => {
    if (channel.type === 0) { // Text channel
      const option = document.createElement('option');
      option.value = channel.id;
      
      // Add category name if available
      const category = serverCategories.find(c => c.id === channel.parentId);
      option.textContent = category ? `${category.name} / #${channel.name}` : `#${channel.name}`;
      
      selectEl.appendChild(option);
    }
  });
}

/**
 * Populate category select dropdown
 * @param {HTMLElement} selectEl - Select element
 * @param {Array} categories - Categories list
 */
function populateCategorySelect(selectEl, categories) {
  if (!selectEl) return;
  
  // Clear dropdown
  selectEl.innerHTML = '<option value="" disabled selected>Select a category</option>';
  
  // Sort categories by position
  const sortedCategories = [...categories].sort((a, b) => a.position - b.position);
  
  // Add categories to dropdown
  sortedCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    selectEl.appendChild(option);
  });
}

/**
 * Populate role select dropdown
 * @param {HTMLElement} selectEl - Select element
 * @param {Array} roles - Roles list
 */
function populateRoleSelect(selectEl, roles) {
  if (!selectEl) return;
  
  // Clear dropdown
  selectEl.innerHTML = '<option value="" disabled selected>Select a role</option>';
  
  // Sort roles by position (highest first)
  const sortedRoles = [...roles].sort((a, b) => b.position - a.position);
  
  // Add roles to dropdown
  sortedRoles.forEach(role => {
    if (!role.managed && role.id !== currentServerId) { // Skip managed roles and @everyone
      const option = document.createElement('option');
      option.value = role.id;
      option.textContent = role.name;
      
      // Add color indicator
      if (role.color) {
        const colorHex = role.color.toString(16).padStart(6, '0');
        option.style.backgroundColor = `#${colorHex}20`; // 20 = 12.5% opacity
        option.style.color = `#${colorHex}`;
        option.style.fontWeight = 'bold';
      }
      
      selectEl.appendChild(option);
    }
  });
}

/**
 * Create a notification toast
 * @param {string} type - Notification type (success, error, info, warning)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
function createNotification(type, title, message) {
  // Create container if it doesn't exist
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
  }
  
  // Create notification
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Generate unique ID
  const id = `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  notification.id = id;
  
  // Set content
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas ${getIconForType(type)}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close" onclick="document.getElementById('${id}').remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add to container
  container.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.classList.add('active');
  }, 10);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.getElementById(id)) {
      notification.classList.remove('active');
      setTimeout(() => {
        if (document.getElementById(id)) {
          document.getElementById(id).remove();
        }
      }, 300);
    }
  }, 5000);
}

/**
 * Get icon for notification type
 * @param {string} type - Notification type
 * @returns {string} - Icon class
 */
function getIconForType(type) {
  switch (type) {
    case 'success':
      return 'fa-check-circle';
    case 'error':
      return 'fa-exclamation-circle';
    case 'warning':
      return 'fa-exclamation-triangle';
    case 'info':
    default:
      return 'fa-info-circle';
  }
}

/**
 * Format duration in seconds to a readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  } else {
    const days = Math.floor(seconds / 86400);
    return `${days}d`;
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
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize tickets page when DOM is ready
document.addEventListener('DOMContentLoaded', initTicketsPage);