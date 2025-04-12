/**
 * SWOOSH Bot 3D Admin Dashboard
 * Ultra Premium Edition - $555k
 * 
 * Admin3D Moderation JS - Advanced visualization with holographic effects
 * Cutting-edge moderation interface with immersive 3D visualizations
 */

// Mark as the premium version loaded to prevent the standard script from initializing
window.premium555kLoaded = true;

// Initialize Three.js visualizations once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing $555K Premium Moderation Interface');
  initialize555kPremiumModeration();
  setupPremiumTabNavigation();
  initializePremiumFormHandlers();
  initializePremiumServerSelector();
  initializePremiumEffects();
});

/**
 * Initialize the premium effects
 */
function initializePremiumEffects() {
  // Add premium UI effects
  addGlassomorphicEffects();
  initializeParticleEffects();
  initializeHolographicElements();
  addPremiumGradients();
}

/**
 * Add glassmorphic effects to UI elements
 */
function addGlassomorphicEffects() {
  // Add blur and transparency to card elements
  document.querySelectorAll('.premium-card, .premium-panel').forEach(card => {
    card.classList.add('glassmorphic');
  });
  
  // Add shimmering effect to borders
  document.querySelectorAll('.premium-card, .premium-panel').forEach(card => {
    const shimmer = document.createElement('div');
    shimmer.className = 'card-shimmer';
    card.appendChild(shimmer);
  });
}

/**
 * Initialize particle effects in background
 */
