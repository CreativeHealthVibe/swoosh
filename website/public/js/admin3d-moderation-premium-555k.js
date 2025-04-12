/**
 * SWOOSH Bot - Ultra Premium Moderation Interface
 * Enterprise-grade $555K Edition JavaScript
 * 
 * 3D Visualizations, Advanced UI Interactions, Real-time Data
 */

// Global variables
let animationFrame;
let scene, camera, renderer;
let controls, raycaster, mouse;
let dataPoints = [];
let serverData = {};
let selectedServerId = '';
let visualizationMode = '3d'; // '3d' or '2d'

// DOM elements
const serverSelect = document.getElementById('serverSelect');
const banListBody = document.getElementById('banListBody');
const warningListBody = document.getElementById('warningListBody');
const banUserForm = document.getElementById('banUserForm');
const warnUserForm = document.getElementById('warnUserForm');
const banDuration = document.getElementById('banDuration');
const customDurationGroup = document.getElementById('customDurationGroup');
const banServerId = document.getElementById('banServerId');
const warnServerId = document.getElementById('warnServerId');
const refreshBans = document.getElementById('refreshBans');
const refreshWarnings = document.getElementById('refreshWarnings');
const banSearchInput = document.getElementById('banSearchInput');
const warningSearchInput = document.getElementById('warningSearchInput');
const totalBansElement = document.getElementById('totalBans');
const totalWarningsElement = document.getElementById('totalWarnings');
const automodActionsElement = document.getElementById('automodActions');
const memberCountElement = document.getElementById('memberCount');
const navBtns = document.querySelectorAll('.mod-nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Check if THREE.js is available
const useThreeJS = window.threeJSLoaded !== false && typeof THREE !== 'undefined';
const threeContainer = document.getElementById('moderation-three-container');

// Initialize the moderation dashboard
document.addEventListener('DOMContentLoaded', () => {
  initializeUI();
  if (useThreeJS && threeContainer) {
    initThreeJS();
  } else {
    console.warn('THREE.js post-processing not available. Skipping effects.');
    visualizationMode = '2d';
  }
  
  // Add data loading animation
  showLoadingAnimation();
});

// Initialize UI elements and event listeners
function initializeUI() {
  // Server selection
  if (serverSelect) {
    serverSelect.addEventListener('change', handleServerChange);
  }
  
  // Ban duration select
  if (banDuration) {
    banDuration.addEventListener('change', () => {
      customDurationGroup.style.display = banDuration.value === 'custom' ? 'block' : 'none';
    });
  }
  
  // Form submissions
  if (banUserForm) {
    banUserForm.addEventListener('submit', handleBanSubmit);
  }
  
  if (warnUserForm) {
    warnUserForm.addEventListener('submit', handleWarnSubmit);
  }
  
  // Refresh buttons
  if (refreshBans) {
    refreshBans.addEventListener('click', () => refreshData('bans'));
  }
  
  if (refreshWarnings) {
    refreshWarnings.addEventListener('click', () => refreshData('warnings'));
  }
  
  // Search inputs
  if (banSearchInput) {
    banSearchInput.addEventListener('input', debounce(() => filterData('bans', banSearchInput.value), 300));
  }
  
  if (warningSearchInput) {
    warningSearchInput.addEventListener('input', debounce(() => filterData('warnings', warningSearchInput.value), 300));
  }
  
  // Tab navigation
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // Initialize tooltips
  initTooltips();
  
  // Add premium UI animations
  addPremiumUIAnimations();
}

// Initialize THREE.js scene
function initThreeJS() {
  // Create scene
  scene = new THREE.Scene();
  
  // Create camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  threeContainer.appendChild(renderer.domElement);
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  
  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 1, 1);
  scene.add(directionalLight);
  
  // Add orbit controls if THREE.OrbitControls is available
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
  }
  
  // Initialize raycaster for interactions
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  
  // Add background particles
  addBackgroundParticles();
  
  // Add event listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  
  // Start animation loop
  animate();
}

