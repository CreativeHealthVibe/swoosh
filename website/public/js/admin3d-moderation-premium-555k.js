/**
 * SWOOSH Bot Admin3D Premium Moderation Interface ($555K Edition)
 * Advanced 3D visualizations and premium UI features for enterprise-level moderation
 * 
 * This premium script enhances the admin3d/moderation page with:
 * - Holographic UI elements
 * - Advanced 3D visualizations of moderation data
 * - Interactive neural-enhanced particle effects
 * - Premium glassmorphic interface elements
 * - Real-time data processing with sophisticated animations
 */

// Initialize Premium $555K Features when document loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Premium $555K Moderation Interface');
  initializePremiumEffects();
  initialize555kPremiumModeration();
  setupPremiumTabNavigation();
  initializePremiumFormHandlers();
  initializePremiumServerSelector();
});

/**
 * Initialize the premium effects
 */
function initializePremiumEffects() {
  addGlassomorphicEffects();
  initializeParticleEffects();
  initializeHolographicElements();
  addPremiumGradients();
}

/**
 * Add glassmorphic effects to UI elements
 */
function addGlassomorphicEffects() {
  const glassElements = document.querySelectorAll('.premium-card, .premium-tab-btn.active');
  
  glassElements.forEach(el => {
    el.style.backdropFilter = 'blur(10px)';
  });
}

/**
 * Initialize particle effects in background
 */
function initializeParticleEffects() {
  if (window.threeJSLoaded) {
    // Particle system will be initialized in THREE.js
    console.log('Particle effects ready with THREE.js');
  } else {
    // Fallback to CSS particles
    const container = document.querySelector('.admin3d-moderation');
    const particleContainer = document.createElement('div');
    particleContainer.className = 'premium-particle-container';
    
    // Add some particles
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'premium-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${5 + Math.random() * 10}s`;
      particle.style.animationDelay = `${Math.random() * 5}s`;
      particleContainer.appendChild(particle);
    }
    
    container.appendChild(particleContainer);
  }
}

/**
 * Initialize holographic UI elements
 */
function initializeHolographicElements() {
  // Add shimmer effect to elements
  const shimmerElements = document.querySelectorAll('.premium-card, .mod-title, .mod-section-header');
  
  shimmerElements.forEach(el => {
    el.classList.add('premium-shimmer');
  });
  
  // Add floating elements animation
  animateHolographicElements();
}

/**
 * Add premium gradients to backgrounds
 */
function addPremiumGradients() {
  const bgElements = document.querySelectorAll('.mod-server-selector, .mod-section-header');
  
  bgElements.forEach(el => {
    el.classList.add('premium-gradient-bg');
  });
}

/**
 * Animate holographic UI elements with subtle floating movement
 */
function animateHolographicElements() {
  const elements = document.querySelectorAll('.premium-card, .holographic-badge');
  
  // Add subtle floating animation
  elements.forEach(el => {
    let startY = 0;
    let floatY = 0;
    let floatX = 0;
    
    function updatePosition() {
      const time = Date.now() * 0.001;
      floatY = Math.sin(time) * 3;
      floatX = Math.sin(time * 0.7) * 1.5;
      
      el.style.transform = `translateY(${startY + floatY}px) translateX(${floatX}px)`;
      requestAnimationFrame(updatePosition);
    }
    
    updatePosition();
  });
}

/**
 * Initialize the premium server selector with dynamic loading visuals
 */
function initializePremiumServerSelector() {
  const serverSelect = document.getElementById('serverSelect');
  
  if (!serverSelect) return;
  
  // Add premium styling
  serverSelect.classList.add('premium-select');
  
  // Add event listener for server selection
  serverSelect.addEventListener('change', function() {
    const serverId = this.value;
    if (serverId) {
      loadPremiumServerData(serverId);
      updatePremiumVisualization(serverId);
    }
  });
}

/**
 * Load server data with premium visualization effects
 * @param {string} serverId - Discord server ID
 */
function loadPremiumServerData(serverId) {
  // Show loading effects
  document.querySelectorAll('.premium-stat-value').forEach(el => {
    el.innerHTML = '<div class="premium-loading">Loading...</div>';
  });
  
  // Update server ID in form inputs
  document.getElementById('banServerId').value = serverId;
  document.getElementById('warnServerId').value = serverId;
  if (document.getElementById('automod-server-selector')) {
    document.getElementById('automod-server-selector').value = serverId;
  }
  if (document.getElementById('filterServerId')) {
    document.getElementById('filterServerId').value = serverId;
  }
  
  // Load server stats
  loadPremiumServerStats(serverId);
  
  // Update active tab content
  const activeTab = document.querySelector('.premium-tab-btn.active');
  if (activeTab) {
    updatePremiumVisualizationForTab(activeTab.dataset.tab);
  }
}

/**
 * Load and display server statistics with premium animations
 * @param {string} serverId - Discord server ID
 */