function initializeParticleEffects() {
  // Create particle container if it doesn't exist
  if (!document.querySelector('.particle-container')) {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    document.querySelector('.admin3d-main').prepend(particleContainer);
    
    // Create particles
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.width = `${Math.random() * 5 + 2}px`;
      particle.style.height = particle.style.width;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${Math.random() * 20 + 10}s`;
      particle.style.animationDelay = `${Math.random() * 10}s`;
      particleContainer.appendChild(particle);
    }
  }
}

/**
 * Initialize holographic UI elements
 */
function initializeHolographicElements() {
  // Add holographic effects to headers
  document.querySelectorAll('.premium-header').forEach(header => {
    header.classList.add('holographic');
    
    // Create holographic overlay
    const holoOverlay = document.createElement('div');
    holoOverlay.className = 'holo-overlay';
    header.appendChild(holoOverlay);
  });
  
  // Add floating labels to inputs
  document.querySelectorAll('.premium-form-group').forEach(group => {
    const input = group.querySelector('input, select, textarea');
    const label = group.querySelector('label');
    
    if (input && label) {
      group.classList.add('floating-label');
      
      input.addEventListener('focus', () => {
        group.classList.add('focused');
      });
      
      input.addEventListener('blur', () => {
        if (!input.value) {
          group.classList.remove('focused');
        }
      });
      
      // Initialize state
      if (input.value) {
        group.classList.add('focused');
      }
    }
  });
}

/**
 * Add premium gradients to backgrounds
 */
function addPremiumGradients() {
  // Add animated gradient backgrounds
  document.querySelectorAll('.premium-gradient-bg').forEach(el => {
    el.classList.add('animated-gradient');
  });
  
  // Add subtle gradient to the main content area if it doesn't have one
  const mainContent = document.querySelector('.admin3d-main');
  if (mainContent && !mainContent.classList.contains('premium-gradient-bg')) {
    mainContent.classList.add('premium-subtle-gradient');
  }
}

/**
 * Initialize the server selector with premium dynamic loading visuals
 */
function initializePremiumServerSelector() {
  const serverSelect = document.getElementById('serverSelect');
  if (!serverSelect) return;
  
  // Add premium styling to select
  serverSelect.classList.add('premium-select');
  
  // Create custom styled select
  const selectContainer = document.createElement('div');
  selectContainer.className = 'premium-select-container';
  serverSelect.parentNode.insertBefore(selectContainer, serverSelect);
  selectContainer.appendChild(serverSelect);
  
  // Add premium dropdown icon
  const dropdownIcon = document.createElement('div');
  dropdownIcon.className = 'premium-select-arrow';
  dropdownIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
  selectContainer.appendChild(dropdownIcon);
  
  serverSelect.addEventListener('change', function() {
    const serverId = this.value;
    
    // Update hidden form fields
    document.querySelectorAll('[id$="ServerId"]').forEach(input => {
      input.value = serverId;
    });
    
    if (serverId) {
      // Show premium loading state
      document.querySelectorAll('.empty-state-message').forEach(el => {
        el.innerHTML = `
          <div class="premium-loading">
            <div class="premium-loading-spinner"></div>
            <div class="premium-loading-text">Loading server data...</div>
          </div>
        `;
      });
      
      // Load server data with premium effects
      loadPremiumServerData(serverId);
    }
  });
}

/**
 * Load server data with premium visualization effects
 * @param {string} serverId - Discord server ID
 */
function loadPremiumServerData(serverId) {
  // Show loading animations on cards
  document.querySelectorAll('.premium-card').forEach(card => {
    card.classList.add('loading');
  });

  // Load bans with premium UI
  loadPremiumBans(serverId);
  
  // Load warnings with premium UI
  loadPremiumWarnings(serverId);
  
  // Load server stats with premium animations
  loadPremiumServerStats(serverId);
  
  // Update visualization with enhanced effects
  updatePremiumVisualization(serverId);
  
  // Remove loading state after all data is loaded
  setTimeout(() => {
    document.querySelectorAll('.premium-card').forEach(card => {
      card.classList.remove('loading');
    });
  }, 2000);
}

/**
 * Load and display server statistics with premium animations
 * @param {string} serverId - Discord server ID
 */
function loadPremiumServerStats(serverId) {
  fetch(`/admin3d/server-stats/${serverId}`, {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    // Update stats cards with premium animations
    updatePremiumStatWithAnimation('totalBans', data.bans || 0);
    updatePremiumStatWithAnimation('totalWarnings', data.warnings || 0);
    updatePremiumStatWithAnimation('automodActions', data.automodActions || 0);
    updatePremiumStatWithAnimation('memberCount', data.members || 0);
    
    // Add premium pulse effect to stats cards
    document.querySelectorAll('.stat-card').forEach(card => {
      card.classList.add('premium-pulse');
      setTimeout(() => {
        card.classList.remove('premium-pulse');
      }, 2000);
    });
  })
  .catch(error => {
    console.error('Error loading server stats:', error);
    // Set default values with subtle error indication
    document.querySelectorAll('.stat-card').forEach(card => {
      card.classList.add('premium-error');
    });
    
    document.getElementById('totalBans').textContent = '0';
    document.getElementById('totalWarnings').textContent = '0';
    document.getElementById('automodActions').textContent = '0';
    document.getElementById('memberCount').textContent = '0';
  });
}

/**
 * Update a stat with premium animation effects
 * @param {string} elementId - Element ID to update
 * @param {number} value - New value
 */
function updatePremiumStatWithAnimation(elementId, value) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Get current value or default to 0
  const currentValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
  const difference = value - currentValue;
  
  // More sophisticated animation with easing
  const duration = 2000; // Animation duration in ms
  const steps = 60; // Number of steps for smoother animation
  const stepTime = duration / steps;
  
  // Remove any existing animation
  if (element._animationInterval) {
    clearInterval(element._animationInterval);
  }
  
  // Create particle burst effect for significant changes
  if (Math.abs(difference) > 5) {
    createParticleBurst(element, difference > 0 ? 'increase' : 'decrease');
  }
  
  // Add glow effect during animation
  element.classList.add('premium-stat-animating');
  
  // Premium animation interval with advanced easing
  element._animationInterval = setInterval(() => {
    const elapsed = new Date() - startTime;
    if (elapsed >= duration) {
      clearInterval(element._animationInterval);
      element._animationInterval = null;
      element.textContent = value.toLocaleString();
      
      // Add completion effect
      element.classList.remove('premium-stat-animating');
      element.classList.add('premium-stat-updated');
      setTimeout(() => {
        element.classList.remove('premium-stat-updated');
      }, 1500);
      
      return;
    }
    
    // Advanced easing function for premium feel
    const progress = elapsed / duration;
    const easedProgress = 1 - Math.pow(1 - progress, 4); // Quartic ease-out for premium smoothness
    const stepValue = currentValue + Math.round(difference * easedProgress);
    
    element.textContent = stepValue.toLocaleString();
  }, stepTime);
  
  const startTime = new Date();
}

/**
 * Create a particle burst effect for stat changes
 * @param {HTMLElement} element - Element to attach particle burst to
 * @param {string} type - Type of change ('increase' or 'decrease')
 */
function createParticleBurst(element, type) {
  const rect = element.getBoundingClientRect();
  const burst = document.createElement('div');
  burst.className = `premium-particle-burst ${type}`;
  
  // Position burst at the element
  burst.style.left = `${rect.left + rect.width / 2}px`;
  burst.style.top = `${rect.top + rect.height / 2}px`;
  
  // Add to document body
  document.body.appendChild(burst);
  
  // Create particles
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('div');
    particle.className = 'burst-particle';
    
    // Random angle and distance
    const angle = (i / 12) * 2 * Math.PI;
    const distance = 30 + Math.random() * 20;
    
    // Set initial position
    particle.style.left = '0px';
    particle.style.top = '0px';
    
    // Set end position with keyframes
    const keyframes = [
      { transform: 'translate(-50%, -50%) scale(0.2)' },
      { 
        transform: `translate(
          calc(-50% + ${Math.cos(angle) * distance}px), 
          calc(-50% + ${Math.sin(angle) * distance}px)
        ) scale(${0.5 + Math.random() * 0.5})`
      }
    ];
    
    // Animation options
    const options = {
      duration: 600 + Math.random() * 400,
      easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)',
      fill: 'forwards'
    };
    
    // Add particle to burst
    burst.appendChild(particle);
    
    // Animate particle
    particle.animate(keyframes, options);
  }
  
  // Remove burst after animation completes
  setTimeout(() => {
    if (burst.parentNode) {
      burst.parentNode.removeChild(burst);
    }
  }, 1500);
}

/**
 * Set up premium tab navigation with enhanced transitions
 */
function setupPremiumTabNavigation() {
  const tabButtons = document.querySelectorAll('.mod-nav-btn');
  if (!tabButtons.length) return;
  
  // Add premium styling to tab buttons
  tabButtons.forEach(button => {
    button.classList.add('premium-tab-btn');
    
    // Add shimmer effect
    const shimmer = document.createElement('div');
    shimmer.className = 'btn-shimmer';
    button.appendChild(shimmer);
    
    button.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      
      // Play premium click sound
      playPremiumUISound('tab-switch');
      
      // Update active button with advanced animation
      document.querySelectorAll('.mod-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.setProperty('--premium-tab-active', '0');
      });
      
      this.classList.add('active');
      this.style.setProperty('--premium-tab-active', '1');
      
      // Update tab indicator position
      updatePremiumTabIndicator(this);
      
      // Animate tab transition
      const activeTab = document.querySelector('.tab-content.active');
      const newTab = document.getElementById(tabId);
      
      if (activeTab && newTab && activeTab !== newTab) {
        // Premium transition between tabs
        activeTab.classList.add('tab-exit');
        newTab.classList.add('tab-enter');
        
        // Remove active class from current tab (delayed)
        setTimeout(() => {
          activeTab.classList.remove('active');
          activeTab.classList.remove('tab-exit');
          newTab.classList.add('active');
          
          // Delay entrance animation slightly
          setTimeout(() => {
            newTab.classList.remove('tab-enter');
          }, 50);
        }, 300);
      } else if (newTab) {
        // Just activate the new tab if there's no active tab
        document.querySelectorAll('.tab-content').forEach(tab => {
          tab.classList.remove('active');
        });
        newTab.classList.add('active');
      }
      
      // Special case for visualization adaptation based on active tab
      updatePremiumVisualizationForTab(tabId);
    });
  });
  
  // Add premium tab indicator
  const tabNav = document.querySelector('.mod-nav');
  if (tabNav && !document.querySelector('.premium-tab-indicator')) {
    const indicator = document.createElement('div');
    indicator.className = 'premium-tab-indicator';
    tabNav.appendChild(indicator);
    
    // Set initial position
    const activeBtn = document.querySelector('.mod-nav-btn.active');
    if (activeBtn) {
      updatePremiumTabIndicator(activeBtn);
    }
  }
}

/**
 * Update the premium tab indicator position
 * @param {HTMLElement} activeBtn - The active tab button
 */
function updatePremiumTabIndicator(activeBtn) {
  const indicator = document.querySelector('.premium-tab-indicator');
  if (!indicator) return;
  
  // Get position and dimensions of the active button
  const rect = activeBtn.getBoundingClientRect();
  const navRect = document.querySelector('.mod-nav').getBoundingClientRect();
  
  // Set indicator position and width
  indicator.style.left = `${rect.left - navRect.left}px`;
  indicator.style.width = `${rect.width}px`;
}

/**
 * Play premium UI sound effects
 * @param {string} sound - Sound type to play
 */
function playPremiumUISound(sound) {
  // Premium UI sound system
  const sounds = {
    'tab-switch': {
      frequency: 1800,
      duration: 40,
      type: 'sine',
      volume: 0.1
    },
    'button-click': {
      frequency: 2200,
      duration: 30,
      type: 'sine',
      volume: 0.1
    },
    'notification': {
      frequency: 1500,
      duration: 80,
      type: 'sine',
      volume: 0.1
    },
    'error': {
      frequency: 300,
      duration: 100,
      type: 'triangle',
      volume: 0.1
    },
    'success': {
      frequency: 2000,
      duration: 60,
      type: 'sine',
      volume: 0.1
    }
  };
  
  // Get sound parameters
  const params = sounds[sound] || sounds['button-click'];
  
  // Create audio context
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  // Configure oscillator
  oscillator.type = params.type;
  oscillator.frequency.setValueAtTime(params.frequency, audioContext.currentTime);
  
  // For some sounds, add a frequency sweep
  if (sound === 'notification' || sound === 'success') {
    oscillator.frequency.exponentialRampToValueAtTime(
      params.frequency * 1.5, 
      audioContext.currentTime + params.duration / 1000
    );
  } else if (sound === 'error') {
    oscillator.frequency.exponentialRampToValueAtTime(
      params.frequency * 0.8, 
      audioContext.currentTime + params.duration / 1000
    );
  }
  
  // Configure gain (volume)
  gainNode.gain.setValueAtTime(params.volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + params.duration / 1000);
  
  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Play sound
  oscillator.start();
  oscillator.stop(audioContext.currentTime + params.duration / 1000);
}

/**
 * Initialize premium form handlers with enhanced interactivity
 */
function initializePremiumFormHandlers() {
  // Add premium form styling
  document.querySelectorAll('.mod-form').forEach(form => {
    form.classList.add('premium-form');
  });
  
  // Ban duration handler with premium select
  const banDuration = document.getElementById('banDuration');
  const customDurationGroup = document.getElementById('customDurationGroup');
  
  if (banDuration && customDurationGroup) {
    // Add premium styling
    banDuration.classList.add('premium-select');
    customDurationGroup.classList.add('premium-form-group');
    
    banDuration.addEventListener('change', function() {
      if (this.value === 'custom') {
        // Show custom duration with animation
        customDurationGroup.style.display = 'block';
        customDurationGroup.style.opacity = '0';
        setTimeout(() => {
          customDurationGroup.style.opacity = '1';
        }, 10);
      } else {
        // Hide with animation
        customDurationGroup.style.opacity = '0';
        setTimeout(() => {
          customDurationGroup.style.display = 'none';
        }, 300);
      }
      
      // Play premium UI sound
      playPremiumUISound('button-click');
    });
  }
  
  // Form submission handlers with premium effects
  setupPremiumFormSubmissionHandlers();
}

/**
 * Setup form submission handlers with premium animations
 */
function setupPremiumFormSubmissionHandlers() {
  // Premium-ize all buttons
  document.querySelectorAll('.mod-btn, button[type="submit"]').forEach(button => {
    if (!button.classList.contains('premium-btn')) {
      button.classList.add('premium-btn');
      
      // Add premium hover effect elements
      const hoverEffect = document.createElement('div');
      hoverEffect.className = 'btn-hover-effect';
      button.appendChild(hoverEffect);
    }
  });
  
  // Ban user form submission with premium effects
  const banUserForm = document.getElementById('banUserForm');
  if (banUserForm) {
    banUserForm.classList.add('premium-form');
    
    banUserForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const button = this.querySelector('button[type="submit"]');
      if (button) {
        // Play premium UI sound
        playPremiumUISound('button-click');
        
        // Show premium loading state
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `
          <div class="premium-btn-loading">
            <div class="premium-btn-loading-spinner"></div>
            <span>Processing</span>
          </div>
        `;
        button.classList.add('loading');
        
        // Submit form data with premium processing animation
        const formData = new FormData(this);
        
        fetch(this.action, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
          // Reset button with animation
          button.classList.remove('loading');
          button.classList.add(data.success ? 'success' : 'error');
          
          // Show appropriate icon
          button.innerHTML = data.success ? 
            '<i class="fas fa-check"></i> Success' : 
            '<i class="fas fa-times"></i> Failed';
          
          setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalText;
            button.classList.remove('success', 'error');
          }, 2000);
          
          if (data.success) {
            // Play success sound
            playPremiumUISound('success');
            
            // Show premium success notification
            showPremiumNotification('success', 'User Banned', data.message || 'The user has been banned successfully.');
            
            // Reset form with animation
            this.classList.add('form-success');
            setTimeout(() => {
              this.reset();
              this.classList.remove('form-success');
            }, 500);
            
            // Refresh the ban list with premium animation
            const serverId = document.getElementById('serverSelect').value;
            if (serverId) {
              loadPremiumBans(serverId);
              updatePremiumVisualization(serverId);
              loadPremiumServerStats(serverId);
            }
          } else {
            // Play error sound
            playPremiumUISound('error');
            
            // Show premium error notification
            showPremiumNotification('error', 'Ban Failed', data.message || 'Failed to ban the user.');
            
            // Shake form to indicate error
            this.classList.add('form-error');
            setTimeout(() => {
              this.classList.remove('form-error');
            }, 500);
          }
        })
        .catch(error => {
          console.error('Ban request error:', error);
          
          // Play error sound
          playPremiumUISound('error');
          
          // Reset button with animation
          button.classList.remove('loading');
          button.classList.add('error');
          button.innerHTML = '<i class="fas fa-times"></i> Error';
          
          setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalText;
            button.classList.remove('error');
          }, 2000);
          
          // Show premium error notification
          showPremiumNotification('error', 'Ban Request Failed', 'An error occurred while processing your request.');
        });
      }
    });
  }
  
  // Warning form submission (similar pattern)
  const warnUserForm = document.getElementById('warnUserForm');
  if (warnUserForm) {
    warnUserForm.classList.add('premium-form');
    
    // Implementation similar to banUserForm
    // ... (Similar implementation as banUserForm with premium effects)
  }
}

/**
 * Show a premium notification with advanced animation
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
function showPremiumNotification(type, title, message) {
  // Create notification element if Admin3DNotification exists
  if (typeof Admin3DNotification !== 'undefined') {
    // Use existing notification system with premium styling
    Admin3DNotification[type](title, {
      message: message,
      duration: 8000,
      animation: 'slide-right',
      className: 'premium-notification'
    });
    
    // Play notification sound
    playPremiumUISound(type === 'error' ? 'error' : 'notification');
  } else {
    // Fallback to console
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
  }
}

/**
 * Update visualization based on active tab with premium effects
 * @param {string} tabId - Active tab ID
 */
function updatePremiumVisualizationForTab(tabId) {
  // Get the current server ID
  const serverId = document.getElementById('serverSelect')?.value;
  if (!serverId) return;
  
  // Update visualization based on active tab
  switch (tabId) {
    case 'bansTab':
      updatePremiumBanVisualization(serverId);
      break;
    case 'warningsTab':
      updatePremiumWarningVisualization(serverId);
      break;
    case 'automodTab':
      updatePremiumAutomodVisualization(serverId);
      break;
    case 'filtersTab':
      updatePremiumFilterVisualization(serverId);
      break;
    default:
      updatePremiumDefaultVisualization(serverId);
      break;
  }
}

/**
 * Initialize the premium Three.js visualization for the moderation page
 */
function initialize555kPremiumModeration() {
  // Check if THREE.js is loaded
  if (typeof THREE === 'undefined') {
    console.error('THREE.js is not loaded');
    return;
  }
  
  // Get visualization container
  const container = document.getElementById('moderationVisualization');
  if (!container) return;
  
  // Set up scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000818);
  
  // Set up camera with premium positioning
  const camera = new THREE.PerspectiveCamera(
    60, // Wider FOV for more immersive feel
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 6); // Positioned for optimal view
  
  // Set up renderer with premium quality
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);
  
  // Create groups for different visualizations
  const visualizationGroups = {
    bans: new THREE.Group(),
    warnings: new THREE.Group(),
    automod: new THREE.Group(),
    filters: new THREE.Group(),
    default: new THREE.Group()
  };
  
  // Add groups to scene
  Object.values(visualizationGroups).forEach(group => {
    scene.add(group);
  });
  
  // Add premium lighting
  // Main directional light
  const mainLight = new THREE.DirectionalLight(0x9e7cff, 1);
  mainLight.position.set(5, 5, 5);
  mainLight.castShadow = true;
  mainLight.shadow.camera.near = 0.1;
  mainLight.shadow.camera.far = 25;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  scene.add(mainLight);
  
  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0x333366, 0.5);
  scene.add(ambientLight);
  
  // Purple spot light for dramatic effect
  const purpleSpot = new THREE.SpotLight(0x9e7cff, 2, 20, Math.PI / 6, 0.5);
  purpleSpot.position.set(-5, 2, 3);
  scene.add(purpleSpot);
  
  // Cyan rim light
  const cyanSpot = new THREE.SpotLight(0x00ffff, 1, 20, Math.PI / 6, 0.5);
  cyanSpot.position.set(3, -2, -3);
  scene.add(cyanSpot);
  
  // Add background particles for premium atmosphere
  addPremiumBackgroundParticles(scene);
  
  // Create default sphere (will be replaced by actual visualizations)
  createPremiumDefaultSphere(visualizationGroups.default);
  
  // Add post-processing for premium visual effects
  let composer;
  try {
    // EffectComposer should be loaded from Three.js extensions
    if (typeof THREE.EffectComposer !== 'undefined') {
      composer = new THREE.EffectComposer(renderer);
      
      // Add render pass
      const renderPass = new THREE.RenderPass(scene, camera);
      composer.addPass(renderPass);
      
      // Add bloom pass for premium glow
      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.6, // bloom strength
        0.4, // bloom radius
        0.85  // bloom threshold
      );
      composer.addPass(bloomPass);
    }
  } catch (e) {
    console.warn('Post-processing not available:', e);
    composer = null;
  }
  
  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    if (composer) composer.setSize(container.clientWidth, container.clientHeight);
  });
  
  // Animation with premium smooth motion
  let targetRotationX = 0;
  let targetRotationY = 0;
  let currentRotationX = 0;
  let currentRotationY = 0;
  
  // Track mouse for interactive rotation
  container.addEventListener('mousemove', (event) => {
    const rect = container.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
    
    targetRotationX = mouseY * 0.3;
    targetRotationY = mouseX * 0.5;
  });
  
  function animate() {
    requestAnimationFrame(animate);
    
    // Smooth rotation with premium easing
    currentRotationX += (targetRotationX - currentRotationX) * 0.05;
    currentRotationY += (targetRotationY - currentRotationY) * 0.05;
    
    // Apply rotation to active group
    Object.values(visualizationGroups).forEach(group => {
      if (group.visible) {
        group.rotation.x = currentRotationX;
        group.rotation.y = currentRotationY + Date.now() * 0.0001;
      }
    });
    
    // Pulse effect on lights for premium ambiance
    const time = Date.now() * 0.001;
    purpleSpot.intensity = 2 + Math.sin(time * 1.5) * 0.3;
    cyanSpot.intensity = 1 + Math.cos(time * 1.3) * 0.2;
    
    // Render with composer if available
    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }
  
  // Start animation
  animate();
  
  // Store references for later use
  window.premium555kVisualization = {
    scene,
    camera,
    renderer,
    composer,
    visualizationGroups,
    container
  };
  
  // Show default visualization
  updatePremiumDefaultVisualization('initial');
}

/**
 * Update premium visualization for the active moderation tab
 * @param {string} serverId - Discord server ID
 */
function updatePremiumVisualization(serverId) {
  // Get active tab ID
  const activeTab = document.querySelector('.mod-nav-btn.active');
  if (!activeTab) return;
  
  const tabId = activeTab.dataset.tab;
  updatePremiumVisualizationForTab(tabId);
}

/**
 * Add premium background particles for atmosphere
 * @param {THREE.Scene} scene - The Three.js scene
 */
function addPremiumBackgroundParticles(scene) {
  // Create particle material with premium glow
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x8866ff,
    size: 0.05,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.8,
    sizeAttenuation: true
  });
  
  // Create particle geometry
  const particleCount = 1000;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colors = new Float32Array(particleCount * 3);
  
  const color1 = new THREE.Color(0x8866ff);
  const color2 = new THREE.Color(0x2233ff);
  
  // Set random positions, sizes, and colors
  for (let i = 0; i < particleCount; i++) {
    // Position in a sphere
    const radius = 15 + Math.random() * 10;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    
    // Random size
    sizes[i] = 0.1 + Math.random() * 0.5;
    
    // Color gradient between two colors
    const mixRatio = Math.random();
    const particleColor = color1.clone().lerp(color2, mixRatio);
    
    colors[i * 3] = particleColor.r;
    colors[i * 3 + 1] = particleColor.g;
    colors[i * 3 + 2] = particleColor.b;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  // Create particle system
  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);
  
  // Animate particles
  const updateParticles = () => {
    const time = Date.now() * 0.0001;
    particleSystem.rotation.x = time * 0.05;
    particleSystem.rotation.y = time * 0.03;
    
    requestAnimationFrame(updateParticles);
  };
  
  updateParticles();
}

/**
 * Load premium ban list data
 * @param {string} serverId - Discord server ID
 */
function loadPremiumBans(serverId) {
  const banListBody = document.getElementById('banListBody');
  if (!banListBody) return;
  
  // Show premium loading state
  banListBody.innerHTML = `
    <tr class="premium-loading-state">
      <td colspan="5">
        <div class="premium-loading">
          <div class="premium-loading-spinner"></div>
          <div class="premium-loading-text">
            <div class="loading-title">Retrieving Ban Records</div>
            <div class="loading-subtitle">Analyzing server ban history...</div>
          </div>
        </div>
      </td>
    </tr>
  `;
  
  // Fetch ban data
  fetch(`/admin3d/direct-bans/list/${serverId}`, {
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to load ban data');
    return response.json();
  })
  .then(data => {
    if (!data.bans || data.bans.length === 0) {
      // Show premium empty state
      banListBody.innerHTML = `
        <tr class="premium-empty-state">
          <td colspan="5">
            <div class="premium-empty-state-message">
              <div class="premium-empty-icon">
                <i class="fas fa-shield-alt"></i>
              </div>
              <div class="premium-empty-title">No Bans Found</div>
              <div class="premium-empty-description">
                This server doesn't have any banned users. When users are banned, they'll appear here.
              </div>
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    // Fill table with premium ban data
    banListBody.innerHTML = '';
    
    // Add staggered reveal animation
    data.bans.forEach((ban, index) => {
      const tr = document.createElement('tr');
      tr.className = 'premium-table-row';
      tr.style.animationDelay = `${index * 50}ms`;
      
      // Format date with premium style
      const banDate = new Date(ban.date || Date.now());
      const formattedDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(banDate);
      
      // Format duration with premium style
      let duration = 'Permanent';
      if (ban.duration && !ban.permanent) {
        duration = ban.duration;
      }
      
      tr.innerHTML = `
        <td>
          <div class="premium-user-info">
            <div class="premium-username">${ban.username || 'Unknown User'}</div>
            <div class="premium-user-id">${ban.userId}</div>
          </div>
        </td>
        <td>
          <div class="premium-reason">
            ${ban.reason || 'No reason provided'}
          </div>
        </td>
        <td>
          <div class="premium-date">
            <div class="date-primary">${formattedDate.split(',')[0]}</div>
            <div class="date-secondary">${formattedDate.split(',')[1]}</div>
          </div>
        </td>
        <td>
          <div class="premium-duration ${duration.toLowerCase() === 'permanent' ? 'permanent' : ''}">
            ${duration}
          </div>
        </td>
        <td>
          <div class="premium-action-buttons">
            <button class="premium-action-btn unban-btn" data-user-id="${ban.userId}" title="Unban User">
              <i class="fas fa-user-check"></i>
              <span class="btn-text">Unban</span>
            </button>
            <button class="premium-action-btn details-btn" data-user-id="${ban.userId}" title="View Details">
              <i class="fas fa-info-circle"></i>
              <span class="btn-text">Details</span>
            </button>
          </div>
        </td>
      `;
      
      banListBody.appendChild(tr);
    });
    
    // Add premium event listeners to action buttons
    setupPremiumBanActionButtons();
  })
  .catch(error => {
    console.error('Error loading bans:', error);
    
    // Show premium error state
    banListBody.innerHTML = `
      <tr class="premium-error-state">
        <td colspan="5">
          <div class="premium-error-message">
            <div class="premium-error-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="premium-error-title">Failed to Load Ban List</div>
            <div class="premium-error-description">
              We encountered an error while retrieving the ban list.
            </div>
            <button id="retryBanLoad" class="premium-retry-btn">
              <i class="fas fa-sync-alt"></i> Retry
            </button>
          </div>
        </td>
      </tr>
    `;
    
    // Add retry button event listener
    document.getElementById('retryBanLoad')?.addEventListener('click', function() {
      // Play premium UI sound
      playPremiumUISound('button-click');
      
      // Show retry animation
      this.classList.add('retrying');
      setTimeout(() => {
        loadPremiumBans(serverId);
      }, 500);
    });
  });
}

