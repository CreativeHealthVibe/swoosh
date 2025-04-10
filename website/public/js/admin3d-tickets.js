/**
 * Admin 3D Dashboard - Ticket Management
 * Premium edition with advanced ticket management features
 */

// Store the currently selected server and ticket data
let currentServerId = '';
let ticketData = {
  tickets: [],
  stats: {
    total: 0,
    open: 0,
    closed: 0,
    avgResponseTime: 0
  }
};

// DOM Elements
const serverSelect = document.getElementById('server-select');
const ticketManagementSection = document.getElementById('ticket-management-section');
const ticketsList = document.getElementById('tickets-list');
const ticketCategory = document.getElementById('ticket-category');
const logChannel = document.getElementById('log-channel');
const panelChannel = document.getElementById('panel-channel');
const autoCloseCheckbox = document.getElementById('auto-close');
const inactivityTimeout = document.querySelector('.inactivity-timeout');
const ticketSetupForm = document.getElementById('ticket-setup-form');
const ticketPanelForm = document.getElementById('ticket-panel-form');
const ticketInfoModal = document.getElementById('ticket-info-modal');
const confirmModal = document.getElementById('confirm-modal');

// Stats elements
const totalTicketsElement = document.getElementById('total-tickets');
const openTicketsElement = document.getElementById('open-tickets');
const closedTicketsElement = document.getElementById('closed-tickets');
const avgResponseElement = document.getElementById('avg-response');
const ticketChartCanvas = document.getElementById('ticket-chart');

// Chart instance
let ticketChart = null;

/**
 * Initialize the tickets page
 */