function loadPremiumServerStats(serverId) {
  fetch(`/admin3d/api/server-stats/${serverId}`)
    .then(response => response.json())
    .then(data => {
      // Update stats with animation
      updatePremiumStatWithAnimation('totalBans', data.totalBans || 0);
      updatePremiumStatWithAnimation('totalWarnings', data.totalWarnings || 0);
      updatePremiumStatWithAnimation('automodActions', data.automodActions || 0);
      updatePremiumStatWithAnimation('memberCount', data.memberCount || 0);
    })
    .catch(error => {
      console.error('Error fetching server stats:', error);
      // Set default values on error
      document.querySelectorAll('.premium-stat-value').forEach(el => {
        el.textContent = '0';
      });
    });
}

/**
 * Update a stat with premium animation effects
 * @param {string} elementId - Element ID to update
 * @param {number} value - New value
 */
function updatePremiumStatWithAnimation(elementId, value) {
  const statElement = document.getElementById(elementId);
  if (!statElement) return;
  
  // Store original value
  const originalValue = parseInt(statElement.textContent.replace(/[^0-9]/g, '') || '0');
  
  // Determine if it's an increase or decrease
  const isIncrease = value > originalValue;
  const isDecrease = value < originalValue;
  
  // Create animation effect
  let startTime = null;
  const duration = 1500; // 1.5 seconds
  
  function animateStat(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    
    // Easing function
    const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
    
    // Calculate current value
    const currentValue = Math.floor(originalValue + (value - originalValue) * eased);
    statElement.textContent = currentValue.toLocaleString();
    
    // Continue animation if not complete
    if (progress < 1) {
      requestAnimationFrame(animateStat);
    } else {
      // Animation complete, add effect for change
      if (isIncrease) {
        createParticleBurst(statElement, 'increase');
        statElement.classList.add('stat-increase');
        setTimeout(() => statElement.classList.remove('stat-increase'), 1000);
      } else if (isDecrease) {
        createParticleBurst(statElement, 'decrease');
        statElement.classList.add('stat-decrease');
        setTimeout(() => statElement.classList.remove('stat-decrease'), 1000);
      }
    }
  }
  
  requestAnimationFrame(animateStat);
}

/**
 * Create a particle burst effect for stat changes
 * @param {HTMLElement} element - Element to attach particle burst to
 * @param {string} type - Type of change ('increase' or 'decrease')
 */
function createParticleBurst(element, type) {
  // Create particle container
  const burstContainer = document.createElement('div');
  burstContainer.className = 'premium-particle-burst';
  
  // Set position relative to the element
  const rect = element.getBoundingClientRect();
  burstContainer.style.position = 'absolute';
  burstContainer.style.left = `${rect.left + rect.width / 2}px`;
  burstContainer.style.top = `${rect.top + rect.height / 2}px`;
  
  // Create particles
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.className = `premium-burst-particle ${type}`;
    
    // Random angle and distance
    const angle = Math.random() * Math.PI * 2;
    const distance = 5 + Math.random() * 30;
    const duration = 500 + Math.random() * 1000;
    
    // Set initial position
    particle.style.left = '0px';
    particle.style.top = '0px';
    
    // Set movement
    particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
    particle.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
    
    // Set delay
    particle.style.transitionDelay = `${Math.random() * 100}ms`;
    
    // Add to container
    burstContainer.appendChild(particle);
  }
  
  // Add to body
  document.body.appendChild(burstContainer);
  
  // Remove after animation completes
  setTimeout(() => {
    document.body.removeChild(burstContainer);
  }, 2000);
}

/**
 * Set up premium tab navigation with enhanced transitions
 */
function setupPremiumTabNavigation() {
  const tabButtons = document.querySelectorAll('.premium-tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // Remove active class from all buttons and hide all content
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Show corresponding content
      const tabId = this.dataset.tab;
      const content = document.getElementById(tabId);
      if (content) {
        content.classList.add('active');
      }
      
      // Update the premium tab indicator
      updatePremiumTabIndicator(this);
      
      // Update the 3D visualization for this tab
      updatePremiumVisualizationForTab(tabId);
      
      // Play UI sound
      playPremiumUISound('tab');
    });
  });
  
  // Initialize active tab indicator
  const activeBtn = document.querySelector('.premium-tab-btn.active');
  if (activeBtn) {
    updatePremiumTabIndicator(activeBtn);
  }
}

/**
 * Update the premium tab indicator position
 * @param {HTMLElement} activeBtn - The active tab button
 */
function updatePremiumTabIndicator(activeBtn) {
  const highlight = activeBtn.querySelector('.premium-tab-highlight');
  if (highlight) {
    highlight.style.opacity = '1';
  }
}

/**
 * Play premium UI sound effects
 * @param {string} sound - Sound type to play
 */
function playPremiumUISound(sound) {
  // Sound is optional for future implementation
  // Could integrate with a Web Audio API solution
  console.log(`Premium UI sound: ${sound}`);
}

/**
 * Initialize premium form handlers with enhanced interactivity
 */
function initializePremiumFormHandlers() {
  setupPremiumFormSubmissionHandlers();
  
  // Add premium effect to form fields
  document.querySelectorAll('.form-field').forEach(field => {
    field.classList.add('premium-field');
  });
  
  // Add premium styling to buttons
  document.querySelectorAll('.mod-btn').forEach(btn => {
    btn.classList.add('premium-btn');
  });
  
  // Update custom duration field visibility
  const banDuration = document.getElementById('banDuration');
  const customDurationGroup = document.getElementById('customDurationGroup');
  
  if (banDuration && customDurationGroup) {
    banDuration.addEventListener('change', function() {
      if (this.value === 'custom') {
        customDurationGroup.style.display = 'block';
      } else {
        customDurationGroup.style.display = 'none';
      }
    });
  }
}

