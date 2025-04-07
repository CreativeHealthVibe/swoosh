/**
 * Three.js animated background for team page
 * Creates a network-like visualization with connected nodes
 */
document.addEventListener('DOMContentLoaded', function() {
  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Transparent background
  
  // Add renderer to the DOM
  const container = document.createElement('div');
  container.className = 'three-bg-container';
  document.body.appendChild(container);
  container.appendChild(renderer.domElement);
  
  // Camera position
  camera.position.z = 30;
  
  // Create particle material
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x9c4dff,
    size: 0.8,
    transparent: true,
    opacity: 0.7,
    map: createCircleTexture('#9c4dff', 256)
  });
  
  // Create particle positions
  const particleCount = 200;
  const particlePositions = new Float32Array(particleCount * 3);
  const velocities = [];
  
  for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 50;
    const y = (Math.random() - 0.5) * 50;
    const z = (Math.random() - 0.5) * 50;
    
    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;
    
    velocities.push({
      x: (Math.random() - 0.5) * 0.05,
      y: (Math.random() - 0.5) * 0.05,
      z: (Math.random() - 0.5) * 0.05,
    });
  }
  
  // Create particle system
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);
  
  // Create connections
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x9c4dff,
    transparent: true,
    opacity: 0.2
  });
  
  let connections = [];
  let linesMesh = null;
  
  // Function to update connections
  function updateConnections() {
    // Remove existing connections
    if (linesMesh) scene.remove(linesMesh);
    
    connections = [];
    const positions = particleGeometry.attributes.position.array;
    
    // Generate connections between close particles
    for (let i = 0; i < particleCount; i++) {
      const x1 = positions[i * 3];
      const y1 = positions[i * 3 + 1];
      const z1 = positions[i * 3 + 2];
      
      for (let j = i + 1; j < particleCount; j++) {
        const x2 = positions[j * 3];
        const y2 = positions[j * 3 + 1];
        const z2 = positions[j * 3 + 2];
        
        // Calculate distance between particles
        const distance = Math.sqrt(
          (x2 - x1) * (x2 - x1) + 
          (y2 - y1) * (y2 - y1) + 
          (z2 - z1) * (z2 - z1)
        );
        
        // If particles are close, create a connection
        if (distance < 10) {
          connections.push(x1, y1, z1);
          connections.push(x2, y2, z2);
        }
      }
    }
    
    // Create geometry for connections
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connections, 3));
    
    // Create mesh for connections
    linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);
  }
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Update particle positions
    const positions = particleGeometry.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
      // Update positions based on velocities
      positions[i * 3] += velocities[i].x;
      positions[i * 3 + 1] += velocities[i].y;
      positions[i * 3 + 2] += velocities[i].z;
      
      // Boundary check and bounce
      if (Math.abs(positions[i * 3]) > 25) velocities[i].x *= -1;
      if (Math.abs(positions[i * 3 + 1]) > 25) velocities[i].y *= -1;
      if (Math.abs(positions[i * 3 + 2]) > 25) velocities[i].z *= -1;
    }
    
    particleGeometry.attributes.position.needsUpdate = true;
    
    // Update connections every few frames for performance
    if (Math.random() < 0.02) {
      updateConnections();
    }
    
    // Slowly rotate the entire scene
    particleSystem.rotation.y += 0.001;
    if (linesMesh) linesMesh.rotation.y += 0.001;
    
    renderer.render(scene, camera);
  }
  
  // Handle window resize
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  window.addEventListener('resize', onWindowResize);
  
  // Helper function to create a circle texture for particles
  function createCircleTexture(color, size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    // Create gradient
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    // Draw circle
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = gradient;
    context.fill();
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  // Start animation
  animate();
});