function initTicketsPage() {
  // Set up server selection
  if (serverSelect) {
    serverSelect.addEventListener('change', handleServerChange);
  }
  
  // Auto-close checkbox
  if (autoCloseCheckbox) {
    autoCloseCheckbox.addEventListener('change', () => {
      inactivityTimeout.style.display = autoCloseCheckbox.checked ? 'block' : 'none';
    });
  }
  
  // Set up ticket setup form
  if (ticketSetupForm) {
    ticketSetupForm.addEventListener('submit', handleTicketSetup);
  }
  
  // Set up ticket panel form
  if (ticketPanelForm) {
    ticketPanelForm.addEventListener('submit', handleSendTicketPanel);
  }
  
  // Modal close buttons
  document.querySelectorAll('.modal-close, [data-action="cancel"]').forEach(button => {
    button.addEventListener('click', closeAllModals);
  });
  
  // Set up ticket action buttons
  document.getElementById('close-ticket-btn').addEventListener('click', () => {
    const ticketId = ticketInfoModal.getAttribute('data-ticket-id');
    if (ticketId) {
      openConfirmModal('close-ticket', ticketId);
    }
  });
  
  document.getElementById('download-transcript-btn').addEventListener('click', () => {
    const ticketId = ticketInfoModal.getAttribute('data-ticket-id');
    if (ticketId) {
      downloadTranscript(ticketId);
    }
  });
  
  document.getElementById('view-channel-btn').addEventListener('click', () => {
    const channelId = ticketInfoModal.getAttribute('data-channel-id');
    if (channelId) {
      window.open(`https://discord.com/channels/${currentServerId}/${channelId}`, '_blank');
    }
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
    ticketManagementSection.style.display = 'none';
    return;
  }
  
  currentServerId = serverId;
  ticketManagementSection.style.display = 'block';
  
  // Load server data
  await Promise.all([
    loadChannels(),
    loadTickets(),
    loadTicketConfig()
  ]);
  
  // Initialize chart
  initTicketChart();
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
    
    // Clear dropdown selects
    ticketCategory.innerHTML = '<option value="">Select a category</option>';
    logChannel.innerHTML = '<option value="">Select a channel</option>';
    panelChannel.innerHTML = '<option value="">Select a channel</option>';
    
    // Add categories to category select
    data.categories.sort((a, b) => a.position - b.position).forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      ticketCategory.appendChild(option);
    });
    
    // Add text channels to channel selects
    data.channels.sort((a, b) => a.position - b.position).forEach(channel => {
      // Add to log channel select
      const logOption = document.createElement('option');
      logOption.value = channel.id;
      logOption.textContent = `#${channel.name}`;
      logChannel.appendChild(logOption);
      
      // Add to panel channel select
      const panelOption = document.createElement('option');
      panelOption.value = channel.id;
      panelOption.textContent = `#${channel.name}`;
      panelChannel.appendChild(panelOption);
    });
  } catch (error) {
    console.error('Error loading channels:', error);
    createNotification('error', 'Error', `Failed to load channels: ${error.message}`);
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
  
  try {
    // Fetch tickets from API
    const response = await fetch(`/api/v2/servers/${currentServerId}/tickets`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load tickets');
    }
    
    // Store tickets and stats
    ticketData.tickets = data.tickets || [];
    ticketData.stats = data.stats || {
      total: 0,
      open: 0,
      closed: 0,
      avgResponseTime: 0
    };
    
    // Render tickets
    renderTicketsList();
    
    // Update stats
    updateTicketStats();
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
    // Fetch ticket configuration from API
    const response = await fetch(`/api/v2/servers/${currentServerId}/ticket-config`);
    const data = await response.json();
    
    if (!data.success) {
      // If no configuration exists, don't throw error
      if (data.code === 'CONFIG_NOT_FOUND') {
        return;
      }
      throw new Error(data.message || 'Failed to load ticket configuration');
    }
    
    // Populate form with config
    const config = data.config;
    
    if (config.categoryId) {
      ticketCategory.value = config.categoryId;
    }
    
    if (config.logChannelId) {
      logChannel.value = config.logChannelId;
    }
    
    if (config.welcomeMessage) {
      document.getElementById('welcome-message').value = config.welcomeMessage;
    }
    
    // Set checkboxes
    document.getElementById('enable-transcripts').checked = config.enableTranscripts || false;
    document.getElementById('auto-close').checked = config.autoClose || false;
    document.getElementById('user-close').checked = config.userClose || false;
    
    // Set inactivity timeout
    if (config.inactivityTime) {
      document.getElementById('inactivity-time').value = config.inactivityTime;
    }
    
    // Toggle inactivity timeout display
    inactivityTimeout.style.display = config.autoClose ? 'block' : 'none';
    
    // Set button color
    if (config.buttonColor) {
      document.querySelector(`input[name="buttonColor"][value="${config.buttonColor}"]`).checked = true;
    }
  } catch (error) {
    console.error('Error loading ticket configuration:', error);
    createNotification('error', 'Error', `Failed to load ticket configuration: ${error.message}`);
  }
}

/**
 * Render the tickets list
 */
function renderTicketsList() {
  if (!ticketData.tickets || !ticketData.tickets.length) {
    ticketsList.innerHTML = '<p class="empty-message">No tickets found for this server.</p>';
    return;
  }
  
  // Clear the list
  ticketsList.innerHTML = '';
  
  // Render each ticket
  ticketData.tickets.forEach(ticket => {
    const ticketItem = document.createElement('div');
    ticketItem.className = 'ticket-item';
    
    // Format created time
    const createdDate = new Date(ticket.createdAt);
    const createdFormatted = `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`;
    
    ticketItem.innerHTML = `
      <div class="ticket-id">${ticket.id}</div>
      <div class="ticket-creator">
        <div class="ticket-creator-avatar">
          ${ticket.creator.avatar ? 
            `<img src="${ticket.creator.avatar}" alt="${escapeHTML(ticket.creator.username)}">` : 
            `<i class="fas fa-user"></i>`}
        </div>
        <span>${escapeHTML(ticket.creator.username)}</span>
      </div>
      <div class="ticket-category">${escapeHTML(ticket.category || 'Support')}</div>
      <div class="ticket-created">${createdFormatted}</div>
      <div class="ticket-status ${ticket.status.toLowerCase()}">${ticket.status}</div>
      <div class="ticket-actions">
        <button class="admin3d-btn admin3d-btn-sm admin3d-btn-primary" data-action="view-ticket" data-ticket-id="${ticket.id}" data-channel-id="${ticket.channelId}">
          <i class="fas fa-eye"></i>
        </button>
        ${ticket.status === 'OPEN' ? `
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
        const channelId = viewButton.getAttribute('data-channel-id');
        openTicketInfoModal(ticketId, channelId);
      });
    }
    
    const closeButton = ticketItem.querySelector('[data-action="close-ticket"]');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        const ticketId = closeButton.getAttribute('data-ticket-id');
        openConfirmModal('close-ticket', ticketId);
      });
    }
    
    ticketsList.appendChild(ticketItem);
  });
}

