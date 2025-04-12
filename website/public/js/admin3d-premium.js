/**
 * Premium Admin UI Enhancement
 * Main JavaScript for premium admin interface upgrade
 */

document.addEventListener('DOMContentLoaded', () => {
  initPremiumUI();
});

// Initialize premium UI enhancements
function initPremiumUI() {
  // Apply enhanced styling to core UI elements
  applyPremiumStyles();
  
  // Setup interactive effects
  setupInteractiveEffects();
  
  // Initialize tooltips 
  initPremiumTooltips();
  
  // Log premium UI initialization
  console.log('Premium UI initialized successfully');
}

// Apply premium styles to existing elements
function applyPremiumStyles() {
  // Enhance all buttons with premium styling
  enhanceButtons();
  
  // Enhance all badges with premium styling
  enhanceBadges();
  
  // Enhance all alerts with premium styling
  enhanceAlerts();
  
  // Enhance all cards with premium styling
  enhanceCards();
  
  // Enhance section headers
  enhanceSectionHeaders();
  
  // Enhance tab navigation
  enhanceTabNavigation();
}

// Enhance all buttons with premium styling
function enhanceButtons() {
  const buttons = document.querySelectorAll('button, .btn, .action-btn');
  
  buttons.forEach(button => {
    // Skip buttons that are already enhanced or are special components
    if (button.classList.contains('premium-enhanced') || 
        button.closest('.dropdown-toggle') ||
        button.closest('.nav-link')) {
      return;
    }
    
    // Mark as enhanced
    button.classList.add('premium-enhanced');
    
    // Add hover effect if not present
    if (!button.querySelector('.hover-effect')) {
      const hoverEffect = document.createElement('span');
      hoverEffect.className = 'hover-effect';
      button.appendChild(hoverEffect);
    }
    
    // Add click effect
    button.addEventListener('click', createRippleEffect);
  });
}

// Enhance all badges with premium styling
function enhanceBadges() {
  const badges = document.querySelectorAll('.badge, .status-badge');
  
  badges.forEach(badge => {
    if (badge.classList.contains('premium-enhanced')) return;
    
    badge.classList.add('premium-enhanced');
    
    // Apply premium class based on existing classes
    if (badge.classList.contains('badge-primary')) {
      badge.classList.add('badge-primary');
    } else if (badge.classList.contains('badge-success') || 
               badge.textContent.toLowerCase().includes('active') || 
               badge.textContent.toLowerCase().includes('online') ||
               badge.textContent.toLowerCase().includes('complete')) {
      badge.classList.add('badge-success');
    } else if (badge.classList.contains('badge-warning') || 
               badge.textContent.toLowerCase().includes('pending') ||
               badge.textContent.toLowerCase().includes('processing')) {
      badge.classList.add('badge-warning');
    } else if (badge.classList.contains('badge-danger') || 
               badge.textContent.toLowerCase().includes('error') ||
               badge.textContent.toLowerCase().includes('failed') ||
               badge.textContent.toLowerCase().includes('offline')) {
      badge.classList.add('badge-danger');
    } else {
      badge.classList.add('badge-primary');
    }
  });
}

