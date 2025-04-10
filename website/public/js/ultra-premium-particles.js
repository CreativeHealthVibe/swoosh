/**
 * SWOOSH ULTRA PREMIUM ADMIN DASHBOARD
 * Particle Effects System - £100,000 Edition
 * 
 * This script provides luxury particle effects for premium experience
 * with sophisticated animations and visual enhancements.
 */

/** 
 * Create a particle effect
 * @param {HTMLElement} container - Container element for particles
 * @param {Object} options - Particle options
 * @param {number} [options.count=30] - Number of particles
 * @param {number|Array} [options.size=[2, 6]] - Particle size or size range
 * @param {number|Array} [options.speed=[0.5, 2]] - Particle speed or speed range
 * @param {string|Array} [options.colors=['#9d00ff', '#00ccff']] - Particle colors
 * @param {number|Array} [options.opacity=[0.3, 0.7]] - Particle opacity or opacity range
 * @param {number|Array} [options.lifetime=[2000, 5000]] - Particle lifetime in ms
 */
function createParticleEffect(container, options = {}) {
  // Set default options
  const defaults = {
    count: 30,
    size: [2, 6],
    speed: [0.5, 2],
    colors: ['#9d00ff', '#00ccff'],
    opacity: [0.3, 0.7],
    lifetime: [2000, 5000]
  };
  
  // Merge options with defaults
  const config = { ...defaults, ...options };
  
  // Prepare container
  if (!container.style.position || container.style.position === 'static') {
    container.style.position = 'relative';
  }
  
  // Create particles
  for (let i = 0; i < config.count; i++) {
    createParticle(container, config);
  }
  
  // Start continuous particle generation if container is still in DOM
  const intervalId = setInterval(() => {
    if (document.body.contains(container)) {
      createParticle(container, config);
    } else {
      clearInterval(intervalId);
    }
  }, 300);
  
  // Store interval ID on container for cleanup
  container.particleIntervalId = intervalId;
  
  // Return cleanup function
  return function cleanupParticles() {
    clearInterval(container.particleIntervalId);
    const particles = container.querySelectorAll('.ultra-premium-particle');
    particles.forEach(particle => particle.remove());
  };
}

/**
 * Create a single particle
 * @param {HTMLElement} container - Container element
 * @param {Object} config - Particle configuration
 */
function createParticle(container, config) {
  // Create particle element
  const particle = document.createElement('div');
  particle.className = 'ultra-premium-particle';
  
  // Set random properties
  const size = Array.isArray(config.size) 
    ? getRandomInRange(config.size[0], config.size[1]) 
    : config.size;
    
  const speed = Array.isArray(config.speed)
    ? getRandomInRange(config.speed[0], config.speed[1])
    : config.speed;
    
  const color = Array.isArray(config.colors)
    ? config.colors[Math.floor(Math.random() * config.colors.length)]
    : config.colors;
    
  const opacity = Array.isArray(config.opacity)
    ? getRandomInRange(config.opacity[0], config.opacity[1])
    : config.opacity;
    
  const lifetime = Array.isArray(config.lifetime)
    ? getRandomInRange(config.lifetime[0], config.lifetime[1])
    : config.lifetime;
  
  // Set starting position (random on screen)
  const startX = Math.random() * 100;
  const startY = Math.random() * 100;
  
  // Create random movement pattern
  const angle = Math.random() * Math.PI * 2;
  const velocityX = Math.cos(angle) * speed;
  const velocityY = Math.sin(angle) * speed;
  
  // Apply styles
  Object.assign(particle.style, {
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: color,
    opacity: opacity.toString(),
    left: `${startX}%`,
    top: `${startY}%`,
    boxShadow: `0 0 ${size * 2}px ${color}`,
    pointerEvents: 'none',
    transition: 'opacity 0.5s ease-out',
    zIndex: '1'
  });
  
  // Add to container
  container.appendChild(particle);
  
  // Create animation
  let currentX = startX;
  let currentY = startY;
  const startTime = Date.now();
  
  // Update function that will be called on each animation frame
  const updateParticle = () => {
    const elapsedTime = Date.now() - startTime;
    
    // Remove particle if lifetime is exceeded
    if (elapsedTime >= lifetime) {
      // Fade out before removing
      particle.style.opacity = '0';
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 500);
      return;
    }
    
    // Update position
    currentX += velocityX * 0.05;
    currentY += velocityY * 0.05;
    
    // Apply boundary bounce
    if (currentX < 0 || currentX > 100) {
      velocityX *= -1;
    }
    
    if (currentY < 0 || currentY > 100) {
      velocityY *= -1;
    }
    
    // Apply new position
    particle.style.left = `${currentX}%`;
    particle.style.top = `${currentY}%`;
    
    // Decreasing opacity over time
    const opacityFactor = 1 - (elapsedTime / lifetime);
    particle.style.opacity = (opacity * opacityFactor).toString();
    
    // Continue animation
    requestAnimationFrame(updateParticle);
  };
  
  // Start animation
  requestAnimationFrame(updateParticle);
}

/**
 * Get a random value in a range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random value in range
 */
function getRandomInRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Ultra Premium Glowing Effect
 * @param {HTMLElement} element - Element to apply effect to
 * @param {Object} options - Effect options
 */
function createGlowingEffect(element, options = {}) {
  const defaults = {
    color: '#9d00ff',
    intensity: 0.5,
    pulse: true,
    duration: 2000
  };
  
  const config = { ...defaults, ...options };
  
  // Ensure element has position
  if (!element.style.position || element.style.position === 'static') {
    element.style.position = 'relative';
  }
  
  // Add glow container
  const glowContainer = document.createElement('div');
  glowContainer.className = 'ultra-premium-glow';
  
  Object.assign(glowContainer.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '0',
    borderRadius: 'inherit',
    boxShadow: `0 0 20px ${config.intensity * 10}px ${config.color}`,
    opacity: config.intensity.toString()
  });
  
  element.appendChild(glowContainer);
  
  // Add pulsing animation if enabled
  if (config.pulse) {
    const keyframes = `
      @keyframes ultra-premium-pulse-${Date.now()} {
        0% { opacity: ${config.intensity * 0.7}; }
        50% { opacity: ${config.intensity}; }
        100% { opacity: ${config.intensity * 0.7}; }
      }
    `;
    
    // Add keyframes to stylesheet
    const style = document.createElement('style');
    style.innerHTML = keyframes;
    document.head.appendChild(style);
    
    // Apply animation
    Object.assign(glowContainer.style, {
      animation: `ultra-premium-pulse-${Date.now()} ${config.duration}ms infinite ease-in-out`
    });
  }
  
  // Return cleanup function
  return function removeGlowingEffect() {
    if (glowContainer.parentNode) {
      glowContainer.parentNode.removeChild(glowContainer);
    }
  };
}

// Export functions if module is available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createParticleEffect,
    createGlowingEffect
  };
}