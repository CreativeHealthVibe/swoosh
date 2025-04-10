/**
 * Admin 3D Dashboard - Notification System
 * Premium edition with stylish, animated notifications
 */

// Container for notifications
let notificationContainer;

// Initialize notification system
function initNotificationSystem() {
  // Create notification container if it doesn't exist
  if (!document.getElementById('notification-container')) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    document.body.appendChild(notificationContainer);
    
    // Add styles if not already added
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        #notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
          pointer-events: none;
        }
        
        .notification {
          background: rgba(30, 26, 69, 0.8);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(90, 85, 135, 0.3);
          color: #fff;
          transform: translateX(120%);
          opacity: 0;
          animation: slideIn 0.3s forwards, fadeOut 0.5s forwards 5s;
          max-width: 100%;
          overflow: hidden;
          pointer-events: auto;
          display: flex;
          flex-direction: column;
        }
        
        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .notification-title {
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .notification-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        
        .notification-close:hover {
          color: #fff;
        }
        
        .notification-message {
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
        }
        
        .notification.success {
          border-left: 4px solid var(--success);
        }
        
        .notification.error {
          border-left: 4px solid var(--danger);
        }
        
        .notification.info {
          border-left: 4px solid var(--info);
        }
        
        .notification.warning {
          border-left: 4px solid var(--warning);
        }
        
        @keyframes slideIn {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        
        @media (max-width: 480px) {
          #notification-container {
            left: 20px;
            right: 20px;
            max-width: calc(100% - 40px);
          }
        }
      `;
      document.head.appendChild(style);
    }
  } else {
    notificationContainer = document.getElementById('notification-container');
  }
}

/**
 * Create a notification
 * @param {string} type - The type of notification ('success', 'error', 'info', 'warning')
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {number} duration - How long to show the notification in ms (default: 5000)
 */
function createNotification(type, title, message, duration = 5000) {
  // Initialize notification system if not already initialized
  if (!notificationContainer) {
    initNotificationSystem();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // Get icon based on type
  let icon;
  switch (type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-times-circle"></i>';
      break;
    case 'info':
      icon = '<i class="fas fa-info-circle"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      icon = '<i class="fas fa-bell"></i>';
  }
  
  // Create notification content
  notification.innerHTML = `
    <div class="notification-header">
      <div class="notification-title">${icon} ${title}</div>
      <button class="notification-close"><i class="fas fa-times"></i></button>
    </div>
    <div class="notification-message">${message}</div>
  `;
  
  // Add close button functionality
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    removeNotification(notification);
  });
  
  // Add to container
  notificationContainer.appendChild(notification);
  
  // Force reflow to trigger animation
  notification.offsetWidth;
  
  // Remove after duration
  setTimeout(() => {
    removeNotification(notification);
  }, duration);
  
  return notification;
}

/**
 * Remove a notification with animation
 * @param {HTMLElement} notification - The notification element to remove
 */
function removeNotification(notification) {
  // Check if notification still exists
  if (!notification || !notification.parentNode) {
    return;
  }
  
  // Add class for exit animation
  notification.style.animation = 'fadeOut 0.3s forwards';
  
  // Remove after animation
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// Initialize on document load
document.addEventListener('DOMContentLoaded', initNotificationSystem);

// Make functions available globally
window.createNotification = createNotification;