/**
 * Setup form submission handlers with premium animations
 */
function setupPremiumFormSubmissionHandlers() {
  // Ban user form
  const banUserForm = document.getElementById('banUserForm');
  if (banUserForm) {
    banUserForm.addEventListener('submit', function(e) {
      const serverId = document.getElementById('banServerId').value;
      if (!serverId) {
        e.preventDefault();
        showPremiumNotification('error', 'Server Required', 'Please select a server before banning a user.');
        return;
      }
    });
  }
  
  // Warn user form
  const warnUserForm = document.getElementById('warnUserForm');
  if (warnUserForm) {
    warnUserForm.addEventListener('submit', function(e) {
      const serverId = document.getElementById('warnServerId').value;
      if (!serverId) {
        e.preventDefault();
        showPremiumNotification('error', 'Server Required', 'Please select a server before issuing a warning.');
        return;
      }
    });
  }
}

/**
 * Show a premium notification with advanced animation
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
function showPremiumNotification(type, title, message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `premium-notification ${type}`;
  
  // Create notification content
  notification.innerHTML = `
    <div class="premium-notification-icon">
      <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
    </div>
    <div class="premium-notification-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
    <div class="premium-notification-close">
      <i class="fas fa-times"></i>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Show with animation
  setTimeout(() => {
    notification.classList.add('active');
  }, 10);
  
  // Add close handler
  const closeBtn = notification.querySelector('.premium-notification-close');
  closeBtn.addEventListener('click', function() {
    notification.classList.remove('active');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  });
  
  // Auto-close after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.classList.remove('active');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }
  }, 5000);
}

/**
 * Update visualization based on active tab with premium effects
 * @param {string} tabId - Active tab ID
 */
function updatePremiumVisualizationForTab(tabId) {
  const serverId = document.getElementById('serverSelect').value;
  if (!serverId) return;
  
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
  }
}

/**
 * Initialize the premium Three.js visualization for the moderation page
 */
function initialize555kPremiumModeration() {
  // Check if THREE.js is loaded
  if (typeof THREE === 'undefined') {
    console.warn('THREE.js not loaded. Premium 3D visualizations disabled.');
    return;
  }
  
  // Create scene
  const scene = new THREE.Scene();
  
  // Create camera
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  
  // Create renderer
  const container = document.getElementById('moderationVisualization');
  if (!container) return;
  
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  
  // Add background particles
  addPremiumBackgroundParticles(scene);
  
  // Create visualization groups
  const banGroup = new THREE.Group();
  const warningGroup = new THREE.Group();
  const automodGroup = new THREE.Group();
  const filterGroup = new THREE.Group();
  
  // Add groups to scene
  scene.add(banGroup);
  scene.add(warningGroup);
  scene.add(automodGroup);
  scene.add(filterGroup);
  
  // Set default state
  createPremiumDefaultSphere(scene);
  
  // Add controls if available
  let controls = null;
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
  }
  
  // Resize handler
  window.addEventListener('resize', function() {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
  });
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Update controls if available
    if (controls) controls.update();
    
    // Render scene
    renderer.render(scene, camera);
  }
  
  // Start animation loop
  animate();
  
  // Store references for later updates
  window.premiumVisualization = {
    scene,
    camera,
    renderer,
    banGroup,
    warningGroup,
    automodGroup,
    filterGroup
  };
}

/**
 * Update premium visualization for the active moderation tab
 * @param {string} serverId - Discord server ID
 */
function updatePremiumVisualization(serverId) {
  if (!window.premiumVisualization) return;
  
  const activeTab = document.querySelector('.premium-tab-btn.active');
  if (activeTab) {
    updatePremiumVisualizationForTab(activeTab.dataset.tab);
  } else {
    // Default to ban visualization if no tab is active
    updatePremiumBanVisualization(serverId);
  }
}

/**
 * Add premium background particles for atmosphere
 * @param {THREE.Scene} scene - The Three.js scene
 */
function addPremiumBackgroundParticles(scene) {
  const particleCount = 200;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colors = new Float32Array(particleCount * 3);
  
  // Generate particle positions and colors
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    
    // Position
    positions[i3] = (Math.random() - 0.5) * 20;
    positions[i3 + 1] = (Math.random() - 0.5) * 20;
    positions[i3 + 2] = (Math.random() - 0.5) * 20;
    
    // Size
    sizes[i] = Math.random() * 0.1 + 0.05;
    
    // Color
    colors[i3] = 0.4 + Math.random() * 0.2; // R (blueish-purple)
    colors[i3 + 1] = 0.3 + Math.random() * 0.2; // G
    colors[i3 + 2] = 0.7 + Math.random() * 0.3; // B
  }
  
  // Set attributes
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  // Create shader material
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  
  // Create particle system
  const particleSystem = new THREE.Points(particles, particleMaterial);
  
  // Add to scene
  scene.add(particleSystem);
  
  // Animate particles
  function animateParticles() {
    const positions = particles.attributes.position.array;
    const sizes = particles.attributes.size.array;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Slow movement
      positions[i3 + 1] += Math.sin(Date.now() * 0.001 + i) * 0.002;
      
      // Pulse size
      sizes[i] = (Math.sin(Date.now() * 0.003 + i) * 0.03 + 0.08);
    }
    
    particles.attributes.position.needsUpdate = true;
    particles.attributes.size.needsUpdate = true;
    
    requestAnimationFrame(animateParticles);
  }
  
  animateParticles();
}

