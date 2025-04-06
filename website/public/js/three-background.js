/**
 * Three.js Background with Interactive Particles
 * Creates an animated particle background that responds to mouse movements
 */

// Default configuration
const defaultConfig = {
  color: 0x9c4dff,
  density: 100,
  size: 1.0,
  speed: 0.2,
  depth: 50,
  responsive: true
};

// Global variables
let container, scene, camera, renderer, particles;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

/**
 * Initializes the Three.js background with custom configuration
 * @param {Object} customConfig - Override default settings
 */
function initThreeBackground(customConfig = {}) {
  // Merge configurations
  const config = { ...defaultConfig, ...customConfig };
  
  // Find container
  container = document.getElementById('three-background');
  if (!container) return;
  
  // Create scene
  scene = new THREE.Scene();
  
  // Add camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 1000;
  
  // Create particles
  const particles = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  
  const color = new THREE.Color(config.color);
  
  // Calculate number of particles based on screen size and density
  const particleCount = Math.ceil(window.innerWidth * window.innerHeight / (10000 / config.density));
  
  // Create the particles
  for (let i = 0; i < particleCount; i++) {
    // Position particles randomly in 3D space
    const x = Math.random() * 2000 - 1000;
    const y = Math.random() * 2000 - 1000;
    const z = Math.random() * config.depth - (config.depth / 2);
    
    positions.push(x, y, z);
    
    // Add slight color variations
    const shade = 0.8 + Math.random() * 0.4; // 0.8-1.2 range for subtle variation
    colors.push(color.r * shade, color.g * shade, color.b * shade);
  }
  
  // Add position and color attributes to geometry
  particles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  particles.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  
  // Create particle material
  const particleMaterial = new THREE.PointsMaterial({
    size: config.size,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });
  
  // Create the particle system
  const particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);
  
  // Set up WebGL renderer
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  
  // Event listeners
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  window.addEventListener('resize', onWindowResize, false);
  
  // Start animation
  animate(particleSystem, config.speed);
}

/**
 * Handle mouse movement to control particle animation
 */
function onDocumentMouseMove(event) {
  mouseX = (event.clientX - windowHalfX) * 0.05;
  mouseY = (event.clientY - windowHalfY) * 0.05;
}

/**
 * Handle window resize
 */
function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Animation loop
 */
function animate(particleSystem, speed) {
  requestAnimationFrame(() => animate(particleSystem, speed));
  
  particleSystem.rotation.x += 0.0003;
  particleSystem.rotation.y += 0.0005;
  
  // Move towards mouse position
  camera.position.x += (mouseX - camera.position.x) * 0.05;
  camera.position.y += (-mouseY - camera.position.y) * 0.05;
  
  // Apply speed to animation
  particleSystem.rotation.y += speed * 0.001;
  
  renderer.render(scene, camera);
}

// Initialize with default settings if not initialized elsewhere
document.addEventListener('DOMContentLoaded', () => {
  // Only auto-initialize if specific pages
  const path = window.location.pathname;
  if (path === '/' || path === '/home' || path === '/landing') {
    initThreeBackground();
  }
});