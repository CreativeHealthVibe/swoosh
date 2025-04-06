/**
 * Three.js dashboard background effect
 * Creates a particle field with grid-like patterns
 */

// Default configuration
const DEFAULT_CONFIG = {
  color: 0x9c4dff,        // Primary color (purple)
  density: 80,            // Number of particles
  size: 1.5,              // Particle size
  speed: 0.3,             // Animation speed
  depth: 100              // Z-depth of the scene
};

// Global variables
let scene, camera, renderer, particles;
let container, containerWidth, containerHeight;
let animationFrame;

// Initialize Three.js background
function initThreeBackground(config = {}) {
  // Merge default config with provided options
  const options = { ...DEFAULT_CONFIG, ...config };
  
  // Get container
  container = document.getElementById('dashboard-bg');
  if (!container) return;
  
  // Set up container dimensions
  containerWidth = container.offsetWidth;
  containerHeight = container.offsetHeight;
  
  // Create scene
  scene = new THREE.Scene();
  
  // Create camera
  const fov = 75;
  const aspect = containerWidth / containerHeight;
  const near = 0.1;
  const far = 1000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 50;
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(containerWidth, containerHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  
  // Create particles
  createParticles(options);
  
  // Create grid
  createGrid(options);
  
  // Add event listeners
  window.addEventListener('resize', onWindowResize);
  
  // Start animation loop
  animate();
}

// Create particle field
function createParticles(options) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  
  const particleTexture = new THREE.TextureLoader().load('/img/particle.png');
  
  // Generate random positions
  for (let i = 0; i < options.density; i++) {
    const x = Math.random() * containerWidth - containerWidth / 2;
    const y = Math.random() * containerHeight - containerHeight / 2;
    const z = Math.random() * options.depth - options.depth / 2;
    
    vertices.push(x, y, z);
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  
  // Create material
  const material = new THREE.PointsMaterial({
    size: options.size,
    sizeAttenuation: true,
    color: options.color,
    transparent: true,
    opacity: 0.8,
    map: particleTexture
  });
  
  // Create point cloud
  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

// Create grid effect
function createGrid(options) {
  // Create grid material
  const gridMaterial = new THREE.LineBasicMaterial({
    color: options.color,
    transparent: true,
    opacity: 0.2
  });
  
  // Create horizontal grid lines
  const horizontalGridSize = 20;
  const horizontalGridStep = containerHeight / horizontalGridSize;
  const horizontalGridHalfSize = containerHeight / 2;
  
  for (let i = -horizontalGridHalfSize; i <= horizontalGridHalfSize; i += horizontalGridStep) {
    const horizontalGridGeometry = new THREE.BufferGeometry();
    
    const horizontalGridVertices = [
      -containerWidth / 2, i, -10,
      containerWidth / 2, i, -10
    ];
    
    horizontalGridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(horizontalGridVertices, 3));
    const horizontalGridLine = new THREE.Line(horizontalGridGeometry, gridMaterial);
    scene.add(horizontalGridLine);
  }
  
  // Create vertical grid lines
  const verticalGridSize = 20;
  const verticalGridStep = containerWidth / verticalGridSize;
  const verticalGridHalfSize = containerWidth / 2;
  
  for (let i = -verticalGridHalfSize; i <= verticalGridHalfSize; i += verticalGridStep) {
    const verticalGridGeometry = new THREE.BufferGeometry();
    
    const verticalGridVertices = [
      i, -containerHeight / 2, -10,
      i, containerHeight / 2, -10
    ];
    
    verticalGridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(verticalGridVertices, 3));
    const verticalGridLine = new THREE.Line(verticalGridGeometry, gridMaterial);
    scene.add(verticalGridLine);
  }
}

// Animation loop
function animate() {
  animationFrame = requestAnimationFrame(animate);
  
  // Rotate particles slightly
  if (particles) {
    particles.rotation.x += 0.0005;
    particles.rotation.y += 0.001;
    
    // Move particles up slowly
    const positions = particles.geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      // Y position (up/down)
      positions[i + 1] += 0.05;
      
      // Reset if particle goes too far up
      if (positions[i + 1] > containerHeight / 2) {
        positions[i + 1] = -containerHeight / 2;
      }
    }
    
    particles.geometry.attributes.position.needsUpdate = true;
  }
  
  // Render scene
  renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
  containerWidth = container.offsetWidth;
  containerHeight = container.offsetHeight;
  
  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
  
  renderer.setSize(containerWidth, containerHeight);
}

// Clean up resources on page unload
function cleanupThreeBackground() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
  
  if (renderer) {
    renderer.dispose();
  }
  
  // Remove event listeners
  window.removeEventListener('resize', onWindowResize);
}

// Export functions
window.initThreeBackground = initThreeBackground;
window.cleanupThreeBackground = cleanupThreeBackground;