/**
 * Admin 3D Dashboard - Notifications System
 * Premium edition with advanced notification features
 */

// Store notification container element
let notificationContainer = null;

// Initialize the notification system
document.addEventListener('DOMContentLoaded', () => {
  // Create the notification container if it doesn't exist
  if (!document.getElementById('admin3d-notifications')) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'admin3d-notifications';
    document.body.appendChild(notificationContainer);
    
    // Add styles if not already added
    if (!document.getElementById('admin3d-notification-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'admin3d-notification-styles';
      styleElement.textContent = `
        #admin3d-notifications {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 350px;
          pointer-events: none;
        }
        
        .admin3d-notification {
          padding: 16px;
          border-radius: 12px;
          background-color: rgba(32, 26, 69, 0.9);
          color: #fff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px var(--primary-glow);
          backdrop-filter: blur(10px);
          margin-bottom: 10px;
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateX(50px);
          display: flex;
          align-items: flex-start;
          pointer-events: auto;
          border-left: 3px solid var(--primary);
          overflow: hidden;
          position: relative;
        }
        
        .admin3d-notification.show {
          opacity: 1;
          transform: translateX(0);
        }
        
        .admin3d-notification.hide {
          opacity: 0;
          transform: translateX(50px);
        }
        
        .admin3d-notification.success {
          border-left-color: var(--success);
        }
        
        .admin3d-notification.error {
          border-left-color: var(--danger);
        }
        
        .admin3d-notification.warning {
          border-left-color: var(--warning);
        }
        
        .admin3d-notification.info {
          border-left-color: var(--info);
        }
        
        .admin3d-notification .notification-icon {
          font-size: 20px;
          margin-right: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }
        
        .admin3d-notification.success .notification-icon {
          color: var(--success);
        }
        
        .admin3d-notification.error .notification-icon {
          color: var(--danger);
        }
        
        .admin3d-notification.warning .notification-icon {
          color: var(--warning);
        }
        
        .admin3d-notification.info .notification-icon {
          color: var(--info);
        }
        
        .admin3d-notification .notification-content {
          flex: 1;
        }
        
        .admin3d-notification .notification-title {
          font-weight: 600;
          margin-bottom: 4px;
          font-size: 16px;
        }
        
        .admin3d-notification .notification-message {
          font-size: 14px;
          opacity: 0.8;
          line-height: 1.4;
          word-break: break-word;
        }
        
        .admin3d-notification .notification-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          margin-left: 8px;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
        
        .admin3d-notification .notification-close:hover {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .admin3d-notification .notification-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background-color: rgba(255, 255, 255, 0.2);
          width: 100%;
        }
        
        .admin3d-notification .notification-progress-inner {
          height: 100%;
          width: 100%;
          transition: width linear;
        }
        
        .admin3d-notification.success .notification-progress-inner {
          background-color: var(--success);
        }
        
        .admin3d-notification.error .notification-progress-inner {
          background-color: var(--danger);
        }
        
        .admin3d-notification.warning .notification-progress-inner {
          background-color: var(--warning);
        }
        
        .admin3d-notification.info .notification-progress-inner {
          background-color: var(--info);
        }
        
        @media (max-width: 576px) {
          #admin3d-notifications {
            right: 10px;
            left: 10px;
            max-width: calc(100% - 20px);
          }
        }
      `;
      document.head.appendChild(styleElement);
    }
  } else {
    notificationContainer = document.getElementById('admin3d-notifications');
  }
});

/**
 * Create a notification
 * @param {string} type - Type of notification: 'success', 'error', 'warning', 'info'
 * @param {string} title - Title of notification
 * @param {string} message - Message body of notification
 * @param {number} [duration=5000] - Duration in milliseconds to show the notification
 * @param {boolean} [progress=true] - Whether to show progress bar
 * @returns {HTMLElement} - The notification element
 */
function createNotification(type, title, message, duration = 5000, progress = true) {
  // Make sure the container exists
  if (!notificationContainer) {
    notificationContainer = document.getElementById('admin3d-notifications');
    
    if (!notificationContainer) {
      console.error('Notification container not found!');
      return null;
    }
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `admin3d-notification ${type}`;
  
  // Set icon based on type
  let iconClass = 'fas fa-info-circle';
  switch (type) {
    case 'success':
      iconClass = 'fas fa-check-circle';
      break;
    case 'error':
      iconClass = 'fas fa-exclamation-circle';
      break;
    case 'warning':
      iconClass = 'fas fa-exclamation-triangle';
      break;
    case 'info':
      iconClass = 'fas fa-info-circle';
      break;
  }
  
  // Build notification HTML
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="${iconClass}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">${escapeHTML(title)}</div>
      <div class="notification-message">${escapeHTML(message)}</div>
    </div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
    ${progress ? `
      <div class="notification-progress">
        <div class="notification-progress-inner"></div>
      </div>
    ` : ''}
  `;
  
  // Add close button event
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    closeNotification(notification);
  });
  
  // Add to container
  notificationContainer.appendChild(notification);
  
  // Show notification (after small delay for animation)
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Set progress bar animation
  if (progress) {
    const progressBar = notification.querySelector('.notification-progress-inner');
    if (progressBar) {
      progressBar.style.width = '100%';
      progressBar.style.transitionDuration = `${duration}ms`;
      
      // Start progress animation after small delay
      setTimeout(() => {
        progressBar.style.width = '0%';
      }, 10);
    }
  }
  
  // Set auto-close timer
  if (duration > 0) {
    notification.timeout = setTimeout(() => {
      closeNotification(notification);
    }, duration);
    
    // Pause timeout on hover
    notification.addEventListener('mouseenter', () => {
      clearTimeout(notification.timeout);
      // Also pause progress bar
      if (progress) {
        const progressBar = notification.querySelector('.notification-progress-inner');
        if (progressBar) {
          const computedStyle = window.getComputedStyle(progressBar);
          const width = computedStyle.getPropertyValue('width');
          progressBar.style.transition = 'none';
          progressBar.style.width = width;
        }
      }
    });
    
    // Resume timeout on mouse leave
    notification.addEventListener('mouseleave', () => {
      // Calculate remaining time based on progress width
      let remainingTime = duration;
      if (progress) {
        const progressBar = notification.querySelector('.notification-progress-inner');
        if (progressBar) {
          const computedStyle = window.getComputedStyle(progressBar);
          const width = parseFloat(computedStyle.getPropertyValue('width'));
          const totalWidth = parseFloat(window.getComputedStyle(notification.querySelector('.notification-progress')).getPropertyValue('width'));
          const remainingRatio = width / totalWidth;
          remainingTime = duration * remainingRatio;
          
          // Resume progress animation
          progressBar.style.transition = `width linear ${remainingTime}ms`;
          progressBar.style.width = '0%';
        }
      }
      
      notification.timeout = setTimeout(() => {
        closeNotification(notification);
      }, remainingTime);
    });
  }
  
  return notification;
}

/**
 * Close a notification
 * @param {HTMLElement} notification - The notification element to close
 */
function closeNotification(notification) {
  // Clear any existing timeout
  if (notification.timeout) {
    clearTimeout(notification.timeout);
  }
  
  // Add hide class for animation
  notification.classList.add('hide');
  notification.classList.remove('show');
  
  // Remove after animation completes
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
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

// Export notification functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createNotification,
    closeNotification
  };
}