/**
 * Load premium ban list data
 * @param {string} serverId - Discord server ID
 */
function loadPremiumBans(serverId) {
  // Create loading visualization
  if (window.premiumVisualization) {
    const { banGroup } = window.premiumVisualization;
    banGroup.clear();
    createPremiumLoadingVisualization(banGroup);
  }
  
  // Fetch ban list data
  fetch(`/admin3d/api/bans/${serverId}`)
    .then(response => response.json())
    .then(data => {
      if (window.premiumVisualization) {
        const { banGroup } = window.premiumVisualization;
        banGroup.clear();
        
        if (data && data.bans && data.bans.length > 0) {
          createPremiumBanVisualization(data.bans, banGroup);
          
          // Also update the UI table
          updateBanList(data.bans);
        } else {
          createPremiumEmptyStateVisualization(banGroup, 'No bans found for this server');
        }
      }
    })
    .catch(error => {
      console.error('Error fetching bans:', error);
      
      if (window.premiumVisualization) {
        const { banGroup } = window.premiumVisualization;
        banGroup.clear();
        createPremiumErrorStateVisualization(banGroup);
      }
    });
}

/**
 * Create a premium default sphere for visualization when no data is available
 * @param {THREE.Group} group - Three.js group to add the sphere to
 */
function createPremiumDefaultSphere(group) {
  const geometry = new THREE.SphereGeometry(2, 32, 32);
  const material = new THREE.MeshPhongMaterial({
    color: 0x7289DA,
    emissive: 0x4a5c9e,
    specular: 0xffffff,
    shininess: 30,
    transparent: true,
    opacity: 0.7
  });
  
  const sphere = new THREE.Mesh(geometry, material);
  
  // Add to group
  group.add(sphere);
  
  // Add light to illuminate the sphere
  const light = new THREE.PointLight(0x7289DA, 1, 10);
  light.position.set(2, 2, 2);
  group.add(light);
  
  // Add animation
  function animateSphere() {
    sphere.rotation.y += 0.005;
    sphere.rotation.x += 0.002;
    
    requestAnimationFrame(animateSphere);
  }
  
  animateSphere();
}

/**
 * Update premium ban visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updatePremiumBanVisualization(serverId) {
  loadPremiumBans(serverId);
  
  // Also update the UI table
  if (typeof loadBans === 'function') {
    loadBans(serverId);
  }
}

/**
 * Create a premium loading visualization
 * @param {THREE.Group} group - Three.js group to add visualization to
 */
