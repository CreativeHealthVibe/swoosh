/**
 * Admin3D Ticket Setup Script
 * Integrates setup-tickets command functionality into the admin interface
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Ticket setup JS loaded');
  
  // Initialize variables
  let selectedServer = null;
  let serverChannels = [];
  let serverRoles = [];
  
  // DOM elements
  const serverSelect = document.getElementById('server-select');
  const quickSetupTab = document.getElementById('quick-setup-tab');
  const quickSetupContent = document.getElementById('quick-setup-content');
  const bountySetupTab = document.getElementById('bounty-setup-tab');
  const bountySetupContent = document.getElementById('bounty-setup-content');
  
  // Setup event listeners
  if (serverSelect) {
    serverSelect.addEventListener('change', function() {
      selectedServer = this.value;
      if (selectedServer) {
        loadServerData(selectedServer);
      }
    });
  }
  
  // Load server data (channels, roles, etc.)
  function loadServerData(serverId) {
    // Update status
    updateStatus(`Loading server data for ${serverId}...`);
    
    // Fetch server channels
    fetch(`/api/v2/servers/${serverId}/channels`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          serverChannels = data.channels;
          populateChannelSelects();
        } else {
          console.error('Failed to load channels:', data.error);
        }
      })
      .catch(error => {
        console.error('Error fetching channels:', error);
      });
    
    // Fetch server roles
    fetch(`/api/v2/servers/${serverId}/roles`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          serverRoles = data.roles;
          populateRoleSelects();
        } else {
          console.error('Failed to load roles:', data.error);
        }
      })
      .catch(error => {
        console.error('Error fetching roles:', error);
      });
    
    // Load existing ticket configuration
    fetch(`/api/v2/servers/${serverId}/ticket-config`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.config) {
          populateConfigForm(data.config);
        }
      })
      .catch(error => {
        console.error('Error fetching ticket config:', error);
      });
  }
  
  // Populate channel select elements
  function populateChannelSelects() {
    // Find all channel select elements
    const channelSelects = [
      document.getElementById('category-id'),
      document.getElementById('log-channel-id'),
      document.getElementById('panel-channel-id'),
      document.getElementById('ticket-channel'),
      document.getElementById('setup-category'),
      document.getElementById('setup-log-channel')
    ];
    
    // Filter channels by type
    const textChannels = serverChannels.filter(channel => 
      channel.type === 'GUILD_TEXT' || channel.type === 0
    );
    
    const categories = serverChannels.filter(channel => 
      channel.type === 'GUILD_CATEGORY' || channel.type === 4
    );
    
    // Update each select element
    channelSelects.forEach(select => {
      if (!select) return;
      
      // Clear existing options
      while (select.options.length > 1) {
        select.remove(1);
      }
      
      // Determine which channel list to use based on select ID
      const channelList = select.id.includes('category') ? categories : textChannels;
      
      // Sort alphabetically
      channelList.sort((a, b) => a.name.localeCompare(b.name));
      
      // Add options
      channelList.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = channel.name;
        select.appendChild(option);
      });
    });
  }
  
  // Populate role select elements
  function populateRoleSelects() {
    // Find all role select elements
    const roleSelects = [
      document.getElementById('support-role-id'),
      document.getElementById('setup-support-role')
    ];
    
    // Sort roles alphabetically
    serverRoles.sort((a, b) => a.name.localeCompare(b.name));
    
    // Update each select element
    roleSelects.forEach(select => {
      if (!select) return;
      
      // Clear existing options
      while (select.options.length > 1) {
        select.remove(1);
      }
      
      // Add options
      serverRoles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name;
        select.appendChild(option);
      });
    });
  }
  
  // Populate form with existing configuration
  function populateConfigForm(config) {
    // Populate settings form
    const elements = {
      'category-id': config.categoryId,
      'support-role-id': config.supportRoleId,
      'log-channel-id': config.logChannelId,
      'max-tickets': config.maxTickets || 1,
      'cooldown': config.cooldown || 60,
      'auto-transcript': config.autoTranscript,
      'auto-close': config.autoClose,
      'require-topic': config.requireTopic,
      'use-threads': config.useThreads,
      'inactive-hours': config.inactiveHours || 24,
      'auto-close-message': config.autoCloseMessage,
      'welcome-message': config.welcomeMessage,
      'close-message': config.closeMessage
    };
    
    // Update form elements
    for (const [id, value] of Object.entries(elements)) {
      const element = document.getElementById(id);
      if (!element) continue;
      
      if (element.type === 'checkbox') {
        element.checked = !!value;
      } else {
        element.value = value || '';
      }
    }
    
    // Show/hide conditional elements
    const autoClose = document.getElementById('auto-close');
    if (autoClose && autoClose.checked) {
      document.querySelectorAll('.auto-close-settings').forEach(el => {
        el.style.display = 'block';
      });
    }
    
    // Update Quick Setup tab
    populateQuickSetup(config);
    
    // Update Bounty Setup tab
    populateBountySetup(config);
  }
  
  // Populate Quick Setup form
  function populateQuickSetup(config) {
    if (!quickSetupContent) return;
    
    // Create the form if it doesn't exist
    if (!document.getElementById('quick-setup-form')) {
      createQuickSetupForm();
    }
    
    // Populate form fields
    const setupElements = {
      'setup-category': config.categoryId,
      'setup-support-role': config.supportRoleId,
      'setup-log-channel': config.logChannelId
    };
    
    // Update form elements
    for (const [id, value] of Object.entries(setupElements)) {
      const element = document.getElementById(id);
      if (element) {
        element.value = value || '';
      }
    }
  }
  
  // Create Quick Setup form
  function createQuickSetupForm() {
    if (!quickSetupContent) return;
    
    // Create HTML for quick setup
    const setupHtml = `
      <div class="quick-setup-container">
        <div class="setup-header">
          <h3><i class="fas fa-bolt"></i> Quick Ticket Setup</h3>
          <p>Configure your ticket system with these essential settings</p>
        </div>
        
        <form id="quick-setup-form" class="setup-form">
          <input type="hidden" id="server-id" name="serverId" value="">
          
          <div class="form-group">
            <label><i class="fas fa-folder"></i> Ticket Category</label>
            <select id="setup-category" name="categoryId" class="form-control" required>
              <option value="">- Select Category -</option>
            </select>
            <small class="form-text">Category where ticket channels will be created</small>
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-user-shield"></i> Support Role</label>
            <select id="setup-support-role" name="supportRoleId" class="form-control" required>
              <option value="">- Select Role -</option>
            </select>
            <small class="form-text">Role that will have access to all tickets</small>
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-history"></i> Log Channel</label>
            <select id="setup-log-channel" name="logChannelId" class="form-control">
              <option value="">- Select Channel -</option>
            </select>
            <small class="form-text">Channel where ticket logs will be posted</small>
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-hashtag"></i> Panel Channel</label>
            <select id="ticket-channel" name="ticketChannelId" class="form-control">
              <option value="">- Select Channel -</option>
            </select>
            <small class="form-text">Channel where users will create tickets (optional)</small>
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-cog"></i> Additional Options</label>
            <div class="options-container">
              <div class="form-check">
                <input type="checkbox" id="setup-transcripts" name="autoTranscript" class="form-check-input">
                <label for="setup-transcripts" class="form-check-label">Save transcripts when tickets are closed</label>
              </div>
              
              <div class="form-check">
                <input type="checkbox" id="setup-topic" name="requireTopic" class="form-check-input">
                <label for="setup-topic" class="form-check-label">Require users to specify a topic</label>
              </div>
              
              <div class="form-check">
                <input type="checkbox" id="create-panel" name="createPanel" class="form-check-input" checked>
                <label for="create-panel" class="form-check-label">Create ticket panel in selected channel</label>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="premium-btn premium-primary">
              <i class="fas fa-magic"></i> Setup Ticket System
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Add the form to the tab content
    quickSetupContent.innerHTML = setupHtml;
    
    // Add form submit event
    const setupForm = document.getElementById('quick-setup-form');
    if (setupForm) {
      setupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const serverId = selectedServer;
        
        if (!serverId) {
          alert('Please select a server first');
          return;
        }
        
        // Add server ID
        formData.append('serverId', serverId);
        
        // Convert to object
        const config = Object.fromEntries(formData.entries());
        
        // Add boolean values
        config.autoTranscript = !!formData.get('autoTranscript');
        config.requireTopic = !!formData.get('requireTopic');
        const createPanel = !!formData.get('createPanel');
        
        // Send to server
        saveTicketConfig(serverId, config);
        
        // Create panel if requested and channel is selected
        if (createPanel && config.ticketChannelId) {
          setTimeout(() => {
            createTicketPanel(serverId, config.ticketChannelId, config);
          }, 1000); // Small delay to allow config to save first
        }
      });
    }
  }
  
  // Create Bounty Setup form
  function createBountySetupForm() {
    if (!bountySetupContent) return;
    
    // Create HTML for bounty setup
    const bountyHtml = `
      <div class="bounty-system-container">
        <div class="bounty-header">
          <h3><i class="fas fa-coins"></i> Bounty System Setup</h3>
          <p>Configure the bounty system for your tickets</p>
        </div>
        
        <form id="bounty-setup-form" class="setup-form">
          <input type="hidden" id="bounty-server-id" name="serverId" value="">
          
          <div class="bounty-option">
            <div class="bounty-option-header">
              <div class="bounty-option-icon">
                <i class="fas fa-toggle-on"></i>
              </div>
              <h4 class="bounty-option-title">Enable Bounty System</h4>
            </div>
            <p class="bounty-option-description">
              Allow users to create and claim bounties through tickets
            </p>
            <div class="form-check">
              <input type="checkbox" id="enable-bounties" name="enableBounties" class="form-check-input" checked>
              <label for="enable-bounties" class="form-check-label">Enable bounty system for tickets</label>
            </div>
          </div>
          
          <div class="bounty-option">
            <div class="bounty-option-header">
              <div class="bounty-option-icon">
                <i class="fas fa-user-shield"></i>
              </div>
              <h4 class="bounty-option-title">Bounty Manager Role</h4>
            </div>
            <p class="bounty-option-description">
              Role that can approve bounties and bounty claims
            </p>
            <div class="form-group">
              <select id="bounty-manager-role" name="bountyManagerRoleId" class="form-control" required>
                <option value="">- Select Role -</option>
              </select>
            </div>
          </div>
          
          <div class="bounty-option">
            <div class="bounty-option-header">
              <div class="bounty-option-icon">
                <i class="fas fa-hashtag"></i>
              </div>
              <h4 class="bounty-option-title">Bounty Panel Channel</h4>
            </div>
            <p class="bounty-option-description">
              Channel where the bounty panel will be created
            </p>
            <div class="form-group">
              <select id="bounty-channel" name="bountyChannelId" class="form-control" required>
                <option value="">- Select Channel -</option>
              </select>
            </div>
          </div>
          
          <div class="info-box">
            <p><i class="fas fa-info-circle"></i> The bounty system allows users to create and claim tickets with rewards. Bounty managers can approve claims before rewards are distributed.</p>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="premium-btn premium-primary">
              <i class="fas fa-save"></i> Save & Create Bounty Panel
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Add the form to the tab content
    bountySetupContent.innerHTML = bountyHtml;
    
    // Add form submit event
    const bountyForm = document.getElementById('bounty-setup-form');
    if (bountyForm) {
      bountyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const serverId = selectedServer;
        
        if (!serverId) {
          alert('Please select a server first');
          return;
        }
        
        // Add server ID
        formData.append('serverId', serverId);
        
        // Convert to object
        const config = Object.fromEntries(formData.entries());
        
        // Add boolean values
        config.enableBounties = !!formData.get('enableBounties');
        
        // Send to server
        saveBountyConfig(serverId, config);
      });
    }
  }
  
  // Populate Bounty Setup form
  function populateBountySetup(config) {
    if (!bountySetupContent) return;
    
    // Create the form if it doesn't exist
    if (!document.getElementById('bounty-setup-form')) {
      createBountySetupForm();
    }
    
    // Repopulate role select
    const bountyManagerSelect = document.getElementById('bounty-manager-role');
    if (bountyManagerSelect) {
      // Clear existing options
      while (bountyManagerSelect.options.length > 1) {
        bountyManagerSelect.remove(1);
      }
      
      // Add options
      serverRoles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name;
        bountyManagerSelect.appendChild(option);
      });
    }
    
    // Repopulate channel select
    const bountyChannelSelect = document.getElementById('bounty-channel');
    if (bountyChannelSelect) {
      // Clear existing options
      while (bountyChannelSelect.options.length > 1) {
        bountyChannelSelect.remove(1);
      }
      
      // Filter text channels
      const textChannels = serverChannels.filter(channel => 
        channel.type === 'GUILD_TEXT' || channel.type === 0
      );
      
      // Sort alphabetically
      textChannels.sort((a, b) => a.name.localeCompare(b.name));
      
      // Add options
      textChannels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = channel.name;
        bountyChannelSelect.appendChild(option);
      });
    }
    
    // Populate form values
    if (config.bountyConfig) {
      const enableBounties = document.getElementById('enable-bounties');
      if (enableBounties) {
        enableBounties.checked = !!config.bountyConfig.enableBounties;
      }
      
      const bountyManagerRole = document.getElementById('bounty-manager-role');
      if (bountyManagerRole && config.bountyConfig.bountyManagerRoleId) {
        bountyManagerRole.value = config.bountyConfig.bountyManagerRoleId;
      }
      
      const bountyChannel = document.getElementById('bounty-channel');
      if (bountyChannel && config.bountyConfig.bountyChannelId) {
        bountyChannel.value = config.bountyConfig.bountyChannelId;
      }
    }
  }
  
  // Save ticket configuration
  function saveTicketConfig(serverId, config) {
    updateStatus('Saving ticket configuration...');
    
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
          showSuccess('Ticket configuration saved successfully!');
          
          // Update main settings form
          loadServerData(serverId);
        } else {
          showError(`Failed to save ticket configuration: ${data.error}`);
        }
      })
      .catch(error => {
        console.error('Error saving ticket config:', error);
        showError('An error occurred while saving ticket configuration');
      });
  }
  
  // Save bounty configuration
  function saveBountyConfig(serverId, config) {
    updateStatus('Saving bounty configuration...');
    
    fetch(`/api/v2/servers/${serverId}/bounty-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showSuccess('Bounty configuration saved successfully!');
          
          // Automatically create the bounty panel without asking
          console.log('Creating bounty panel with config:', config);
          createBountyPanel(serverId, config);
        } else {
          showError(`Failed to save bounty configuration: ${data.error}`);
        }
      })
      .catch(error => {
        console.error('Error saving bounty config:', error);
        showError('An error occurred while saving bounty configuration');
      });
  }
  
  // Show success message
  function showSuccess(message) {
    const notificationArea = document.querySelector('.notification-area') || createNotificationArea();
    
    const notification = document.createElement('div');
    notification.className = 'notification success-notification';
    notification.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    `;
    
    notificationArea.appendChild(notification);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  }
  
  // Show error message
  function showError(message) {
    const notificationArea = document.querySelector('.notification-area') || createNotificationArea();
    
    const notification = document.createElement('div');
    notification.className = 'notification error-notification';
    notification.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
    `;
    
    notificationArea.appendChild(notification);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 5000);
  }
  
  // Create notification area
  function createNotificationArea() {
    const notificationArea = document.createElement('div');
    notificationArea.className = 'notification-area';
    document.body.appendChild(notificationArea);
    return notificationArea;
  }
  
  // Update status
  function updateStatus(message) {
    const statusElement = document.querySelector('.status-message');
    if (statusElement) {
      statusElement.textContent = message;
    } else {
      console.log('Status:', message);
    }
  }
  
  // Initialize the forms
  function init() {
    // Create Quick Setup form
    if (quickSetupContent && !document.getElementById('quick-setup-form')) {
      createQuickSetupForm();
    }
    
    // Create Bounty Setup form
    if (bountySetupContent && !document.getElementById('bounty-setup-form')) {
      createBountySetupForm();
    }
    
    // Set up auto-close checkbox event
    const autoClose = document.getElementById('auto-close');
    if (autoClose) {
      autoClose.addEventListener('change', function() {
        const autoCloseSettings = document.querySelectorAll('.auto-close-settings');
        autoCloseSettings.forEach(setting => {
          setting.style.display = this.checked ? 'block' : 'none';
        });
      });
    }
    
    // Set up ticket settings form
    const ticketSettingsForm = document.getElementById('ticket-settings-form');
    if (ticketSettingsForm) {
      ticketSettingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const serverId = selectedServer;
        
        if (!serverId) {
          alert('Please select a server first');
          return;
        }
        
        // Add server ID
        formData.append('serverId', serverId);
        
        // Convert to object
        const config = Object.fromEntries(formData.entries());
        
        // Add boolean values
        config.autoTranscript = !!formData.get('autoTranscript');
        config.autoClose = !!formData.get('autoClose');
        config.requireTopic = !!formData.get('requireTopic');
        config.useThreads = !!formData.get('useThreads');
        
        // Send to server
        saveTicketConfig(serverId, config);
      });
    }
  }
  
  // Create a regular ticket panel
  function createTicketPanel(serverId, channelId, config) {
    updateStatus('Creating ticket panel...');
    
    fetch(`/api/v2/servers/${serverId}/quick-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channelId: channelId,
        config: config
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showSuccess('Ticket panel created successfully!');
        } else {
          showError(`Failed to create ticket panel: ${data.error}`);
        }
      })
      .catch(error => {
        console.error('Error creating ticket panel:', error);
        showError('An error occurred while creating the ticket panel');
      });
  }
  
  // Create a bounty system panel
  function createBountyPanel(serverId, config) {
    updateStatus('Creating bounty panel...');
    
    fetch(`/api/v2/servers/${serverId}/bounty-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channelId: config.bountyChannelId,
        bountyManagerRoleId: config.bountyManagerRoleId,
        titleText: config.titleText || '🏆 SWOOSH Bounty System',
        descriptionText: config.descriptionText || 'Select an option below to interact with the bounty system.',
        panelColor: config.panelColor || '#000000'
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showSuccess('Bounty panel created successfully!');
        } else {
          showError(`Failed to create bounty panel: ${data.error}`);
        }
      })
      .catch(error => {
        console.error('Error creating bounty panel:', error);
        showError('An error occurred while creating the bounty panel');
      });
  }

  // Initialize on load
  init();
});