// Enhance all alerts with premium styling
function enhanceAlerts() {
  const alerts = document.querySelectorAll('.alert, .message-box, .notification');
  
  alerts.forEach(alert => {
    if (alert.classList.contains('premium-enhanced')) return;
    
    alert.classList.add('premium-enhanced');
    
    // Make sure alert has an icon
    if (!alert.querySelector('.alert-icon, .message-icon, .fas, .far, .fa')) {
      const iconContainer = document.createElement('div');
      iconContainer.className = 'alert-icon';
      
      let icon;
      if (alert.classList.contains('alert-success')) {
        icon = 'fa-check-circle';
      } else if (alert.classList.contains('alert-warning')) {
        icon = 'fa-exclamation-triangle';
      } else if (alert.classList.contains('alert-danger')) {
        icon = 'fa-exclamation-circle';
      } else if (alert.classList.contains('alert-info')) {
        icon = 'fa-info-circle';
      } else {
        icon = 'fa-info-circle';
      }
      
      const iconElement = document.createElement('i');
      iconElement.className = `fas ${icon}`;
      iconContainer.appendChild(iconElement);
      
      // Add icon to the beginning of the alert
      alert.insertBefore(iconContainer, alert.firstChild);
    }
    
    // Make sure alert content is wrapped
    if (!alert.querySelector('.alert-content')) {
      // Get all elements except the icon
      const iconElement = alert.querySelector('.alert-icon, .message-icon, .fas, .far, .fa');
      const contentElements = Array.from(alert.childNodes).filter(node => 
        node !== iconElement && 
        (node.nodeType !== 3 || node.textContent.trim() !== '')
      );
      
      // Create content wrapper
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'alert-content';
      
      // Move all content into wrapper
      contentElements.forEach(element => {
        // If it's a text node, wrap it in a paragraph
        if (element.nodeType === 3 && element.textContent.trim() !== '') {
          const paragraph = document.createElement('p');
          paragraph.className = 'alert-message';
          paragraph.textContent = element.textContent;
          contentWrapper.appendChild(paragraph);
        } else {
          contentWrapper.appendChild(element);
        }
      });
      
      // Clear alert and add back icon and content wrapper
      if (iconElement) {
        alert.innerHTML = '';
        alert.appendChild(iconElement);
        alert.appendChild(contentWrapper);
      }
    }
  });
}

// Enhance all cards with premium styling
function enhanceCards() {
  const cards = document.querySelectorAll('.card, .stat-card, .admin3d-card');
  
  cards.forEach(card => {
    if (card.classList.contains('premium-enhanced')) return;
    
    card.classList.add('premium-enhanced');
    
    // Add top border accent if not present
    if (!card.querySelector('.card-accent')) {
      const accent = document.createElement('div');
      accent.className = 'card-accent';
      card.insertBefore(accent, card.firstChild);
    }
  });
}

// Enhance section headers
function enhanceSectionHeaders() {
  const headers = document.querySelectorAll('.section-header, .mod-section-header, .admin3d-section-header');
  
  headers.forEach(header => {
    if (header.classList.contains('premium-enhanced')) return;
    
    header.classList.add('premium-enhanced');
    
    // Make sure title has an icon
    const title = header.querySelector('.section-title, .mod-section-title, .admin3d-section-title, h2, h3');
    if (title && !title.querySelector('i.fas, i.far, i.fa')) {
      // Try to determine appropriate icon
      let iconClass = 'fa-th-large'; // Default icon
      
      // Check title text to choose appropriate icon
      const titleText = title.textContent.toLowerCase();
      if (titleText.includes('dashboard') || titleText.includes('overview')) {
        iconClass = 'fa-tachometer-alt';
      } else if (titleText.includes('user') || titleText.includes('member')) {
        iconClass = 'fa-users';
      } else if (titleText.includes('setting') || titleText.includes('config')) {
        iconClass = 'fa-cogs';
      } else if (titleText.includes('log') || titleText.includes('activity')) {
        iconClass = 'fa-list';
      } else if (titleText.includes('stat') || titleText.includes('analytic')) {
        iconClass = 'fa-chart-line';
      } else if (titleText.includes('ban') || titleText.includes('kick') || titleText.includes('moderation')) {
        iconClass = 'fa-gavel';
      } else if (titleText.includes('warn') || titleText.includes('infraction')) {
        iconClass = 'fa-exclamation-triangle';
      } else if (titleText.includes('automod') || titleText.includes('automatic')) {
        iconClass = 'fa-shield-alt';
      } else if (titleText.includes('escalation') || titleText.includes('tier')) {
        iconClass = 'fa-level-up-alt';
      }
      
      // Create and add the icon
      const icon = document.createElement('i');
      icon.className = `fas ${iconClass}`;
      title.insertBefore(icon, title.firstChild);
    }
  });
}