// Create background particles
function addBackgroundParticles() {
  const particleCount = 200;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSizes = new Float32Array(particleCount);
  
  // Generate random positions for particles
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    particlePositions[i3] = (Math.random() - 0.5) * 20;
    particlePositions[i3 + 1] = (Math.random() - 0.5) * 20;
    particlePositions[i3 + 2] = (Math.random() - 0.5) * 20 - 5;
    
    particleSizes[i] = Math.random() * 0.1 + 0.02;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
  
  // Create particle shader material
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color1: { value: new THREE.Color(0x8936ff) },
      color2: { value: new THREE.Color(0x0cd0ff) },
      time: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      varying vec3 vPosition;
      uniform float time;
      
      void main() {
        vPosition = position;
        vec3 pos = position;
        pos.y += sin(time * 0.2 + position.x + position.z) * 0.2;
        pos.x += cos(time * 0.1 + position.y) * 0.1;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
      varying vec3 vPosition;
      
      void main() {
        // Create a circular point
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        if (dist > 0.5) discard;
        
        // Interpolate between colors based on position
        float factor = (vPosition.x + vPosition.y + vPosition.z + 10.0) / 20.0;
        factor = clamp(factor, 0.0, 1.0);
        vec3 color = mix(color1, color2, factor);
        
        // Add glow effect
        float glow = 1.0 - dist * 1.5;
        gl_FragColor = vec4(color, glow);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  
  // Create particle system
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
  
  // Store particles for animation
  scene.userData.particles = particles;
}

// Create data visualization based on server data
function createDataVisualization(data) {
  // Clear any existing data points
  dataPoints.forEach(point => scene.remove(point));
  dataPoints = [];
  
  if (!data || !data.bans || !data.warnings) return;
  
  // Create a data point for each ban
  const banPoints = createDataPoints(data.bans, 0xff3d71, 0.1);
  
  // Create a data point for each warning
  const warningPoints = createDataPoints(data.warnings, 0xffa600, -0.1);
  
  // Add all points to the scene
  banPoints.forEach(point => {
    scene.add(point);
    dataPoints.push(point);
  });
  
  warningPoints.forEach(point => {
    scene.add(point);
    dataPoints.push(point);
  });
}

// Create data points for visualization
function createDataPoints(items, color, yOffset) {
  const points = [];
  const pointCount = Math.min(items.length, 50); // Limit to 50 points for performance
  
  for (let i = 0; i < pointCount; i++) {
    // Calculate position based on index (circular arrangement)
    const angle = (i / pointCount) * Math.PI * 2;
    const radius = 3 + Math.random() * 0.5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = yOffset + Math.random() * 0.2 - 0.1;
    
    // Create a sphere for each point
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      emissive: color,
      emissiveIntensity: 0.3
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    
    // Add pulse animation
    const pulse = {
      scale: 1,
      direction: Math.random() > 0.5 ? 1 : -1,
      speed: 0.01 + Math.random() * 0.01,
      amplitude: 0.1 + Math.random() * 0.1
    };
    
    sphere.userData = {
      pulse,
      originalPosition: new THREE.Vector3(x, y, z),
      data: items[i]
    };
    
    points.push(sphere);
  }
  
  return points;
}

// Animation loop
function animate() {
  animationFrame = requestAnimationFrame(animate);
  
  // Update particle shader time
  if (scene.userData.particles) {
    scene.userData.particles.material.uniforms.time.value += 0.01;
  }
  
  // Animate data points
  dataPoints.forEach(point => {
    const pulse = point.userData.pulse;
    pulse.scale += pulse.direction * pulse.speed;
    
    if (pulse.scale > 1 + pulse.amplitude || pulse.scale < 1 - pulse.amplitude) {
      pulse.direction *= -1;
    }
    
    point.scale.set(pulse.scale, pulse.scale, pulse.scale);
    
    // Add gentle floating motion
    const originalPosition = point.userData.originalPosition;
    point.position.y = originalPosition.y + Math.sin(Date.now() * 0.001 + originalPosition.x) * 0.1;
    point.position.x = originalPosition.x + Math.cos(Date.now() * 0.0005 + originalPosition.z) * 0.05;
  });
  
  // Update controls
  if (controls) controls.update();
  
  // Render the scene
  renderer.render(scene, camera);
}

// Window resize handler
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Mouse move handler for interactive elements
function onMouseMove(event) {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Raycast to check for intersections with data points
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(dataPoints);
  
  // Reset cursor for all data points
  dataPoints.forEach(point => {
    point.material.emissiveIntensity = 0.3;
  });
  
  // Highlight intersected point
  if (intersects.length > 0) {
    document.body.style.cursor = 'pointer';
    intersects[0].object.material.emissiveIntensity = 0.8;
    
    // Show tooltip with data details
    // (This would be implemented with a custom DOM tooltip)
  } else {
    document.body.style.cursor = 'default';
  }
}

// Handle server selection change
function handleServerChange() {
  selectedServerId = serverSelect.value;
  
  // Update hidden form fields
  if (banServerId) banServerId.value = selectedServerId;
  if (warnServerId) warnServerId.value = selectedServerId;
  
  // Reset and load new data
  resetData();
  if (selectedServerId) {
    fetchServerData(selectedServerId);
  }
}

// Fetch server data from API
function fetchServerData(serverId) {
  showLoadingAnimation();
  
  // Create loading states
  updateLoadingState('bans');
  updateLoadingState('warnings');
  
  // Make API requests
  Promise.all([
    fetch(`/api/admin/bans?serverId=${serverId}`).then(res => res.json()),
    fetch(`/api/admin/warnings?serverId=${serverId}`).then(res => res.json()),
    fetch(`/api/admin/automod-stats?serverId=${serverId}`).then(res => res.json()),
    fetch(`/api/admin/server-info?serverId=${serverId}`).then(res => res.json())
  ])
    .then(([bansData, warningsData, automodData, serverInfo]) => {
      // Store the data
      serverData = {
        bans: bansData,
        warnings: warningsData,
        automod: automodData,
        info: serverInfo
      };
      
      // Update UI with the new data
      updateUI(serverData);
      
      // Create 3D visualization
      if (useThreeJS) {
        createDataVisualization(serverData);
      }
      
      hideLoadingAnimation();
    })
    .catch(error => {
      console.error('Error fetching server data:', error);
      showErrorMessage('Failed to load server data. Please try again.');
      hideLoadingAnimation();
    });
}

// Update UI with server data
function updateUI(data) {
  // Update stats counters with animation
  animateCounter(totalBansElement, data.bans ? data.bans.length : 0);
  animateCounter(totalWarningsElement, data.warnings ? data.warnings.length : 0);
  animateCounter(automodActionsElement, data.automod ? data.automod.totalActions : 0);
  animateCounter(memberCountElement, data.info ? data.info.memberCount : 0);
  
  // Update ban list
  updateBanList(data.bans || []);
  
  // Update warning list
  updateWarningList(data.warnings || []);
  
  // Update warning stats if available
  if (data.warnings) {
    updateWarningStats(data.warnings);
  }
}

// Update ban list table
function updateBanList(bans) {
  if (!banListBody) return;
  
  if (bans.length === 0) {
    banListBody.innerHTML = `
      <tr class="empty-state">
        <td colspan="5">
          <div class="empty-state-message">
            <i class="fas fa-ban"></i>
            <p>No bans found for this server</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  // Sort bans by date (newest first)
  bans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Generate HTML for each ban
  const banRows = bans.map(ban => {
    const date = new Date(ban.createdAt);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    return `
      <tr data-id="${ban.id}">
        <td>${ban.user ? ban.user.username : ban.userId}</td>
        <td>${ban.reason || '<em>No reason provided</em>'}</td>
        <td>${formattedDate}</td>
        <td>${ban.duration === 'permanent' ? 'Permanent' : formatDuration(ban.duration)}</td>
        <td>
          <button class="table-action-btn ban-info-btn" data-id="${ban.id}" title="View Details">
            <i class="fas fa-info-circle"></i>
          </button>
          <button class="table-action-btn danger unban-btn" data-id="${ban.id}" title="Unban User">
            <i class="fas fa-user-check"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  banListBody.innerHTML = banRows;
  
  // Add event listeners to buttons
  document.querySelectorAll('.ban-info-btn').forEach(btn => {
    btn.addEventListener('click', () => showBanDetails(btn.getAttribute('data-id')));
  });
  
  document.querySelectorAll('.unban-btn').forEach(btn => {
    btn.addEventListener('click', () => handleUnban(btn.getAttribute('data-id')));
  });
}

// Update warning list table
function updateWarningList(warnings) {
  if (!warningListBody) return;
  
  if (warnings.length === 0) {
    warningListBody.innerHTML = `
      <tr class="empty-state">
        <td colspan="5">
          <div class="empty-state-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>No warnings found for this server</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  // Sort warnings by date (newest first)
  warnings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Generate HTML for each warning
  const warningRows = warnings.map(warning => {
    const date = new Date(warning.createdAt);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    return `
      <tr data-id="${warning.id}">
        <td>${warning.user ? warning.user.username : warning.userId}</td>
        <td>${warning.reason || '<em>No reason provided</em>'}</td>
        <td>${formattedDate}</td>
        <td>
          <span class="warning-status ${warning.active ? 'active' : 'expired'}">
            ${warning.active ? 'Active' : 'Expired'}
          </span>
        </td>
        <td>
          <button class="table-action-btn warning-info-btn" data-id="${warning.id}" title="View Details">
            <i class="fas fa-info-circle"></i>
          </button>
          <button class="table-action-btn danger remove-warning-btn" data-id="${warning.id}" title="Remove Warning">
            <i class="fas fa-times"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  warningListBody.innerHTML = warningRows;
  
  // Add event listeners to buttons
  document.querySelectorAll('.warning-info-btn').forEach(btn => {
    btn.addEventListener('click', () => showWarningDetails(btn.getAttribute('data-id')));
  });
  
  document.querySelectorAll('.remove-warning-btn').forEach(btn => {
    btn.addEventListener('click', () => handleRemoveWarning(btn.getAttribute('data-id')));
  });
}

// Update warning statistics
function updateWarningStats(warnings) {
  const totalServerWarnings = document.getElementById('totalServerWarnings');
  const activeWarnings = document.getElementById('activeWarnings');
  const warnedUsers = document.getElementById('warnedUsers');
  const avgWarningsPerUser = document.getElementById('avgWarningsPerUser');
  
  if (!totalServerWarnings || !activeWarnings || !warnedUsers || !avgWarningsPerUser) return;
  
  // Calculate statistics
  const totalCount = warnings.length;
  const activeCount = warnings.filter(w => w.active).length;
  
  // Get unique users
  const uniqueUsers = new Set();
  warnings.forEach(warning => {
    uniqueUsers.add(warning.userId);
  });
  
  const uniqueUserCount = uniqueUsers.size;
  const average = uniqueUserCount > 0 ? (totalCount / uniqueUserCount).toFixed(1) : '0';
  
  // Update UI
  totalServerWarnings.textContent = totalCount;
  activeWarnings.textContent = activeCount;
  warnedUsers.textContent = uniqueUserCount;
  avgWarningsPerUser.textContent = average;
}

// Show loading animation
function showLoadingAnimation() {
  const loadingOverlay = document.querySelector('.loading-overlay');
  
  if (!loadingOverlay) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="premium-loader">
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
        <span>Loading data</span>
      </div>
    `;
    document.querySelector('.admin3d-moderation').appendChild(overlay);
    
    // Apply styles
    const style = document.createElement('style');
    style.textContent = `
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(10, 11, 20, 0.7);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .premium-loader {
        position: relative;
        width: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .loader-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid transparent;
        border-top-color: var(--accent-primary);
        animation: spin 1.5s linear infinite;
      }
      
      .loader-ring:nth-child(2) {
        width: 80%;
        height: 80%;
        animation-duration: 2s;
        border-top-color: var(--accent-secondary);
        animation-direction: reverse;
      }
      
      .loader-ring:nth-child(3) {
        width: 60%;
        height: 60%;
        animation-duration: 1s;
        border-top-color: var(--accent-tertiary);
      }
      
      .premium-loader span {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.9rem;
        position: absolute;
        bottom: -30px;
        left: 0;
        width: 100%;
        text-align: center;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(style);
    
    // Trigger animation
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 10);
  }
}

// Hide loading animation
function hideLoadingAnimation() {
  const loadingOverlay = document.querySelector('.loading-overlay');
  
  if (loadingOverlay) {
    loadingOverlay.style.opacity = '0';
    
    setTimeout(() => {
      loadingOverlay.remove();
    }, 300);
  }
}

// Show error message
function showErrorMessage(message) {
  // Create a toast notification
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas fa-exclamation-circle"></i>
    </div>
    <div class="toast-content">
      <p>${message}</p>
    </div>
    <button class="toast-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  document.body.appendChild(toast);
  
  // Apply styles
  const style = document.createElement('style');
  style.textContent = `
    .error-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, rgba(255, 61, 113, 0.9), rgba(255, 0, 87, 0.9));
      padding: 15px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      min-width: 300px;
      box-shadow: 0 10px 25px rgba(255, 61, 113, 0.4);
      backdrop-filter: blur(8px);
      z-index: 9999;
      transform: translateX(120%);
      transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1);
    }
    
    .toast-icon {
      color: white;
      font-size: 1.5rem;
      margin-right: 15px;
    }
    
    .toast-content {
      flex: 1;
    }
    
    .toast-content p {
      color: white;
      margin: 0;
    }
    
    .toast-close {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      font-size: 1rem;
      padding: 5px;
    }
    
    .toast-close:hover {
      color: white;
    }
  `;
  
  document.head.appendChild(style);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
  
  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.transform = 'translateX(120%)';
    
    setTimeout(() => {
      toast.remove();
    }, 300);
  });
}

// Switch between tabs
function switchTab(tabName) {
  // Update tab buttons
  navBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    }
  });
  
  // Update tab content
  tabContents.forEach(content => {
    content.classList.remove('active');
    if (content.id === tabName) {
      content.classList.add('active');
    }
  });
}

