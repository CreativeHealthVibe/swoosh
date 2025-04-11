/**
 * SWOOSH Bot 3D Admin Dashboard
 * Premium Edition
 * 
 * Admin3D Moderation JS - Powers the advanced moderation interface
 * Complete rebuild with direct access system
 */

// Initialize Three.js visualizations once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeModeration3D();
});

/**
 * Initialize Three.js visualization for the moderation page
 */
function initializeModeration3D() {
  try {
    // Only initialize if the container exists
    const container = document.getElementById('moderation-three-container');
    if (!container) return;
    
    // Set up Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      60, 
      container.clientWidth / container.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 15;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);
    
    // Create a group for ban particles
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);
    
    // Resize handler
    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Rotate the particle group
      if (particleGroup) {
        particleGroup.rotation.y += 0.003;
      }
      
      renderer.render(scene, camera);
    }
    
    // Start the animation
    animate();
    
    // Event listener for server changes
    document.getElementById('serverSelect')?.addEventListener('change', function() {
      // Clear existing particles
      while (particleGroup.children.length) {
        particleGroup.remove(particleGroup.children[0]);
      }
      
      // Add visualization for the selected server
      const serverId = this.value;
      if (serverId) {
        loadVisualizationData(serverId, particleGroup);
      }
    });
    
  } catch (error) {
    console.error('Error initializing 3D visualization:', error);
  }
}

/**
 * Load visualization data for a server
 * @param {string} serverId - Discord server ID
 * @param {THREE.Group} particleGroup - Three.js group to add particles to
 */
function loadVisualizationData(serverId, particleGroup) {
  // Fetch data from our reliable direct access endpoint
  fetch(`/admin3d/direct-bans/list/${serverId}`, {
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to load ban data for visualization');
    return response.json();
  })
  .then(data => {
    console.log('Visualization data loaded:', data);
    
    if (!data.bans || data.bans.length === 0) {
      // Add a default sphere if no bans
      createDefaultSphere(particleGroup);
      return;
    }
    
    // Create visualization based on bans data
    createBanVisualization(data.bans, particleGroup);
  })
  .catch(error => {
    console.error('Error loading visualization data:', error);
    // Add a default sphere if there's an error
    createDefaultSphere(particleGroup);
  });
}

/**
 * Create a default sphere for visualization when no data is available
 * @param {THREE.Group} group - Three.js group to add the sphere to
 */
function createDefaultSphere(group) {
  const geometry = new THREE.SphereGeometry(5, 24, 24);
  const material = new THREE.MeshStandardMaterial({
    color: 0x7289da,
    roughness: 0.7,
    metalness: 0.3,
    transparent: true,
    opacity: 0.15,
    wireframe: true
  });
  
  const sphere = new THREE.Mesh(geometry, material);
  group.add(sphere);
}

/**
 * Create a visualization of ban data
 * @param {Array} bans - Array of ban objects
 * @param {THREE.Group} group - Three.js group to add visualization to
 */
function createBanVisualization(bans, group) {
  const banCount = bans.length;
  
  // Create a sphere to represent each ban
  bans.forEach((ban, index) => {
    // Calculate position on a spiral
    const radius = 7;
    const angle = (index / banCount) * Math.PI * 8;
    const height = (index / banCount) * 12 - 6;
    
    const x = Math.cos(angle) * radius;
    const y = height;
    const z = Math.sin(angle) * radius;
    
    // Create geometry (size based on ban reason length)
    const reasonLength = ban.reason ? ban.reason.length : 10;
    const size = 0.3 + (Math.min(reasonLength, 100) / 100) * 0.7;
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    
    // Create material (color based on ban duration)
    let color;
    if (ban.permanent) {
      color = 0xff3333; // Red for permanent bans
    } else if (ban.duration && ban.duration.includes('d')) {
      const days = parseInt(ban.duration);
      if (days > 14) {
        color = 0xff6600; // Orange for long bans
      } else {
        color = 0xffaa00; // Yellow for shorter bans
      }
    } else {
      color = 0x64aaff; // Blue for other bans
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: 0.7
    });
    
    // Create mesh and add to group
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    group.add(sphere);
    
    // Add a connecting line to the center
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(x, y, z)
    ]);
    
    const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3
    });
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    group.add(line);
  });
  
  // Create a sphere in the center
  const centerGeometry = new THREE.SphereGeometry(1.5, 24, 24);
  const centerMaterial = new THREE.MeshStandardMaterial({
    color: 0x7289da,
    roughness: 0.3,
    metalness: 0.7,
    transparent: true,
    opacity: 0.8
  });
  
  const centerSphere = new THREE.Mesh(centerGeometry, centerMaterial);
  group.add(centerSphere);
}

// Ban search functionality
document.getElementById('banSearchInput')?.addEventListener('input', function() {
  const searchValue = this.value.toLowerCase();
  const rows = document.querySelectorAll('#banListBody tr:not(.empty-state):not(.error-state):not(.loading-state)');
  
  rows.forEach(row => {
    const username = row.querySelector('.username')?.textContent.toLowerCase() || '';
    const userId = row.querySelector('.user-id')?.textContent.toLowerCase() || '';
    const reason = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
    
    if (username.includes(searchValue) || userId.includes(searchValue) || reason.includes(searchValue)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
});