function createPremiumLoadingVisualization(group) {
  // Create loading circle
  const geometry = new THREE.RingGeometry(1, 1.2, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0x7289DA,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  
  const ring = new THREE.Mesh(geometry, material);
  group.add(ring);
  
  // Create segments for loading animation
  const segmentCount = 8;
  const segments = [];
  
  for (let i = 0; i < segmentCount; i++) {
    const segmentGeometry = new THREE.TorusGeometry(1.1, 0.1, 8, 6, Math.PI / 6);
    const segmentMaterial = new THREE.MeshBasicMaterial({
      color: 0x7289DA,
      transparent: true,
      opacity: 0.2 + (i / segmentCount) * 0.8
    });
    
    const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
    segment.rotation.z = (i / segmentCount) * Math.PI * 2;
    
    group.add(segment);
    segments.push(segment);
  }
  
  // Animate loading
  function animateLoading() {
    ring.rotation.z += 0.01;
    
    segments.forEach((segment, i) => {
      segment.rotation.z += 0.02 + (i / segmentCount) * 0.01;
      segment.material.opacity = 0.2 + (Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5) * 0.8;
    });
    
    requestAnimationFrame(animateLoading);
  }
  
  animateLoading();
}

/**
 * Create an enhanced premium visualization of ban data
 * @param {Array} bans - Array of ban objects
 * @param {THREE.Group} group - Three.js group to add visualization to
 */
function createPremiumBanVisualization(bans, group) {
  // Calculate stats for visualization
  const totalBans = bans.length;
  const reasonCounts = {};
  const dateGroups = {};
  
  // Process ban data
  bans.forEach(ban => {
    // Process reasons
    const reason = ban.reason || 'Unknown';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    
    // Process dates
    const date = new Date(ban.createdAt || Date.now());
    const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    dateGroups[month] = (dateGroups[month] || 0) + 1;
  });
  
  // Create central hub
  const hubGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const hubMaterial = new THREE.MeshPhongMaterial({
    color: 0x7289DA,
    emissive: 0x4a5c9e,
    transparent: true,
    opacity: 0.8
  });
  
  const hub = new THREE.Mesh(hubGeometry, hubMaterial);
  group.add(hub);
  
  // Add light
  const light = new THREE.PointLight(0x7289DA, 1, 10);
  light.position.set(0, 0, 0);
  group.add(light);
  
  // Create data nodes for reasons
  const reasonKeys = Object.keys(reasonCounts);
  const reasonNodes = [];
  
  reasonKeys.forEach((reason, i) => {
    const count = reasonCounts[reason];
    const angle = (i / reasonKeys.length) * Math.PI * 2;
    const distance = 2 + Math.random() * 0.5;
    
    // Calculate position
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const z = (Math.random() - 0.5) * 2;
    
    // Create node
    const size = 0.1 + (count / totalBans) * 0.4;
    const nodeGeometry = new THREE.SphereGeometry(size, 16, 16);
    const nodeMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(i / reasonKeys.length, 0.7, 0.5),
      transparent: true,
      opacity: 0.7
    });
    
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    node.position.set(x, y, z);
    group.add(node);
    
    // Create connection line
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x7289DA,
      transparent: true,
      opacity: 0.3
    });
    
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(x, y, z)
    ]);
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    group.add(line);
    
    // Store node for animation
    reasonNodes.push({
      node,
      line,
      angle,
      distance,
      basePos: { x, y, z }
    });
  });
  
  // Create time-based data orbit
  const timeKeys = Object.keys(dateGroups).sort();
  const timeNodes = [];
  
  timeKeys.forEach((date, i) => {
    const count = dateGroups[date];
    const angle = (i / timeKeys.length) * Math.PI * 2;
    const distance = 1.5;
    
    // Calculate position
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const z = 0.5;
    
    // Create node
    const size = 0.05 + (count / totalBans) * 0.2;
    const nodeGeometry = new THREE.BoxGeometry(size, size, size);
    const nodeMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a5c9e,
      emissive: 0x293752,
      transparent: true,
      opacity: 0.7
    });
    
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    node.position.set(x, y, z);
    group.add(node);
    
    // Store node for animation
    timeNodes.push({
      node,
      angle,
      distance,
      basePos: { x, y, z }
    });
  });
  
  // Animate visualization
  function animateVisualization() {
    // Rotate hub
    hub.rotation.y += 0.01;
    hub.rotation.x += 0.005;
    
    // Animate reason nodes
    reasonNodes.forEach((data, i) => {
      const time = Date.now() * 0.001;
      const { node, line, angle, distance, basePos } = data;
      
      // Orbital movement
      const newAngle = angle + time * (0.1 + i * 0.01) % (Math.PI * 2);
      const x = Math.cos(newAngle) * distance;
      const y = Math.sin(newAngle) * distance;
      const z = basePos.z + Math.sin(time * 0.5 + i) * 0.2;
      
      node.position.set(x, y, z);
      
      // Update line
      line.geometry.dispose();
      line.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z)
      ]);
      
      // Pulse effect
      node.scale.set(
        1 + Math.sin(time * 2 + i) * 0.1,
        1 + Math.sin(time * 2 + i) * 0.1,
        1 + Math.sin(time * 2 + i) * 0.1
      );
    });
    
    // Animate time nodes
    timeNodes.forEach((data, i) => {
      const time = Date.now() * 0.001;
      const { node, angle, distance } = data;
      
      // Orbital movement
      const newAngle = angle + time * 0.2 % (Math.PI * 2);
      const x = Math.cos(newAngle) * distance;
      const y = Math.sin(newAngle) * distance;
      const z = data.basePos.z + Math.cos(time + i) * 0.1;
      
      node.position.set(x, y, z);
      
      // Rotation
      node.rotation.x += 0.01;
      node.rotation.y += 0.01;
    });
    
    requestAnimationFrame(animateVisualization);
  }
  
  animateVisualization();
}

/**
 * Create a premium empty state visualization
 * @param {THREE.Group} group - Three.js group to add visualization to
 * @param {string} message - Message to display
 */
function createPremiumEmptyStateVisualization(group, message) {
  // Create empty state orb
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshPhongMaterial({
    color: 0x555555,
    emissive: 0x222222,
    transparent: true,
    opacity: 0.5,
    wireframe: true
  });
  
  const sphere = new THREE.Mesh(geometry, material);
  group.add(sphere);
  
  // Create particles inside the sphere
  const particleCount = 50;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = 0.8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
  }
  
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x7289DA,
    size: 0.05,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
  });
  
  const particleSystem = new THREE.Points(particles, particleMaterial);
  group.add(particleSystem);
  
  // Add light
  const light = new THREE.PointLight(0x7289DA, 0.5, 10);
  light.position.set(2, 2, 2);
  group.add(light);
  
  // Animate
  function animateEmptyState() {
    sphere.rotation.y += 0.005;
    sphere.rotation.x += 0.002;
    
    // Pulse effect
    const time = Date.now() * 0.001;
    const scale = 1 + Math.sin(time) * 0.05;
    sphere.scale.set(scale, scale, scale);
    
    // Pulse particles
    particleMaterial.opacity = 0.5 + Math.sin(time * 2) * 0.2;
    
    requestAnimationFrame(animateEmptyState);
  }
  
  animateEmptyState();
}

/**
 * Create a premium error state visualization
 * @param {THREE.Group} group - Three.js group to add visualization to
 */