// Enhance tab navigation
function enhanceTabNavigation() {
  const tabLists = document.querySelectorAll('.nav-tabs, .tab-nav, .admin3d-tabs');
  
  tabLists.forEach(tabList => {
    if (tabList.classList.contains('premium-enhanced')) return;
    
    tabList.classList.add('premium-enhanced');
    
    // Get all tab links
    const tabLinks = tabList.querySelectorAll('.nav-link, .tab-link, .admin3d-tab-link');
    
    // Add click handlers for tabs if they're not already set up
    tabLinks.forEach(tabLink => {
      if (!tabLink.hasAttribute('data-enhanced-tab')) {
        tabLink.setAttribute('data-enhanced-tab', 'true');
        
        tabLink.addEventListener('click', function() {
          // Get the target tab content
          const targetId = this.getAttribute('href') || this.getAttribute('data-tab-target');
          
          if (targetId) {
            // Remove active class from all tabs
            tabLinks.forEach(link => link.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab content
            const tabContainer = document.querySelector('.tab-content, .admin3d-tab-content');
            if (tabContainer) {
              const tabPanes = tabContainer.querySelectorAll('.tab-pane, .admin3d-tab-pane');
              tabPanes.forEach(pane => pane.classList.remove('active', 'show'));
              
              // Show the selected tab content
              const targetPane = targetId.startsWith('#') 
                ? document.querySelector(targetId)
                : document.querySelector(`#${targetId}`);
              
              if (targetPane) {
                targetPane.classList.add('active', 'show');
                
                // Add fade-in animation
                targetPane.style.animation = 'none';
                setTimeout(() => {
                  targetPane.style.animation = 'fadeIn 0.3s forwards';
                }, 10);
              }
            }
          }
        });
      }
    });
  });
}

// Setup interactive effects
function setupInteractiveEffects() {
  // Add ripple effect to clickable elements
  const clickables = document.querySelectorAll('.btn, button, .card, .stat-card, .admin3d-card, .nav-link, .admin3d-tab-link');
  
  clickables.forEach(element => {
    if (!element.hasAttribute('data-ripple-attached')) {
      element.setAttribute('data-ripple-attached', 'true');
      element.addEventListener('click', createRippleEffect);
    }
  });
  
  // Setup scrolling effects
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    // Parallax effect for headers
    const headers = document.querySelectorAll('.section-header, .admin3d-section-header, .mod-section-header');
    headers.forEach(header => {
      const distance = header.getBoundingClientRect().top;
      if (distance > -500 && distance < window.innerHeight) {
        header.style.transform = `translateY(${scrollY * 0.05}px)`;
      }
    });
    
    // Fade in elements as they scroll into view
    const fadeElements = document.querySelectorAll('.card, .stat-card, .admin3d-card, .section-content');
    fadeElements.forEach(element => {
      const position = element.getBoundingClientRect().top;
      
      // If element is in viewport and doesn't have fade-in class
      if (position < window.innerHeight - 100 && !element.classList.contains('has-faded-in')) {
        element.classList.add('fade-in', 'has-faded-in');
      }
    });
  });
}

// Initialize premium tooltips
function initPremiumTooltips() {
  // Find elements with title attributes and convert to data-tooltip attributes
  const elements = document.querySelectorAll('[title]:not([data-tooltip])');
  
  elements.forEach(element => {
    if (element.title && element.title.trim() !== '') {
      // Create data-tooltip attribute from title
      element.setAttribute('data-tooltip', element.title);
      
      // Remove title to prevent default browser tooltip
      element.removeAttribute('title');
    }
  });
}

// Create ripple effect on click
function createRippleEffect(event) {
  const element = this;
  
  // Skip if element already has active ripple
  if (element.querySelectorAll('.ripple.active').length > 0) return;
  
  // Create ripple element
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  element.appendChild(ripple);
  
  // Set position of ripple
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  
  // Activate ripple
  ripple.classList.add('active');
  
  // Remove ripple after animation
  setTimeout(() => {
    ripple.remove();
  }, 600);
}