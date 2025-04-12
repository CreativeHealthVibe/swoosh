/**
 * Premium Background Effects
 * Advanced animated background effects for premium sections
 */

document.addEventListener('DOMContentLoaded', () => {
  initPremiumBackgrounds();
});

// Initialize premium background effects
function initPremiumBackgrounds() {
  // Create premium background container
  const container = document.createElement('div');
  container.className = 'premium-backgrounds';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.zIndex = '-10';
  container.style.pointerEvents = 'none';
  container.style.overflow = 'hidden';
  
  // Add base gradient background
  const gradientBg = document.createElement('div');
  gradientBg.className = 'premium-gradient-bg';
  container.appendChild(gradientBg);
  
  // Add animated orbs
  const orbsContainer = document.createElement('div');
  orbsContainer.className = 'premium-orbs-container';
  
  for (let i = 0; i < 4; i++) {
    const orb = document.createElement('div');
    orb.className = 'premium-orb';
    orbsContainer.appendChild(orb);
  }
  
  container.appendChild(orbsContainer);
  
  // Add grid lines
  const gridLines = document.createElement('div');
  gridLines.className = 'premium-grid-lines';
  container.appendChild(gridLines);
  
  // Add stars
  const starsContainer = document.createElement('div');
  starsContainer.className = 'premium-stars';
  
  // Create stars
  for (let i = 0; i < 100; i++) {
    createStar(starsContainer);
  }
  
  container.appendChild(starsContainer);
  
  // Add noise texture
  const noiseTexture = document.createElement('div');
  noiseTexture.className = 'premium-noise';
  container.appendChild(noiseTexture);
  
  // Add glow overlay
  const glowOverlay = document.createElement('div');
  glowOverlay.className = 'premium-glow-overlay';
  container.appendChild(glowOverlay);
  
  // Add scanning effect
  const scanLine = document.createElement('div');
  scanLine.className = 'premium-scan-line';
  container.appendChild(scanLine);
  
  // Add to document
  document.body.prepend(container);
  
  // Add pulse effects on mouse move
  document.addEventListener('mousemove', debounce((e) => {
    createPulseEffect(e.clientX, e.clientY, container);
  }, 1000));
  
  // Add premium card animated borders
  document.querySelectorAll('.premium-card, .admin3d-card').forEach(card => {
    card.classList.add('animated-border');
  });
  
  // Add section accents
  document.querySelectorAll('.mod-section-header-wrapper, .dashboard-header').forEach(section => {
    section.classList.add('premium-section-accent');
  });
}

// Create a star element with random properties
function createStar(container) {
  const star = document.createElement('div');
  star.className = 'premium-star';
  
  // Random position
  star.style.left = `${Math.random() * 100}%`;
  star.style.top = `${Math.random() * 100}%`;
  
  // Random size
  const size = Math.random() * 2 + 1;
  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  
  // Random brightness
  const brightness = Math.random() * 0.7 + 0.3;
  star.style.opacity = brightness.toString();
  
  // Random twinkling
  const twinkleDuration = Math.random() * 5 + 3;
  star.style.setProperty('--twinkle-duration', `${twinkleDuration}s`);
  
  // Random delay
  star.style.animationDelay = `${Math.random() * 5}s`;
  
  container.appendChild(star);
}

// Create pulse effect at cursor position
function createPulseEffect(x, y, container) {
  const pulse = document.createElement('div');
  pulse.className = 'premium-pulse';
  pulse.style.left = `${x}px`;
  pulse.style.top = `${y}px`;
  
  container.appendChild(pulse);
  
  // Remove after animation completes
  setTimeout(() => {
    pulse.remove();
  }, 5000);
}

// Debounce function to limit function calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}