/**
 * Create a premium default sphere for visualization when no data is available
 * @param {THREE.Group} group - Three.js group to add the sphere to
 */
function createPremiumDefaultSphere(group) {
  // Clear existing objects
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
  
  // Create premium holographic sphere
  const sphereGeometry = new THREE.SphereGeometry(2, 64, 64);
  
  // Create premium material with wireframe overlay
  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x5522aa,
    metalness: 0.7,
    roughness: 0.3,
    emissive: 0x220033,
    emissiveIntensity: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  });
  
  // Create sphere
  const sphere = new THREE.Mesh(sphereGeometry, coreMaterial);
  group.add(sphere);
  
  // Add wireframe overlay
  const wireGeometry = new THREE.SphereGeometry(2.01, 32, 32);
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x9966ff,
    wireframe: true,
    transparent: true,
    opacity: 0.3
  });
  
  const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
  group.add(wireframe);
  
  // Add outer glow
  const glowGeometry = new THREE.SphereGeometry(2.1, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x9966ff,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide
  });
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);
  
  // Add floating particles around sphere
  const particleCount = 100;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    // Position particles in a shell around the sphere
    const radius = 2.5 + Math.random() * 0.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    
    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = radius * Math.cos(phi);
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xaa66ff,
    size: 0.1,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.7
  });
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);
  
  // Add floating text
  const loader = new THREE.FontLoader();
  
  // Position all groups correctly
  group.visible = true;
  Object.values(window.premium555kVisualization.visualizationGroups).forEach(g => {
    if (g !== group) g.visible = false;
  });
  
  // Add animation
  const clock = new THREE.Clock();
  const animate = () => {
    const time = clock.getElapsedTime();
    
    // Pulse effect on particles
    particleMaterial.size = 0.1 + Math.sin(time * 2) * 0.03;
    particleMaterial.opacity = 0.7 + Math.sin(time * 1.5) * 0.2;
    
    // Pulse effect on wireframe
    wireMaterial.opacity = 0.3 + Math.sin(time * 1.2) * 0.1;
    
    // Rotate wireframe differently than core
    wireframe.rotation.x = time * 0.2;
    wireframe.rotation.z = time * 0.1;
    
    // Pulse glow
    glowMaterial.opacity = 0.1 + Math.sin(time) * 0.05;
    
    requestAnimationFrame(animate);
  };
  
  animate();
}

