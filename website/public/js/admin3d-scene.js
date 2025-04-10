/**
 * SWOOSH Bot 3D Admin Dashboard
 * Premium Edition - £50,000 Value
 * 
 * Advanced Three.js visualization with interactive elements,
 * dynamic lighting, and immersive particle effects.
 */

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if the three-container element exists
  const container = document.getElementById('three-container');
  if (!container) return;
  
  // Scene variables
  let scene, camera, renderer;
  let particleSystem, commandBoxes = [];
  let frameId;
  let raycaster, mouse;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;
  
  // Make sure THREE is defined before using it
  if (typeof THREE === 'undefined') {
    console.warn('THREE.js not loaded! Falling back to 2D mode.');
    // Add a class to the body to indicate 3D is not available
    document.body.classList.add('three-js-unavailable');
    return; // Exit initialization
  }
  
  // Scene configuration options
  const config = {
    particleCount: 400,
    particleSize: 2.5,
    particleSpeed: 0.02,
    cameraPosition: new THREE.Vector3(0, 0, 100),
    backgroundColorTop: 0x0a0720,
    backgroundColorBottom: 0x13103a,
    mouseMoveStrength: 0.1,
    glowIntensity: 1.5,
    glowColor: 0x8936ff,
    boxSize: 15,
    boxRotationSpeed: 0.005
  };
  
  // Command categories for 3D boxes
  const commandCategories = [
    { id: 'dashboard', name: 'Dashboard', icon: 'tachometer-alt', position: [-40, 20, 0], color: 0x8936ff },
    { id: 'moderation', name: 'Moderation', icon: 'gavel', position: [-20, 20, 0], color: 0xff3d71 },
    { id: 'messages', name: 'Messages', icon: 'envelope', position: [0, 20, 0], color: 0x00e676 },
    { id: 'tickets', name: 'Tickets', icon: 'ticket-alt', position: [20, 20, 0], color: 0xffb300 },
    { id: 'roles', name: 'Roles', icon: 'user-tag', position: [40, 20, 0], color: 0x29b6f6 },
    { id: 'commands', name: 'Commands', icon: 'terminal', position: [-40, -20, 0], color: 0x4d9fff },
    { id: 'blacklist', name: 'Blacklist', icon: 'ban', position: [-20, -20, 0], color: 0xff6be6 },
    { id: 'stats', name: 'Statistics', icon: 'chart-line', position: [0, -20, 0], color: 0x5cff8b },
    { id: 'settings', name: 'Settings', icon: 'cogs', position: [20, -20, 0], color: 0xb76eff },
    { id: 'premium', name: 'Premium', icon: 'crown', position: [40, -20, 0], color: 0xf5c242 }
  ];
  
  // Initialize the 3D scene
  initScene();
  animate();
  
  /**
   * Initialize the Three.js scene with all elements
   */
  function initScene() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.copy(config.cameraPosition);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Setup raycaster for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Add scene background
    createSceneBackground();
    
    // Add ambient and point lights
    createLighting();
    
    // Add particle system
    createParticles();
    
    // Add command category boxes
    createCommandBoxes();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onContainerClick);
    
    // Animate the scene
    requestAnimationFrame(animate);
  }
  
  /**
   * Create gradient background for the scene
   */
  function createSceneBackground() {
    // Create gradient texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 2;
    canvas.height = 512;
    
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, `#${config.backgroundColorTop.toString(16).padStart(6, '0')}`);
    gradient.addColorStop(1, `#${config.backgroundColorBottom.toString(16).padStart(6, '0')}`);
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 2, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    // Create sky box
    const geometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide
    });
    
    const skyBox = new THREE.Mesh(geometry, material);
    scene.add(skyBox);
  }
  
  /**
   * Create lighting for the scene
   */
  function createLighting() {
    // Ambient light for global illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add point lights with different colors for dramatic effect
    const pointLightColors = [0x8936ff, 0xff3d71, 0x00e676, 0x29b6f6];
    
    pointLightColors.forEach((color, index) => {
      const pointLight = new THREE.PointLight(color, 1, 100);
      const angle = (index / pointLightColors.length) * Math.PI * 2;
      const radius = 50;
      
      pointLight.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        20
      );
      
      scene.add(pointLight);
      
      // Create light animation
      animatePointLight(pointLight, angle, radius);
    });
  }
  
  /**
   * Animate a point light in a circular path
   */
  function animatePointLight(light, startAngle, radius) {
    const speed = 0.0005 + Math.random() * 0.001;
    let angle = startAngle;
    
    function updateLightPosition() {
      angle += speed;
      
      light.position.x = Math.cos(angle) * radius;
      light.position.y = Math.sin(angle) * radius;
      
      requestAnimationFrame(updateLightPosition);
    }
    
    updateLightPosition();
  }
  
  /**
   * Create particle system for background effects
   */
  function createParticles() {
    // Create particle geometry
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(config.particleCount * 3);
    const particleSizes = new Float32Array(config.particleCount);
    const particleColors = new Float32Array(config.particleCount * 3);
    
    // Define possible colors for particles
    const colors = [
      new THREE.Color(0x8936ff), // Primary
      new THREE.Color(0x4d9fff), // Blue
      new THREE.Color(0xff3d71), // Red
      new THREE.Color(0x00e676), // Green
      new THREE.Color(0xb76eff)  // Purple
    ];
    
    // Generate random particles
    for (let i = 0; i < config.particleCount; i++) {
      // Random positions within a spherical volume
      const radius = 100 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Random sizes
      particleSizes[i] = config.particleSize * (0.5 + Math.random());
      
      // Random colors from palette
      const color = colors[Math.floor(Math.random() * colors.length)];
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;
    }
    
    // Add attributes to geometry
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    
    // Load a sprite texture for particles
    const texture = new THREE.TextureLoader().load('/images/particle.svg');
    
    // Create shader material for particles
    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        texture: { value: texture }
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          
          // Simple wobble animation
          vec3 pos = position;
          float wobbleSpeed = 0.5;
          float wobbleAmplitude = 2.0;
          
          pos.x += sin(time * wobbleSpeed + position.z * 0.01) * wobbleAmplitude;
          pos.y += cos(time * wobbleSpeed + position.x * 0.01) * wobbleAmplitude;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Create a circular particle
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          
          if (dist > 0.5) discard;
          
          gl_FragColor = vec4(vColor, strength);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Create particle system and add to scene
    particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleSystem);
  }
  
  /**
   * Create 3D boxes for command categories
   */
  function createCommandBoxes() {
    commandBoxes = [];
    
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(config.glowColor) },
        glowIntensity: { value: config.glowIntensity }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float glowIntensity;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          // Calculate edge glow effect
          float edgeFactor = 1.0 - pow(abs(dot(vNormal, vec3(0, 0, 1))), 2.0);
          vec3 glow = glowColor * pow(edgeFactor, 1.5) * glowIntensity;
          
          // Apply alpha for transparency
          float alpha = min(pow(edgeFactor, 1.0) * 0.8, 0.8);
          
          // Output final color
          gl_FragColor = vec4(glow, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide
    });
    
    // Create each command box
    commandCategories.forEach(category => {
      // Create box with a custom size
      const boxSize = config.boxSize;
      const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
      
      // Create inner box material (semi-transparent)
      const boxMaterial = new THREE.MeshPhysicalMaterial({
        color: category.color,
        transparent: true,
        opacity: 0.3,
        metalness: 0.9,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.2,
        side: THREE.DoubleSide
      });
      
      // Create the inner box mesh
      const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
      boxMesh.position.set(category.position[0], category.position[1], category.position[2]);
      boxMesh.userData = {
        id: category.id,
        name: category.name,
        color: category.color,
        url: `/admin3d/${category.id}`,
        isHovered: false
      };
      scene.add(boxMesh);
      
      // Create a slightly larger geometry for the glow effect
      const glowGeometry = new THREE.BoxGeometry(boxSize * 1.1, boxSize * 1.1, boxSize * 1.1);
      
      // Update glow material color
      const glowMeshMaterial = glowMaterial.clone();
      glowMeshMaterial.uniforms.glowColor.value = new THREE.Color(category.color);
      
      // Create glow mesh
      const glowMesh = new THREE.Mesh(glowGeometry, glowMeshMaterial);
      glowMesh.position.copy(boxMesh.position);
      scene.add(glowMesh);
      
      // Store both meshes
      commandBoxes.push({
        inner: boxMesh,
        outer: glowMesh,
        initialPosition: new THREE.Vector3().copy(boxMesh.position),
        initialRotation: new THREE.Euler().copy(boxMesh.rotation)
      });
    });
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
   * Handle mouse movement
   */
  function onMouseMove(event) {
    // Update mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Store mouse position for camera animation
    targetMouseX = event.clientX - windowHalfX;
    targetMouseY = event.clientY - windowHalfY;
    
    // Update raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with boxes
    const intersects = raycaster.intersectObjects(
      commandBoxes.map(box => box.inner)
    );
    
    // Reset all boxes first
    commandBoxes.forEach(box => {
      if (!box.inner.userData.isHovered) {
        // Reset glow intensity if not hovered
        if (box.outer.material.uniforms) {
          box.outer.material.uniforms.glowIntensity.value = config.glowIntensity;
        }
      }
    });
    
    // Update hovered boxes
    if (intersects.length > 0) {
      const box = intersects[0].object;
      box.userData.isHovered = true;
      
      // Find the corresponding box in our array
      const boxData = commandBoxes.find(b => b.inner.uuid === box.uuid);
      if (boxData && boxData.outer.material.uniforms) {
        // Increase glow intensity when hovered
        boxData.outer.material.uniforms.glowIntensity.value = config.glowIntensity * 2;
        
        // Change cursor to pointer
        container.style.cursor = 'pointer';
      }
    } else {
      // Reset cursor
      container.style.cursor = 'default';
    }
  }
  
  /**
   * Handle click on boxes
   */
  function onContainerClick() {
    // Check for intersections with command boxes
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
      commandBoxes.map(box => box.inner)
    );
    
    if (intersects.length > 0) {
      const box = intersects[0].object;
      const url = box.userData.url;
      
      // Navigate to the URL
      window.location.href = url;
    }
  }
  
  /**
   * Animation loop
   */
  function animate() {
    frameId = requestAnimationFrame(animate);
    
    // Smoothly update camera position based on mouse
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;
    
    // Move camera slightly with mouse
    camera.position.x = config.cameraPosition.x + (mouseX * config.mouseMoveStrength * 0.1);
    camera.position.y = config.cameraPosition.y + (mouseY * config.mouseMoveStrength * -0.1);
    camera.lookAt(scene.position);
    
    // Update particle system shader time
    if (particleSystem && particleSystem.material.uniforms) {
      particleSystem.material.uniforms.time.value += config.particleSpeed;
    }
    
    // Animate command boxes
    commandBoxes.forEach((box, index) => {
      // Base rotation on index for variety
      const rotationSpeed = config.boxRotationSpeed * (1 + (index % 3) * 0.2);
      
      // Rotate boxes continuously
      box.inner.rotation.x += rotationSpeed * 0.5;
      box.inner.rotation.y += rotationSpeed;
      
      // Sync outer glow with inner box
      box.outer.rotation.copy(box.inner.rotation);
      
      // Add a floating effect
      const time = Date.now() * 0.001;
      const floatOffset = Math.sin(time + index) * 0.5;
      
      box.inner.position.y = box.initialPosition.y + floatOffset;
      box.outer.position.y = box.inner.position.y;
      
      // If the box is hovered, make it "pop" slightly
      if (box.inner.userData.isHovered) {
        const scale = 1.1 + Math.sin(time * 5) * 0.05;
        box.inner.scale.set(scale, scale, scale);
        box.outer.scale.set(scale * 1.1, scale * 1.1, scale * 1.1);
      } else {
        box.inner.scale.set(1, 1, 1);
        box.outer.scale.set(1.1, 1.1, 1.1);
      }
    });
    
    // Render the scene
    renderer.render(scene, camera);
  }
  
  /**
   * Clean up resources
   */
  function dispose() {
    // Stop animation
    if (frameId) {
      cancelAnimationFrame(frameId);
    }
    
    // Remove event listeners
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('mousemove', onMouseMove);
    container.removeEventListener('click', onContainerClick);
    
    // Dispose of Three.js objects
    scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      
      if (object.material) {
        if (object.material.uniforms) {
          for (const uniform in object.material.uniforms) {
            if (object.material.uniforms[uniform].value instanceof THREE.Texture) {
              object.material.uniforms[uniform].value.dispose();
            }
          }
        }
        
        object.material.dispose();
      }
    });
    
    renderer.dispose();
    
    // Clear references
    scene = null;
    camera = null;
    renderer = null;
    particleSystem = null;
    commandBoxes = [];
    raycaster = null;
    mouse = null;
  }
  
  // Make the dispose function available globally
  window.disposeThreeScene = dispose;
});