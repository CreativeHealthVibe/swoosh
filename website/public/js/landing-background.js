/**
 * Three.js animated background for the landing page
 * Creates an immersive particle field with interactive elements
 */
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if the particle canvas exists
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  // Initialize Three.js
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas,
    antialias: true,
    alpha: true 
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x0d0d0d, 1);

  // Create particles
  const particlesGeometry = new THREE.BufferGeometry();
  const particleCount = 1000; // More particles for landing page
  
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  
  const color = new THREE.Color();
  
  for (let i = 0; i < particleCount; i++) {
    // Position particles in a 3D space
    const x = THREE.MathUtils.randFloatSpread(2000);
    const y = THREE.MathUtils.randFloatSpread(1000);
    const z = THREE.MathUtils.randFloatSpread(1000);
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    
    // Generate colors in the purple spectrum with more variation
    const h = Math.random() * 80 + 260; // Purple hue range
    const s = 0.5 + Math.random() * 0.5; // Saturation
    const l = 0.3 + Math.random() * 0.5; // Lightness
    
    color.setHSL(h/360, s, l);
    
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    
    // Randomize sizes
    sizes[i] = Math.random() * 6 + 1;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  // Load a particle texture
  const textureLoader = new THREE.TextureLoader();
  const particleTexture = textureLoader.load('/images/particle.png');
  
  // Create the particle material
  const particlesMaterial = new THREE.PointsMaterial({
    size: 4,
    sizeAttenuation: true,
    map: particleTexture,
    alphaMap: particleTexture,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  
  // Create the particle system
  const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particleSystem);

  // Position camera
  camera.position.z = 200;

  // Animation variables
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  // Mouse move event handler
  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) / 50;
    mouseY = (event.clientY - windowHalfY) / 50;
  });

  // Create more dynamic animations
  const clock = new THREE.Clock();
  
  function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    
    // Rotate the entire particle system
    particleSystem.rotation.y = elapsedTime * 0.05;
    particleSystem.rotation.x = Math.sin(elapsedTime * 0.1) * 0.2;
    
    // Update particle positions for wave effect
    const positions = particleSystem.geometry.attributes.position.array;
    const sizes = particleSystem.geometry.attributes.size.array;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Make particles move in a wave pattern
      positions[i3 + 1] += Math.sin((elapsedTime + i * 0.1) * 0.5) * 0.2;
      positions[i3] += Math.cos((elapsedTime + i * 0.1) * 0.5) * 0.2;
      
      // Pulsate the size
      sizes[i] = (Math.sin(elapsedTime * 0.5 + i) * 0.5 + 1) * (Math.random() * 5 + 2);
    }
    
    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.geometry.attributes.size.needsUpdate = true;
    
    // Update camera position based on mouse movement
    targetX = mouseX * 2;
    targetY = mouseY * 1;
    
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (-targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    
    renderer.render(scene, camera);
  }

  animate();

  // Handle window resize
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener('resize', onWindowResize);

  // Create a fallback particle texture if needed
  function createFallbackTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(
      size/2, size/2, 0,
      size/2, size/2, size/2
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(156, 77, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(156, 77, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const texture = new THREE.CanvasTexture(canvas);
    particlesMaterial.map = texture;
    particlesMaterial.alphaMap = texture;
    particlesMaterial.needsUpdate = true;
  }

  // If texture fails to load, use fallback
  particleTexture.addEventListener('error', () => {
    console.warn('Failed to load particle texture, using default');
    createFallbackTexture();
  });
});