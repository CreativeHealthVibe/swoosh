/**
 * Ultra Premium Effects for Admin3D Interface
 * Adds advanced animations, interactive effects and premium visual enhancements
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all premium effects
  initPremiumCards();
  initPremiumButtons();
  init3DEffects();
  initDynamicReflections();
  initPremiumParticles();
  addButtonRippleEffects();
  enhanceStatusIndicators();
});

/**
 * Initialize premium card effects
 */
function initPremiumCards() {
  const premiumCards = document.querySelectorAll('.premium-card, .premium-3d-hover');
  
  premiumCards.forEach(card => {
    // Skip if already initialized
    if (card.dataset.premiumInitialized) return;
    
    // Add mousemove event for 3D tilt effect
    card.addEventListener('mousemove', handleCardTilt);
    
    // Add mouseenter event
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px) scale(1.02)';
      const icons = this.querySelectorAll('i, .stat-icon');
      icons.forEach(icon => {
        icon.style.textShadow = '0 0 8px rgba(255, 255, 255, 0.8)';
        icon.style.transform = 'scale(1.1)';
      });
    });
    
    // Add mouseleave event
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      const icons = this.querySelectorAll('i, .stat-icon');
      icons.forEach(icon => {
        icon.style.textShadow = '0 0 0 rgba(255, 255, 255, 0)';
        icon.style.transform = 'scale(1)';
      });
      
      // Reset any 3D transform
      this.style.transform = '';
    });
    
    // Mark as initialized
    card.dataset.premiumInitialized = true;
  });
}

/**
 * Handle 3D tilt effect on cards
 * @param {Event} e - Mouse event
 */
function handleCardTilt(e) {
  const card = e.currentTarget;
  const cardRect = card.getBoundingClientRect();
  const centerX = cardRect.left + cardRect.width / 2;
  const centerY = cardRect.top + cardRect.height / 2;
  const mouseX = e.clientX;
  const mouseY = e.clientY;
  
  // Calculate distance from center (in percentage)
  const percentX = (mouseX - centerX) / (cardRect.width / 2);
  const percentY = (mouseY - centerY) / (cardRect.height / 2);
  
  // Limit tilt angle
  const maxTilt = 10;
  const tiltX = maxTilt * percentY * -1;
  const tiltY = maxTilt * percentX;
  
  // Apply transform
  card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
  
  // Add shine effect
  const glare = card.querySelector('.card-glare') || document.createElement('div');
  if (!card.querySelector('.card-glare')) {
    glare.className = 'card-glare';
    glare.style.position = 'absolute';
    glare.style.top = '0';
    glare.style.left = '0';
    glare.style.width = '100%';
    glare.style.height = '100%';
    glare.style.opacity = '0';
    glare.style.pointerEvents = 'none';
    glare.style.backgroundImage = 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)';
    glare.style.transition = 'opacity 0.3s ease';
    glare.style.zIndex = '1';
    card.style.position = card.style.position === 'static' ? 'relative' : card.style.position;
    card.style.overflow = 'hidden';
    card.appendChild(glare);
  }
  
  // Position the glare based on mouse position
  const glareX = 100 * (mouseX - cardRect.left) / cardRect.width;
  const glareY = 100 * (mouseY - cardRect.top) / cardRect.height;
  glare.style.backgroundPosition = `${glareX}% ${glareY}%`;
  glare.style.opacity = '0.7';
}

/**
 * Initialize premium button effects
 */
function initPremiumButtons() {
  const premiumButtons = document.querySelectorAll('.premium-btn, button.premium-primary, button.premium-secondary');
  
  premiumButtons.forEach(button => {
    // Skip if already initialized
    if (button.dataset.premiumInitialized) return;
    
    // Add hover effect
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      const icons = this.querySelectorAll('i');
      icons.forEach(icon => {
        icon.style.transform = 'translateX(-2px)';
      });
    });
    
    // Reset on mouse leave
    button.addEventListener('mouseleave', function() {
      this.style.transform = '';
      const icons = this.querySelectorAll('i');
      icons.forEach(icon => {
        icon.style.transform = '';
      });
    });
    
    // Mark as initialized
    button.dataset.premiumInitialized = true;
  });
}

/**
 * Add water ripple effect to buttons
 */
function addButtonRippleEffects() {
  const buttons = document.querySelectorAll('.premium-btn, button.premium-primary, button.premium-secondary');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const circle = document.createElement('span');
      circle.classList.add('btn-ripple');
      circle.style.top = y + 'px';
      circle.style.left = x + 'px';
      
      this.appendChild(circle);
      
      setTimeout(() => {
        circle.remove();
      }, 600);
    });
  });
}

/**
 * Initialize 3D effects for the interface
 */
