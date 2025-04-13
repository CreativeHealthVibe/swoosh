/**
 * Premium UI Effects for Admin3D Interface
 * Adds advanced animations and visual effects to premium UI elements
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize ambient particles effect
  initAmbientParticles();
  
  // Add premium card hover effects
  initPremiumCardEffects();
  
  // Add water ripple effect to buttons
  initPremiumButtonEffects();
  
  // Add 3D tilt effect to panels
  init3DTiltEffect();
});

/**
 * Initializes ambient floating particles for premium containers
 */
function initAmbientParticles() {
  const containers = document.querySelectorAll('.premium-glow-container');
  
  containers.forEach(container => {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'ambient-particles';
    
    // Create particles
    for(let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random positions
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      
      // Random sizes
      const size = Math.random() * 4 + 1;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      
      // Random animation durations
      const duration = Math.random() * 10 + 10;
      particle.style.animationDuration = duration + 's';
      
      // Random delays
      const delay = Math.random() * 5;
      particle.style.animationDelay = delay + 's';
      
      particlesContainer.appendChild(particle);
    }
    
    container.appendChild(particlesContainer);
  });
}

/**
 * Initializes premium card hover effects with dynamic shadows
 */
function initPremiumCardEffects() {
  const cards = document.querySelectorAll('.premium-card');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element
      const y = e.clientY - rect.top;  // y position within the element
      
      // Calculate the position relative to the center of the card
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate the distance from center (for shadow intensity)
      const distanceX = (x - centerX) / centerX; // -1 to 1
      const distanceY = (y - centerY) / centerY; // -1 to 1
      
      // Apply dynamic shadow based on mouse position
      this.style.boxShadow = `
        ${-distanceX * 10}px ${-distanceY * 10}px 20px rgba(0, 0, 0, 0.3),
        0 15px 35px rgba(0, 0, 0, 0.4),
        0 0 15px rgba(114, 137, 218, ${0.2 + Math.abs(distanceX) * 0.1})
      `;
      
      // Subtle transform to follow mouse
      this.style.transform = `
        translateY(-5px) 
        scale(1.02) 
        rotateX(${-distanceY * 5}deg) 
        rotateY(${distanceX * 5}deg)
      `;
    });
    
    // Reset when mouse leaves
    card.addEventListener('mouseleave', function() {
      this.style.boxShadow = '';
      this.style.transform = '';
    });
  });
}

/**
 * Initializes premium button ripple effects
 */
function initPremiumButtonEffects() {
  const buttons = document.querySelectorAll('.premium-btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create ripple element
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      // Add to button and remove after animation completes
      this.appendChild(ripple);
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
}

/**
 * Initializes 3D tilt effect for panels
 */
function init3DTiltEffect() {
  const panels = document.querySelectorAll('.premium-3d-hover');
  
  panels.forEach(panel => {
    panel.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate the position relative to the center
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const distanceX = (x - centerX) / centerX; // -1 to 1
      const distanceY = (y - centerY) / centerY; // -1 to 1
      
      // Apply 3D tilt transformation
      this.style.transform = `
        perspective(1000px) 
        rotateX(${-distanceY * 5}deg) 
        rotateY(${distanceX * 5}deg) 
        scale3d(1.02, 1.02, 1.02)
      `;
      
      // Add dynamic lighting effect using pseudo-element
      this.style.setProperty('--highlight-x', x + 'px');
      this.style.setProperty('--highlight-y', y + 'px');
    });
    
    // Reset when mouse leaves
    panel.addEventListener('mouseleave', function() {
      this.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });
}

/**
 * Adds premium scrolling effects to elements
 */
function initPremiumScrollEffects() {
  const elements = document.querySelectorAll('.premium-scroll-reveal');
  
  // Intersection Observer to detect when elements enter viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Unobserve after animation is triggered
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1 // Trigger when 10% of the element is visible
  });
  
  // Observe each element
  elements.forEach(element => {
    observer.observe(element);
  });
}