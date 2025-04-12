/**
 * SWOOSH Bot 3D Admin Dashboard - Ultra Premium Edition
 * 
 * Enhanced 3D Visualization for the Moderation Panel
 * Implements high-performance WebGL rendering with optimized effects
 * and interactive elements for a premium experience.
 */

// Track global state of THREE.js
window.premiumVisualizationInitialized = false;

// Initialize Premium 3D experience when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializePremiumVisualization();
  
  // Add tab switching handlers
  setupTabNavigation();
  
  // Add handlers for form interactions
  setupFormInteractions();
});

/**
 * Initialize premium THREE.js visualization
 */
function initializePremiumVisualization() {
  // Only initialize if container exists and THREE.js is loaded
  const container = document.getElementById('moderation-three-container');
  if (!container || typeof THREE === 'undefined' || window.threeJSLoaded === false) {
    console.warn('THREE.js not loaded or container not found!');
    return;
  }
  
  // Prevent multiple initializations
  if (window.premiumVisualizationInitialized) return;
  window.premiumVisualizationInitialized = true;
  
  // Scene variables
  let scene, camera, renderer;
  let particles = [];
  let particleSystem, particleCount = 300;
  let actionCubes = [];
  let raycaster, mouse;
  let glowPass, composer;
  let clock = new THREE.Clock();
  let hoveredObject = null;
  
  // Premium scene parameters
  const params = {
    backgroundColor: new THREE.Color(0x0f0728),
    particleColor: new THREE.Color(0x9d4eff),
    accentColor: new THREE.Color(0x4f46e5),
    warningColor: new THREE.Color(0xf59e0b),
    dangerColor: new THREE.Color(0xef4444),
    successColor: new THREE.Color(0x10b981),
    infoColor: new THREE.Color(0x3b82f6),
    cameraDistance: 200,
    rotationSpeed: 0.0005,
    particleSize: 2.0,
    cubeSize: 10,
    cubeDistance: 40,
    fogDensity: 0.015,
    blurStrength: 1.5,
    glowStrength: 0.5,
    bloomThreshold: 0.3,
    bloomRadius: 0.8
  };
  
  // Initialize scene
  initScene();
  
  // Create animation loop
  animate();
  
  /**
   * Initialize the 3D scene with premium effects
   */
  function initScene() {
    // Create scene with fog for depth
    scene = new THREE.Scene();
    scene.background = params.backgroundColor;
    scene.fog = new THREE.FogExp2(0x0f0728, params.fogDensity);
    
    // Create perspective camera
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.set(0, 30, params.cameraDistance);
    camera.lookAt(0, 0, 0);
    
    // Create renderer with antialias for premium quality
    renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Setup premium lighting
    setupLighting();
    
    // Create particle system for background ambience
    createParticles();
    
    // Create floating action cubes
    createActionCubes();
    
    // Add post-processing effects for premium look
    setupPostProcessing();
    
    // Setup interaction system
    setupInteraction();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
  }
  
  /**
   * Setup premium lighting system
   */
  function setupLighting() {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x666666, 0.5);
    scene.add(ambientLight);
    
    // Add directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 10;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Add point lights for colorful accent
    const purpleLight = new THREE.PointLight(0x9d4eff, 1.2, 200);
    purpleLight.position.set(-50, 50, 50);
    scene.add(purpleLight);
    
    const blueLight = new THREE.PointLight(0x4f46e5, 1, 200);
    blueLight.position.set(50, 30, -50);
    scene.add(blueLight);
    
    // Add small, animated point lights for dynamic effect
    for (let i = 0; i < 3; i++) {
      const color = [0x9d4eff, 0x4f46e5, 0x3b82f6][i];
      const intensity = 0.8;
      const distance = 150;
      
      const light = new THREE.PointLight(color, intensity, distance);
      const angle = (i / 3) * Math.PI * 2;
      const radius = 80;
      light.position.set(
        Math.cos(angle) * radius,
        20 + Math.random() * 40,
        Math.sin(angle) * radius
      );
      
      // Store animation info
      light.userData = {
        basePosition: light.position.clone(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5
      };
      
      scene.add(light);
    }
  }
  
  /**
   * Create particle system for ambient background
   */
  function createParticles() {
    // Create geometry with random positions
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Load particle texture
    const textureLoader = new THREE.TextureLoader();
    const particleTexture = createParticleTexture();
    
    // Create particles with random properties
    for (let i = 0; i < particleCount; i++) {
      // Position in a sphere
      const radius = 150 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Random velocity
      velocities[i * 3] = (Math.random() - 0.5) * 0.03;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.03;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
      
      // Color between particles
      const colorChoice = Math.random();
      if (colorChoice < 0.7) {
        // Purple
        colors[i * 3] = 0.616; // R
        colors[i * 3 + 1] = 0.306; // G
        colors[i * 3 + 2] = 1.0; // B
      } else if (colorChoice < 0.9) {
        // Blue
        colors[i * 3] = 0.310; // R
        colors[i * 3 + 1] = 0.275; // G
        colors[i * 3 + 2] = 0.898; // B
      } else {
        // White
        colors[i * 3] = 1.0; // R
        colors[i * 3 + 1] = 1.0; // G
        colors[i * 3 + 2] = 1.0; // B
      }
      
      // Random size
      sizes[i] = Math.random() * 3 + 0.5;
      
      // Create particle object for animation
      particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(
          velocities[i * 3],
          velocities[i * 3 + 1],
          velocities[i * 3 + 2]
        ),
        originalPosition: new THREE.Vector3(x, y, z),
        color: new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]),
        size: sizes[i],
        radius: radius,
        theta: theta,
        phi: phi,
        speed: Math.random() * 0.2 + 0.1
      });
    }
    
    // Set attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material with custom shader for glow effect
    const particleMaterial = new THREE.PointsMaterial({
      size: params.particleSize,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create particle system
    particleSystem = new THREE.Points(geometry, particleMaterial);
    scene.add(particleSystem);
  }
  
  /**
   * Create a circular particle texture
   */
  function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    // Create gradient
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Fill with gradient
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  /**
   * Create interactive action cubes
   */
  function createActionCubes() {
    // Moderation actions with icons and colors
    const actions = [
      { name: 'Ban', color: params.dangerColor, icon: '🛑' },
      { name: 'Warn', color: params.warningColor, icon: '⚠️' },
      { name: 'Mute', color: params.infoColor, icon: '🔇' },
      { name: 'Timeout', color: params.accentColor, icon: '⏱️' },
      { name: 'Kick', color: new THREE.Color(0xf97316), icon: '👢' }, // orange
      { name: 'Unban', color: params.successColor, icon: '✅' },
      { name: 'Logs', color: new THREE.Color(0x94a3b8), icon: '📋' }, // slate
      { name: 'Filter', color: new THREE.Color(0x7c3aed), icon: '🔍' }, // purple
      { name: 'Shield', color: new THREE.Color(0x3b82f6), icon: '🛡️' }, // blue
      { name: 'Settings', color: new THREE.Color(0x64748b), icon: '⚙️' }, // slate-gray
      { name: 'Report', color: new THREE.Color(0xec4899), icon: '📢' }, // pink
      { name: 'Purge', color: new THREE.Color(0x0ea5e9), icon: '🧹' }, // sky blue
    ];
    
    // Material loader for environment map
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    const cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
    scene.add(cubeCamera);
    
    // Create each action cube
    actions.forEach((action, index) => {
      // Calculate position in a circular pattern
      const angleStep = (Math.PI * 2) / actions.length;
      const angle = index * angleStep;
      const radius = params.cubeDistance;
      
      // Core geometry
      const geometry = new THREE.BoxGeometry(params.cubeSize, params.cubeSize, params.cubeSize);
      
      // Create texture for cube faces
      const texture = createCubeTexture(action.icon, action.name, action.color);
      
      // Enhanced material with environment mapping for reflections
      const material = new THREE.MeshPhysicalMaterial({
        color: action.color,
        metalness: 0.3,
        roughness: 0.2,
        transmission: 0.8,
        thickness: 1,
        envMap: cubeRenderTarget.texture,
        envMapIntensity: 1,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        emissive: action.color,
        emissiveIntensity: 0.2
      });
      
      // Front and back faces with icon
      const materials = [
        material, material, // sides
        material, material, // top/bottom
        new THREE.MeshBasicMaterial({ // front
          map: texture,
          transparent: true,
          opacity: 0.95
        }),
        new THREE.MeshBasicMaterial({ // back
          map: texture,
          transparent: true,
          opacity: 0.95
        })
      ];
      
      // Create cube mesh
      const cube = new THREE.Mesh(geometry, materials);
      
      // Position on circle
      cube.position.x = Math.cos(angle) * radius;
      cube.position.z = Math.sin(angle) * radius;
      cube.position.y = 10 + Math.random() * 10; // random initial height
      
      // Add user data for animations
      cube.userData = {
        action: action.name,
        originalColor: action.color.clone(),
        originalPosition: cube.position.clone(),
        originalScale: new THREE.Vector3(1, 1, 1),
        targetScale: new THREE.Vector3(1, 1, 1),
        targetPosition: cube.position.clone(),
        angle: angle,
        radius: radius,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        )
      };
      
      // Add to scene and track
      scene.add(cube);
      actionCubes.push(cube);
      
      // Create glow effect
      addGlowEffect(cube, action.color);
    });
  }
  
  /**
   * Create a cube face texture with icon and text
   */
  function createCubeTexture(icon, text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Background - slightly transparent
    ctx.fillStyle = `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, 0.2)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, 0.3)`);
    gradient.addColorStop(1, `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, 0.1)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Fancy border
    ctx.strokeStyle = `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, 0.8)`;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Inner subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
    
    // Icon
    ctx.font = '80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, canvas.width / 2, canvas.height / 2 - 25);
    
    // Name with glow effect
    ctx.shadowColor = `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, 0.8)`;
    ctx.shadowBlur = 10;
    ctx.font = 'bold 26px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 50);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  /**
   * Add a glow effect to an object
   */
  function addGlowEffect(object, color) {
    // Create a slightly larger, glowing wireframe
    const glowGeometry = new THREE.BoxGeometry(
      params.cubeSize * 1.2, 
      params.cubeSize * 1.2, 
      params.cubeSize * 1.2
    );
    
    // Glowing material
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide
    });
    
    // Create glow mesh
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(object.position);
    
    // Link to original object for animation
    glowMesh.userData = {
      parent: object,
      originalScale: new THREE.Vector3(1.2, 1.2, 1.2),
      targetScale: new THREE.Vector3(1.2, 1.2, 1.2),
      pulsePhase: Math.random() * Math.PI * 2
    };
    
    // Add to scene
    scene.add(glowMesh);
    
    // Link glow mesh to original object
    object.userData.glowMesh = glowMesh;
  }
  
  /**
   * Set up post-processing effects
   */
  function setupPostProcessing() {
    try {
      // Skip post-processing if THREE.js modules are missing
      if (!THREE.EffectComposer) {
        console.warn('THREE.js post-processing not available. Skipping effects.');
        return;
      }
      
      composer = new THREE.EffectComposer(renderer);
      
      // Render pass - basic scene rendering
      const renderPass = new THREE.RenderPass(scene, camera);
      composer.addPass(renderPass);
      
      // Bloom pass - makes bright things glow
      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        params.blurStrength,
        params.bloomRadius,
        params.bloomThreshold
      );
      composer.addPass(bloomPass);
      
      // Optional output pass
      const outputPass = new THREE.ShaderPass(THREE.CopyShader);
      outputPass.renderToScreen = true;
      composer.addPass(outputPass);
    } catch (error) {
      console.warn('Error setting up post-processing:', error);
    }
  }
  
  /**
   * Setup interactive raycasting
   */
  function setupInteraction() {
    // Create raycaster and mouse vector
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Add mouse event listeners
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onMouseClick);
  }
  
  /**
   * Handle mouse movement for interaction
   */
  function onMouseMove(event) {
    // Convert mouse position to normalized device coordinates
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Find intersections with cubes
    const intersects = raycaster.intersectObjects(actionCubes);
    
    // Reset cursor
    container.style.cursor = 'default';
    
    // Clear previous hover state
    if (hoveredObject && (!intersects.length || intersects[0].object !== hoveredObject)) {
      // Restore original properties
      resetHoveredObject();
    }
    
    // Set hover state on newly hovered object
    if (intersects.length > 0) {
      const object = intersects[0].object;
      hoveredObject = object;
      
      // Change cursor to pointer
      container.style.cursor = 'pointer';
      
      // Animate to larger scale
      object.userData.targetScale = new THREE.Vector3(1.2, 1.2, 1.2);
      
      // Animate glow mesh
      if (object.userData.glowMesh) {
        object.userData.glowMesh.userData.targetScale = new THREE.Vector3(1.5, 1.5, 1.5);
        object.userData.glowMesh.material.opacity = 0.4;
      }
      
      // Lift slightly
      object.userData.targetPosition = object.userData.originalPosition.clone().add(new THREE.Vector3(0, 5, 0));
    }
  }
  
  /**
   * Reset a previously hovered object
   */
  function resetHoveredObject() {
    if (!hoveredObject) return;
    
    // Reset target scale
    hoveredObject.userData.targetScale = new THREE.Vector3(1, 1, 1);
    
    // Reset glow mesh
    if (hoveredObject.userData.glowMesh) {
      hoveredObject.userData.glowMesh.userData.targetScale = new THREE.Vector3(1.2, 1.2, 1.2);
      hoveredObject.userData.glowMesh.material.opacity = 0.2;
    }
    
    // Reset position
    hoveredObject.userData.targetPosition = hoveredObject.userData.originalPosition.clone();
    
    // Clear hovered object
    hoveredObject = null;
  }
  
  /**
   * Handle mouse clicks on cubes
   */
  function onMouseClick(event) {
    // Check for intersections
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(actionCubes);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      const action = object.userData.action;
      
      // Perform action based on cube clicked
      console.log('Action clicked:', action);
      
      // Trigger visual feedback
      triggerActionFeedback(object);
      
      // Switch to appropriate tab based on action
      switch(action) {
        case 'Ban':
        case 'Unban':
          document.querySelector('[data-tab="ban-management"]').click();
          break;
        case 'Warn':
          document.querySelector('[data-tab="warning-system"]').click();
          break;
        case 'Shield':
        case 'Mute':
        case 'Timeout':
          document.querySelector('[data-tab="auto-moderation"]').click();
          break;
        case 'Filter':
          document.querySelector('[data-tab="advanced-filters"]').click();
          break;
      }
    }
  }
  
  /**
   * Trigger visual feedback when an action is clicked
   */
  function triggerActionFeedback(object) {
    // Create explosion effect
    createExplosionEffect(object.position, object.userData.originalColor);
    
    // Pulse the object
    object.scale.set(1.5, 1.5, 1.5);
    setTimeout(() => {
      // Animate back to normal over time
      object.userData.targetScale = new THREE.Vector3(1, 1, 1);
    }, 200);
    
    // Pulse the glow
    if (object.userData.glowMesh) {
      object.userData.glowMesh.scale.set(2, 2, 2);
      object.userData.glowMesh.material.opacity = 0.8;
      
      setTimeout(() => {
        object.userData.glowMesh.userData.targetScale = new THREE.Vector3(1.2, 1.2, 1.2);
        object.userData.glowMesh.material.opacity = 0.2;
      }, 200);
    }
  }
  
  /**
   * Create particle explosion effect at position
   */
  function createExplosionEffect(position, color) {
    // Number of particles
    const particleCount = 50;
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(particleCount * 3);
    
    // Create material
    const material = new THREE.PointsMaterial({
      color: color,
      size: 3,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      map: createParticleTexture(),
      depthWrite: false
    });
    
    // Set initial positions (all at center)
    for (let i = 0; i < particleCount * 3; i += 3) {
      vertices[i] = position.x;
      vertices[i + 1] = position.y;
      vertices[i + 2] = position.z;
    }
    
    // Set attribute
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    // Create particle system
    const explosionParticles = new THREE.Points(geometry, material);
    scene.add(explosionParticles);
    
    // Create velocities for particles
    const velocities = [];
    for (let i = 0; i < particleCount; i++) {
      // Random direction
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      // Normalize and scale
      velocity.normalize().multiplyScalar(0.5 + Math.random() * 1.5);
      velocities.push(velocity);
    }
    
    // Animation duration
    const duration = 1000; // ms
    const startTime = Date.now();
    
    // Update function for explosion animation
    function updateExplosion() {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      // Update positions based on velocities
      const positions = explosionParticles.geometry.attributes.position.array;
      
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const velocity = velocities[i];
        
        // Update position
        positions[idx] += velocity.x;
        positions[idx + 1] += velocity.y;
        positions[idx + 2] += velocity.z;
        
        // Slow down over time
        velocity.multiplyScalar(0.97);
      }
      
      // Update opacity based on progress
      explosionParticles.material.opacity = 1 - progress;
      
      // Mark attributes as needing update
      explosionParticles.geometry.attributes.position.needsUpdate = true;
      
      // Continue animation or remove when done
      if (progress < 1) {
        requestAnimationFrame(updateExplosion);
      } else {
        scene.remove(explosionParticles);
        explosionParticles.geometry.dispose();
        explosionParticles.material.dispose();
      }
    }
    
    // Start animation
    updateExplosion();
  }
  
  /**
   * Resize handler
   */
  function onWindowResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Update camera
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    // Update renderer and composer
    renderer.setSize(width, height);
    if (composer) composer.setSize(width, height);
  }
  
  /**
   * Main animation loop
   */
  function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();
    
    // Slowly rotate camera around scene
    camera.position.x = Math.sin(elapsedTime * 0.05) * params.cameraDistance;
    camera.position.z = Math.cos(elapsedTime * 0.05) * params.cameraDistance;
    camera.lookAt(0, 0, 0);
    
    // Update particles
    updateParticles(deltaTime, elapsedTime);
    
    // Update action cubes
    updateActionCubes(deltaTime, elapsedTime);
    
    // Update point lights
    updateLights(elapsedTime);
    
    // Render with post-processing if available
    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }
  
  /**
   * Update particle positions
   */
  function updateParticles(deltaTime, elapsedTime) {
    if (!particleSystem) return;
    
    const positions = particleSystem.geometry.attributes.position.array;
    
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      
      // Orbital movement with slight drift
      particle.theta += particle.speed * deltaTime * 0.2;
      
      // Update position
      particle.position.x = particle.radius * Math.sin(particle.phi) * Math.cos(particle.theta);
      particle.position.y = particle.radius * Math.sin(particle.phi) * Math.sin(particle.theta);
      particle.position.z = particle.radius * Math.cos(particle.phi);
      
      // Add slight drift
      particle.position.x += Math.sin(elapsedTime * 0.5 + i) * 0.5;
      particle.position.y += Math.cos(elapsedTime * 0.3 + i) * 0.5;
      
      // Update position in geometry
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
      
      // Random sparkle effect - update size
      const sizes = particleSystem.geometry.attributes.size;
      const pulse = Math.sin(elapsedTime * 2 + i * 0.1) * 0.5 + 0.5;
      if (Math.random() > 0.99) {
        sizes.array[i] = particle.size * (1 + pulse);
      } else if (Math.random() > 0.99) {
        sizes.array[i] = particle.size;
      }
    }
    
    // Mark attributes as needing update
    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.geometry.attributes.size.needsUpdate = true;
  }
  
  /**
   * Update action cubes animation
   */
  function updateActionCubes(deltaTime, elapsedTime) {
    // Update each cube
    actionCubes.forEach((cube, index) => {
      const userData = cube.userData;
      
      // Rotation
      cube.rotation.x += userData.rotationSpeed.x;
      cube.rotation.y += userData.rotationSpeed.y;
      cube.rotation.z += userData.rotationSpeed.z;
      
      // Float up and down
      const floatY = Math.sin(elapsedTime * userData.speed + userData.phase) * 3;
      const targetY = userData.targetPosition.y + floatY;
      
      // Orbital movement
      const newAngle = userData.angle + Math.sin(elapsedTime * 0.1 + userData.phase) * 0.03;
      const targetX = Math.cos(newAngle) * userData.radius;
      const targetZ = Math.sin(newAngle) * userData.radius;
      
      // Smooth interpolation of position
      cube.position.x += (targetX - cube.position.x) * 0.05;
      cube.position.y += (targetY - cube.position.y) * 0.05;
      cube.position.z += (targetZ - cube.position.z) * 0.05;
      
      // Smooth interpolation of scale
      cube.scale.lerp(userData.targetScale, 0.1);
      
      // Update glow mesh if present
      if (userData.glowMesh) {
        // Position
        userData.glowMesh.position.copy(cube.position);
        
        // Rotation
        userData.glowMesh.rotation.copy(cube.rotation);
        
        // Scale with smooth interpolation
        userData.glowMesh.scale.lerp(userData.glowMesh.userData.targetScale, 0.1);
        
        // Pulse glow opacity
        const pulseFactor = Math.sin(elapsedTime * 2 + userData.glowMesh.userData.pulsePhase) * 0.5 + 0.5;
        userData.glowMesh.material.opacity = 0.1 + pulseFactor * 0.1;
        
        // If this is the hovered object, make it more prominent
        if (hoveredObject === cube) {
          userData.glowMesh.material.opacity = 0.3 + pulseFactor * 0.2;
        }
      }
    });
  }
  
  /**
   * Update animated point lights
   */
  function updateLights(elapsedTime) {
    // Get all point lights
    scene.children.forEach(child => {
      if (child instanceof THREE.PointLight && child.userData.basePosition) {
        const userData = child.userData;
        
        // Circular motion around base position
        const radius = 5;
        const x = userData.basePosition.x + Math.sin(elapsedTime * userData.speed + userData.phase) * radius;
        const y = userData.basePosition.y + Math.cos(elapsedTime * userData.speed + userData.phase * 2) * radius;
        const z = userData.basePosition.z + Math.sin(elapsedTime * userData.speed * 0.5 + userData.phase) * radius;
        
        // Update position
        child.position.set(x, y, z);
        
        // Pulse intensity
        const intensityPulse = Math.sin(elapsedTime * 2 + userData.phase) * 0.2 + 0.8;
        child.intensity = intensityPulse;
      }
    });
  }
}

/**
 * Setup tab navigation
 */
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.mod-nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Get tab ID
      const tabId = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

/**
 * Setup form interactions
 */
function setupFormInteractions() {
  // Ban duration handler
  const durationSelect = document.getElementById('banDuration');
  const customDurationGroup = document.getElementById('customDurationGroup');
  
  if (durationSelect && customDurationGroup) {
    durationSelect.addEventListener('change', () => {
      if (durationSelect.value === 'custom') {
        customDurationGroup.style.display = 'block';
      } else {
        customDurationGroup.style.display = 'none';
      }
    });
  }
  
  // Server selector handler
  const serverSelect = document.getElementById('serverSelect');
  
  if (serverSelect) {
    serverSelect.addEventListener('change', () => {
      // Update hidden form server ID fields
      const serverId = serverSelect.value;
      
      if (document.getElementById('banServerId')) {
        document.getElementById('banServerId').value = serverId;
      }
      
      if (document.getElementById('warnServerId')) {
        document.getElementById('warnServerId').value = serverId;
      }
      
      // Could update stats and lists based on selected server
      updateServerStats(serverId);
    });
  }
}

/**
 * Update server stats based on selected server
 */
function updateServerStats(serverId) {
  if (!serverId) return;
  
  // This would normally fetch data from the server
  // For now just update with placeholder animation
  
  // Animate stats counters
  animateCounter('totalBans', 0, Math.floor(Math.random() * 50));
  animateCounter('totalWarnings', 0, Math.floor(Math.random() * 80));
  animateCounter('automodActions', 0, Math.floor(Math.random() * 200));
  animateCounter('memberCount', 0, Math.floor(Math.random() * 5000 + 1000));
  
  // Additional warning stats
  if (document.getElementById('totalServerWarnings')) {
    animateCounter('totalServerWarnings', 0, Math.floor(Math.random() * 80));
    animateCounter('activeWarnings', 0, Math.floor(Math.random() * 30));
    animateCounter('warnedUsers', 0, Math.floor(Math.random() * 20));
    
    // Average per user with decimal
    const avgElement = document.getElementById('avgWarningsPerUser');
    if (avgElement) {
      const avg = (Math.random() * 2 + 1).toFixed(1);
      avgElement.textContent = avg;
    }
  }
}

/**
 * Animate a counter element
 */
function animateCounter(elementId, start, end) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Duration in ms
  const duration = 1500;
  const startTime = Date.now();
  
  function updateCounter() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease out cubic)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    // Calculate current value
    const value = Math.floor(start + (end - start) * easeOut);
    
    // Update element
    element.textContent = value.toLocaleString();
    
    // Continue animation if not complete
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  }
  
  // Start animation
  updateCounter();
}