// Handle ban form submission
function handleBanSubmit(event) {
  event.preventDefault();
  
  // Check if server is selected
  if (!selectedServerId) {
    showErrorMessage('Please select a server first.');
    return;
  }
  
  // Add loading state to button
  const submitBtn = banUserForm.querySelector('button[type="submit"]');
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;
  
  // Get form data
  const formData = new FormData(banUserForm);
  
  // Convert to JSON
  const jsonData = {};
  formData.forEach((value, key) => {
    jsonData[key] = value;
  });
  
  // Handle custom duration
  if (jsonData.duration === 'custom') {
    const customDuration = formData.get('customDuration');
    const customDurationUnit = formData.get('customDurationUnit');
    jsonData.duration = `${customDuration}${customDurationUnit}`;
  }
  
  // Send the request
  fetch('/api/admin/ban-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jsonData)
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Show success notification
        showSuccessNotification('User banned successfully.');
        
        // Reset form
        banUserForm.reset();
        
        // Refresh the ban list
        refreshData('bans');
      } else {
        // Show error message
        showErrorMessage(data.error || 'Failed to ban user. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error banning user:', error);
      showErrorMessage('Failed to ban user. Please try again.');
    })
    .finally(() => {
      // Reset button
      submitBtn.innerHTML = '<i class="fas fa-gavel"></i> Ban User';
      submitBtn.disabled = false;
    });
}

