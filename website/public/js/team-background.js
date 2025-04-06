/**
 * Enhanced Three.js Background for Team Page
 * Inspired by the purple flow design
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Three.js scene for team page with custom settings
  if (window.location.pathname.includes('/team')) {
    initTeamBackground();
  }
});

function initTeamBackground() {
  // Basic setup - use unique variable names to avoid conflicts
  const teamScene = new THREE.Scene();
  const teamCamera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  const teamRenderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true
  });
  
  teamRenderer.setSize(window.innerWidth, window.innerHeight);
  teamRenderer.setClearColor(0x0d0d0d, 1);
  
  // Add the renderer to the background container
  const container = document.getElementById('three-background');
  if (!container) return;
  container.appendChild(teamRenderer.domElement);
  
  // Create particles
  const particlesGeometry = new THREE.BufferGeometry();
  const particleCount = Math.min(Math.ceil(window.innerWidth * window.innerHeight / 6000), 1000);
  
  const positionArray = new Float32Array(particleCount * 3);
  const colorArray = new Float32Array(particleCount * 3);
  
  // Main particle color - purple
  const purple = new THREE.Color(0x9c4dff);
  const darkPurple = new THREE.Color(0x7209b7);
  
  // Create particles with different colors and positions
  for (let i = 0; i < particleCount; i++) {
    // Position
    const x = (Math.random() - 0.5) * 100;
    const y = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 50;
    
    positionArray[i * 3] = x;
    positionArray[i * 3 + 1] = y;
    positionArray[i * 3 + 2] = z;
    
    // Color - interpolate between purple and dark purple
    const colorMix = Math.random();
    const color = purple.clone().lerp(darkPurple, colorMix);
    
    colorArray[i * 3] = color.r;
    colorArray[i * 3 + 1] = color.g;
    colorArray[i * 3 + 2] = color.b;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
  
  // Particle material
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.7,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });
  
  // Points mesh
  const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
  teamScene.add(particleSystem);
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  teamScene.add(ambientLight);
  
  // Add point light for highlights
  const pointLight = new THREE.PointLight(0x9c4dff, 1, 100);
  pointLight.position.set(10, 10, 10);
  teamScene.add(pointLight);
  
  // Position camera
  teamCamera.position.z = 30;
  
  // Mouse movement tracking
  const teamMouse = {
    x: 0,
    y: 0
  };
  
  document.addEventListener('mousemove', (event) => {
    teamMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    teamMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    teamCamera.aspect = window.innerWidth / window.innerHeight;
    teamCamera.updateProjectionMatrix();
    teamRenderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Rotate particle system slowly
    particleSystem.rotation.x += 0.0005;
    particleSystem.rotation.y += 0.0007;
    
    // Move toward mouse position for subtle interactivity
    particleSystem.rotation.x += teamMouse.y * 0.0003;
    particleSystem.rotation.y += teamMouse.x * 0.0003;
    
    // Add a wave-like motion
    const time = Date.now() * 0.0005;
    
    // Update particle positions for wave effect
    const positions = particlesGeometry.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;
      
      // Get original positions
      const x = positions[ix] / 2;
      const y = positions[iy] / 2;
      const z = positions[iz] / 2;
      
      // Add wave effect
      positions[iy] = y + Math.sin(time + x) * 0.5;
      positions[iz] = z + Math.cos(time + y) * 0.5;
    }
    
    particlesGeometry.attributes.position.needsUpdate = true;
    
    // Render the scene
    teamRenderer.render(teamScene, teamCamera);
  }
  
  animate();
}