/**
 * Update premium ban visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updatePremiumBanVisualization(serverId) {
  // Get visualization references
  const viz = window.premium555kVisualization;
  if (!viz) return;
  
  // Show loading visualization while fetching data
  createPremiumLoadingVisualization(viz.visualizationGroups.bans);
  
  // Show the ban visualization group
  Object.values(viz.visualizationGroups).forEach(group => {
    group.visible = false;
  });
  viz.visualizationGroups.bans.visible = true;
  
  // Fetch ban data for visualization
  fetch(`/admin3d/direct-bans/list/${serverId}`, {
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to load ban data');
    return response.json();
  })
  .then(data => {
    if (!data.bans || data.bans.length === 0) {
      // Show empty state visualization
      createPremiumEmptyStateVisualization(
        viz.visualizationGroups.bans, 
        'No bans found'
      );
      return;
    }
    
    // Create premium visualization with actual ban data
    createPremiumBanVisualization(data.bans, viz.visualizationGroups.bans);
  })
  .catch(error => {
    console.error('Error loading ban visualization data:', error);
    createPremiumErrorStateVisualization(viz.visualizationGroups.bans);
  });
}

/**
 * Create a premium loading visualization
 * @param {THREE.Group} group - Three.js group to add visualization to
 */
function createPremiumLoadingVisualization(group) {
  // Clear existing objects
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
  
  // Create premium loading ring
  const ringGeometry = new THREE.TorusGeometry(2, 0.1, 16, 100);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x9966ff,
    transparent: true,
    opacity: 0.7
  });
  
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  group.add(ring);
  
  // Create second ring
  const ring2Geometry = new THREE.TorusGeometry(2, 0.1, 16, 100);
  const ring2Material = new THREE.MeshBasicMaterial({
    color: 0x33aaff,
    transparent: true,
    opacity: 0.5
  });
  
  const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
  ring2.rotation.x = Math.PI / 2;
  group.add(ring2);
  
  // Create third ring
  const ring3Geometry = new THREE.TorusGeometry(1.7, 0.05, 16, 100);
  const ring3Material = new THREE.MeshBasicMaterial({
    color: 0xffaa33,
    transparent: true,
    opacity: 0.6
  });
  
  const ring3 = new THREE.Mesh(ring3Geometry, ring3Material);
  ring3.rotation.y = Math.PI / 2;
  group.add(ring3);
  
  // Create central sphere
  const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const sphereMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0x9966ff,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.9
  });
  
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  group.add(sphere);
  
  // Create particles
  const particleCount = 100;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    // Random positions in a sphere
    const radius = Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = radius * Math.cos(phi);
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x9966ff,
    size: 0.1,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.7
  });
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);
  
  // Animate loading visualization
  const clock = new THREE.Clock();
  
  function animateLoading() {
    const time = clock.getElapsedTime();
    
    // Rotate rings
    ring.rotation.x = time * 0.5;
    ring.rotation.y = time * 0.3;
    
    ring2.rotation.x = Math.PI / 2 + time * 0.7;
    ring2.rotation.z = time * 0.4;
    
    ring3.rotation.y = Math.PI / 2 + time * 0.6;
    ring3.rotation.z = time * 0.5;
    
    // Pulse central sphere
    const scale = 0.8 + Math.sin(time * 3) * 0.2;
    sphere.scale.set(scale, scale, scale);
    sphere.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.3;
    
    // Fade particles
    particleMaterial.opacity = 0.7 + Math.sin(time * 2) * 0.3;
    
    // Only continue animation if this group is still in the scene
    if (group.parent) {
      requestAnimationFrame(animateLoading);
    }
  }
  
  animateLoading();
}

