/**
 * Three.js background animation for landing page
 */

document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('home-bg');
  if (!container) return;
  
  let scene, camera, renderer;
  const particlesData = [];
  let particles;
  const PARTICLE_COUNT = 1000;
  const maxDistance = 150;
  
  // Initialize mouse position variables
  let mouseX = 0, mouseY = 0;
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;
  
  init();
  animate();
  
  function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 500;
    
    // Create particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random positioning in 3D space
      const x = Math.random() * 1000 - 500;
      const y = Math.random() * 1000 - 500;
      const z = Math.random() * 500 - 250;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Add velocity and acceleration data
      particlesData.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        ),
        acceleration: new THREE.Vector3(0, 0, 0),
        numConnections: 0
      });
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Point material with custom shader
    const material = new THREE.PointsMaterial({
      color: 0x9c4dff,
      size: 3,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Lines for connections
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x9c4dff,
      transparent: true,
      opacity: 0.2
    });
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    
    // Add window resize event
    window.addEventListener('resize', onWindowResize);
    
    // Add mouse move effect
    document.addEventListener('mousemove', onMouseMove);
  }
  
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  function onMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
  }
  
  function animate() {
    requestAnimationFrame(animate);
    render();
  }
  
  function render() {
    // Rotate based on mouse position
    camera.position.x += (mouseX * 0.05 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.05 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    
    const positions = particles.geometry.attributes.position.array;
    
    // Update particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;
      const particleData = particlesData[i];
      
      // Apply velocity
      positions[ix] += particleData.velocity.x;
      positions[ix + 1] += particleData.velocity.y;
      positions[ix + 2] += particleData.velocity.z;
      
      // Boundary conditions
      if (positions[ix] < -500 || positions[ix] > 500) particleData.velocity.x = -particleData.velocity.x;
      if (positions[ix + 1] < -500 || positions[ix + 1] > 500) particleData.velocity.y = -particleData.velocity.y;
      if (positions[ix + 2] < -250 || positions[ix + 2] > 250) particleData.velocity.z = -particleData.velocity.z;
    }
    
    particles.geometry.attributes.position.needsUpdate = true;
    
    // Render the scene
    renderer.render(scene, camera);
  }
});