function createPremiumErrorStateVisualization(group) {
  // Create glitchy error cube
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const material = new THREE.MeshPhongMaterial({
    color: 0xff3333,
    emissive: 0x551111,
    transparent: true,
    opacity: 0.7,
    wireframe: false
  });
  
  const cube = new THREE.Mesh(geometry, material);
  group.add(cube);
  
  // Create glitch particles
  const particleCount = 100;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
    
    sizes[i] = Math.random() * 0.1 + 0.02;
  }
  
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xff5555,
    size: 0.1,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
  });
  
  const particleSystem = new THREE.Points(particles, particleMaterial);
  group.add(particleSystem);
  
  // Add light
  const light = new THREE.PointLight(0xff0000, 1, 10);
  light.position.set(2, 2, 2);
  group.add(light);
  
  // Animate
  function animateErrorState() {
    // Glitchy rotation
    cube.rotation.y += 0.01 * (Math.random() * 0.5 + 0.75);
    cube.rotation.x += 0.005 * (Math.random() * 0.5 + 0.75);
    
    // Random scale glitches
    if (Math.random() > 0.95) {
      const glitchScale = 0.9 + Math.random() * 0.2;
      cube.scale.set(glitchScale, glitchScale, glitchScale);
    }
    
    // Particle movement
    const positions = particles.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random movements
      if (Math.random() > 0.95) {
        positions[i3] += (Math.random() - 0.5) * 0.2;
        positions[i3 + 1] += (Math.random() - 0.5) * 0.2;
        positions[i3 + 2] += (Math.random() - 0.5) * 0.2;
      }
      
      // Pull back to sphere
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      const length = Math.sqrt(x * x + y * y + z * z);
      
      if (length > 2.2 || length < 1.8) {
        positions[i3] *= 2 / length;
        positions[i3 + 1] *= 2 / length;
        positions[i3 + 2] *= 2 / length;
      }
    }
    
    particles.attributes.position.needsUpdate = true;
    
    requestAnimationFrame(animateErrorState);
  }
  
  animateErrorState();
}