/**
 * Create an enhanced premium visualization of ban data
 * @param {Array} bans - Array of ban objects
 * @param {THREE.Group} group - Three.js group to add visualization to
 */
function createPremiumBanVisualization(bans, group) {
  // Clear existing objects
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
  
  // Create a central hub
  const hubGeometry = new THREE.OctahedronGeometry(1, 1);
  const hubMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x6633aa,
    metalness: 0.7,
    roughness: 0.3,
    emissive: 0x220033,
    emissiveIntensity: 0.3,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  });
  
  const hub = new THREE.Mesh(hubGeometry, hubMaterial);
  group.add(hub);
  
  // Add rim light effect
  const rimGeometry = new THREE.OctahedronGeometry(1.05, 1);
  const rimMaterial = new THREE.MeshBasicMaterial({
    color: 0xaa66ff,
    transparent: true,
    opacity: 0.3,
    wireframe: true
  });
  
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  group.add(rim);
  
  // Create orbit rings
  const orbitMaterial = new THREE.MeshBasicMaterial({
    color: 0x6633aa,
    transparent: true,
    opacity: 0.2
  });
  
  const orbits = [];
  const orbitCount = Math.min(3, Math.ceil(bans.length / 10));
  
  for (let i = 0; i < orbitCount; i++) {
    const radius = 2 + i * 1.2;
    const orbitGeometry = new THREE.TorusGeometry(radius, 0.02, 16, 100);
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    orbit.userData.radius = radius;
    orbit.userData.rotationSpeed = 0.1 - i * 0.02;
    orbits.push(orbit);
    group.add(orbit);
  }
  
  // Add ban nodes in orbits
  const banNodes = [];
  const colors = [
    new THREE.Color(0xaa3366), // Red for permanent bans
    new THREE.Color(0x33aacc), // Blue for temporary bans
    new THREE.Color(0xaacc33)  // Green for expired bans
  ];
  
  bans.forEach((ban, index) => {
    // Determine node color based on ban type
    let colorIndex = 0; // Default to permanent (red)
    if (ban.duration && !ban.permanent) {
      colorIndex = 1; // Temporary (blue)
      
      // Check if expired (This is just a placeholder, you'd need actual logic to determine this)
      const isExpired = false; // Example condition
      if (isExpired) {
        colorIndex = 2; // Expired (green)
      }
    }
    
    // Create node
    const nodeSize = 0.15 + (ban.severity ? ban.severity * 0.05 : 0);
    const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
    const nodeMaterial = new THREE.MeshPhysicalMaterial({
      color: colors[colorIndex],
      emissive: colors[colorIndex],
      emissiveIntensity: 0.3,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    
    // Distribute nodes across available orbits
    const orbitIndex = index % orbits.length;
    const orbit = orbits[orbitIndex];
    const radius = orbit.userData.radius;
    
    // Position node on orbit
    const angle = (index / bans.length) * Math.PI * 2;
    node.position.x = radius * Math.cos(angle);
    node.position.z = radius * Math.sin(angle);
    
    // Store original position and orbit data
    node.userData = {
      ban: ban,
      orbit: orbitIndex,
      angle: angle,
      radius: radius,
      originalY: 0,
      pulsePhase: Math.random() * Math.PI * 2
    };
    
    banNodes.push(node);
    group.add(node);
    
    // Create connection line to hub
    const lineMaterial = new THREE.LineBasicMaterial({
      color: colors[colorIndex],
      transparent: true,
      opacity: 0.3
    });
    
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(node.position.x, node.position.y, node.position.z)
    ]);
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.userData = {
      node: node,
      baseOpacity: 0.3,
      pulsePhase: Math.random() * Math.PI * 2
    };
    group.add(line);
  });
  
  // Create animated particles
  const particleCount = 200;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSizes = new Float32Array(particleCount);
  
  for (let i = 0; i < particleCount; i++) {
    // Position particles in a sphere around the center
    const radius = 1 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    
    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = radius * Math.cos(phi);
    
    // Random sizes
    particleSizes[i] = 0.03 + Math.random() * 0.05;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x6633aa,
    size: 0.1,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.7,
    sizeAttenuation: true
  });
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);
  
  // Add central glow
  const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xaa66ff,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide
  });
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);
  
  // Animate the visualization
  const clock = new THREE.Clock();
  
  function animateVisualization() {
    const time = clock.getElapsedTime();
    
    // Rotate rim differently than hub
    rim.rotation.x = time * 0.2;
    rim.rotation.z = time * 0.1;
    
    // Pulse glow
    glowMaterial.opacity = 0.1 + Math.sin(time) * 0.05;
    
    // Rotate hub slowly
    hub.rotation.y = time * 0.1;
    
    // Update orbits
    orbits.forEach(orbit => {
      orbit.rotation.z = time * orbit.userData.rotationSpeed;
    });
    
    // Update ban nodes
    banNodes.forEach(node => {
      // Get orbit data
      const orbitIndex = node.userData.orbit;
      const orbit = orbits[orbitIndex];
      const angle = node.userData.angle + time * orbit.userData.rotationSpeed;
      const radius = node.userData.radius;
      
      // Update position based on orbit rotation
      node.position.x = radius * Math.cos(angle);
      node.position.z = radius * Math.sin(angle);
      
      // Add subtle floating motion
      node.position.y = node.userData.originalY + Math.sin(time + node.userData.pulsePhase) * 0.1;
      
      // Pulse node
      const scale = 1 + Math.sin(time * 2 + node.userData.pulsePhase) * 0.1;
      node.scale.set(scale, scale, scale);
    });
    
    // Update connection lines
    group.children.forEach(child => {
      if (child instanceof THREE.Line && child.userData.node) {
        const nodePos = child.userData.node.position;
        
        // Update line geometry to connect to moving node
        const positions = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(nodePos.x, nodePos.y, nodePos.z)
        ];
        
        child.geometry.dispose();
        child.geometry = new THREE.BufferGeometry().setFromPoints(positions);
        
        // Pulse opacity
        child.material.opacity = child.userData.baseOpacity + 
          Math.sin(time * 1.5 + child.userData.pulsePhase) * 0.2;
      }
    });
    
    // Animate particles
    const positions = particles.geometry.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      // Move particles in a subtle oscillating pattern
      const px = positions.getX(i);
      const py = positions.getY(i);
      const pz = positions.getZ(i);
      
      // Distance from center
      const dist = Math.sqrt(px * px + py * py + pz * pz);
      
      // Normalize direction
      const nx = px / dist;
      const ny = py / dist;
      const nz = pz / dist;
      
      // Oscillate distance
      const newDist = dist + Math.sin(time + i * 0.1) * 0.1;
      
      // Set new position
      positions.setX(i, nx * newDist);
      positions.setY(i, ny * newDist);
      positions.setZ(i, nz * newDist);
    }
    positions.needsUpdate = true;
    
    // Only continue animation if this group is still in the scene
    if (group.parent) {
      requestAnimationFrame(animateVisualization);
    }
  }
  
  animateVisualization();
}