/**
 * Update ticket statistics display
 */
function updateTicketStats() {
  const stats = ticketData.stats;
  
  // Update number displays
  totalTicketsElement.textContent = stats.total || 0;
  openTicketsElement.textContent = stats.open || 0;
  closedTicketsElement.textContent = stats.closed || 0;
  
  // Format average response time
  if (stats.avgResponseTime) {
    const minutes = Math.floor(stats.avgResponseTime / 60);
    if (minutes < 60) {
      avgResponseElement.textContent = `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      avgResponseElement.textContent = `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  } else {
    avgResponseElement.textContent = 'N/A';
  }
  
  // Update chart if it exists
  if (ticketChart) {
    updateTicketChart();
  }
}

/**
 * Initialize the ticket statistics chart
 */
function initTicketChart() {
  if (!ticketChartCanvas) return;
  
  // If chart already exists, destroy it
  if (ticketChart) {
    ticketChart.destroy();
  }
  
  // Get ticket data by day
  const ticketsByDay = getTicketDataByDay();
  
  // Create chart
  const ctx = ticketChartCanvas.getContext('2d');
  ticketChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ticketsByDay.labels,
      datasets: [
        {
          label: 'Created',
          data: ticketsByDay.created,
          borderColor: 'rgba(88, 101, 242, 1)', // Discord blue
          backgroundColor: 'rgba(88, 101, 242, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Closed',
          data: ticketsByDay.closed,
          borderColor: 'rgba(237, 66, 69, 1)', // Discord red
          backgroundColor: 'rgba(237, 66, 69, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            precision: 0,
            color: 'rgba(255, 255, 255, 0.6)'
          }
        }
      }
    }
  });
}

/**
 * Update the ticket statistics chart
 */
function updateTicketChart() {
  if (!ticketChart) return;
  
  // Get ticket data by day
  const ticketsByDay = getTicketDataByDay();
  
  // Update chart data
  ticketChart.data.labels = ticketsByDay.labels;
  ticketChart.data.datasets[0].data = ticketsByDay.created;
  ticketChart.data.datasets[1].data = ticketsByDay.closed;
  
  // Update chart
  ticketChart.update();
}

/**
 * Get ticket data organized by day for the chart
 */
function getTicketDataByDay() {
  // Get dates for the last 7 days
  const dates = [];
  const created = [];
  const closed = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const dateString = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    dates.push(dateString);
    
    // Count tickets created on this day
    const createdCount = ticketData.tickets.filter(ticket => {
      const ticketDate = new Date(ticket.createdAt);
      return ticketDate.toDateString() === date.toDateString();
    }).length;
    
    created.push(createdCount);
    
    // Count tickets closed on this day
    const closedCount = ticketData.tickets.filter(ticket => {
      if (!ticket.closedAt) return false;
      const closedDate = new Date(ticket.closedAt);
      return closedDate.toDateString() === date.toDateString();
    }).length;
    
    closed.push(closedCount);
  }
  
  return {
    labels: dates,
    created,
    closed
  };
}

/**
 * Handle ticket setup form submission
 */
