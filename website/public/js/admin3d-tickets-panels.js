/**
 * SWOOSH Bot - Admin3D Tickets Panels
 * Premium JavaScript functionality for the ticket panels interface
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize premium notifications container
  if (!document.querySelector('.premium-notifications')) {
    const notificationsContainer = document.createElement('div');
    notificationsContainer.className = 'premium-notifications';
    document.body.appendChild(notificationsContainer);
  }

  // Variables and elements
  const panelForm = document.getElementById('panel-form');
  if (!panelForm) return; // Exit if not on panels page
  
  const ticketTypesContainer = document.getElementById('ticket-types-container');
  const addTicketTypeBtn = document.getElementById('add-ticket-type');
  const testImageBtn = document.getElementById('test-image-btn');
  const panelColorInput = document.getElementById('panel-color');
  const colorPresets = document.querySelectorAll('.color-preset');
  const serverSelect = document.getElementById('server-select');
  
  // Preview elements
  const previewTitle = document.getElementById('preview-title');
  const previewDescription = document.getElementById('preview-description');
  const previewImage = document.getElementById('preview-image');
  const panelPreview = document.getElementById('panel-preview');
  
  // Panel form inputs
  const panelTitleInput = document.getElementById('panel-title');
  const panelDescriptionInput = document.getElementById('panel-description');
  const panelImageInput = document.getElementById('panel-image');
  const panelChannelInput = document.getElementById('panel-channel-id');
  
  // Initialize variables
  let ticketTypeIndex = 1; // Start at 1 since we have a default type
  let currentServerId = null;
  
  // Function to show premium notification
  function showPremiumNotification(message, type = 'info') {
    const notificationsContainer = document.querySelector('.premium-notifications');
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `premium-notification ${type}`;
    
    // Define icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    // Set content
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="fas fa-${icon}"></i>
      </div>
      <div class="notification-content">${message}</div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add to container
    notificationsContainer.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Set up close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.classList.remove('show');
      notification.classList.add('hiding');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.remove('show');
        notification.classList.add('hiding');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }
  
  // Function to update the panel preview
  function updatePanelPreview() {
    // Update title and description
    if (previewTitle) previewTitle.textContent = panelTitleInput.value || 'Support Tickets';
    if (previewDescription) previewDescription.textContent = panelDescriptionInput.value || 'Select an option below to create a support ticket.';
    
    // Update image
    if (previewImage) {
      if (panelImageInput.value) {
        previewImage.style.backgroundImage = `url(${panelImageInput.value})`;
        previewImage.style.display = 'block';
      } else {
        previewImage.style.backgroundImage = '';
        previewImage.style.display = 'none';
      }
    }
    
    // Update panel color
    if (panelPreview) {
      panelPreview.style.borderColor = panelColorInput.value;
    }
    
    // Update ticket buttons in preview
    const previewButtons = document.querySelector('.preview-embed-buttons');
    if (previewButtons) {
      // Clear existing buttons
      previewButtons.innerHTML = '';
      
      // Add a button for each ticket type
      const ticketTypes = document.querySelectorAll('.ticket-type-row');
      ticketTypes.forEach(typeRow => {
        const label = typeRow.querySelector('.type-label').value;
        const emoji = typeRow.querySelector('.type-emoji').value;
        
        const button = document.createElement('button');
        button.className = 'preview-button';
        button.disabled = true;
        button.innerHTML = `<span class="preview-emoji">${emoji}</span> ${label}`;
        
        previewButtons.appendChild(button);
      });
    }
  }
  
  // Function to add new ticket type
  function addTicketType() {
    const ticketTypeRow = document.createElement('div');
    ticketTypeRow.className = 'ticket-type-row';
    ticketTypeRow.dataset.index = ticketTypeIndex;
    
    // Add premium animations for new elements
    ticketTypeRow.style.opacity = '0';
    ticketTypeRow.style.transform = 'translateY(20px)';
    
    ticketTypeRow.innerHTML = `
      <div class="ticket-type-card premium-3d-hover reflection-effect">
        <div class="ticket-type-header">
          <div class="type-emoji-display floating-animation">📝</div>
          <div class="ticket-type-actions">
            <button type="button" class="premium-btn premium-danger premium-sm remove-ticket-type">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="ticket-type-body">
          <div class="form-group">
            <label>Label</label>
            <input type="text" class="form-control type-label" 
                   name="ticketTypes[${ticketTypeIndex}][label]" placeholder="Label" value="New Ticket" required>
          </div>
          <div class="form-group">
            <label>Emoji</label>
            <input type="text" class="form-control type-emoji" 
                   name="ticketTypes[${ticketTypeIndex}][emoji]" placeholder="Emoji" value="📝" required>
          </div>
          <div class="form-group">
            <label>Description</label>
            <input type="text" class="form-control type-description" 
                   name="ticketTypes[${ticketTypeIndex}][description]" placeholder="Description" value="Create a new ticket">
          </div>
        </div>
      </div>
    `;
    
    ticketTypesContainer.appendChild(ticketTypeRow);
    
    // Animate new row appearing
    setTimeout(() => {
      ticketTypeRow.style.opacity = '1';
      ticketTypeRow.style.transform = 'translateY(0)';
    }, 10);
    
    // Add event listeners to the new row
    const typeLabel = ticketTypeRow.querySelector('.type-label');
    const typeEmoji = ticketTypeRow.querySelector('.type-emoji');
    const removeBtn = ticketTypeRow.querySelector('.remove-ticket-type');
    
    // Update emoji display when changed
    typeEmoji.addEventListener('input', function() {
      ticketTypeRow.querySelector('.type-emoji-display').textContent = this.value;
      updatePanelPreview();
    });
    
    // Update preview when label changed
    typeLabel.addEventListener('input', function() {
      updatePanelPreview();
    });
    
    // Remove ticket type
    removeBtn.addEventListener('click', function() {
      ticketTypeRow.classList.add('removing');
      setTimeout(() => {
        ticketTypeRow.remove();
        updatePanelPreview();
        showPremiumNotification('Ticket type removed', 'info');
      }, 300);
    });
    
    // Increment for next time
    ticketTypeIndex++;
    
    // Update preview
    updatePanelPreview();
    
    // Show notification
    showPremiumNotification('New ticket type added', 'success');
  }
  
  // Function to load channels for the selected server
  function loadChannels(serverId) {
    if (!serverId || serverId === currentServerId) return;
    currentServerId = serverId;
    
    // Clear channel selection
    if (panelChannelInput) {
      panelChannelInput.innerHTML = '<option value="">- Select Channel -</option>';
      panelChannelInput.disabled = true;
    }
    
    // Show loading notification
    showPremiumNotification('Loading channels...', 'info');
    
    // Fetch channels from API
    fetch(`/api/v2/servers/${serverId}/channels`)
      .then(response => response.json())
      .then(data => {
        if (panelChannelInput) {
          panelChannelInput.disabled = false;
          
          // Add channels to dropdown
          data.forEach(channel => {
            // Only show text channels
            if (channel.type === 0) {
              const option = document.createElement('option');
              option.value = channel.id;
              option.textContent = `#${channel.name}`;
              panelChannelInput.appendChild(option);
            }
          });
          
          showPremiumNotification('Channels loaded successfully', 'success');
        }
      })
      .catch(error => {
        console.error('Error loading channels:', error);
        showPremiumNotification('Failed to load channels', 'error');
      });
      
    // Load existing panels
    loadExistingPanels(serverId);
  }
  
  // Function to load existing panels
  function loadExistingPanels(serverId) {
    const existingPanelsList = document.getElementById('existing-panels');
    if (!existingPanelsList) return;
    
    // Reset the existing panels list
    existingPanelsList.innerHTML = `
      <div class="panel-loading-state">
        <i class="fas fa-circle-notch fa-spin"></i>
        <p>Loading existing panels...</p>
      </div>
    `;
    
    // Fetch panels from API
    fetch(`/api/v2/servers/${serverId}/tickets`)
      .then(response => response.json())
      .then(data => {
        // Clear loading state
        existingPanelsList.innerHTML = '';
        
        if (data.length === 0) {
          // Show empty state
          existingPanelsList.innerHTML = `
            <div class="panel-empty-state reflection-effect">
              <i class="fas fa-info-circle floating-animation"></i>
              <p>No panels have been created yet for this server</p>
            </div>
          `;
          return;
        }
        
        // Add panels to list
        data.forEach(panel => {
          const panelElement = document.createElement('div');
          panelElement.className = 'panel-item premium-3d-hover';
          panelElement.style.borderLeft = `4px solid ${panel.color || '#000000'}`;
          
          panelElement.innerHTML = `
            <div class="panel-item-header">
              <div class="panel-item-title">${panel.title || 'Untitled Panel'}</div>
              <div class="panel-item-actions">
                <button class="premium-btn premium-danger premium-sm delete-panel" data-panel-id="${panel.id}">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
            <div class="panel-item-body">
              <div class="panel-item-channel">
                <i class="fas fa-hashtag"></i> ${panel.channelName || 'Unknown Channel'}
              </div>
              <div class="panel-item-types">
                <span class="panel-item-types-count">
                  <i class="fas fa-ticket-alt"></i> ${panel.ticketTypes?.length || 0} ticket types
                </span>
              </div>
            </div>
          `;
          
          existingPanelsList.appendChild(panelElement);
          
          // Add event listener for delete button
          const deleteBtn = panelElement.querySelector('.delete-panel');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
              e.preventDefault();
              const panelId = this.dataset.panelId;
              if (confirm('Are you sure you want to delete this panel?')) {
                deletePanel(serverId, panelId, panelElement);
              }
            });
          }
        });
      })
      .catch(error => {
        console.error('Error loading existing panels:', error);
        existingPanelsList.innerHTML = `
          <div class="panel-error-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>Failed to load existing panels</p>
          </div>
        `;
        showPremiumNotification('Failed to load existing panels', 'error');
      });
  }
  
  // Function to delete a panel
  function deletePanel(serverId, panelId, element) {
    // Show loading state
    element.classList.add('deleting');
    showPremiumNotification('Deleting panel...', 'info');
    
    // Delete the panel
    fetch(`/api/v2/servers/${serverId}/tickets/${panelId}`, {
      method: 'DELETE'
    })
      .then(response => {
        if (response.ok) {
          // Remove the element with animation
          element.style.height = element.offsetHeight + 'px';
          element.style.opacity = '0';
          element.style.transform = 'translateX(50px)';
          
          setTimeout(() => {
            element.remove();
            
            // Check if there are no more panels
            const existingPanelsList = document.getElementById('existing-panels');
            if (existingPanelsList && existingPanelsList.children.length === 0) {
              existingPanelsList.innerHTML = `
                <div class="panel-empty-state reflection-effect">
                  <i class="fas fa-info-circle floating-animation"></i>
                  <p>No panels have been created yet for this server</p>
                </div>
              `;
            }
            
            showPremiumNotification('Panel deleted successfully', 'success');
          }, 300);
        } else {
          throw new Error('Failed to delete panel');
        }
      })
      .catch(error => {
        console.error('Error deleting panel:', error);
        element.classList.remove('deleting');
        showPremiumNotification('Failed to delete panel', 'error');
      });
  }
  
  // Event: Add new ticket type button
  if (addTicketTypeBtn) {
    addTicketTypeBtn.addEventListener('click', addTicketType);
  }
  
  // Event: Test image button
  if (testImageBtn) {
    testImageBtn.addEventListener('click', function() {
      const imageUrl = panelImageInput.value;
      if (!imageUrl) {
        showPremiumNotification('Please enter an image URL to test', 'warning');
        return;
      }
      
      // Create a test image
      const testImage = new Image();
      testImage.onload = function() {
        showPremiumNotification('Image loaded successfully!', 'success');
        if (previewImage) {
          previewImage.style.backgroundImage = `url(${imageUrl})`;
          previewImage.style.display = 'block';
        }
      };
      
      testImage.onerror = function() {
        showPremiumNotification('Failed to load image. Please check the URL.', 'error');
      };
      
      testImage.src = imageUrl;
    });
  }
  
  // Event: Color input change
  if (panelColorInput) {
    panelColorInput.addEventListener('input', function() {
      updatePanelPreview();
      
      // Remove selected class from all presets
      colorPresets.forEach(preset => preset.classList.remove('selected'));
    });
  }
  
  // Event: Color preset click
  colorPresets.forEach(preset => {
    preset.addEventListener('click', function() {
      const color = this.dataset.color;
      panelColorInput.value = color;
      
      // Update preview
      updatePanelPreview();
      
      // Update selected preset
      colorPresets.forEach(p => p.classList.remove('selected'));
      this.classList.add('selected');
      
      // Show notification
      showPremiumNotification('Color preset applied', 'success');
    });
  });
  
  // Event: Panel title, description, and image changes
  if (panelTitleInput) {
    panelTitleInput.addEventListener('input', updatePanelPreview);
  }
  
  if (panelDescriptionInput) {
    panelDescriptionInput.addEventListener('input', updatePanelPreview);
  }
  
  if (panelImageInput) {
    panelImageInput.addEventListener('input', function() {
      // Only update if it's a complete URL
      if (this.value.startsWith('http')) {
        updatePanelPreview();
      } else if (!this.value) {
        // Clear image if field is empty
        if (previewImage) {
          previewImage.style.backgroundImage = '';
          previewImage.style.display = 'none';
        }
      }
    });
  }
  
  // Event: Server select change
  if (serverSelect) {
    serverSelect.addEventListener('change', function() {
      const serverId = this.value;
      loadChannels(serverId);
    });
    
    // Load channels for initial server if selected
    if (serverSelect.value) {
      loadChannels(serverSelect.value);
    }
  }
  
  // Event: Panel form submit
  if (panelForm) {
    panelForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Check if server is selected
      if (!serverSelect || !serverSelect.value) {
        showPremiumNotification('Please select a server', 'error');
        return;
      }
      
      // Check if channel is selected
      if (!panelChannelInput.value) {
        showPremiumNotification('Please select a channel', 'error');
        return;
      }
      
      // Collect form data
      const formData = new FormData(panelForm);
      const serverId = serverSelect.value;
      
      // Convert form data to JSON
      const jsonData = {
        channelId: formData.get('channelId'),
        title: formData.get('panelTitle'),
        description: formData.get('panelDescription'),
        color: formData.get('panelColor'),
        image: formData.get('panelImage'),
        ticketTypes: []
      };
      
      // Collect ticket types
      const typeRows = document.querySelectorAll('.ticket-type-row');
      typeRows.forEach(row => {
        const index = row.dataset.index;
        jsonData.ticketTypes.push({
          label: formData.get(`ticketTypes[${index}][label]`),
          emoji: formData.get(`ticketTypes[${index}][emoji]`),
          description: formData.get(`ticketTypes[${index}][description]`) || ''
        });
      });
      
      // Show loading notification
      showPremiumNotification('Creating ticket panel...', 'info');
      
      // Send to API
      fetch(`/api/v2/servers/${serverId}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Failed to create panel');
        })
        .then(data => {
          showPremiumNotification('Ticket panel created successfully!', 'success');
          
          // Reset form
          panelTitleInput.value = 'Support Tickets';
          panelDescriptionInput.value = 'Select an option below to create a support ticket. Our team will assist you as soon as possible.';
          panelImageInput.value = '';
          panelColorInput.value = '#000000';
          
          // Reset ticket types
          ticketTypesContainer.innerHTML = `
            <div class="ticket-type-row" data-index="0">
              <div class="ticket-type-card premium-3d-hover reflection-effect">
                <div class="ticket-type-header">
                  <div class="type-emoji-display floating-animation">🔧</div>
                  <div class="ticket-type-actions">
                    <button type="button" class="premium-btn premium-danger premium-sm remove-ticket-type">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <div class="ticket-type-body">
                  <div class="form-group">
                    <label>Label</label>
                    <input type="text" class="form-control type-label" 
                           name="ticketTypes[0][label]" placeholder="Label" value="General Support" required>
                  </div>
                  <div class="form-group">
                    <label>Emoji</label>
                    <input type="text" class="form-control type-emoji" 
                           name="ticketTypes[0][emoji]" placeholder="Emoji" value="🔧" required>
                  </div>
                  <div class="form-group">
                    <label>Description</label>
                    <input type="text" class="form-control type-description" 
                           name="ticketTypes[0][description]" placeholder="Description" value="General questions and support">
                  </div>
                </div>
              </div>
            </div>
          `;
          
          // Reset ticket type index
          ticketTypeIndex = 1;
          
          // Reset color presets
          colorPresets.forEach(preset => preset.classList.remove('selected'));
          
          // Update preview
          updatePanelPreview();
          
          // Reload panels
          loadExistingPanels(serverId);
          
          // Add event listeners to the default row
          const defaultRow = document.querySelector('.ticket-type-row[data-index="0"]');
          const defaultEmoji = defaultRow.querySelector('.type-emoji');
          const defaultLabel = defaultRow.querySelector('.type-label');
          const defaultRemoveBtn = defaultRow.querySelector('.remove-ticket-type');
          
          defaultEmoji.addEventListener('input', function() {
            defaultRow.querySelector('.type-emoji-display').textContent = this.value;
            updatePanelPreview();
          });
          
          defaultLabel.addEventListener('input', updatePanelPreview);
          
          defaultRemoveBtn.addEventListener('click', function() {
            showPremiumNotification('Cannot remove the default ticket type', 'warning');
          });
        })
        .catch(error => {
          console.error('Error creating panel:', error);
          showPremiumNotification('Failed to create ticket panel. Please try again.', 'error');
        });
    });
  }
  
  // Set up event listeners for default ticket type
  const defaultRow = document.querySelector('.ticket-type-row[data-index="0"]');
  if (defaultRow) {
    const defaultEmoji = defaultRow.querySelector('.type-emoji');
    const defaultLabel = defaultRow.querySelector('.type-label');
    const defaultRemoveBtn = defaultRow.querySelector('.remove-ticket-type');
    
    if (defaultEmoji) {
      defaultEmoji.addEventListener('input', function() {
        defaultRow.querySelector('.type-emoji-display').textContent = this.value;
        updatePanelPreview();
      });
    }
    
    if (defaultLabel) {
      defaultLabel.addEventListener('input', updatePanelPreview);
    }
    
    if (defaultRemoveBtn) {
      defaultRemoveBtn.addEventListener('click', function() {
        showPremiumNotification('Cannot remove the default ticket type', 'warning');
      });
    }
  }
  
  // Initialize preview
  updatePanelPreview();
  
  // Add premium classes to color presets
  colorPresets.forEach(preset => {
    preset.classList.add('premium-3d-hover');
  });
  
  // Welcome notification
  setTimeout(() => {
    showPremiumNotification('Welcome to the premium ticket panel manager!', 'info');
  }, 1000);
});