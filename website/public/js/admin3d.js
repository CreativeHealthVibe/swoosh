/**
 * SWOOSH Bot 3D Admin Dashboard
 * Premium Edition - £50,000 Value
 * 
 * UI interaction handling and functionality
 * for the 3D admin dashboard interface.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const body = document.querySelector('body');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const flashMessages = document.querySelectorAll('.flash-message');
  const notificationArea = document.querySelector('.notification-area');
  
  // Toggle sidebar visibility
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      body.classList.toggle('sidebar-collapsed');
      body.classList.toggle('sidebar-open');
      
      // Store preference in local storage
      localStorage.setItem('sidebarState', 
        body.classList.contains('sidebar-collapsed') ? 'collapsed' : 'expanded'
      );
    });
    
    // Restore sidebar state from local storage
    const sidebarState = localStorage.getItem('sidebarState');
    if (sidebarState === 'collapsed') {
      body.classList.add('sidebar-collapsed');
    }
  }
  
  // Handle flash message dismissal
  flashMessages.forEach(message => {
    const closeBtn = message.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        message.style.opacity = '0';
        setTimeout(() => {
          message.style.display = 'none';
        }, 300);
      });
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => {
          message.style.display = 'none';
        }, 300);
      }, 5000);
    }
  });
  
  // Form submission handling with loading overlay
  const forms = document.querySelectorAll('form[data-loading="true"]');
  const loadingOverlay = document.querySelector('.loading-overlay');
  
  forms.forEach(form => {
    form.addEventListener('submit', () => {
      loadingOverlay.style.display = 'flex';
    });
  });
  
  // Ajax form submission
  const ajaxForms = document.querySelectorAll('form[data-ajax="true"]');
  
  ajaxForms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
      }
      
      try {
        // Collect form data
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
          data[key] = value;
        });
        
        // Send request
        const response = await fetch(form.action, {
          method: form.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        // Handle response
        if (result.success) {
          showNotification('success', 'Success', result.message);
          
          // Reset form if specified
          if (form.dataset.reset === 'true') {
            form.reset();
          }
          
          // Execute optional callback
          if (form.dataset.callback) {
            window[form.dataset.callback](result);
          }
        } else {
          showNotification('error', 'Error', result.message || 'An unknown error occurred');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        showNotification('error', 'Error', 'An unexpected error occurred while processing your request');
      } finally {
        // Restore button state
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  });
  
  // Initialize tabs if present
  initTabs();
  
  // Initialize charts if present
  if (typeof initCharts === 'function') {
    initCharts();
  }
  
  // Initialize premium features showcase
  initPremiumFeatures();
  
  // Setup WebSocket connection for real-time updates
  setupWebSocket();
});

/**
 * Show a notification to the user
 * 
 * @param {string} type - The type of notification ('success', 'error', 'warning', 'info')
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 */
function showNotification(type, title, message) {
  const notificationArea = document.querySelector('.notification-area');
  if (!notificationArea) return;
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // Set icon based on type
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  // Add content
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-${icon}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add notification to the DOM
  notificationArea.appendChild(notification);
  
  // Setup close button
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
  
  // Play notification sound
  playNotificationSound(type);
}

/**
 * Play a notification sound
 * 
 * @param {string} type - The type of notification
 */
function playNotificationSound(type) {
  let sound;
  
  switch (type) {
    case 'success':
      sound = new Audio('/sounds/success.mp3');
      break;
    case 'error':
      sound = new Audio('/sounds/error.mp3');
      break;
    case 'warning':
      sound = new Audio('/sounds/warning.mp3');
      break;
    default:
      sound = new Audio('/sounds/notification.mp3');
  }
  
  // Attempt to play if audio was created successfully
  if (sound) {
    sound.volume = 0.5;
    sound.play().catch(error => {
      // Ignore errors - audio may not be available or user hasn't interacted with page
      console.log('Audio playback prevented by browser', error);
    });
  }
}

