/**
 * Admin 3D Ticket Management
 * Premium Edition - $55k Value Design
 * 
 * JavaScript to handle ticket management functionality on the admin panel
 * with advanced 3D visualizations
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Premium ticket management script loaded');
  
  // DOM elements
  const serverSelect = document.getElementById('server-select');
  const totalTicketsEl = document.getElementById('total-tickets');
  const openTicketsEl = document.getElementById('open-tickets');
  const closedTicketsEl = document.getElementById('closed-tickets');
  const avgResponseTimeEl = document.getElementById('avg-response-time');
  const ticketListBody = document.getElementById('ticket-list-body');
  const statusFilter = document.getElementById('status-filter');
  const typeFilter = document.getElementById('type-filter');
  const searchTickets = document.getElementById('search-tickets');
  
  // Settings form elements
  const ticketSettingsForm = document.getElementById('ticket-settings-form');
  const categoryId = document.getElementById('category-id');
  const supportRoleId = document.getElementById('support-role-id');
  const logChannelId = document.getElementById('log-channel-id');
  const maxTickets = document.getElementById('max-tickets');
  const cooldown = document.getElementById('cooldown');
  const autoTranscript = document.getElementById('auto-transcript');
  const autoClose = document.getElementById('auto-close');
  const requireTopic = document.getElementById('require-topic');
  const useThreads = document.getElementById('use-threads');
  const inactiveHours = document.getElementById('inactive-hours');
  const autoCloseMessage = document.getElementById('auto-close-message');
  const welcomeMessage = document.getElementById('welcome-message');
  const closeMessage = document.getElementById('close-message');
  const resetSettingsBtn = document.getElementById('reset-settings');
  
  // Ticket panel form elements
  const panelForm = document.getElementById('panel-form');
  const panelChannelId = document.getElementById('panel-channel-id');
  const panelTitle = document.getElementById('panel-title');
  const panelDescription = document.getElementById('panel-description');
  const panelColor = document.getElementById('panel-color');
  const panelImage = document.getElementById('panel-image');
  const ticketTypesContainer = document.getElementById('ticket-types-container');
  const addTicketTypeBtn = document.getElementById('add-ticket-type');
  
  // Variables to store data
  let currentServerId = null;
  let allTickets = [];
  let ticketTypes = [];
  
  // Check if server select exists
  if (!serverSelect) {
    console.warn('Server select element not found - this is expected on pages other than tickets.');
    return;
  }
  
  // Initialize server select
  serverSelect.addEventListener('change', function() {
    currentServerId = this.value;
    
    if (currentServerId) {
      // Load data for the selected server
      loadTickets(currentServerId);
      loadServerConfiguration(currentServerId);
      loadServerChannels(currentServerId);
      loadServerRoles(currentServerId);
    } else {
      resetTicketDisplay();
    }
  });
  
  // Initialize filters
  if (statusFilter) {
    statusFilter.addEventListener('change', filterTickets);
  }
  
  if (typeFilter) {
    typeFilter.addEventListener('change', filterTickets);
  }
  
  if (searchTickets) {
    searchTickets.addEventListener('input', filterTickets);
  }
  
  // Initialize autoClose settings visibility
  if (autoClose) {
    autoClose.addEventListener('change', function() {
      const autoCloseSettings = document.querySelectorAll('.auto-close-settings');
      autoCloseSettings.forEach(element => {
        element.style.display = this.checked ? 'flex' : 'none';
      });
    });
  }
  
  // Initialize form submissions
  if (ticketSettingsForm) {
    ticketSettingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveTicketConfiguration(currentServerId);
    });
  }
  
  if (panelForm) {
    panelForm.addEventListener('submit', function(e) {
      e.preventDefault();
      createTicketPanel(currentServerId);
    });
  }
  
  // Initialize reset settings button
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', function() {
      resetSettingsToDefaults();
    });
  }
  
  // Initialize ticket type management
  if (addTicketTypeBtn && ticketTypesContainer) {
    addTicketTypeBtn.addEventListener('click', function() {
      addTicketTypeRow();
    });
    
    // Add event delegation for remove buttons
    ticketTypesContainer.addEventListener('click', function(e) {
      if (e.target.classList.contains('remove-ticket-type') || 
          e.target.parentElement.classList.contains('remove-ticket-type')) {
        const row = e.target.closest('.ticket-type-row');
        if (row && ticketTypesContainer.children.length > 1) {
          row.remove();
          updateTicketTypeIndices();
        }
      }
    });
  }
  
  /**
   * Load tickets for a server
   * @param {string} serverId - Discord server ID
   */
  function loadTickets(serverId) {
    // Show loading state
    ticketListBody.innerHTML = '<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading tickets...</td></tr>';
    
    fetch(`/api/v2/servers/${serverId}/tickets`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          allTickets = data.tickets || [];
          // Store allTickets globally for other scripts to access
          window.allTickets = allTickets;
          
          // Update stats
          updateTicketStats(data.stats);
          
          // Extract and populate ticket types
          populateTicketTypes(allTickets);
          
          // Display tickets
          displayTickets(allTickets);
          
          // Update 3D tickets if the premium feature is available
          if (window.update3DTickets) {
            window.update3DTickets(allTickets);
          }
        } else {
          showError('Failed to load tickets: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error loading tickets:', error);
        showError('Error loading tickets. Check console for details.');
      });
  }
  
  /**
   * Update ticket statistics display
   * @param {Object} stats - Ticket statistics
   */
  function updateTicketStats(stats) {
    if (!stats) return;
    
    totalTicketsEl.textContent = stats.total || 0;
    openTicketsEl.textContent = stats.open || 0;
    closedTicketsEl.textContent = stats.closed || 0;
    
    if (stats.avgResponseTime) {
      const minutes = Math.floor(stats.avgResponseTime / 60);
      avgResponseTimeEl.textContent = `${minutes}m`;
    } else {
      avgResponseTimeEl.textContent = '-';
    }
  }
  
  /**
   * Extract and populate ticket types filter
   * @param {Array} tickets - Array of tickets
   */
  function populateTicketTypes(tickets) {
    if (!typeFilter) return;
    
    // Reset
    typeFilter.innerHTML = '<option value="all">All Types</option>';
    
    // Extract unique ticket types
    const types = new Set();
    tickets.forEach(ticket => {
      if (ticket.type) {
        types.add(ticket.type);
      }
    });
    
    // Add to filter
    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      typeFilter.appendChild(option);
    });
    
    // Save for later use
    ticketTypes = Array.from(types);
  }
  
  /**
   * Display tickets in the table
   * @param {Array} tickets - Array of tickets to display
   */
  function displayTickets(tickets) {
    if (!ticketListBody) return;
    
    if (!tickets || tickets.length === 0) {
      ticketListBody.innerHTML = '<tr class="no-tickets-row"><td colspan="6" class="text-center">No tickets found for this server.</td></tr>';
      return;
    }
    
    // Store all tickets globally for 3D visualization
    window.allTickets = tickets;
    
    // Update 3D visualization if available
    if (typeof window.update3DTickets === 'function') {
      window.update3DTickets(tickets);
    }
    
    // Clear existing rows
    ticketListBody.innerHTML = '';
    
    // Sort tickets by creation date (newest first)
    tickets.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    // Create rows for each ticket
    tickets.forEach(ticket => {
      const row = document.createElement('tr');
      row.dataset.ticketId = ticket.id;
      
      // Format date
      const created = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
      const formattedDate = created.toLocaleDateString() + ' ' + 
                            created.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      // Status class
      const statusClass = ticket.status === 'OPEN' ? 'badge-success' : 'badge-secondary';
      
      // Calculate time since creation for premium display
      let timeSince = '';
      if (ticket.createdAt) {
        const now = new Date();
        const diffMs = now - created;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (diffDays > 0) {
          timeSince = `${diffDays}d ${diffHours}h ago`;
        } else {
          timeSince = `${diffHours}h ago`;
        }
      }
      
      // Status pill class - premium style
      const statusPillClass = ticket.status === 'OPEN' ? 'status-pill-open' : 'status-pill-closed';
      
      row.innerHTML = `
        <td><strong>#${ticket.id}</strong></td>
        <td>${escapeHtml(ticket.username || 'Unknown User')}</td>
        <td>${escapeHtml(ticket.type || 'General')}</td>
        <td title="${formattedDate}">${timeSince || formattedDate}</td>
        <td><span class="status-pill ${statusPillClass}">${ticket.status || 'UNKNOWN'}</span></td>
        <td class="premium-action-cell">
          <div class="premium-button-group">
            <button class="premium-btn premium-sm premium-info view-ticket" data-ticket-id="${ticket.id}" title="View Details">
              <i class="fas fa-eye"></i>
            </button>
            ${ticket.status === 'OPEN' ? `
              <button class="premium-btn premium-sm premium-warning close-ticket" data-ticket-id="${ticket.id}" title="Close Ticket">
                <i class="fas fa-times"></i>
              </button>
            ` : ''}
            <button class="premium-btn premium-sm premium-secondary download-transcript" data-ticket-id="${ticket.id}" title="Download Transcript">
              <i class="fas fa-download"></i>
            </button>
          </div>
        </td>
      `;
      
      ticketListBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    addTicketActionListeners();
  }
  
  /**
   * Add event listeners to ticket action buttons
   */
  function addTicketActionListeners() {
    // View ticket buttons
    document.querySelectorAll('.view-ticket').forEach(button => {
      button.addEventListener('click', function() {
        const ticketId = this.dataset.ticketId;
        viewTicket(currentServerId, ticketId);
      });
    });
    
    // Close ticket buttons
    document.querySelectorAll('.close-ticket').forEach(button => {
      button.addEventListener('click', function() {
        const ticketId = this.dataset.ticketId;
        closeTicket(currentServerId, ticketId);
      });
    });
    
    // Download transcript buttons
    document.querySelectorAll('.download-transcript').forEach(button => {
      button.addEventListener('click', function() {
        const ticketId = this.dataset.ticketId;
        downloadTranscript(currentServerId, ticketId);
      });
    });
  }
  
  /**
   * Filter tickets based on selected filters
   */
  function filterTickets() {
    if (!allTickets || allTickets.length === 0) return;
    
    const statusValue = statusFilter ? statusFilter.value : 'all';
    const typeValue = typeFilter ? typeFilter.value : 'all';
    const searchValue = searchTickets ? searchTickets.value.toLowerCase() : '';
    
    const filteredTickets = allTickets.filter(ticket => {
      // Status filter
      if (statusValue !== 'all' && ticket.status !== statusValue.toUpperCase()) {
        return false;
      }
      
      // Type filter
      if (typeValue !== 'all' && ticket.type !== typeValue) {
        return false;
      }
      
      // Search filter
      if (searchValue && !ticketMatchesSearch(ticket, searchValue)) {
        return false;
      }
      
      return true;
    });
    
    displayTickets(filteredTickets);
    
    // Update 3D view with filtered tickets if premium feature is available
    if (typeof window.update3DTickets === 'function') {
      window.update3DTickets(filteredTickets);
    }
  }
  
  /**
   * Check if ticket matches search term
   * @param {Object} ticket - Ticket object
   * @param {string} search - Search term
   * @returns {boolean} - Whether the ticket matches the search
   */
  function ticketMatchesSearch(ticket, search) {
    const searchFields = [
      ticket.id,
      ticket.username,
      ticket.userId,
      ticket.type,
      ticket.topic
    ];
    
    return searchFields.some(field => {
      return field && field.toString().toLowerCase().includes(search);
    });
  }
  
  /**
   * View ticket details in modal
   * @param {string} serverId - Discord server ID
   * @param {string} ticketId - Ticket ID
   */
  function viewTicket(serverId, ticketId) {
    // Find ticket in already loaded data
    const ticket = allTickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      showError('Ticket not found');
      return;
    }
    
    // Show loading
    let modal = document.getElementById('ticket-modal');
    if (!modal) {
      console.error('Ticket modal not found');
      return;
    }
    
    // Format date
    const created = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
    const formattedDate = created.toLocaleDateString() + ' ' + 
                          created.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Update modal fields
    document.getElementById('modal-ticket-id').textContent = ticket.id;
    document.getElementById('modal-ticket-user').textContent = ticket.username || 'Unknown';
    document.getElementById('modal-ticket-type').textContent = ticket.type || 'General';
    document.getElementById('modal-ticket-created').textContent = formattedDate;
    document.getElementById('modal-ticket-status').textContent = ticket.status || 'UNKNOWN';
    document.getElementById('modal-ticket-topic').textContent = ticket.topic || 'No topic provided';
    
    // Update action buttons based on status
    const closeBtn = document.getElementById('modal-close-ticket');
    if (closeBtn) {
      if (ticket.status === 'OPEN') {
        closeBtn.style.display = 'block';
        closeBtn.dataset.ticketId = ticket.id;
      } else {
        closeBtn.style.display = 'none';
      }
    }
    
    // Load transcript
    fetchTranscript(serverId, ticketId);
    
    // Show modal
    $(modal).modal('show');
  }
  
  /**
   * Fetch transcript for a ticket
   * @param {string} serverId - Discord server ID
   * @param {string} ticketId - Ticket ID
   */
  function fetchTranscript(serverId, ticketId) {
    const transcriptContainer = document.getElementById('modal-transcript');
    if (!transcriptContainer) return;
    
    // Show loading
    transcriptContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading transcript...</div>';
    
    fetch(`/api/v2/servers/${serverId}/tickets/${ticketId}/transcript`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.transcript) {
          if (data.transcript.html) {
            // If HTML transcript is available, use iframe
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '300px';
            iframe.style.border = 'none';
            
            transcriptContainer.innerHTML = '';
            transcriptContainer.appendChild(iframe);
            
            // Write HTML content to iframe
            iframe.contentDocument.open();
            iframe.contentDocument.write(data.transcript.html);
            iframe.contentDocument.close();
          } else if (data.transcript.messages) {
            // Otherwise render messages
            renderMessages(data.transcript.messages, transcriptContainer);
          } else {
            transcriptContainer.innerHTML = '<div class="alert alert-info">No transcript content available</div>';
          }
        } else {
          transcriptContainer.innerHTML = '<div class="alert alert-warning">Failed to load transcript</div>';
        }
      })
      .catch(error => {
        console.error('Error loading transcript:', error);
        transcriptContainer.innerHTML = '<div class="alert alert-danger">Error loading transcript</div>';
      });
  }
  
  /**
   * Render messages in transcript
   * @param {Array} messages - Array of messages
   * @param {Element} container - Container element
   */
  function renderMessages(messages, container) {
    container.innerHTML = '';
    
    if (!messages || messages.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No messages in this ticket</div>';
      return;
    }
    
    const messageList = document.createElement('div');
    messageList.className = 'transcript-messages';
    
    messages.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'transcript-message';
      
      const timestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
      const formattedTime = timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      messageDiv.innerHTML = `
        <div class="message-header">
          <span class="message-author">${escapeHtml(msg.author || 'Unknown')}</span>
          <span class="message-time">${formattedTime}</span>
        </div>
        <div class="message-content">${escapeHtml(msg.content || '')}</div>
      `;
      
      messageList.appendChild(messageDiv);
    });
    
    container.appendChild(messageList);
  }
  
  /**
   * Close a ticket
   * @param {string} serverId - Discord server ID
   * @param {string} ticketId - Ticket ID
   */
  function closeTicket(serverId, ticketId) {
    if (!confirm('Are you sure you want to close this ticket?')) {
      return;
    }
    
    const reason = prompt('Please enter a reason for closing this ticket (optional):');
    
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
          // Reload tickets
          loadTickets(serverId);
          
          // Close modal if open
          $('#ticket-modal').modal('hide');
          
          showSuccess('Ticket closed successfully');
        } else {
          showError('Failed to close ticket: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error closing ticket:', error);
        showError('Error closing ticket. Check console for details.');
      });
  }
  
  /**
   * Download transcript for a ticket
   * @param {string} serverId - Discord server ID
   * @param {string} ticketId - Ticket ID
   */
  function downloadTranscript(serverId, ticketId) {
    window.open(`/api/v2/servers/${serverId}/tickets/${ticketId}/transcript/download`, '_blank');
  }
  
  /**
   * Load server configuration
   * @param {string} serverId - Discord server ID
   */
  function loadServerConfiguration(serverId) {
    if (!ticketSettingsForm) return;
    
    fetch(`/api/v2/servers/${serverId}/ticket-config`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.config) {
          populateConfigForm(data.config);
        } else if (data.code === 'CONFIG_NOT_FOUND') {
          // Config not set up yet, use defaults
          resetSettingsToDefaults();
        } else {
          showError('Failed to load ticket configuration: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error loading configuration:', error);
        showError('Error loading configuration. Check console for details.');
      });
  }
  
  /**
   * Populate config form with data
   * @param {Object} config - Configuration object
   */
  function populateConfigForm(config) {
    if (!ticketSettingsForm) return;
    
    // Set form values
    if (categoryId) categoryId.value = config.categoryId || '';
    if (supportRoleId) supportRoleId.value = config.supportRoleId || '';
    if (logChannelId) logChannelId.value = config.logChannelId || '';
    if (maxTickets) maxTickets.value = config.maxTickets || 1;
    if (cooldown) cooldown.value = config.cooldown || 60;
    if (autoTranscript) autoTranscript.checked = !!config.autoTranscript;
    if (autoClose) {
      autoClose.checked = !!config.autoClose;
      // Trigger change event to show/hide auto-close settings
      const event = new Event('change');
      autoClose.dispatchEvent(event);
    }
    if (requireTopic) requireTopic.checked = !!config.requireTopic;
    if (useThreads) useThreads.checked = !!config.useThreads;
    if (inactiveHours) inactiveHours.value = config.inactiveHours || 24;
    if (autoCloseMessage) autoCloseMessage.value = config.autoCloseMessage || 'This ticket has been automatically closed due to inactivity.';
    if (welcomeMessage) welcomeMessage.value = config.welcomeMessage || 'Thanks for creating a ticket! The support team will assist you shortly. Please describe your issue in detail.';
    if (closeMessage) closeMessage.value = config.closeMessage || 'This ticket is now closed. If you need further assistance, please open a new ticket.';
  }
  
  /**
   * Save ticket configuration
   * @param {string} serverId - Discord server ID
   */
  function saveTicketConfiguration(serverId) {
    if (!ticketSettingsForm) return;
    
    // Build config object
    const config = {
      categoryId: categoryId ? categoryId.value : '',
      supportRoleId: supportRoleId ? supportRoleId.value : '',
      logChannelId: logChannelId ? logChannelId.value : '',
      maxTickets: maxTickets ? parseInt(maxTickets.value) || 1 : 1,
      cooldown: cooldown ? parseInt(cooldown.value) || 60 : 60,
      autoTranscript: autoTranscript ? autoTranscript.checked : false,
      autoClose: autoClose ? autoClose.checked : false,
      requireTopic: requireTopic ? requireTopic.checked : false,
      useThreads: useThreads ? useThreads.checked : false,
      inactiveHours: inactiveHours ? parseInt(inactiveHours.value) || 24 : 24,
      autoCloseMessage: autoCloseMessage ? autoCloseMessage.value : '',
      welcomeMessage: welcomeMessage ? welcomeMessage.value : '',
      closeMessage: closeMessage ? closeMessage.value : ''
    };
    
    fetch(`/api/v2/servers/${serverId}/ticket-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showSuccess('Configuration saved successfully');
        } else {
          showError('Failed to save configuration: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error saving configuration:', error);
        showError('Error saving configuration. Check console for details.');
      });
  }
  
  /**
   * Reset settings form to defaults
   */
  function resetSettingsToDefaults() {
    if (!ticketSettingsForm) return;
    
    // Set default values
    if (categoryId) categoryId.value = '';
    if (supportRoleId) supportRoleId.value = '';
    if (logChannelId) logChannelId.value = '';
    if (maxTickets) maxTickets.value = 1;
    if (cooldown) cooldown.value = 60;
    if (autoTranscript) autoTranscript.checked = true;
    if (autoClose) {
      autoClose.checked = false;
      // Update visibility
      const autoCloseSettings = document.querySelectorAll('.auto-close-settings');
      autoCloseSettings.forEach(element => {
        element.style.display = 'none';
      });
    }
    if (requireTopic) requireTopic.checked = false;
    if (useThreads) useThreads.checked = false;
    if (inactiveHours) inactiveHours.value = 24;
    if (autoCloseMessage) autoCloseMessage.value = 'This ticket has been automatically closed due to inactivity.';
    if (welcomeMessage) welcomeMessage.value = 'Thanks for creating a ticket! The support team will assist you shortly. Please describe your issue in detail.';
    if (closeMessage) closeMessage.value = 'This ticket is now closed. If you need further assistance, please open a new ticket.';
    
    showSuccess('Settings reset to defaults');
  }
  
  /**
   * Load server channels for dropdown selects
   * @param {string} serverId - Discord server ID
   */
  function loadServerChannels(serverId) {
    fetch(`/api/v2/servers/${serverId}/channels`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          populateChannelSelects(data.channels, data.categories);
        } else {
          showError('Failed to load channels: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error loading channels:', error);
        showError('Error loading channels. Check console for details.');
      });
  }
  
  /**
   * Populate channel dropdown selects
   * @param {Array} channels - Array of channels
   * @param {Array} categories - Array of categories
   */
  function populateChannelSelects(channels, categories) {
    // Category select for settings
    if (categoryId) {
      // Clear existing options
      categoryId.innerHTML = '<option value="">- Select Category -</option>';
      
      // Add categories
      if (categories && categories.length > 0) {
        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.id;
          option.textContent = category.name;
          categoryId.appendChild(option);
        });
      }
    }
    
    // Log channel select for settings
    if (logChannelId) {
      // Clear existing options
      logChannelId.innerHTML = '<option value="">- Select Channel -</option>';
      
      // Add text channels
      if (channels && channels.length > 0) {
        // Group channels by category
        const channelsByCategory = {};
        channels.forEach(channel => {
          if (!channelsByCategory[channel.parentId]) {
            channelsByCategory[channel.parentId] = [];
          }
          channelsByCategory[channel.parentId].push(channel);
        });
        
        // Add optgroups for categories
        Object.keys(channelsByCategory).forEach(parentId => {
          let groupLabel = 'No Category';
          
          // Find category name
          if (parentId) {
            const category = categories.find(c => c.id === parentId);
            if (category) {
              groupLabel = category.name;
            }
          }
          
          const optgroup = document.createElement('optgroup');
          optgroup.label = groupLabel;
          
          // Add channels to optgroup
          channelsByCategory[parentId].forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.id;
            option.textContent = channel.name;
            optgroup.appendChild(option);
          });
          
          logChannelId.appendChild(optgroup);
        });
      }
    }
    
    // Panel channel select for ticket panel form
    if (panelChannelId) {
      // Clear existing options
      panelChannelId.innerHTML = '<option value="">- Select Channel -</option>';
      
      // Add text channels (same structure as log channel select)
      if (channels && channels.length > 0) {
        // Group channels by category
        const channelsByCategory = {};
        channels.forEach(channel => {
          if (!channelsByCategory[channel.parentId]) {
            channelsByCategory[channel.parentId] = [];
          }
          channelsByCategory[channel.parentId].push(channel);
        });
        
        // Add optgroups for categories
        Object.keys(channelsByCategory).forEach(parentId => {
          let groupLabel = 'No Category';
          
          // Find category name
          if (parentId) {
            const category = categories.find(c => c.id === parentId);
            if (category) {
              groupLabel = category.name;
            }
          }
          
          const optgroup = document.createElement('optgroup');
          optgroup.label = groupLabel;
          
          // Add channels to optgroup
          channelsByCategory[parentId].forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.id;
            option.textContent = channel.name;
            optgroup.appendChild(option);
          });
          
          panelChannelId.appendChild(optgroup);
        });
      }
    }
  }
  
  /**
   * Load server roles for dropdown selects
   * @param {string} serverId - Discord server ID
   */
  function loadServerRoles(serverId) {
    fetch(`/api/v2/servers/${serverId}/roles`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          populateRoleSelects(data.roles);
        } else {
          showError('Failed to load roles: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error loading roles:', error);
        showError('Error loading roles. Check console for details.');
      });
  }
  
  /**
   * Populate role dropdown selects
   * @param {Array} roles - Array of roles
   */
  function populateRoleSelects(roles) {
    // Support role select for settings
    if (supportRoleId) {
      // Clear existing options
      supportRoleId.innerHTML = '<option value="">- Select Role -</option>';
      
      // Add roles
      if (roles && roles.length > 0) {
        roles.forEach(role => {
          const option = document.createElement('option');
          option.value = role.id;
          option.textContent = role.name;
          // Add color indicator
          if (role.color && role.color !== '#000000') {
            option.style.color = role.color;
          }
          supportRoleId.appendChild(option);
        });
      }
    }
  }
  
  /**
   * Create a ticket panel
   * @param {string} serverId - Discord server ID
   */
  function createTicketPanel(serverId) {
    if (!panelForm) return;
    
    // Collect ticket types
    const ticketTypes = [];
    document.querySelectorAll('.ticket-type-row').forEach(row => {
      const label = row.querySelector('.type-label').value;
      const emoji = row.querySelector('.type-emoji').value;
      const description = row.querySelector('.type-description').value;
      
      if (label) {
        ticketTypes.push({
          label,
          emoji,
          description
        });
      }
    });
    
    // Build panel data
    const panelData = {
      channelId: panelChannelId ? panelChannelId.value : '',
      panelTitle: panelTitle ? panelTitle.value : 'Support Tickets',
      panelDescription: panelDescription ? panelDescription.value : '',
      panelColor: panelColor ? panelColor.value : '#000000',
      panelImage: panelImage ? panelImage.value : '',
      ticketTypes: JSON.stringify(ticketTypes)
    };
    
    // Validate
    if (!panelData.channelId) {
      showError('Please select a channel for the panel');
      return;
    }
    
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
          showSuccess('Ticket panel created successfully');
          
          // Reset form
          if (panelForm) {
            panelForm.reset();
          }
        } else {
          showError('Failed to create panel: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error creating panel:', error);
        showError('Error creating panel. Check console for details.');
      });
  }
  
  /**
   * Add a new ticket type row to the panel form
   */
  function addTicketTypeRow() {
    if (!ticketTypesContainer) return;
    
    const index = ticketTypesContainer.children.length;
    const row = document.createElement('div');
    row.className = 'ticket-type-row';
    row.dataset.index = index;
    row.style.setProperty('--row-index', index);
    
    row.innerHTML = `
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
    
    ticketTypesContainer.appendChild(row);
  }
  
  /**
   * Update indices for ticket type rows
   */
  function updateTicketTypeIndices() {
    if (!ticketTypesContainer) return;
    
    Array.from(ticketTypesContainer.children).forEach((row, index) => {
      row.dataset.index = index;
      row.style.setProperty('--row-index', index);
      
      const labelInput = row.querySelector('.type-label');
      const emojiInput = row.querySelector('.type-emoji');
      const descriptionInput = row.querySelector('.type-description');
      
      if (labelInput) labelInput.name = `ticketTypes[${index}][label]`;
      if (emojiInput) emojiInput.name = `ticketTypes[${index}][emoji]`;
      if (descriptionInput) descriptionInput.name = `ticketTypes[${index}][description]`;
    });
  }
  
  /**
   * Reset ticket display when no server is selected
   */
  function resetTicketDisplay() {
    // Reset ticket stats
    totalTicketsEl.textContent = '0';
    openTicketsEl.textContent = '0';
    closedTicketsEl.textContent = '0';
    avgResponseTimeEl.textContent = '-';
    
    // Reset ticket list
    ticketListBody.innerHTML = '<tr class="no-tickets-row"><td colspan="6" class="text-center">No server selected. Please select a server to view tickets.</td></tr>';
    
    // Reset ticket types filter
    if (typeFilter) {
      typeFilter.innerHTML = '<option value="all">All Types</option>';
    }
    
    // Reset form selects
    if (categoryId) categoryId.innerHTML = '<option value="">- Select Category -</option>';
    if (supportRoleId) supportRoleId.innerHTML = '<option value="">- Select Role -</option>';
    if (logChannelId) logChannelId.innerHTML = '<option value="">- Select Channel -</option>';
    if (panelChannelId) panelChannelId.innerHTML = '<option value="">- Select Channel -</option>';
  }
  
  /**
   * Show error message
   * @param {string} message - Error message
   */
  function showError(message) {
    console.error(message);
    // Using bootstrap toast or alert
    if (typeof $.toast === 'function') {
      $.toast({
        heading: 'Error',
        text: message,
        icon: 'error',
        position: 'top-right'
      });
    } else {
      alert('Error: ' + message);
    }
  }
  
  /**
   * Show success message
   * @param {string} message - Success message
   */
  function showSuccess(message) {
    // Using bootstrap toast or alert
    if (typeof $.toast === 'function') {
      $.toast({
        heading: 'Success',
        text: message,
        icon: 'success',
        position: 'top-right'
      });
    } else {
      alert('Success: ' + message);
    }
  }
  
  /**
   * Escape HTML to prevent XSS
   * @param {string} unsafe - Unsafe string
   * @returns {string} - Escaped string
   */
  function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  // Initialize server select if one is selected
  if (serverSelect.value) {
    currentServerId = serverSelect.value;
    loadTickets(currentServerId);
    loadServerConfiguration(currentServerId);
    loadServerChannels(currentServerId);
    loadServerRoles(currentServerId);
  }
});