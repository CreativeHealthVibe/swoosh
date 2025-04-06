/**
 * Initialize Three.js background for status page
 * @param {Object} options - Configuration options
 */
function initThreeBackground(options = {}) {
  const defaultOptions = {
    color: 0x9c4dff,
    density: 80,
    size: 1.5,
    speed: 0.3,
    depth: 100
  };
  
  // Merge options with defaults
  const config = { ...defaultOptions, ...options };
  
  // Create a container if it doesn't exist
  let container = document.querySelector('.background-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'background-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '-1';
    container.style.overflow = 'hidden';
    document.body.prepend(container);
  }
  
  // Initialize Three.js
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Transparent background
  container.appendChild(renderer.domElement);
  
  // Create particles
  const particleCount = config.density;
  const particles = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSpeeds = [];
  
  for (let i = 0; i < particleCount; i++) {
    // Random position in a sphere
    const x = (Math.random() - 0.5) * config.depth;
    const y = (Math.random() - 0.5) * config.depth;
    const z = (Math.random() - 0.5) * config.depth - 25; // Offset to place particles in front of camera
    
    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;
    
    // Random speed for each particle
    particleSpeeds.push({
      x: (Math.random() - 0.5) * config.speed * 0.1,
      y: (Math.random() - 0.5) * config.speed * 0.1,
      z: (Math.random() - 0.5) * config.speed * 0.1
    });
  }
  
  particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  // Create particle material
  const particleMaterial = new THREE.PointsMaterial({
    color: config.color,
    size: config.size,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
  });
  
  // Create points system
  const pointsSystem = new THREE.Points(particles, particleMaterial);
  scene.add(pointsSystem);
  
  // Position camera
  camera.position.z = 50;
  
  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // Mouse movement effect
  let mouseX = 0, mouseY = 0;
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;
  
  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.01;
    mouseY = (event.clientY - windowHalfY) * 0.01;
  });
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Rotate scene slightly based on mouse position
    scene.rotation.x += (mouseY * 0.1 - scene.rotation.x) * 0.05;
    scene.rotation.y += (mouseX * 0.1 - scene.rotation.y) * 0.05;
    
    // Update particle positions
    const positions = pointsSystem.geometry.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
      const ix = i * 3;
      
      // Add slight wave motion
      positions[ix] += Math.sin(Date.now() * 0.001 + i) * 0.02 + particleSpeeds[i].x;
      positions[ix + 1] += Math.cos(Date.now() * 0.001 + i) * 0.02 + particleSpeeds[i].y;
      positions[ix + 2] += particleSpeeds[i].z;
      
      // Reset particles that go too far
      const distance = Math.sqrt(
        positions[ix] * positions[ix] + 
        positions[ix + 1] * positions[ix + 1] + 
        positions[ix + 2] * positions[ix + 2]
      );
      
      if (distance > config.depth) {
        // Reset to random position near origin
        positions[ix] = (Math.random() - 0.5) * config.depth * 0.2;
        positions[ix + 1] = (Math.random() - 0.5) * config.depth * 0.2;
        positions[ix + 2] = (Math.random() - 0.5) * config.depth * 0.2;
      }
    }
    
    pointsSystem.geometry.attributes.position.needsUpdate = true;
    
    // Render the scene
    renderer.render(scene, camera);
  }
  
  animate();
  
  // Return control functions
  return {
    resize: () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    dispose: () => {
      // Clean up resources
      particles.dispose();
      particleMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    }
  };
}