/**
 * Initialize tab functionality
 */
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  if (!tabButtons.length) return;
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Get the tab to display from the button
      const tabId = button.getAttribute('data-tab');
      if (!tabId) return;
      
      // Get all tabs and buttons in the container
      const tabContainer = button.closest('.tabs-container');
      if (!tabContainer) return;
      
      const allButtons = tabContainer.querySelectorAll('.tab-btn');
      const allTabs = tabContainer.querySelectorAll('.tab-content');
      
      // Hide all tabs and deactivate all buttons
      allTabs.forEach(tab => tab.classList.remove('active'));
      allButtons.forEach(btn => btn.classList.remove('active'));
      
      // Show the selected tab and activate the button
      const selectedTab = tabContainer.querySelector(`#${tabId}`);
      if (selectedTab) {
        selectedTab.classList.add('active');
        button.classList.add('active');
      }
      
      // Store active tab in localStorage if tab has an ID
      if (tabContainer.id) {
        localStorage.setItem(`activeTab-${tabContainer.id}`, tabId);
      }
    });
  });
  
  // Restore active tabs from localStorage
  const tabContainers = document.querySelectorAll('.tabs-container[id]');
  tabContainers.forEach(container => {
    const activeTabId = localStorage.getItem(`activeTab-${container.id}`);
    if (activeTabId) {
      const tabButton = container.querySelector(`.tab-btn[data-tab="${activeTabId}"]`);
      if (tabButton) tabButton.click();
    } else {
      // Activate first tab by default
      const firstButton = container.querySelector('.tab-btn');
      if (firstButton) firstButton.click();
    }
  });
}

/**
 * Initialize premium features showcase
 */
function initPremiumFeatures() {
  // Add premium badge to premium features
  const premiumFeatures = document.querySelectorAll('[data-premium="true"]');
  
  premiumFeatures.forEach(feature => {
    const badge = document.createElement('div');
    badge.className = 'premium-badge';
    badge.innerHTML = '<i class="fas fa-crown"></i> Premium';
    
    // Add badge at the appropriate position
    if (feature.classList.contains('admin3d-card')) {
      // For cards, add to the header
      const header = feature.querySelector('.admin3d-card-header');
      if (header) {
        header.appendChild(badge);
      } else {
        feature.appendChild(badge);
      }
    } else {
      // For other elements, add it directly
      feature.appendChild(badge);
    }
    
    // Add premium feature class for visual effects
    feature.classList.add('premium-feature');
  });
  
  // Add premium price tag if element exists
  const priceTag = document.querySelector('.premium-price-tag');
  if (priceTag) {
    priceTag.innerHTML = `
      <span class="price-currency">£</span>
      <span class="price-value">50,000</span>
    `;
    priceTag.classList.add('price-tag');
  }
}

/**
 * Set up WebSocket connection for real-time updates
 */
function setupWebSocket() {
  // Determine if we should connect (only on dashboard pages)
  const shouldConnect = document.querySelector('[data-realtime="true"]');
  if (!shouldConnect) return;
  
  // Create WebSocket connection
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  let socket;
  let reconnectInterval = 1000; // Start with 1 second
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  
  function connect() {
    try {
      socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        reconnectInterval = 1000; // Reset reconnect interval
        reconnectAttempts = 0;
        
        // Update connection status indicator
        updateConnectionStatus(true);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        updateConnectionStatus(false);
        
        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && event.code !== 1001) {
          reconnect();
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket.close();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      reconnect();
    }
  }
  
  function reconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }
    
    reconnectAttempts++;
    
    // Exponential backoff with a maximum of 30 seconds
    reconnectInterval = Math.min(30000, reconnectInterval * 1.5);
    
    console.log(`Attempting to reconnect in ${reconnectInterval/1000} seconds...`);
    
    setTimeout(() => {
      connect();
    }, reconnectInterval);
  }
  
  function updateConnectionStatus(isConnected) {
    const statusIndicator = document.querySelector('.connection-status i');
    const statusText = document.querySelector('.connection-status span');
    
    if (statusIndicator && statusText) {
      if (isConnected) {
        statusIndicator.className = 'fas fa-circle connected';
        statusText.textContent = 'Bot Online';
      } else {
        statusIndicator.className = 'fas fa-circle disconnected';
        statusText.textContent = 'Bot Offline';
      }
    }
  }
  
  // Start connection
  connect();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, 'Page unloaded');
    }
  });
}

/**
 * Handle incoming WebSocket messages
 * 
 * @param {Object} data - The parsed WebSocket message data
 */
function handleWebSocketMessage(data) {
  // Check if this is a stats update
  if (data.type === 'stats') {
    updateDashboardStats(data);
  }
  
  // Check if this is a notification
  else if (data.type === 'notification') {
    showNotification(
      data.notificationType || 'info',
      data.title || 'Notification',
      data.message || 'You have a new notification'
    );
  }
  
  // Log other message types
  else {
    console.log('Received WebSocket message:', data);
  }
}

/**
 * Update dashboard statistics with real-time data
 * 
 * @param {Object} data - The stats data
 */