async function handleTicketSetup(event) {
  event.preventDefault();
  
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  try {
    // Show loading state
    const submitButton = ticketSetupForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Get form data
    const formData = new FormData(ticketSetupForm);
    const categoryId = formData.get('categoryId');
    const logChannelId = formData.get('logChannelId');
    const welcomeMessage = formData.get('welcomeMessage');
    const enableTranscripts = formData.get('transcripts') === 'on';
    const autoClose = formData.get('autoClose') === 'on';
    const userClose = formData.get('userClose') === 'on';
    const inactivityTime = formData.get('inactivityTime');
    const buttonColor = formData.get('buttonColor');
    
    // Prepare data for API
    const configData = {
      categoryId,
      logChannelId,
      welcomeMessage,
      enableTranscripts,
      autoClose,
      userClose,
      inactivityTime: autoClose ? inactivityTime : null,
      buttonColor
    };
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/ticket-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(configData)
    });
    
    const data = await response.json();
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-save"></i> Save Configuration';
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to save ticket configuration');
    }
    
    // Show success notification
    createNotification('success', 'Success', 'Ticket configuration saved successfully');
  } catch (error) {
    console.error('Error saving ticket configuration:', error);
    createNotification('error', 'Error', `Failed to save ticket configuration: ${error.message}`);
    
    // Reset button state
    const submitButton = ticketSetupForm.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-save"></i> Save Configuration';
  }
}

/**
 * Handle sending ticket panel
 */
async function handleSendTicketPanel(event) {
  event.preventDefault();
  
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  try {
    // Show loading state
    const submitButton = ticketPanelForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    // Get form data
    const formData = new FormData(ticketPanelForm);
    const channelId = formData.get('channelId');
    const title = formData.get('title');
    const description = formData.get('description');
    const buttonLabel = formData.get('buttonLabel');
    
    if (!channelId) {
      throw new Error('Please select a channel');
    }
    
    // Prepare data for API
    const panelData = {
      channelId,
      title,
      description,
      buttonLabel
    };
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/ticket-panel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(panelData)
    });
    
    const data = await response.json();
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Panel';
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to send ticket panel');
    }
    
    // Show success notification
    createNotification('success', 'Success', 'Ticket panel sent successfully');
  } catch (error) {
    console.error('Error sending ticket panel:', error);
    createNotification('error', 'Error', `Failed to send ticket panel: ${error.message}`);
    
    // Reset button state
    const submitButton = ticketPanelForm.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Panel';
  }
}

/**
 * Open ticket info modal
 */
async function openTicketInfoModal(ticketId, channelId) {
  // Find ticket in data
  const ticket = ticketData.tickets.find(t => t.id === ticketId);
  
  if (!ticket) {
    createNotification('error', 'Error', 'Ticket not found');
    return;
  }
  
  // Set modal data
  ticketInfoModal.setAttribute('data-ticket-id', ticketId);
  ticketInfoModal.setAttribute('data-channel-id', channelId);
  
  // Update UI with ticket info
  document.getElementById('modal-ticket-title').textContent = `Ticket #${ticketId}`;
  document.getElementById('modal-ticket-status').textContent = ticket.status;
  document.getElementById('modal-ticket-status').className = `ticket-badge ${ticket.status.toLowerCase()}`;
  document.getElementById('modal-ticket-id').textContent = ticketId;
  
  // Format created time
  const createdDate = new Date(ticket.createdAt);
  document.getElementById('modal-ticket-created').textContent = 
    `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`;
  
  document.getElementById('modal-ticket-creator').textContent = ticket.creator.username;
  document.getElementById('modal-ticket-category').textContent = ticket.category || 'Support';
  
  // Show loading state for transcript
  document.getElementById('transcript-preview').innerHTML = `
    <div class="transcript-loading">
      <div class="spinner"></div>
      <p>Loading transcript preview...</p>
    </div>
  `;
  
  // Update button states
  document.getElementById('close-ticket-btn').style.display = ticket.status === 'OPEN' ? '' : 'none';
  
  // Show the modal
  ticketInfoModal.classList.add('active');
  
  // Load transcript
  await loadTranscriptPreview(ticketId);
}

/**
 * Load transcript preview for a ticket
 */
