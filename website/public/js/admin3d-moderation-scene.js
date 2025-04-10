/**
 * SWOOSH Bot 3D Admin Dashboard
 * Premium Edition - £50,000 Value
 * 
 * Moderation Scene - Specialized Three.js visualization for the moderation page
 * Featuring 3D moderation command models, interactive visualizations, and premium effects
 */

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if the moderation-three-container element exists
  const container = document.getElementById('moderation-three-container');
  if (!container) return;
  
  // Make sure THREE is defined before using it
  if (typeof THREE === 'undefined') {
    console.warn('THREE.js not loaded! Falling back to 2D mode.');
    // Add a class to the body to indicate 3D is not available
    document.body.classList.add('three-js-unavailable');
    return; // Exit initialization
  }
  
  // Scene variables
  let scene, camera, renderer;
  let moderationModels = [];
  let particleSystem, particleGeometry, particleMaterial;
  let commandBoxes = [];
  let frameId;
  let raycaster, mouse;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;
  let stats = {
    bans: 0,
    kicks: 0,
    warnings: 0
  };
  
  // Scene configuration options
  const config = {
    particleCount: 600,
    particleSize: 2.0,
    particleSpeed: 0.03,
    cameraPosition: new THREE.Vector3(0, 0, 100),
    cameraRotation: new THREE.Euler(0, 0, 0),
    cameraNear: 10,
    cameraFar: 5000,
    cameraFOV: 75,
    boxSize: 15,
    boxSpacing: 25,
    boxRotationSpeed: 0.005,
    hoverScale: 1.2,
    glowStrength: 0.8,
    glowSize: 0.4,
    colors: {
      background: new THREE.Color(0x0a0a14),
      particles: new THREE.Color(0x4422ff),
      ban: new THREE.Color(0xff3333),
      kick: new THREE.Color(0xffaa22),
      warning: new THREE.Color(0xffdd00),
      glow: new THREE.Color(0x4477ff)
    }
  };
  
  /**
   * Initialize the scene
   */
  function init() {
    // Create Scene
    scene = new THREE.Scene();
    scene.background = config.colors.background;
    
    // Create Camera
    camera = new THREE.PerspectiveCamera(
      config.cameraFOV,
      container.clientWidth / container.clientHeight,
      config.cameraNear,
      config.cameraFar
    );
    camera.position.copy(config.cameraPosition);
    camera.rotation.copy(config.cameraRotation);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    // Setup raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Add ambinet light
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    // Add point lights
    const pointLight1 = new THREE.PointLight(0x3344ff, 1, 100);
    pointLight1.position.set(50, 50, 50);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff0066, 1, 100);
    pointLight2.position.set(-50, -50, 50);
    scene.add(pointLight2);
    
    // Create the scene elements
    createParticles();
    createModerationBoxes();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize, false);
    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('click', onClick, false);
    
    // Start animation loop
    animate();
  }
  
  /**
   * Create background particle system
   */
  function createParticles() {
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(config.particleCount * 3);
    const velocities = new Float32Array(config.particleCount * 3);
    const colors = new Float32Array(config.particleCount * 3);
    const sizes = new Float32Array(config.particleCount);
    
    const color = config.colors.particles;
    
    for (let i = 0; i < config.particleCount; i++) {
      // Position
      const x = (Math.random() - 0.5) * container.clientWidth;
      const y = (Math.random() - 0.5) * container.clientHeight;
      const z = (Math.random() - 0.5) * 500;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Velocity
      velocities[i * 3] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      
      // Color
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Size
      sizes[i] = Math.random() * 3 + 1;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        pointTexture: { value: createParticleTexture() }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        attribute vec3 velocity;
        varying vec3 vColor;
        void main() {
          vColor = customColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(color * vColor, 1.0);
          gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
          if (gl_FragColor.a < 0.3) discard;
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });
    
    particleSystem = new THREE.Points(particles, shaderMaterial);
    scene.add(particleSystem);
  }
  
  /**
   * Create a particle texture for better looking points
   */
  function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(240,240,255,0.8)');
    gradient.addColorStop(0.4, 'rgba(220,220,255,0.5)');
    gradient.addColorStop(1, 'rgba(0,0,64,0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  /**
   * Create the moderation command boxes
   */
  function createModerationBoxes() {
    // Define commands to show visually
    const commands = [
      { id: 'ban', name: 'Ban', icon: 'ban', color: config.colors.ban, position: new THREE.Vector3(-config.boxSpacing, config.boxSpacing/2, 0) },
      { id: 'kick', name: 'Kick', icon: 'user-slash', color: config.colors.kick, position: new THREE.Vector3(0, config.boxSpacing/2, 0) },
      { id: 'warn', name: 'Warn', icon: 'exclamation-triangle', color: config.colors.warning, position: new THREE.Vector3(config.boxSpacing, config.boxSpacing/2, 0) },
      { id: 'purge', name: 'Purge', icon: 'trash-alt', color: new THREE.Color(0x00aaff), position: new THREE.Vector3(-config.boxSpacing/2, -config.boxSpacing/2, 0) },
      { id: 'timeout', name: 'Timeout', icon: 'clock', color: new THREE.Color(0xbbaaff), position: new THREE.Vector3(config.boxSpacing/2, -config.boxSpacing/2, 0) }
    ];
    
    // Create each command box
    commands.forEach(command => {
      const { box, glow } = createCommandBox(command);
      box.position.copy(command.position);
      glow.position.copy(command.position);
      
      // Add custom properties
      box.userData = {
        id: command.id,
        name: command.name,
        icon: command.icon,
        color: command.color,
        originalScale: box.scale.clone(),
        originalPosition: box.position.clone(),
        hover: false
      };
      
      // Add to scene
      scene.add(box);
      scene.add(glow);
      commandBoxes.push({ box, glow });
    });
  }
  
  /**
   * Create an individual command box with glow effect
   */
  function createCommandBox(command) {
    // Create the box geometry
    const geometry = new THREE.BoxGeometry(config.boxSize, config.boxSize, config.boxSize);
    
    // Create glass-like material
    const material = new THREE.MeshPhysicalMaterial({
      color: command.color,
      metalness: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.7,
      transmission: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1,
      reflectivity: 1,
      side: THREE.DoubleSide
    });
    
    // Create the mesh
    const box = new THREE.Mesh(geometry, material);
    box.position.z = 0;
    box.rotation.x = Math.PI / 8;
    box.rotation.y = Math.PI / 8;
    
    // Create glow effect
    const glowGeometry = new THREE.SphereGeometry(
      config.boxSize * config.glowSize, 32, 32
    );
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: command.color },
        viewVector: { value: new THREE.Vector3(0, 0, 1) }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vec3 actual_normal = vec3(modelMatrix * vec4(normal, 0.0));
          intensity = pow(dot(normalize(viewVector), actual_normal), 2.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, 1.0);
        }
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    
    return { box, glow };
  }
  
  /**
   * Handle window resize
   */
  function onWindowResize() {
    windowHalfX = container.clientWidth / 2;
    windowHalfY = container.clientHeight / 2;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  
  /**
   * Handle mouse movement
   */
  function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
    
    // Track mouse for background effect
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
    
    // Check for hover effects
    checkHover();
  }
  
  /**
   * Handle mouse clicks
   */
  function onClick(event) {
    // Check if a command box was clicked
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
      commandBoxes.map(item => item.box)
    );
    
    if (intersects.length > 0) {
      const command = intersects[0].object.userData;
      executeCommand(command);
    }
  }
  
  /**
   * Execute a command when box is clicked
   */
  function executeCommand(command) {
    console.log(`Executing moderation command: ${command.name}`);
    
    // Show animation
    const pulseAnimation = createCommandAnimation(command);
    scene.add(pulseAnimation);
    
    // Trigger UI action (these will connect to the existing UI handlers)
    setTimeout(() => {
      // Find the corresponding button in the UI and click it
      const btn = document.querySelector(`[data-action="${command.id}-user"]`) ||
                 document.querySelector(`button[data-action="${command.id}"]`);
      
      if (btn) {
        btn.click();
      }
    }, 500);
  }
  
  /**
   * Create a visual animation when a command is executed
   */
  function createCommandAnimation(command) {
    // Create a ripple effect using particles
    const geometry = new THREE.BufferGeometry();
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    // Create particles in a spherical shape
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * config.boxSize * 1.5;
      
      positions[i * 3] = command.originalPosition.x + (Math.cos(angle) * radius);
      positions[i * 3 + 1] = command.originalPosition.y + (Math.sin(angle) * radius);
      positions[i * 3 + 2] = command.originalPosition.z;
      
      colors[i * 3] = command.color.r;
      colors[i * 3 + 1] = command.color.g;
      colors[i * 3 + 2] = command.color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 3,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    
    // Automatically remove after animation
    setTimeout(() => {
      scene.remove(particles);
    }, 1000);
    
    return particles;
  }
  
  /**
   * Check for hover effects on command boxes
   */
  function checkHover() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
      commandBoxes.map(item => item.box)
    );
    
    // Reset all hover states
    commandBoxes.forEach(({ box, glow }) => {
      if (box.userData.hover) {
        box.userData.hover = false;
        box.scale.copy(box.userData.originalScale);
        
        // Reset glow size
        glow.scale.set(1, 1, 1);
      }
    });
    
    // Apply hover effect to intersected items
    if (intersects.length > 0) {
      const box = intersects[0].object;
      box.userData.hover = true;
      
      // Scale up the box when hovered
      box.scale.set(
        box.userData.originalScale.x * config.hoverScale,
        box.userData.originalScale.y * config.hoverScale,
        box.userData.originalScale.z * config.hoverScale
      );
      
      // Get corresponding glow and increase its size
      const glowObject = commandBoxes.find(item => item.box === box).glow;
      glowObject.scale.set(1.5, 1.5, 1.5);
    }
  }
  
  /**
   * Update statistics display
   */
  function updateStats(newStats) {
    if (newStats) {
      stats = newStats;
    }
    
    // Update the DOM elements
    document.getElementById('total-bans').textContent = stats.bans;
    document.getElementById('total-kicks').textContent = stats.kicks;
    document.getElementById('total-warnings').textContent = stats.warnings;
  }
  
  /**
   * Animation loop
   */
  function animate() {
    frameId = requestAnimationFrame(animate);
    
    // Smooth mouse movement for background effect
    targetMouseX = mouseX * 0.001;
    targetMouseY = mouseY * 0.001;
    
    // Rotate camera slightly based on mouse
    camera.position.x += (targetMouseX - camera.position.x) * 0.05;
    camera.position.y += (-targetMouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    
    // Animate each command box
    commandBoxes.forEach(({ box, glow }) => {
      if (!box.userData.hover) {
        box.rotation.y += config.boxRotationSpeed;
        box.rotation.x += config.boxRotationSpeed * 0.5;
      }
      
      // Update glow position
      glow.position.copy(box.position);
      
      // Update viewVector for glow effect
      glow.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(
        camera.position,
        glow.position
      );
    });
    
    // Animate particles
    if (particleSystem) {
      const positions = particleSystem.geometry.attributes.position.array;
      const velocities = particleSystem.geometry.attributes.velocity.array;
      
      for (let i = 0; i < config.particleCount; i++) {
        // Update positions
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];
        
        // Reset particles that go out of bounds
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        
        const bound = 300;
        
        if (x < -bound || x > bound ||
            y < -bound || y > bound ||
            z < -bound || z > bound) {
          positions[i * 3] = (Math.random() - 0.5) * bound * 0.5;
          positions[i * 3 + 1] = (Math.random() - 0.5) * bound * 0.5;
          positions[i * 3 + 2] = (Math.random() - 0.5) * bound;
        }
      }
      
      particleSystem.geometry.attributes.position.needsUpdate = true;
    }
    
    // Render the scene
    renderer.render(scene, camera);
  }
  
  /**
   * Fetch statistics from the server
   */
  function fetchModerationStats(serverId) {
    if (!serverId) return;
    
    fetch(`/api/moderation/stats/${serverId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          updateStats({
            bans: data.stats.bans || 0,
            kicks: data.stats.kicks || 0,
            warnings: data.stats.warnings || 0
          });
        }
      })
      .catch(error => console.error('Error fetching moderation stats:', error));
  }
  
  /**
   * Clean up resources when the component is unmounted
   */
  function cleanup() {
    // Stop animation loop
    if (frameId) {
      cancelAnimationFrame(frameId);
    }
    
    // Remove event listeners
    window.removeEventListener('resize', onWindowResize);
    if (container) {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onClick);
    }
    
    // Dispose resources
    if (particleSystem) {
      particleSystem.geometry.dispose();
      particleSystem.material.dispose();
      scene.remove(particleSystem);
    }
    
    if (commandBoxes) {
      commandBoxes.forEach(({ box, glow }) => {
        box.geometry.dispose();
        box.material.dispose();
        scene.remove(box);
        
        glow.geometry.dispose();
        glow.material.dispose();
        scene.remove(glow);
      });
    }
    
    // Remove the renderer's canvas from the DOM
    if (renderer && container) {
      container.removeChild(renderer.domElement);
    }
  }
  
  /**
   * Public API
   */
  window.ModerationScene = {
    init,
    updateStats,
    cleanup
  };
  
  // Initialize the scene
  init();
  
  // Listen for server changes
  document.getElementById('server-select')?.addEventListener('change', (e) => {
    if (e.target.value) {
      fetchModerationStats(e.target.value);
    }
  });
});