/**
 * Create a premium empty state visualization
 * @param {THREE.Group} group - Three.js group to add visualization to
 * @param {string} message - Message to display
 */
function createPremiumEmptyStateVisualization(group, message) {
  // Clear existing objects
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
  
  // Create floating holographic shield
  const shieldGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 32, 1, false);
  const shieldMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x33aaff,
    metalness: 0.9,
    roughness: 0.2,
    emissive: 0x1133ff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  
  const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
  shield.rotation.x = Math.PI / 2;
  group.add(shield);
  
  // Add shield rim
  const rimGeometry = new THREE.TorusGeometry(1.5, 0.05, 16, 100);
  const rimMaterial = new THREE.MeshPhongMaterial({
    color: 0x33ccff,
    emissive: 0x3366ff,
    emissiveIntensity: 0.5,
    shininess: 100
  });
  
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.x = Math.PI / 2;
  group.add(rim);
  
  // Add center sphere
  const sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);
  const sphereMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0x6699ff,
    emissiveIntensity: 0.7,
    shininess: 100
  });
  
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  group.add(sphere);
  
  // Add pulsing rings
  const ringCount = 3;
  const rings = [];
  
  for (let i = 0; i < ringCount; i++) {
    const ringGeometry = new THREE.TorusGeometry(0.3 + i * 0.1, 0.02, 16, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x33aaff,
      transparent: true,
      opacity: 0.7 - i * 0.2
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.userData = {
      baseRadius: 0.3 + i * 0.1,
      pulsePhase: i * Math.PI / ringCount
    };
    rings.push(ring);
    group.add(ring);
  }
  
  // Add particles
  const particleCount = 100;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    // Position particles in a disc shape
    const radius = Math.random() * 1.4;
    const angle = Math.random() * Math.PI * 2;
    
    particlePositions[i * 3] = radius * Math.cos(angle);
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    particlePositions[i * 3 + 2] = radius * Math.sin(angle);
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x33ccff,
    size: 0.05,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.7
  });
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);
  
  // Animate the empty state visualization
  const clock = new THREE.Clock();
  
  function animateEmptyState() {
    const time = clock.getElapsedTime();
    
    // Float the shield up and down
    shield.position.y = Math.sin(time * 0.5) * 0.1;
    rim.position.y = shield.position.y;
    
    // Pulse the shield opacity
    shieldMaterial.opacity = 0.5 + Math.sin(time) * 0.2;
    
    // Rotate the shield
    shield.rotation.z = time * 0.2;
    rim.rotation.z = time * 0.2;
    
    // Animate sphere
    sphere.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
    
    // Animate rings
    rings.forEach(ring => {
      const pulseTime = time + ring.userData.pulsePhase;
      const scale = 1 + Math.sin(pulseTime * 3) * 0.2;
      ring.scale.set(scale, scale, scale);
      
      // Rotate rings
      ring.rotation.z = time * 0.3;
    });
    
    // Fade particles
    particleMaterial.opacity = 0.5 + Math.sin(time * 1.5) * 0.2;
    
    // Only continue animation if this group is still in the scene
    if (group.parent) {
      requestAnimationFrame(animateEmptyState);
    }
  }
  
  animateEmptyState();
}