// Handle warning form submission
function handleWarnSubmit(event) {
  event.preventDefault();
  
  // Check if server is selected
  if (!selectedServerId) {
    showErrorMessage('Please select a server first.');
    return;
  }
  
  // Add loading state to button
  const submitBtn = warnUserForm.querySelector('button[type="submit"]');
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;
  
  // Get form data
  const formData = new FormData(warnUserForm);
  
  // Convert to JSON
  const jsonData = {};
  formData.forEach((value, key) => {
    if (key === 'notifyUser') {
      jsonData[key] = true;
    } else {
      jsonData[key] = value;
    }
  });
  
  // Send the request
  fetch('/api/admin/warn-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jsonData)
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Show success notification
        showSuccessNotification('Warning issued successfully.');
        
        // Reset form
        warnUserForm.reset();
        
        // Refresh the warning list
        refreshData('warnings');
      } else {
        // Show error message
        showErrorMessage(data.error || 'Failed to issue warning. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error issuing warning:', error);
      showErrorMessage('Failed to issue warning. Please try again.');
    })
    .finally(() => {
      // Reset button
      submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Issue Warning';
      submitBtn.disabled = false;
    });
}

// Handle unban action
function handleUnban(banId) {
  // Show confirmation dialog
  if (!confirm('Are you sure you want to unban this user?')) {
    return;
  }
  
  // Send unban request
  fetch(`/api/admin/unban-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      serverId: selectedServerId,
      banId: banId
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Show success notification
        showSuccessNotification('User unbanned successfully.');
        
        // Refresh the ban list
        refreshData('bans');
      } else {
        // Show error message
        showErrorMessage(data.error || 'Failed to unban user. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error unbanning user:', error);
      showErrorMessage('Failed to unban user. Please try again.');
    });
}

// Handle remove warning action
function handleRemoveWarning(warningId) {
  // Show confirmation dialog
  if (!confirm('Are you sure you want to remove this warning?')) {
    return;
  }
  
  // Send remove warning request
  fetch(`/api/admin/remove-warning`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      serverId: selectedServerId,
      warningId: warningId
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Show success notification
        showSuccessNotification('Warning removed successfully.');
        
        // Refresh the warning list
        refreshData('warnings');
      } else {
        // Show error message
        showErrorMessage(data.error || 'Failed to remove warning. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error removing warning:', error);
      showErrorMessage('Failed to remove warning. Please try again.');
    });
}

// Show ban details modal
function showBanDetails(banId) {
  const ban = serverData.bans.find(b => b.id === banId);
  
  if (!ban) {
    showErrorMessage('Ban details not found.');
    return;
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'premium-modal';
  
  const date = new Date(ban.createdAt);
  const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  
  // Format user info
  const username = ban.user ? ban.user.username : 'Unknown';
  const userId = ban.userId;
  
  modal.innerHTML = `
    <div class="premium-modal-overlay"></div>
    <div class="premium-modal-container">
      <div class="premium-modal-header">
        <h3>Ban Details</h3>
        <button class="premium-modal-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="premium-modal-body">
        <div class="ban-details">
          <div class="ban-user-info">
            <div class="ban-user-avatar">
              <i class="fas fa-user"></i>
            </div>
            <div class="ban-user-name">
              <h4>${username}</h4>
              <span>${userId}</span>
            </div>
          </div>
          
          <div class="ban-info-grid">
            <div class="ban-detail-item">
              <div class="detail-label">Reason</div>
              <div class="detail-value">${ban.reason || '<em>No reason provided</em>'}</div>
            </div>
            
            <div class="ban-detail-item">
              <div class="detail-label">Ban Date</div>
              <div class="detail-value">${formattedDate}</div>
            </div>
            
            <div class="ban-detail-item">
              <div class="detail-label">Ban Duration</div>
              <div class="detail-value">${ban.duration === 'permanent' ? 'Permanent' : formatDuration(ban.duration)}</div>
            </div>
            
            <div class="ban-detail-item">
              <div class="detail-label">Banned By</div>
              <div class="detail-value">${ban.moderator || '<em>Unknown</em>'}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="premium-modal-footer">
        <button class="premium-modal-btn" data-action="close">Close</button>
        <button class="premium-modal-btn danger" data-action="unban" data-id="${banId}">Unban User</button>
      </div>
    </div>
  `;
  
  // Add modal styles
  const style = document.createElement('style');
  style.textContent = `
    .premium-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    
    .premium-modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 11, 20, 0.8);
      backdrop-filter: blur(8px);
      animation: fadeIn 0.3s ease forwards;
    }
    
    .premium-modal-container {
      position: relative;
      width: 90%;
      max-width: 600px;
      background: linear-gradient(135deg, rgba(30, 25, 76, 0.9), rgba(45, 30, 95, 0.9));
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(137, 54, 255, 0.3);
      animation: modalIn 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    
    .premium-modal-header {
      padding: 20px 24px;
      background: rgba(20, 17, 46, 0.9);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .premium-modal-header h3 {
      margin: 0;
      color: rgba(255, 255, 255, 0.95);
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    .premium-modal-close {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1rem;
      cursor: pointer;
      padding: 5px;
      transition: all 0.2s ease;
    }
    
    .premium-modal-close:hover {
      color: white;
      transform: scale(1.1);
    }
    
    .premium-modal-body {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .premium-modal-footer {
      padding: 16px 24px;
      background: rgba(20, 17, 46, 0.9);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .premium-modal-btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }
    
    .premium-modal-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
    
    .premium-modal-btn.danger {
      background: linear-gradient(135deg, rgba(255, 61, 113, 0.8), rgba(255, 0, 87, 0.8));
      border: 1px solid rgba(255, 61, 113, 0.5);
      color: white;
    }
    
    .premium-modal-btn.danger:hover {
      background: linear-gradient(135deg, rgba(255, 61, 113, 0.9), rgba(255, 0, 87, 0.9));
      box-shadow: 0 5px 15px rgba(255, 61, 113, 0.4);
    }
    
    /* Ban details styles */
    .ban-user-info {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .ban-user-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(137, 54, 255, 0.3), rgba(189, 16, 224, 0.3));
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      color: white;
      font-size: 1.5rem;
    }
    
    .ban-user-name h4 {
      margin: 0 0 5px;
      color: white;
      font-size: 1.2rem;
    }
    
    .ban-user-name span {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
    }
    
    .ban-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .ban-detail-item {
      display: flex;
      flex-direction: column;
    }
    
    .detail-label {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.8rem;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .detail-value {
      color: white;
      font-size: 1rem;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes modalIn {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    
    @media (max-width: 768px) {
      .ban-info-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(modal);
  
  // Add event listeners
  modal.querySelector('.premium-modal-close').addEventListener('click', () => {
    closeModal(modal);
  });
  
  modal.querySelector('[data-action="close"]').addEventListener('click', () => {
    closeModal(modal);
  });
  
  modal.querySelector('[data-action="unban"]').addEventListener('click', () => {
    closeModal(modal);
    handleUnban(banId);
  });
  
  // Close on overlay click
  modal.querySelector('.premium-modal-overlay').addEventListener('click', (e) => {
    if (e.target === modal.querySelector('.premium-modal-overlay')) {
      closeModal(modal);
    }
  });
  
  // Close on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal(modal);
    }
  });
}

// Show warning details modal
function showWarningDetails(warningId) {
  const warning = serverData.warnings.find(w => w.id === warningId);
  
  if (!warning) {
    showErrorMessage('Warning details not found.');
    return;
  }
  
  // Create modal (similar to ban details, but with warning-specific fields)
  // ...
}

// Close modal
function closeModal(modal) {
  const overlay = modal.querySelector('.premium-modal-overlay');
  const container = modal.querySelector('.premium-modal-container');
  
  overlay.style.opacity = '0';
  container.style.opacity = '0';
  container.style.transform = 'translateY(20px) scale(0.95)';
  
  setTimeout(() => {
    modal.remove();
  }, 300);
}

// Refresh data
function refreshData(type) {
  if (!selectedServerId) return;
  
  // Update UI to show loading
  if (type === 'bans') {
    if (refreshBans) {
      refreshBans.classList.add('loading');
      refreshBans.querySelector('i').className = 'fas fa-spinner fa-spin';
    }
    updateLoadingState('bans');
  } else if (type === 'warnings') {
    if (refreshWarnings) {
      refreshWarnings.classList.add('loading');
      refreshWarnings.querySelector('i').className = 'fas fa-spinner fa-spin';
    }
    updateLoadingState('warnings');
  }
  
  // Make the appropriate API request
  let url = '';
  if (type === 'bans') {
    url = `/api/admin/bans?serverId=${selectedServerId}`;
  } else if (type === 'warnings') {
    url = `/api/admin/warnings?serverId=${selectedServerId}`;
  }
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      // Update the data and UI
      if (type === 'bans') {
        serverData.bans = data;
        updateBanList(data);
        animateCounter(totalBansElement, data.length);
      } else if (type === 'warnings') {
        serverData.warnings = data;
        updateWarningList(data);
        updateWarningStats(data);
        animateCounter(totalWarningsElement, data.length);
      }
      
      // Update 3D visualization if needed
      if (useThreeJS) {
        createDataVisualization(serverData);
      }
    })
    .catch(error => {
      console.error(`Error refreshing ${type}:`, error);
      showErrorMessage(`Failed to refresh ${type}. Please try again.`);
    })
    .finally(() => {
      // Reset loading state
      if (type === 'bans' && refreshBans) {
        refreshBans.classList.remove('loading');
        refreshBans.querySelector('i').className = 'fas fa-sync-alt';
      } else if (type === 'warnings' && refreshWarnings) {
        refreshWarnings.classList.remove('loading');
        refreshWarnings.querySelector('i').className = 'fas fa-sync-alt';
      }
    });
}

// Update loading state for tables
function updateLoadingState(type) {
  const targetElement = type === 'bans' ? banListBody : warningListBody;
  
  if (!targetElement) return;
  
  targetElement.innerHTML = `
    <tr>
      <td colspan="5">
        <div class="admin3d-loading">
          <div class="admin3d-spinner"></div>
          <p>Loading ${type}...</p>
        </div>
      </td>
    </tr>
  `;
}

// Reset data when changing servers
function resetData() {
  // Reset stats
  if (totalBansElement) totalBansElement.textContent = '0';
  if (totalWarningsElement) totalWarningsElement.textContent = '0';
  if (automodActionsElement) automodActionsElement.textContent = '0';
  if (memberCountElement) memberCountElement.textContent = '0';
  
  // Reset ban list
  if (banListBody) {
    banListBody.innerHTML = `
      <tr class="empty-state">
        <td colspan="5">
          <div class="empty-state-message">
            <i class="fas fa-info-circle"></i>
            <p>Select a server to view ban list</p>
          </div>
        </td>
      </tr>
    `;
  }
  
  // Reset warning list
  if (warningListBody) {
    warningListBody.innerHTML = `
      <tr class="empty-state">
        <td colspan="5">
          <div class="empty-state-message">
            <i class="fas fa-info-circle"></i>
            <p>Select a server to view warnings</p>
          </div>
        </td>
      </tr>
    `;
  }
  
  // Clear 3D visualization
  if (useThreeJS) {
    dataPoints.forEach(point => scene.remove(point));
    dataPoints = [];
  }
}

// Filter data based on search input
function filterData(type, query) {
  if (!query) {
    // If no query, show all data
    if (type === 'bans') {
      updateBanList(serverData.bans || []);
    } else if (type === 'warnings') {
      updateWarningList(serverData.warnings || []);
    }
    return;
  }
  
  query = query.toLowerCase();
  
  if (type === 'bans' && serverData.bans) {
    const filteredBans = serverData.bans.filter(ban => {
      const username = ban.user ? ban.user.username.toLowerCase() : '';
      const userId = ban.userId.toLowerCase();
      const reason = (ban.reason || '').toLowerCase();
      
      return username.includes(query) || userId.includes(query) || reason.includes(query);
    });
    
    updateBanList(filteredBans);
  } else if (type === 'warnings' && serverData.warnings) {
    const filteredWarnings = serverData.warnings.filter(warning => {
      const username = warning.user ? warning.user.username.toLowerCase() : '';
      const userId = warning.userId.toLowerCase();
      const reason = (warning.reason || '').toLowerCase();
      
      return username.includes(query) || userId.includes(query) || reason.includes(query);
    });
    
    updateWarningList(filteredWarnings);
  }
}

// Animate counter from current value to target value
function animateCounter(element, target) {
  if (!element) return;
  
  const current = parseInt(element.textContent) || 0;
  const duration = 1000; // 1 second
  const increment = Math.abs(target - current) / (duration / 16); // 60fps
  let value = current;
  
  const animate = () => {
    if (target > current) {
      value = Math.min(value + increment, target);
    } else {
      value = Math.max(value - increment, target);
    }
    
    element.textContent = Math.round(value);
    
    if ((target > current && value < target) || (target < current && value > target)) {
      requestAnimationFrame(animate);
    } else {
      element.textContent = target;
    }
  };
  
  animate();
}

// Format duration for display
function formatDuration(duration) {
  if (!duration || duration === 'permanent') return 'Permanent';
  
  const regex = /^(\d+)([hdwmy])$/;
  const match = duration.match(regex);
  
  if (!match) return duration;
  
  const value = match[1];
  const unit = match[2];
  
  const unitMap = {
    'h': 'Hour',
    'd': 'Day',
    'w': 'Week',
    'm': 'Month',
    'y': 'Year'
  };
  
  const unitName = unitMap[unit] || unit;
  return `${value} ${unitName}${value > 1 ? 's' : ''}`;
}

// Initialize tooltips
function initTooltips() {
  document.querySelectorAll('[title]').forEach(element => {
    const title = element.getAttribute('title');
    element.setAttribute('data-tooltip', title);
    element.removeAttribute('title');
    
    // Add tooltip styles if not already added
    if (!document.getElementById('tooltip-styles')) {
      const style = document.createElement('style');
      style.id = 'tooltip-styles';
      style.textContent = `
        [data-tooltip] {
          position: relative;
        }
        
        [data-tooltip]:hover::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 0.8rem;
          white-space: nowrap;
          pointer-events: none;
          z-index: 1000;
          margin-bottom: 5px;
        }
      `;
      document.head.appendChild(style);
    }
  });
}

// Add premium UI animations
function addPremiumUIAnimations() {
  // Add hover effects to cards
  document.querySelectorAll('.mod-stat-card, .mod-ban-user, .mod-warn-user, .mod-current-bans, .mod-current-warnings').forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (useThreeJS) {
        // Add 3D effects or animations when cards are hovered
      }
    });
  });
  
  // Add ripple effect to buttons
  document.querySelectorAll('.mod-btn, .mod-nav-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      btn.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
    
    // Add ripple styles if not already added
    if (!document.getElementById('ripple-styles')) {
      const style = document.createElement('style');
      style.id = 'ripple-styles';
      style.textContent = `
        .mod-btn, .mod-nav-btn {
          overflow: hidden;
          position: relative;
        }
        
        .btn-ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
        }
        
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  });
}

// Show success notification
function showSuccessNotification(message) {
  // Create a toast notification
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas fa-check-circle"></i>
    </div>
    <div class="toast-content">
      <p>${message}</p>
    </div>
    <button class="toast-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  document.body.appendChild(toast);
  
  // Apply styles if not already added
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .success-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(0, 230, 118, 0.9), rgba(0, 178, 105, 0.9));
        padding: 15px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        min-width: 300px;
        box-shadow: 0 10px 25px rgba(0, 230, 118, 0.4);
        backdrop-filter: blur(8px);
        z-index: 9999;
        transform: translateX(120%);
        transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1);
      }
      
      .toast-icon {
        color: white;
        font-size: 1.5rem;
        margin-right: 15px;
      }
      
      .toast-content {
        flex: 1;
      }
      
      .toast-content p {
        color: white;
        margin: 0;
      }
      
      .toast-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        font-size: 1rem;
        padding: 5px;
      }
      
      .toast-close:hover {
        color: white;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
  
  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.transform = 'translateX(120%)';
    
    setTimeout(() => {
      toast.remove();
    }, 300);
  });
}

// Debounce function for search inputs
function debounce(func, delay) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

// Clean up resources when page is unloaded
window.addEventListener('beforeunload', () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
  
  // Dispose THREE.js resources
  if (renderer) {
    renderer.dispose();
  }
});