async function loadTranscriptPreview(ticketId) {
  try {
    // Fetch transcript from API
    const response = await fetch(`/api/v2/servers/${currentServerId}/tickets/${ticketId}/transcript-preview`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load transcript preview');
    }
    
    const transcriptContainer = document.getElementById('transcript-preview');
    
    // If no messages, show a message
    if (!data.messages || !data.messages.length) {
      transcriptContainer.innerHTML = '<p class="empty-message">No messages found for this ticket.</p>';
      return;
    }
    
    // Clear container
    transcriptContainer.innerHTML = '';
    
    // Add messages to preview
    data.messages.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = 'transcript-message';
      
      // Format timestamp
      const timestamp = new Date(message.timestamp);
      const timeFormatted = timestamp.toLocaleTimeString();
      const dateFormatted = timestamp.toLocaleDateString();
      
      messageElement.innerHTML = `
        <div class="transcript-avatar">
          ${message.author.avatar ? 
            `<img src="${message.author.avatar}" alt="${escapeHTML(message.author.username)}">` : 
            `<i class="fas fa-user"></i>`}
        </div>
        <div class="transcript-content">
          <div class="transcript-header">
            <div class="transcript-author">${escapeHTML(message.author.username)}</div>
            <div class="transcript-time">${dateFormatted} ${timeFormatted}</div>
          </div>
          <div class="transcript-text">${escapeHTML(message.content)}</div>
        </div>
      `;
      
      transcriptContainer.appendChild(messageElement);
    });
  } catch (error) {
    console.error('Error loading transcript preview:', error);
    document.getElementById('transcript-preview').innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading transcript: ${error.message}</p>
      </div>
    `;
  }
}

/**
 * Download transcript for a ticket
 */
async function downloadTranscript(ticketId) {
  try {
    // Open the transcript URL in a new tab
    window.open(`/api/v2/servers/${currentServerId}/tickets/${ticketId}/transcript-download`, '_blank');
  } catch (error) {
    console.error('Error downloading transcript:', error);
    createNotification('error', 'Error', `Failed to download transcript: ${error.message}`);
  }
}

/**
 * Open the confirmation modal
 */
function openConfirmModal(action, ticketId) {
  // Set modal data
  confirmModal.setAttribute('data-action', action);
  confirmModal.setAttribute('data-ticket-id', ticketId);
  
  // Set confirm message
  const confirmMessage = document.getElementById('confirm-message');
  
  switch (action) {
    case 'close-ticket':
      confirmMessage.textContent = `Are you sure you want to close ticket #${ticketId}?`;
      break;
    default:
      confirmMessage.textContent = 'Are you sure you want to perform this action?';
  }
  
  // Show the modal
  confirmModal.classList.add('active');
}

/**
 * Handle confirming an action in the confirm modal
 */
async function handleConfirmAction() {
  const action = confirmModal.getAttribute('data-action');
  const ticketId = confirmModal.getAttribute('data-ticket-id');
  
  if (!action || !ticketId || !currentServerId) {
    closeAllModals();
    return;
  }
  
  // Disable confirm button
  const confirmButton = confirmModal.querySelector('[data-action="confirm"]');
  confirmButton.disabled = true;
  confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  try {
    switch (action) {
      case 'close-ticket':
        await closeTicket(ticketId);
        break;
    }
    
    // Close modals
    closeAllModals();
    
    // Reload tickets
    await loadTickets();
  } catch (error) {
    console.error(`Error performing action ${action}:`, error);
    createNotification('error', 'Error', `Failed to perform action: ${error.message}`);
    
    // Reset button state
    confirmButton.disabled = false;
    confirmButton.innerHTML = 'Confirm';
  }
}

/**
 * Close a ticket
 */
async function closeTicket(ticketId) {
  if (!ticketId || !currentServerId) {
    throw new Error('Invalid ticket or server');
  }
  
  // Send request to API
  const response = await fetch(`/api/v2/servers/${currentServerId}/tickets/${ticketId}/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason: 'Closed by admin via dashboard' })
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to close ticket');
  }
  
  // Show success notification
  createNotification('success', 'Success', `Ticket #${ticketId} closed successfully`);
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
 * Escape HTML to prevent XSS
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
document.addEventListener('DOMContentLoaded', initTicketsPage);