/**
 * Create a premium error state visualization
 * @param {THREE.Group} group - Three.js group to add visualization to
 */
function createPremiumErrorStateVisualization(group) {
  // Clear existing objects
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
  
  // Create central error icon
  const iconGeometry = new THREE.OctahedronGeometry(1, 0);
  const iconMaterial = new THREE.MeshPhongMaterial({
    color: 0xcc3366,
    emissive: 0xaa2255,
    emissiveIntensity: 0.5,
    shininess: 100,
    flatShading: true
  });
  
  const icon = new THREE.Mesh(iconGeometry, iconMaterial);
  group.add(icon);
  
  // Create warning pulses
  const warningRings = [];
  const ringCount = 5;
  
  for (let i = 0; i < ringCount; i++) {
    const ringGeometry = new THREE.TorusGeometry(1.5, 0.1, 16, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3366,
      transparent: true,
      opacity: 0.8 - (i / ringCount) * 0.8,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.userData = {
      baseScale: 0.1 + (i / ringCount) * 2,
      phase: i * 0.2
    };
    
    ring.scale.set(
      ring.userData.baseScale,
      ring.userData.baseScale,
      ring.userData.baseScale
    );
    
    warningRings.push(ring);
    group.add(ring);
  }
  
  // Create flickering particles
  const particleCount = 200;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    // Random positions in a sphere
    const radius = 1 + Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    
    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = radius * Math.cos(phi);
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xff3366,
    size: 0.08,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.7
  });
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);
  
  // Animate the error state
  const clock = new THREE.Clock();
  
  function animateErrorState() {
    const time = clock.getElapsedTime();
    
    // Pulsate and rotate the icon
    const pulse = 1 + Math.sin(time * 3) * 0.1;
    icon.scale.set(pulse, pulse, pulse);
    icon.rotation.y = time * 0.5;
    icon.rotation.z = time * 0.3;
    
    // Flicker the icon's emissive intensity
    iconMaterial.emissiveIntensity = 0.5 + Math.random() * 0.5;
    
    // Animate warning rings
    warningRings.forEach(ring => {
      const t = (time + ring.userData.phase) % 2; // 2-second cycle
      if (t < 1) {
        // Expand ring during the first half of the cycle
        const scale = ring.userData.baseScale + t * 2;
        ring.scale.set(scale, scale, scale);
        ring.material.opacity = 0.8 * (1 - t);
      } else {
        // Reset ring during the second half
        ring.scale.set(ring.userData.baseScale, ring.userData.baseScale, ring.userData.baseScale);
        ring.material.opacity = 0;
      }
      
      // Rotate rings
      ring.rotation.x = time * 0.2;
      ring.rotation.y = time * 0.3;
    });
    
    // Flicker particles
    particleMaterial.opacity = 0.5 + Math.random() * 0.5;
    particleMaterial.size = 0.08 + Math.random() * 0.04;
    
    // Only continue animation if this group is still in the scene
    if (group.parent) {
      requestAnimationFrame(animateErrorState);
    }
  }
  
  animateErrorState();
}

