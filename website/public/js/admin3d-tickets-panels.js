/**
 * SWOOSH Bot 3D Ticket Panels
 * Premium Edition - Panel interactions
 * 
 * Enhanced interactions for the premium ticket panels interface
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the ticket panels page
  const panelsTab = document.getElementById('panels-tab');
  if (!panelsTab) return;
  
  // Initialize variables
  const panelTitle = document.getElementById('panel-title');
  const panelDescription = document.getElementById('panel-description');
  const panelColor = document.getElementById('panel-color');
  const panelImage = document.getElementById('panel-image');
  const previewTitle = document.getElementById('preview-title');
  const previewDescription = document.getElementById('preview-description');
  const previewImage = document.getElementById('preview-image');
  const previewEmbed = document.getElementById('panel-preview');
  const addTicketTypeBtn = document.getElementById('add-ticket-type');
  const ticketTypesContainer = document.getElementById('ticket-types-container');
  const testImageBtn = document.getElementById('test-image-btn');
  const colorPresets = document.querySelectorAll('.color-preset');
  
  // Update preview when title changes
  if (panelTitle) {
    panelTitle.addEventListener('input', function() {
      previewTitle.textContent = this.value || 'Support Tickets';
    });
  }
  
  // Update preview when description changes
  if (panelDescription) {
    panelDescription.addEventListener('input', function() {
      previewDescription.textContent = this.value || 'Select an option below to create a support ticket. Our team will assist you as soon as possible.';
    });
  }
  
  // Update preview when color changes
  if (panelColor) {
    panelColor.addEventListener('input', function() {
      previewEmbed.style.borderLeftColor = this.value;
    });
  }
  
  // Update preview when image URL changes
  if (panelImage) {
    panelImage.addEventListener('input', function() {
      updatePanelImage(this.value);
    });
  }
  
  // Test image button functionality
  if (testImageBtn) {
    testImageBtn.addEventListener('click', function() {
      const imageUrl = panelImage.value;
      if (imageUrl) {
        updatePanelImage(imageUrl);
        // Show notification
        showNotification('Testing image...', 'info');
      } else {
        showNotification('Please enter an image URL first', 'warning');
      }
    });
  }
  
  // Update panel image in preview
  function updatePanelImage(url) {
    if (url && url.trim() !== '') {
      // Test if the image exists
      const testImage = new Image();
      testImage.onload = function() {
        previewImage.style.backgroundImage = `url(${url})`;
        previewImage.style.display = 'block';
        showNotification('Image loaded successfully', 'success');
      };
      testImage.onerror = function() {
        previewImage.style.display = 'none';
        showNotification('Invalid image URL', 'error');
      };
      testImage.src = url;
    } else {
      previewImage.style.backgroundImage = 'none';
      previewImage.style.display = 'none';
    }
  }
  
  // Add color preset functionality
  if (colorPresets) {
    colorPresets.forEach(preset => {
      preset.addEventListener('click', function() {
        const color = this.getAttribute('data-color');
        panelColor.value = color;
        previewEmbed.style.borderLeftColor = color;
        
        // Add selection effect
        document.querySelectorAll('.color-preset').forEach(p => {
          p.style.transform = 'scale(1)';
          p.style.boxShadow = 'none';
        });
        this.style.transform = 'scale(1.2)';
        this.style.boxShadow = `0 0 10px ${color}`;
      });
    });
  }
  
  // Add new ticket type
  if (addTicketTypeBtn) {
    addTicketTypeBtn.addEventListener('click', function() {
      addTicketType();
    });
  }
  
  // Remove ticket type
  if (ticketTypesContainer) {
    ticketTypesContainer.addEventListener('click', function(e) {
      if (e.target.classList.contains('remove-ticket-type') || e.target.closest('.remove-ticket-type')) {
        const ticketTypeRow = e.target.closest('.ticket-type-row');
        if (ticketTypeRow) {
          // Don't remove if it's the only ticket type
          if (document.querySelectorAll('.ticket-type-row').length > 1) {
            ticketTypeRow.classList.add('removing');
            setTimeout(() => {
              ticketTypeRow.remove();
              updatePreviewButtons();
              updateTicketTypeIndices();
            }, 300);
          } else {
            showNotification('You must have at least one ticket type', 'warning');
          }
        }
      }
    });
    
    // Update emoji display when emoji input changes
    ticketTypesContainer.addEventListener('input', function(e) {
      if (e.target.classList.contains('type-emoji')) {
        const ticketTypeRow = e.target.closest('.ticket-type-row');
        if (ticketTypeRow) {
          const emojiDisplay = ticketTypeRow.querySelector('.type-emoji-display');
          if (emojiDisplay) {
            emojiDisplay.textContent = e.target.value || '🔧';
          }
        }
      }
      
      // Update preview buttons
      if (e.target.classList.contains('type-label') || e.target.classList.contains('type-emoji')) {
        updatePreviewButtons();
      }
    });
  }
  
  // Add a new ticket type
  function addTicketType() {
    const ticketTypeRows = document.querySelectorAll('.ticket-type-row');
    const newIndex = ticketTypeRows.length;
    
    const ticketTypeTemplate = `
      <div class="ticket-type-row" data-index="${newIndex}">
        <div class="ticket-type-card">
          <div class="ticket-type-header">
            <div class="type-emoji-display">🔔</div>
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
                    name="ticketTypes[${newIndex}][label]" placeholder="Label" value="Support Request" required>
            </div>
            <div class="form-group">
              <label>Emoji</label>
              <input type="text" class="form-control type-emoji" 
                    name="ticketTypes[${newIndex}][emoji]" placeholder="Emoji" value="🔔" required>
            </div>
            <div class="form-group">
              <label>Description</label>
              <input type="text" class="form-control type-description" 
                    name="ticketTypes[${newIndex}][description]" placeholder="Description" value="Request support from our team">
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add to container
    ticketTypesContainer.insertAdjacentHTML('beforeend', ticketTypeTemplate);
    
    // Apply entrance animation
    const newTicketType = ticketTypesContainer.lastElementChild;
    newTicketType.style.opacity = '0';
    newTicketType.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      newTicketType.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      newTicketType.style.opacity = '1';
      newTicketType.style.transform = 'translateY(0)';
    }, 10);
    
    // Update preview
    updatePreviewButtons();
  }
  
  // Update the indices of ticket types after removal
  function updateTicketTypeIndices() {
    const ticketTypeRows = document.querySelectorAll('.ticket-type-row');
    ticketTypeRows.forEach((row, index) => {
      row.setAttribute('data-index', index);
      const inputs = row.querySelectorAll('input');
      inputs.forEach(input => {
        const name = input.getAttribute('name');
        if (name) {
          // Replace the index in the name attribute
          const newName = name.replace(/ticketTypes\[\d+\]/, `ticketTypes[${index}]`);
          input.setAttribute('name', newName);
        }
      });
    });
  }
  
  // Update the preview buttons based on ticket types
  function updatePreviewButtons() {
    const previewButtonsContainer = document.querySelector('.preview-embed-buttons');
    if (!previewButtonsContainer) return;
    
    // Clear existing buttons
    previewButtonsContainer.innerHTML = '';
    
    // Get ticket types
    const ticketTypeRows = document.querySelectorAll('.ticket-type-row');
    ticketTypeRows.forEach(row => {
      const labelInput = row.querySelector('.type-label');
      const emojiInput = row.querySelector('.type-emoji');
      
      if (labelInput && emojiInput) {
        const label = labelInput.value || 'Support';
        const emoji = emojiInput.value || '🔧';
        
        const buttonHtml = `
          <button class="preview-button" disabled>
            <span class="preview-emoji">${emoji}</span> ${label}
          </button>
        `;
        
        previewButtonsContainer.insertAdjacentHTML('beforeend', buttonHtml);
      }
    });
  }
  
  // Simple notification system
  function showNotification(message, type = 'info') {
    // Check if notification container exists, create if not
    let notifContainer = document.querySelector('.premium-notifications');
    if (!notifContainer) {
      notifContainer = document.createElement('div');
      notifContainer.className = 'premium-notifications';
      document.body.appendChild(notifContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `premium-notification ${type}`;
    
    // Set icon based on type
    let icon = 'fa-info-circle';
    switch(type) {
      case 'success': icon = 'fa-check-circle'; break;
      case 'error': icon = 'fa-exclamation-circle'; break;
      case 'warning': icon = 'fa-exclamation-triangle'; break;
    }
    
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="fas ${icon}"></i>
      </div>
      <div class="notification-content">
        ${message}
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add to container
    notifContainer.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Auto-remove after delay
    const timeout = setTimeout(() => {
      removeNotification(notification);
    }, 5000);
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        clearTimeout(timeout);
        removeNotification(notification);
      });
    }
  }
  
  // Remove notification with animation
  function removeNotification(notification) {
    notification.classList.add('hiding');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
  
  // Initialize preview
  updatePreviewButtons();
});