/**
 * Admin 3D Ticket Quick Setup
 * Premium Edition
 * 
 * JavaScript to handle the quick setup (.setup-tickets) functionality in the admin panel
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Premium ticket quick setup script loaded');
  
  // DOM elements for quick setup
  const setupServerSelect = document.getElementById('setup-server-select');
  const setupChannelId = document.getElementById('setup-channel-id');
  const setupCategoryId = document.getElementById('setup-category-id');
  const setupPanelTitle = document.getElementById('setup-panel-title');
  const setupPanelDescription = document.getElementById('setup-panel-description');
  const setupPanelColor = document.getElementById('setup-panel-color');
  const quickSetupForm = document.getElementById('quick-setup-form');
  const setupResultContainer = document.querySelector('.setup-result-container');
  const setupResultChannel = document.getElementById('setup-result-channel');
  
  // Color preset functionality
  const colorPresets = document.querySelectorAll('#quick-setup-content .color-preset');
  colorPresets.forEach(preset => {
    preset.addEventListener('click', function() {
      const color = this.getAttribute('data-color');
      setupPanelColor.value = color;
    });
  });
  
  // Sync server select with main server selector
  function syncServerSelectors() {
    const mainServerSelect = document.getElementById('server-select');
    
    if (mainServerSelect && setupServerSelect) {
      // Clear existing options except the default
      while (setupServerSelect.options.length > 1) {
        setupServerSelect.remove(1);
      }
      
      // Copy options from main server select
      for (let i = 1; i < mainServerSelect.options.length; i++) {
        const option = mainServerSelect.options[i];
        const newOption = document.createElement('option');
        newOption.value = option.value;
        newOption.textContent = option.textContent;
        setupServerSelect.appendChild(newOption);
      }
    }
  }
  
  // Populate channels and categories when server is selected
  setupServerSelect.addEventListener('change', function() {
    const serverId = this.value;
    if (!serverId) return;
    
    fetchServerChannels(serverId);
    fetchServerCategories(serverId);
  });
  
  // Fetch channels for the selected server
  function fetchServerChannels(serverId) {
    fetch(`/api/discord/servers/${serverId}/channels?type=text`)
      .then(response => response.json())
      .then(data => {
        // Clear existing options except the default
        while (setupChannelId.options.length > 1) {
          setupChannelId.remove(1);
        }
        
        // Add new options
        data.forEach(channel => {
          const option = document.createElement('option');
          option.value = channel.id;
          option.textContent = '#' + channel.name;
          setupChannelId.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error fetching channels:', error);
      });
  }
  
  // Fetch categories for the selected server
  function fetchServerCategories(serverId) {
    fetch(`/api/discord/servers/${serverId}/channels?type=category`)
      .then(response => response.json())
      .then(data => {
        // Clear existing options except the default
        while (setupCategoryId.options.length > 1) {
          setupCategoryId.remove(1);
        }
        
        // Add new options
        data.forEach(category => {
          const option = document.createElement('option');
          option.value = category.id;
          option.textContent = category.name;
          setupCategoryId.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
      });
  }
  
  // Handle form submission
  quickSetupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const serverId = setupServerSelect.value;
    const channelId = setupChannelId.value;
    
    if (!serverId || !channelId) {
      showToast('Please select both a server and a channel', 'error');
      return;
    }
    
    // Get form data
    const formData = {
      serverId: serverId,
      channelId: channelId,
      title: setupPanelTitle.value || '🎫 SWOOSH Support Tickets',
      description: setupPanelDescription.value || 'Please select a ticket type from the dropdown below to get assistance.',
      color: setupPanelColor.value || '#000000',
      categoryId: setupCategoryId.value || '' // Optional
    };
    
    // Show loading state
    const submitBtn = quickSetupForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting up...';
    submitBtn.disabled = true;
    
    // Submit the setup request
    fetch('/api/tickets/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      // Reset button state
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      
      if (data.success) {
        // Show success message
        setupResultChannel.textContent = '#' + data.channelName;
        setupResultContainer.style.display = 'block';
        
        // Scroll to result
        setupResultContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Show success toast
        showToast('Ticket panel set up successfully!', 'success');
        
        // Reset form after successful submission
        quickSetupForm.reset();
        setupPanelTitle.value = '🎫 SWOOSH Support Tickets';
        setupPanelDescription.value = 'Please select a ticket type from the dropdown below to get assistance.';
        setupPanelColor.value = '#000000';
      } else {
        // Show error message
        showToast(data.message || 'Failed to set up ticket panel', 'error');
      }
    })
    .catch(error => {
      console.error('Error setting up ticket panel:', error);
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      showToast('Error setting up ticket panel. Check console for details.', 'error');
    });
  });
  
  // Show toast message
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Hide and remove toast after 5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 5000);
  }
  
  // Initialize
  function initialize() {
    // Set up initial data when main server select changes
    const mainServerSelect = document.getElementById('server-select');
    if (mainServerSelect) {
      mainServerSelect.addEventListener('change', syncServerSelectors);
      
      // Initial sync if main select already has a value
      if (mainServerSelect.value) {
        syncServerSelectors();
      }
    }
  }
  
  // Initialize when document is loaded
  initialize();
});