/**
 * Update premium warning visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updatePremiumWarningVisualization(serverId) {
  // Implementation would be similar to updatePremiumBanVisualization
  // ... (Similar implementation with premium warning visualization)
  
  // For now, use the default visualization
  const viz = window.premium555kVisualization;
  if (!viz) return;
  
  createPremiumDefaultSphere(viz.visualizationGroups.warnings);
  
  // Show the warnings visualization group
  Object.values(viz.visualizationGroups).forEach(group => {
    group.visible = false;
  });
  viz.visualizationGroups.warnings.visible = true;
}

/**
 * Update premium automod visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updatePremiumAutomodVisualization(serverId) {
  // Implementation would be similar to updatePremiumBanVisualization
  // ... (Similar implementation with premium automod visualization)
  
  // For now, use the default visualization
  const viz = window.premium555kVisualization;
  if (!viz) return;
  
  createPremiumDefaultSphere(viz.visualizationGroups.automod);
  
  // Show the automod visualization group
  Object.values(viz.visualizationGroups).forEach(group => {
    group.visible = false;
  });
  viz.visualizationGroups.automod.visible = true;
}

/**
 * Update premium filter visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updatePremiumFilterVisualization(serverId) {
  // Implementation would be similar to updatePremiumBanVisualization
  // ... (Similar implementation with premium filter visualization)
  
  // For now, use the default visualization
  const viz = window.premium555kVisualization;
  if (!viz) return;
  
  createPremiumDefaultSphere(viz.visualizationGroups.filters);
  
  // Show the filters visualization group
  Object.values(viz.visualizationGroups).forEach(group => {
    group.visible = false;
  });
  viz.visualizationGroups.filters.visible = true;
}

/**
 * Update premium default visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updatePremiumDefaultVisualization(serverId) {
  const viz = window.premium555kVisualization;
  if (!viz) return;
  
  createPremiumDefaultSphere(viz.visualizationGroups.default);
  
  // Show the default visualization group
  Object.values(viz.visualizationGroups).forEach(group => {
    group.visible = false;
  });
  viz.visualizationGroups.default.visible = true;
}

// Initialize the premium $555k interface
console.log('$555K Premium Moderation Interface Loaded');