/**
 * Update premium warning visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updatePremiumWarningVisualization(serverId) {
  if (!window.premiumVisualization) return;
  
  const { warningGroup } = window.premiumVisualization;
  warningGroup.clear();
  
  // Show loading state
  createPremiumLoadingVisualization(warningGroup);
  
  // Fetch warning data
  fetch(`/admin3d/api/warnings/${serverId}`)
    .then(response => response.json())
    .then(data => {
      warningGroup.clear();
      
      if (data && data.warnings && data.warnings.length > 0) {
        // Process warning data for visualization
        const warnings = data.warnings;
        
        // Create visualization for the warnings
        const warningsByUser = {};
        warnings.forEach(warning => {
          const userId = warning.userId;
          if (!warningsByUser[userId]) {
            warningsByUser[userId] = [];
          }
          warningsByUser[userId].push(warning);
        });
        
        // Create central visualization
        const users = Object.keys(warningsByUser);
        const userCount = users.length;
        
        // Create user nodes
        users.forEach((userId, i) => {
          const userWarnings = warningsByUser[userId];
          const angle = (i / userCount) * Math.PI * 2;
          const distance = 2;
          
          // Calculate position
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance;
          const z = (Math.random() - 0.5) * 2;
          
          // Create node
          const size = 0.2 + (userWarnings.length / 10) * 0.3; // Scale by warning count
          const nodeGeometry = new THREE.SphereGeometry(size, 16, 16);
          const nodeMaterial = new THREE.MeshPhongMaterial({
            color: 0xff9900,
            emissive: 0x553300,
            transparent: true,
            opacity: 0.7
          });
          
          const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
          node.position.set(x, y, z);
          warningGroup.add(node);
          
          // Create connection to center
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xff9900,
            transparent: true,
            opacity: 0.3
          });
          
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(x, y, z)
          ]);
          
          const line = new THREE.Line(lineGeometry, lineMaterial);
          warningGroup.add(line);
        });
      } else {
        // Show empty state
        createPremiumEmptyStateVisualization(warningGroup, 'No warnings found');
      }
      
      // Load the warning list into the UI
      if (typeof loadWarnings === 'function') {
        loadWarnings(serverId);
      }
    })
    .catch(error => {
      console.error('Error fetching warnings:', error);
      warningGroup.clear();
      createPremiumErrorStateVisualization(warningGroup);
    });
}

/**
 * Update premium automod visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updatePremiumAutomodVisualization(serverId) {
  if (!window.premiumVisualization) return;
  
  const { automodGroup } = window.premiumVisualization;
  automodGroup.clear();
  
  // Show loading state
  createPremiumLoadingVisualization(automodGroup);
  
  // Fetch automod settings & logs
  fetch(`/admin3d/api/automod/${serverId}`)
    .then(response => response.json())
    .then(data => {
      automodGroup.clear();
      
      if (data && data.enabled) {
        // Create automod brain visualization
        const brainGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const brainMaterial = new THREE.MeshPhongMaterial({
          color: 0x64aaff,
          emissive: 0x224466,
          transparent: true,
          opacity: 0.7,
          wireframe: false
        });
        
        const brain = new THREE.Mesh(brainGeometry, brainMaterial);
        automodGroup.add(brain);
        
        // Create neural network lines
        const lineCount = 20;
        for (let i = 0; i < lineCount; i++) {
          const points = [];
          const segments = 10;
          
          // Create curved line
          for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            const angle = (i / lineCount) * Math.PI * 2;
            const radius = 1.5 + Math.sin(t * Math.PI) * 1;
            
            const x = Math.cos(angle) * radius * t;
            const y = Math.sin(angle) * radius * t;
            const z = (Math.random() - 0.5) * t * 2;
            
            points.push(new THREE.Vector3(x, y, z));
          }
          
          const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x64aaff,
            transparent: true,
            opacity: 0.5
          });
          
          const line = new THREE.Line(lineGeometry, lineMaterial);
          automodGroup.add(line);
        }
        
        // Create activity nodes
        if (data.logs && data.logs.length > 0) {
          data.logs.slice(0, 10).forEach((log, i) => {
            const angle = (i / 10) * Math.PI * 2;
            const distance = 2.5;
            
            // Calculate position
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const z = (Math.random() - 0.5) * 2;
            
            // Create node
            const nodeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const color = log.action === 'delete' ? 0xff5050 : 
                         log.action === 'warn' ? 0xffaa00 :
                         log.action === 'mute' ? 0xaa00ff : 0x64aaff;
            
            const nodeMaterial = new THREE.MeshPhongMaterial({
              color,
              transparent: true,
              opacity: 0.7
            });
            
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
            node.position.set(x, y, z);
            automodGroup.add(node);
          });
        }
      } else {
        // Show disabled state
        createPremiumEmptyStateVisualization(automodGroup, 'AutoMod is disabled');
      }
    })
    .catch(error => {
      console.error('Error fetching automod data:', error);
      automodGroup.clear();
      createPremiumErrorStateVisualization(automodGroup);
    });
}

/**
 * Update premium filter visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updatePremiumFilterVisualization(serverId) {
  if (!window.premiumVisualization) return;
  
  const { filterGroup } = window.premiumVisualization;
  filterGroup.clear();
  
  // Show loading state
  createPremiumLoadingVisualization(filterGroup);
  
  // Fetch filter data
  fetch(`/admin3d/api/filters/${serverId}`)
    .then(response => response.json())
    .then(data => {
      filterGroup.clear();
      
      if (data && data.filters && data.filters.length > 0) {
        // Create filter visualization
        const filterCount = data.filters.length;
        
        // Create shield
        const shieldGeometry = new THREE.CylinderGeometry(1.5, 1.8, 0.2, 32);
        const shieldMaterial = new THREE.MeshPhongMaterial({
          color: 0x9880ff,
          emissive: 0x332266,
          transparent: true,
          opacity: 0.5
        });
        
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.rotation.x = Math.PI / 2;
        filterGroup.add(shield);
        
        // Create filter nodes
        data.filters.forEach((filter, i) => {
          const angle = (i / filterCount) * Math.PI * 2;
          const distance = 1.2;
          
          // Calculate position
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance;
          const z = 0;
          
          // Create node
          const nodeGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
          const nodeMaterial = new THREE.MeshPhongMaterial({
            color: 0x9880ff,
            transparent: true,
            opacity: 0.8
          });
          
          const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
          node.position.set(x, y, z);
          node.rotation.z = angle;
          node.rotation.y = angle;
          filterGroup.add(node);
        });
        
        // Create outer ring
        const ringGeometry = new THREE.RingGeometry(1.8, 2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0x9880ff,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        filterGroup.add(ring);
      } else {
        // Show empty state
        createPremiumEmptyStateVisualization(filterGroup, 'No filters configured');
      }
    })
    .catch(error => {
      console.error('Error fetching filter data:', error);
      filterGroup.clear();
      createPremiumErrorStateVisualization(filterGroup);
    });
}

/**
 * Update premium default visualization for a server
 * @param {string} serverId - Discord server ID
 */
function updatePremiumDefaultVisualization(serverId) {
  if (!window.premiumVisualization) return;
  
  const { scene } = window.premiumVisualization;
  
  // Hide all groups
  if (window.premiumVisualization.banGroup) window.premiumVisualization.banGroup.visible = false;
  if (window.premiumVisualization.warningGroup) window.premiumVisualization.warningGroup.visible = false;
  if (window.premiumVisualization.automodGroup) window.premiumVisualization.automodGroup.visible = false;
  if (window.premiumVisualization.filterGroup) window.premiumVisualization.filterGroup.visible = false;
  
  // Create default sphere if not exists
  if (!window.premiumVisualization.defaultGroup) {
    const defaultGroup = new THREE.Group();
    createPremiumDefaultSphere(defaultGroup);
    scene.add(defaultGroup);
    window.premiumVisualization.defaultGroup = defaultGroup;
  } else {
    window.premiumVisualization.defaultGroup.visible = true;
  }
}