function init3DEffects() {
  // Add floating animation to icons
  const floatingElements = document.querySelectorAll('.floating-animation, .float-animation');
  
  floatingElements.forEach(el => {
    // Skip if already initialized
    if (el.dataset.floatInitialized) return;
    
    // Add random animation delay
    const delay = Math.random() * 2;
    el.style.animationDelay = `${delay}s`;
    
    // Mark as initialized
    el.dataset.floatInitialized = true;
  });
}

/**
 * Initialize dynamic reflections for premium containers
 */
function initDynamicReflections() {
  const reflectionContainers = document.querySelectorAll('.reflection-effect');
  
  reflectionContainers.forEach(container => {
    // Skip if already initialized
    if (container.dataset.reflectionInitialized) return;
    
    // Create reflection overlay
    const reflectionOverlay = document.createElement('div');
    reflectionOverlay.className = 'reflection-overlay';
    reflectionOverlay.style.position = 'absolute';
    reflectionOverlay.style.top = '0';
    reflectionOverlay.style.left = '0';
    reflectionOverlay.style.right = '0';
    reflectionOverlay.style.bottom = '0';
    reflectionOverlay.style.background = 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0) 100%)';
    reflectionOverlay.style.pointerEvents = 'none';
    reflectionOverlay.style.zIndex = '1';
    
    // Add to container
    container.style.position = container.style.position === 'static' ? 'relative' : container.style.position;
    container.appendChild(reflectionOverlay);
    
    // Add mousemove event to track reflection
    container.addEventListener('mousemove', function(e) {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate percentage within container
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;
      
      // Update reflection position
      reflectionOverlay.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 30%, rgba(255,255,255,0) 70%)`;
    });
    
    // Mark as initialized
    container.dataset.reflectionInitialized = true;
  });
}

/**
 * Initialize premium particle effects
 */
function initPremiumParticles() {
  const premiumContainers = document.querySelectorAll('.premium-glow-container');
  
  premiumContainers.forEach(container => {
    // Skip if already initialized
    if (container.dataset.particlesInitialized) return;
    
    // Create particles container
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    particlesContainer.style.position = 'absolute';
    particlesContainer.style.top = '0';
    particlesContainer.style.left = '0';
    particlesContainer.style.width = '100%';
    particlesContainer.style.height = '100%';
    particlesContainer.style.overflow = 'hidden';
    particlesContainer.style.pointerEvents = 'none';
    particlesContainer.style.zIndex = '0';
    
    // Set container position if needed
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }
    
    // Add particles
    const particleCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const size = 2 + Math.random() * 3;
      const duration = 3 + Math.random() * 5;
      
      particle.className = 'premium-particle';
      particle.style.position = 'absolute';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.background = 'rgba(255, 255, 255, 0.5)';
      particle.style.borderRadius = '50%';
      particle.style.opacity = '0';
      particle.style.boxShadow = '0 0 6px rgba(255, 255, 255, 0.3)';
      
      // Random position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      
      // Add floating animation
      particle.style.animation = `float-particle ${duration}s ease-in-out infinite`;
      particle.style.animationDelay = `${Math.random() * 5}s`;
      
      particlesContainer.appendChild(particle);
    }
    
    // Add particles container at the beginning for proper layering
    container.insertBefore(particlesContainer, container.firstChild);
    
    // Add keyframes for particle animation if not already added
    if (!document.getElementById('premium-particle-keyframes')) {
      const style = document.createElement('style');
      style.id = 'premium-particle-keyframes';
      style.textContent = `
        @keyframes float-particle {
          0% { transform: translate(0, 0); opacity: 0; }
          25% { opacity: 0.8; }
          50% { transform: translate(${Math.random() > 0.5 ? '+' : '-'}${20 + Math.random() * 30}px, ${Math.random() > 0.5 ? '+' : '-'}${20 + Math.random() * 30}px); opacity: 0.2; }
          75% { opacity: 0.6; }
          100% { transform: translate(0, 0); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Mark as initialized
    container.dataset.particlesInitialized = true;
  });
}

/**
 * Enhance status indicators with advanced effects
 */
function enhanceStatusIndicators() {
  const statusIndicators = document.querySelectorAll('.status-indicator');
  
  statusIndicators.forEach(indicator => {
    // Skip if already initialized
    if (indicator.dataset.statusEnhanced) return;
    
    // Add pulse animation
    if (indicator.classList.contains('status-open')) {
      const pulse = document.createElement('div');
      pulse.className = 'status-pulse';
      pulse.style.position = 'absolute';
      pulse.style.top = '0';
      pulse.style.left = '0';
      pulse.style.width = '100%';
      pulse.style.height = '100%';
      pulse.style.borderRadius = '50%';
      pulse.style.background = 'rgba(87, 242, 135, 0.5)';
      pulse.style.animation = 'pulse-status 1.5s infinite';
      
      indicator.style.position = 'relative';
      indicator.appendChild(pulse);
    }
    
    // Mark as enhanced
    indicator.dataset.statusEnhanced = true;
  });
}