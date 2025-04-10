/**
 * SWOOSH Bot - Ultra Premium Administration Dashboard - £100,000 Edition
 * Premium Particle Effect System
 * 
 * This script adds floating particle effects to premium containers
 * for a more immersive and luxurious experience.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the particle system
  initializeParticleSystem();
  
  /**
   * Initialize the particle effect system
   */
  function initializeParticleSystem() {
    // Find all premium elements that should have particles
    const premiumContainers = document.querySelectorAll('.premium-edition, .ultra-premium');
    
    // Create particles for each container
    premiumContainers.forEach(container => {
      createParticleContainer(container);
    });
  }
  
  /**
   * Create a particle container for a premium element
   * @param {HTMLElement} container - The container element
   */
  function createParticleContainer(container) {
    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'ultra-particles-container';
    
    // Add to container
    container.appendChild(particleContainer);
    
    // Create particles
    const particleCount = getContainerSize(container);
    createParticles(particleContainer, particleCount);
  }
  
  /**
   * Determine how many particles to create based on container size
   * @param {HTMLElement} container - The container element
   * @returns {number} - Number of particles to create
   */
  function getContainerSize(container) {
    const rect = container.getBoundingClientRect();
    const area = rect.width * rect.height;
    
    // Base particle count on area
    if (area > 500000) return 30; // Very large container
    if (area > 200000) return 20; // Large container
    if (area > 100000) return 15; // Medium container
    return 10; // Small container
  }
  
  /**
   * Create particles within a container
   * @param {HTMLElement} container - The particle container
   * @param {number} count - Number of particles to create
   */
  function createParticles(container, count) {
    for (let i = 0; i < count; i++) {
      createParticle(container);
    }
  }
  
  /**
   * Create a single particle
   * @param {HTMLElement} container - The particle container
   */
  function createParticle(container) {
    // Create particle element
    const particle = document.createElement('div');
    particle.className = 'ultra-particle';
    
    // Random position
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    // Random size
    const size = Math.random() * 5 + 2;
    
    // Random animation duration
    const duration = Math.random() * 10 + 10;
    
    // Random float values
    const floatX = (Math.random() * 40 - 20) + 'px';
    const floatY = (Math.random() * 40 - 20) + 'px';
    
    // Random opacity
    const opacity = Math.random() * 0.4 + 0.1;
    
    // Set styles
    particle.style.left = x + '%';
    particle.style.top = y + '%';
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.setProperty('--float-duration', duration + 's');
    particle.style.setProperty('--float-x', floatX);
    particle.style.setProperty('--float-y', floatY);
    particle.style.setProperty('--particle-opacity', opacity);
    
    // Add to container
    container.appendChild(particle);
  }
});

/**
 * Premium Notification System
 */
class UltraPremiumNotification {
  /**
   * Create a new premium notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {object} options - Additional options
   */
  static show(message, type = 'info', options = {}) {
    // Default options
    const defaultOptions = {
      duration: 5000,
      showIcon: true,
      showProgress: true,
      showCloseButton: true,
      position: 'top-right',
      animation: 'slide-right'
    };
    
    // Merge options
    const settings = { ...defaultOptions, ...options };
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `ultra-premium-notification ${type} ${settings.position} ${settings.animation}`;
    
    // Build notification content
    let notificationContent = '';
    
    // Add icon
    if (settings.showIcon) {
      notificationContent += `
        <div class="notification-icon">
          <i class="fas fa-${this.getIconForType(type)}"></i>
        </div>
      `;
    }
    
    // Add content
    notificationContent += `
      <div class="notification-content">
        <div class="notification-message">${message}</div>
      </div>
    `;
    
    // Add close button
    if (settings.showCloseButton) {
      notificationContent += `
        <button class="notification-close">
          <i class="fas fa-times"></i>
        </button>
      `;
    }
    
    // Add progress bar
    if (settings.showProgress) {
      notificationContent += `
        <div class="notification-progress" style="animation-duration: ${settings.duration}ms"></div>
      `;
    }
    
    // Set notification content
    notification.innerHTML = notificationContent;
    
    // Get notification area (or create it)
    let notificationArea = document.querySelector('.notification-area');
    
    if (!notificationArea) {
      notificationArea = document.createElement('div');
      notificationArea.className = 'notification-area';
      document.body.appendChild(notificationArea);
    }
    
    // Add to notification area
    notificationArea.appendChild(notification);
    
    // Add event listener for close button
    if (settings.showCloseButton) {
      const closeButton = notification.querySelector('.notification-close');
      
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          this.dismiss(notification);
        });
      }
    }
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('notification-visible');
    }, 10);
    
    // Auto dismiss after duration
    if (settings.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification);
      }, settings.duration);
    }
    
    // Return notification element for reference
    return notification;
  }
  
  /**
   * Dismiss a notification
   * @param {HTMLElement} notification - Notification element
   */
  static dismiss(notification) {
    // Add closing class
    notification.classList.add('notification-closing');
    
    // Remove after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
  
  /**
   * Show a success notification
   * @param {string} message - Notification message
   * @param {object} options - Additional options
   */
  static success(message, options = {}) {
    return this.show(message, 'success', options);
  }
  
  /**
   * Show an error notification
   * @param {string} message - Notification message
   * @param {object} options - Additional options
   */
  static error(message, options = {}) {
    return this.show(message, 'error', options);
  }
  
  /**
   * Show a warning notification
   * @param {string} message - Notification message
   * @param {object} options - Additional options
   */
  static warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }
  
  /**
   * Show an info notification
   * @param {string} message - Notification message
   * @param {object} options - Additional options
   */
  static info(message, options = {}) {
    return this.show(message, 'info', options);
  }
  
  /**
   * Get icon for notification type
   * @param {string} type - Notification type
   * @returns {string} - Icon name
   */
  static getIconForType(type) {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'exclamation-circle';
      case 'warning':
        return 'exclamation-triangle';
      case 'info':
      default:
        return 'info-circle';
    }
  }
}

// Expose to global scope
window.UltraPremiumNotification = UltraPremiumNotification;