// Add function to update ban list UI with premium styling
function updateBanList(bans) {
  const banListBody = document.getElementById('banListBody');
  if (!banListBody) return;
  
  if (!bans || bans.length === 0) {
    banListBody.innerHTML = `
      <tr class="empty-state">
        <td colspan="5">
          <div class="premium-empty-state">
            <i class="fas fa-info-circle"></i>
            <p>No bans found for this server</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  let html = '';
  
  bans.forEach(ban => {
    const date = new Date(ban.createdAt || Date.now()).toLocaleString();
    
    html += `
      <tr class="premium-table-row" data-ban-id="${ban.id || ''}">
        <td>
          <div class="user-cell">
            <div class="user-avatar">
              <img src="${ban.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="User Avatar">
            </div>
            <div class="user-info">
              <div class="user-name">${ban.username || 'Unknown User'}</div>
              <div class="user-id">${ban.userId || ''}</div>
            </div>
          </div>
        </td>
        <td>${ban.reason || 'No reason provided'}</td>
        <td>${date}</td>
        <td>${ban.duration === 'permanent' ? 'Permanent' : ban.duration || 'Permanent'}</td>
        <td>
          <div class="action-buttons">
            <button class="premium-action-btn unban-btn" data-ban-id="${ban.id || ''}" data-user-id="${ban.userId || ''}">
              <i class="fas fa-undo"></i>
            </button>
            <button class="premium-action-btn details-btn" data-ban-id="${ban.id || ''}">
              <i class="fas fa-info-circle"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  
  banListBody.innerHTML = html;
  
  // Add event listeners to buttons
  document.querySelectorAll('.unban-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const userId = this.dataset.userId;
      const serverId = document.getElementById('serverSelect').value;
      
      if (confirm(`Are you sure you want to unban this user?`)) {
        fetch(`/admin3d/api/unban`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            serverId,
            userId
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            showPremiumNotification('success', 'User Unbanned', data.message || 'The user has been unbanned successfully.');
            loadPremiumBans(serverId);
          } else {
            showPremiumNotification('error', 'Error', data.message || 'Failed to unban the user.');
          }
        })
        .catch(error => {
          console.error('Error unbanning user:', error);
          showPremiumNotification('error', 'Error', 'An error occurred while unbanning the user.');
        });
      }
    });
  });
  
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const banId = this.dataset.banId;
      const ban = bans.find(b => b.id === banId);
      
      if (ban) {
        showBanDetailsModal(ban);
      }
    });
  });
}

// Add ban details modal function
function showBanDetailsModal(ban) {
  // Create modal if not exists
  let modal = document.getElementById('banDetailsModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'banDetailsModal';
    modal.className = 'premium-modal';
    
    modal.innerHTML = `
      <div class="premium-modal-content">
        <div class="premium-modal-header">
          <h3>Ban Details</h3>
          <div class="premium-modal-close">&times;</div>
        </div>
        <div class="premium-modal-body">
          <div class="ban-details-content"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close handler
    modal.querySelector('.premium-modal-close').addEventListener('click', function() {
      modal.classList.remove('active');
    });
  }
  
  // Update modal content
  const content = modal.querySelector('.ban-details-content');
  const date = new Date(ban.createdAt || Date.now()).toLocaleString();
  const expiresDate = ban.expiresAt ? new Date(ban.expiresAt).toLocaleString() : 'Never';
  
  content.innerHTML = `
    <div class="ban-details-user">
      <div class="ban-user-avatar">
        <img src="${ban.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="User Avatar">
      </div>
      <div class="ban-user-info">
        <h4>${ban.username || 'Unknown User'}</h4>
        <div class="ban-user-id">${ban.userId || ''}</div>
      </div>
    </div>
    
    <div class="ban-details-info">
      <div class="ban-detail-item">
        <div class="ban-detail-label">Reason</div>
        <div class="ban-detail-value">${ban.reason || 'No reason provided'}</div>
      </div>
      
      <div class="ban-detail-item">
        <div class="ban-detail-label">Banned By</div>
        <div class="ban-detail-value">${ban.executor || 'Unknown'}</div>
      </div>
      
      <div class="ban-detail-item">
        <div class="ban-detail-label">Date</div>
        <div class="ban-detail-value">${date}</div>
      </div>
      
      <div class="ban-detail-item">
        <div class="ban-detail-label">Duration</div>
        <div class="ban-detail-value">${ban.duration === 'permanent' ? 'Permanent' : ban.duration || 'Permanent'}</div>
      </div>
      
      <div class="ban-detail-item">
        <div class="ban-detail-label">Expires</div>
        <div class="ban-detail-value">${expiresDate}</div>
      </div>
    </div>
    
    <div class="ban-actions">
      <button class="premium-btn unban-action" data-user-id="${ban.userId || ''}">
        <i class="fas fa-undo"></i> Unban User
      </button>
    </div>
  `;
  
  // Add unban handler
  content.querySelector('.unban-action').addEventListener('click', function() {
    const userId = this.dataset.userId;
    const serverId = document.getElementById('serverSelect').value;
    
    if (confirm(`Are you sure you want to unban this user?`)) {
      fetch(`/admin3d/api/unban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serverId,
          userId
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showPremiumNotification('success', 'User Unbanned', data.message || 'The user has been unbanned successfully.');
          modal.classList.remove('active');
          loadPremiumBans(serverId);
        } else {
          showPremiumNotification('error', 'Error', data.message || 'Failed to unban the user.');
        }
      })
      .catch(error => {
        console.error('Error unbanning user:', error);
        showPremiumNotification('error', 'Error', 'An error occurred while unbanning the user.');
      });
    }
  });
  
  // Show modal
  modal.classList.add('active');
}