function updateDashboardStats(data) {
  // Update server count
  const serverCountElement = document.getElementById('server-count');
  if (serverCountElement && data.servers) {
    updateStatWithAnimation(serverCountElement, data.servers);
  }
  
  // Update user count
  const userCountElement = document.getElementById('user-count');
  if (userCountElement && data.users) {
    updateStatWithAnimation(userCountElement, data.users);
  }
  
  // Update memory usage
  const memoryUsageElement = document.getElementById('memory-usage');
  if (memoryUsageElement && data.memory) {
    const memoryPercent = Math.round((data.memory.used / data.memory.total) * 100);
    updateStatWithAnimation(memoryUsageElement, `${memoryPercent}%`);
    
    // Update progress bar if it exists
    const memoryProgressBar = document.getElementById('memory-progress');
    if (memoryProgressBar) {
      memoryProgressBar.style.width = `${memoryPercent}%`;
      
      // Change color based on usage
      if (memoryPercent > 90) {
        memoryProgressBar.style.backgroundColor = 'var(--danger)';
      } else if (memoryPercent > 70) {
        memoryProgressBar.style.backgroundColor = 'var(--warning)';
      } else {
        memoryProgressBar.style.backgroundColor = 'var(--success)';
      }
    }
  }
  
  // Update CPU usage
  const cpuUsageElement = document.getElementById('cpu-usage');
  if (cpuUsageElement && data.cpu) {
    const cpuPercent = Math.round(data.cpu * 100);
    updateStatWithAnimation(cpuUsageElement, `${cpuPercent}%`);
    
    // Update progress bar if it exists
    const cpuProgressBar = document.getElementById('cpu-progress');
    if (cpuProgressBar) {
      cpuProgressBar.style.width = `${cpuPercent}%`;
      
      // Change color based on usage
      if (cpuPercent > 90) {
        cpuProgressBar.style.backgroundColor = 'var(--danger)';
      } else if (cpuPercent > 70) {
        cpuProgressBar.style.backgroundColor = 'var(--warning)';
      } else {
        cpuProgressBar.style.backgroundColor = 'var(--success)';
      }
    }
  }
  
  // Update uptime
  const uptimeElement = document.getElementById('uptime');
  if (uptimeElement && data.uptime) {
    const uptimeStr = formatUptime(data.uptime);
    uptimeElement.textContent = uptimeStr;
  }
  
  // Update charts if they exist and the function is available
  if (typeof updateCharts === 'function' && data.charts) {
    updateCharts(data.charts);
  }
}

/**
 * Update a stat element with animation
 * 
 * @param {HTMLElement} element - The element to update
 * @param {number|string} newValue - The new value
 */
function updateStatWithAnimation(element, newValue) {
  // Get current value
  const currentValue = element.textContent;
  
  // If it's a number without units, animate counting
  if (!isNaN(currentValue) && !isNaN(newValue)) {
    animateCount(element, parseInt(currentValue), parseInt(newValue));
  } 
  // For percentage or other format with units
  else if (typeof newValue === 'string' && newValue.includes('%')) {
    const currentPercent = parseInt(currentValue);
    const newPercent = parseInt(newValue);
    
    if (!isNaN(currentPercent) && !isNaN(newPercent)) {
      animateCount(element, currentPercent, newPercent, '%');
    } else {
      element.textContent = newValue;
    }
  }
  // For other formats, just update directly
  else {
    element.textContent = newValue;
  }
}

/**
 * Animate counting from one number to another
 * 
 * @param {HTMLElement} element - The element to update
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {string} suffix - Optional suffix like '%'
 */
function animateCount(element, start, end, suffix = '') {
  // Determine animation duration based on the difference
  const diff = Math.abs(end - start);
  const duration = Math.min(2000, Math.max(400, diff * 10));
  
  // Animation variables
  const startTime = performance.now();
  const endTime = startTime + duration;
  
  // Animation function
  function updateCount() {
    const now = performance.now();
    const progress = Math.min(1, (now - startTime) / duration);
    
    // Use easeOutExpo for natural deceleration
    const easeOutExpo = 1 - Math.pow(1 - progress, 5);
    
    const currentValue = Math.round(start + (end - start) * easeOutExpo);
    element.textContent = currentValue + suffix;
    
    if (now < endTime) {
      requestAnimationFrame(updateCount);
    } else {
      element.textContent = end + suffix;
    }
  }
  
  // Start animation
  requestAnimationFrame(updateCount);
}

/**
 * Format uptime string
 * 
 * @param {Object} uptime - Uptime object with days, hours, minutes, seconds
 * @returns {string} Formatted uptime string
 */
function formatUptime(uptime) {
  const parts = [];
  
  if (uptime.days > 0) {
    parts.push(`${uptime.days}d`);
  }
  
  if (uptime.hours > 0 || parts.length > 0) {
    parts.push(`${uptime.hours}h`);
  }
  
  if (uptime.minutes > 0 || parts.length > 0) {
    parts.push(`${uptime.minutes}m`);
  }
  
  parts.push(`${uptime.seconds}s`);
  
  return parts.join(' ');
}