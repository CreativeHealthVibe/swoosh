/**
 * Three.js background animation for dashboard
 */
document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('dashboard-bg');
  if (!container) return;
  
  let scene, camera, renderer;
  let particles, geometryParticles;
  const particleCount = 400;
  let time = 0;
  
  init();
  animate();
  
  function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Set up camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;
    
    // Create particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    // Define gradient from bottom (dark) to top (light)
    const color1 = new THREE.Color(0x2a1052); // Dark purple
    const color2 = new THREE.Color(0x9c4dff); // Light purple
    
    for (let i = 0; i < particleCount; i++) {
      // Random position in 3D space, more concentrated on a horizontal plane
      positions[i * 3] = (Math.random() - 0.5) * 100;      // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;   // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;   // z
      
      // Calculate color based on y-position (vertical gradient)
      const yPos = positions[i * 3 + 1];
      const normalizedY = (yPos + 30) / 60; // Normalize to 0-1 range
      const particleColor = new THREE.Color().lerpColors(color1, color2, normalizedY);
      
      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Material that uses vertex colors
    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true
    });
    
    // Create the particle system
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Add some grid lines to represent data flows
    addGridLines();
    
    // Set up renderer
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
  }
  
  function addGridLines() {
    // Horizontal grid lines
    const gridMaterial = new THREE.LineBasicMaterial({ 
      color: 0x4a1e8a,
      transparent: true,
      opacity: 0.3
    });
    
    // Create horizontal grid
    for (let i = -3; i <= 3; i++) {
      const y = i * 10;
      const geometryLine = new THREE.BufferGeometry();
      const positions = new Float32Array([
        -50, y, 0,
        50, y, 0
      ]);
      geometryLine.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geometryLine, gridMaterial);
      scene.add(line);
    }
    
    // Create data flow lines that will animate
    geometryParticles = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) {
      geometryParticles[i * 3] = (Math.random() - 0.5) * 100;     // x
      geometryParticles[i * 3 + 1] = (Math.random() - 0.5) * 60;  // y
      geometryParticles[i * 3 + 2] = (Math.random() - 0.5) * 30;  // z
    }
  }
  
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  function animate() {
    requestAnimationFrame(animate);
    
    time += 0.005;
    
    // Animate particles
    if (particles) {
      // Gently rotate the particles
      particles.rotation.y = time * 0.1;
      
      // Make particles move in a wave pattern
      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        // Apply wave effect to y-position
        positions[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.03;
        
        // Apply slight movement in x and z directions
        positions[i * 3] += Math.sin(time * 0.5 + i) * 0.01;
        positions[i * 3 + 2] += Math.cos(time * 0.3 + i) * 0.01;
        
        // Wrap particles that go out of bounds
        if (positions[i * 3] > 50) positions[i * 3] = -50;
        if (positions[i * 3] < -50) positions[i * 3] = 50;
        if (positions[i * 3 + 1] > 30) positions[i * 3 + 1] = -30;
        if (positions[i * 3 + 1] < -30) positions[i * 3 + 1] = 30;
        if (positions[i * 3 + 2] > 25) positions[i * 3 + 2] = -25;
        if (positions[i * 3 + 2] < -25) positions[i * 3 + 2] = 25;
      }
      particles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Render the scene
    renderer.render(scene, camera);
  }
});
