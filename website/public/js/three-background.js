// Three.js animated background for the hero section
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if the hero section exists
  const heroSection = document.querySelector('.hero');
  if (!heroSection) return;

  // Create canvas container
  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'hero-background';
  canvasContainer.style.position = 'absolute';
  canvasContainer.style.top = '0';
  canvasContainer.style.left = '0';
  canvasContainer.style.width = '100%';
  canvasContainer.style.height = '100%';
  canvasContainer.style.zIndex = '-1';
  canvasContainer.style.overflow = 'hidden';
  
  // Insert before the first child of hero
  heroSection.insertBefore(canvasContainer, heroSection.firstChild);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvasContainer.appendChild(canvas);

  // Initialize Three.js
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas,
    antialias: true,
    alpha: true 
  });
  
  renderer.setSize(window.innerWidth, heroSection.offsetHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);

  // Create particles
  const particlesGeometry = new THREE.BufferGeometry();
  const particleCount = 500;
  
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  
  const color = new THREE.Color();
  
  for (let i = 0; i < particleCount; i++) {
    // Position particles in a 3D space
    const distance = Math.random() * 100 + 50;
    const theta = THREE.MathUtils.randFloatSpread(360); 
    const phi = THREE.MathUtils.randFloatSpread(360);
    
    positions[i * 3] = distance * Math.sin(theta) * Math.cos(phi);
    positions[i * 3 + 1] = distance * Math.sin(theta) * Math.sin(phi);
    positions[i * 3 + 2] = distance * Math.cos(theta);
    
    // Generate colors in the purple spectrum
    const h = Math.random() * 60 + 260; // Purple hue range
    const s = 0.7 + Math.random() * 0.3; // Saturation
    const l = 0.5 + Math.random() * 0.3; // Lightness
    
    color.setHSL(h/360, s, l);
    
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    
    // Randomize sizes
    sizes[i] = Math.random() * 5 + 1;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  // Load a particle texture
  const textureLoader = new THREE.TextureLoader();
  const particleTexture = textureLoader.load('/images/particle.png', () => {
    // Fallback to a basic circle if image fails to load
    console.log('Particle texture loaded successfully');
  }, undefined, () => {
    console.warn('Failed to load particle texture, using default');
  });
  
  // Create the particle material
  const particlesMaterial = new THREE.PointsMaterial({
    size: 5,
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

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Position camera
  camera.position.z = 20;

  // Animation variables
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  // Mouse move event handler
  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) / 100;
    mouseY = (event.clientY - windowHalfY) / 100;
  });

  // Add scroll effect
  let scrollY = 0;
  let scrollTarget = 0;
  
  window.addEventListener('scroll', () => {
    scrollTarget = window.scrollY;
  });

  // Create wave effect
  const waveSpeed = 0.5;
  const waveHeight = 5;

  // Animation loop
  const clock = new THREE.Clock();
  
  function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    
    // Update scroll animation
    scrollY += (scrollTarget - scrollY) * 0.05;
    
    // Rotate the entire particle system slowly
    particleSystem.rotation.x = scrollY * 0.0003;
    particleSystem.rotation.y = elapsedTime * 0.05;
    
    // Update particle positions based on time for wave effect
    const positions = particleSystem.geometry.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      // Calculate distance from center
      const distance = Math.sqrt(x * x + y * y + z * z);
      
      // Apply wave effect based on distance and time
      const wave = Math.sin(distance * 0.05 + elapsedTime * waveSpeed) * waveHeight;
      
      // Normalize direction vector
      const nx = x / distance;
      const ny = y / distance;
      const nz = z / distance;
      
      // Apply wave effect in the normalized direction
      positions[i3] = x + nx * wave * 0.1;
      positions[i3 + 1] = y + ny * wave * 0.1;
      positions[i3 + 2] = z + nz * wave * 0.1;
    }
    
    particleSystem.geometry.attributes.position.needsUpdate = true;
    
    // Update camera position based on mouse movement
    targetX = mouseX * 0.5;
    targetY = mouseY * 0.5;
    
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
    renderer.setSize(window.innerWidth, heroSection.offsetHeight);
  }

  window.addEventListener('resize', onWindowResize);

  // Create a fallback particle texture if it fails to load
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
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const texture = new THREE.CanvasTexture(canvas);
    particlesMaterial.map = texture;
    particlesMaterial.alphaMap = texture;
    particlesMaterial.needsUpdate = true;
  }
  
  // Call this function only if the texture load fails
  if (!particleTexture) {
    createFallbackTexture();
  }
});