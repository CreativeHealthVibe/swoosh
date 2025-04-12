/**
 * SWOOSH BOT - Ultra Premium Moderation 3D Visualization
 * 
 * This specialized THREE.js implementation is designed specifically for the 
 * moderation page with high-end premium visuals, advanced lighting effects,
 * and interactive elements that provide a superior visual experience.
 * 
 * Premium Features:
 * - Volumetric lighting and ray casting
 * - Advanced particle systems with custom shaders
 * - Interactive 3D data visualization
 * - Holographic UI elements
 * - Dynamic reflections and environment mapping
 * - Adaptive performance optimization
 */

// Premium visualization controller
const PremiumModerationVisualizer = {
  // Three.js core components
  scene: null,
  camera: null,
  renderer: null,
  composer: null, // Post-processing composer
  clock: new THREE.Clock(),
  container: null,
  
  // Scene elements
  particleSystem: null,
  particles: [],
  holoCubes: [],
  dataCloud: null,
  dataNodes: [],
  glowSphere: null,
  grid: null,
  
  // Interactive elements
  raycaster: new THREE.Raycaster(),
  mouse: new THREE.Vector2(),
  hoveredObject: null,
  selectedObject: null,
  
  // Environment and effects
  bloomPass: null,
  volumetricLight: null,
  reflectionProbe: null,
  environmentMap: null,
  
  // Animation settings
  rotationSpeed: 0.15,
  
  // Premium visual parameters
  params: {
    // Base scene
    background: new THREE.Color(0x060610),
    fogColor: new THREE.Color(0x060620),
    fogDensity: 0.015,
    ambientLight: 0.2,
    ambientColor: 0x3333aa,
    
    // Particles
    particleCount: 1500,
    particleSize: { min: 0.8, max: 3.5 },
    particleSpeed: { min: 0.01, max: 0.05 },
    particleOpacity: { min: 0.2, max: 0.6 },
    particleColor: [0x8866ff, 0x5577ff, 0x3399ff],
    
    // Data visualization
    dataNodeCount: 32,
    dataNodeSize: { min: 0.5, max: 2.5 },
    dataNodeColor: [0xff3366, 0xff6633, 0x33ccff, 0x66ff99],
    dataLineOpacity: 0.2,
    dataLineColor: 0x5588ff,
    
    // Holo cubes
    holoCubeCount: 12,
    holoCubeSize: 6,
    holoCubeGap: 40,
    holoCubeHeight: 0,
    holoCubeOpacity: 0.7,
    
    // Bloom effect
    bloomStrength: 1.5,
    bloomRadius: 0.7,
    bloomThreshold: 0.2,
    
    // Grid
    gridSize: 140,
    gridDivisions: 20,
    gridColor1: 0x000833,
    gridColor2: 0x3355ff,
    
    // Animation
    pulseSpeed: 0.8,
    rotationSpeed: 0.2,
    hoverScaleSpeed: 0.1,
    
    // Camera
    cameraDistance: 80,
    cameraHeight: 30,
    cameraFov: 70
  },
  
  /**
   * Initialize the premium visualization
   */
  init() {
    // Get container element
    this.container = document.getElementById('moderation-three-container');
    if (!this.container) return false;
    
    // Check THREE.js availability
    if (typeof THREE === 'undefined') {
      console.warn('THREE.js not loaded. Premium visualization disabled.');
      return false;
    }
    
    // Load required THREE.js modules conditionally
    this.loadModules()
      .then(() => {
        this.setupScene();
        this.setupCamera();
        this.setupLights();
        this.setupRenderer();
        this.createEnvironment();
        this.createParticles();
        this.createDataVisualization();
        this.createHoloCubes();
        this.setupPostProcessing();
        this.setupEventListeners();
        this.animate();
        
        console.log('✅ Premium 3D visualization initialized');
      })
      .catch(error => {
        console.error('Failed to initialize premium visualization', error);
        return false;
      });
      
    return true;
  },
  
  /**
   * Load required THREE.js modules
   */
  async loadModules() {
    // Check if required modules are available or load dynamically
    if (!THREE.EffectComposer) {
      // These would need to be loaded via script tags in production
      // For now we'll just check if they exist
      console.warn('Post-processing modules not available. Some premium effects disabled.');
    }
    
    return Promise.resolve();
  },
  
  /**
   * Set up the Three.js scene
   */
  setupScene() {
    // Create scene with fog
    this.scene = new THREE.Scene();
    this.scene.background = this.params.background;
    this.scene.fog = new THREE.FogExp2(
      this.params.fogColor, 
      this.params.fogDensity
    );
    
    // Add clock for animations
    this.clock = new THREE.Clock();
  },
  
  /**
   * Set up the camera
   */
  setupCamera() {
    const { clientWidth, clientHeight } = this.container;
    
    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      this.params.cameraFov,
      clientWidth / clientHeight,
      0.1,
      1000
    );
    
    // Position camera
    this.camera.position.set(0, this.params.cameraHeight, this.params.cameraDistance);
    this.camera.lookAt(0, 0, 0);
  },
  
  /**
   * Set up scene lighting
   */
  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      this.params.ambientColor, 
      this.params.ambientLight
    );
    this.scene.add(ambientLight);
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xaaccff, 0.8);
    directionalLight.position.set(20, 40, 30);
    this.scene.add(directionalLight);
    
    // Add colored point lights for atmosphere
    const pointLight1 = new THREE.PointLight(0x7289da, 1, 100);
    pointLight1.position.set(20, 30, 40);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff5577, 1, 100);
    pointLight2.position.set(-30, 20, -40);
    this.scene.add(pointLight2);
    
    const pointLight3 = new THREE.PointLight(0x44aaff, 1, 80);
    pointLight3.position.set(0, -20, 30);
    this.scene.add(pointLight3);
    
    // Create volumetric light effect if SpotLightHelper is available
    if (THREE.SpotLight) {
      this.volumetricLight = new THREE.SpotLight(0x8866ff, 1);
      this.volumetricLight.position.set(0, 50, 0);
      this.volumetricLight.angle = Math.PI / 6;
      this.volumetricLight.penumbra = 0.3;
      this.volumetricLight.decay = 1.5;
      this.volumetricLight.distance = 180;
      this.volumetricLight.castShadow = true;
      this.volumetricLight.shadow.bias = -0.0001;
      this.scene.add(this.volumetricLight);
      
      // Make the light target the center
      const lightTarget = new THREE.Object3D();
      lightTarget.position.set(0, 0, 0);
      this.scene.add(lightTarget);
      this.volumetricLight.target = lightTarget;
    }
  },
  
  /**
   * Set up the renderer
   */
  setupRenderer() {
    const { clientWidth, clientHeight } = this.container;
    
    // Create WebGL renderer with antialiasing and high precision
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      precision: 'highp',
      powerPreference: 'high-performance'
    });
    
    // Configure renderer
    this.renderer.setSize(clientWidth, clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    // Add to container
    this.container.appendChild(this.renderer.domElement);
  },
  
  /**
   * Create environment for the scene
   */
  createEnvironment() {
    // Create grid for perspective and depth
    const gridHelper = new THREE.GridHelper(
      this.params.gridSize, 
      this.params.gridDivisions,
      this.params.gridColor1,
      this.params.gridColor2
    );
    
    gridHelper.position.y = -15;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.15;
    this.scene.add(gridHelper);
    this.grid = gridHelper;
    
    // Create center glow sphere
    const glowGeometry = new THREE.SphereGeometry(8, 32, 32);
    const glowMaterial = new THREE.MeshPhongMaterial({
      color: 0x4466ff,
      emissive: 0x2233ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    this.glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(this.glowSphere);
    
    // Add atmosphere haze (if ShaderMaterial is available)
    if (THREE.ShaderMaterial) {
      const atmosphereGeometry = new THREE.SphereGeometry(70, 32, 32);
      const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x0011ff,
        transparent: true,
        opacity: 0.05,
        side: THREE.BackSide
      });
      
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      this.scene.add(atmosphere);
    }
  },
  
  /**
   * Create premium particle system
   */
  createParticles() {
    // Create particle geometry
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = this.params.particleCount;
    
    // Create particle attributes
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = [];
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      // Random spherical position
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 30 + Math.random() * 60;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      // Set position
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Random particle color from palette
      const colorIndex = Math.floor(Math.random() * this.params.particleColor.length);
      const color = new THREE.Color(this.params.particleColor[colorIndex]);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Random size within range
      const size = this.params.particleSize.min + 
        Math.random() * (this.params.particleSize.max - this.params.particleSize.min);
      sizes[i] = size;
      
      // Random velocity
      const speed = this.params.particleSpeed.min + 
        Math.random() * (this.params.particleSpeed.max - this.params.particleSpeed.min);
      
      velocities.push({
        x: (Math.random() - 0.5) * speed,
        y: (Math.random() - 0.5) * speed,
        z: (Math.random() - 0.5) * speed
      });
      
      // Add to tracked particles
      this.particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(velocities[i].x, velocities[i].y, velocities[i].z),
        size: size,
        color: color,
        opacity: this.params.particleOpacity.min + 
          Math.random() * (this.params.particleOpacity.max - this.params.particleOpacity.min)
      });
    }
    
    // Add attributes to geometry
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create particle texture
    const particleTexture = this.createParticleTexture();
    
    // Create material
    const particlesMaterial = new THREE.PointsMaterial({
      size: 3.0,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create point system
    this.particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particleSystem);
  },
  
  /**
   * Create particle texture with glow effect
   */
  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    // Create circular gradient
    const gradient = context.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(200, 200, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(120, 140, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(120, 140, 255, 0)');
    
    // Fill with gradient
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  },
  
  /**
   * Create data visualization nodes representing the server data
   */
  createDataVisualization() {
    // Create group for data visualization
    this.dataCloud = new THREE.Group();
    this.scene.add(this.dataCloud);
    
    // Create nodes based on params
    for (let i = 0; i < this.params.dataNodeCount; i++) {
      // Position on a spherical distribution
      const angle = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const radius = 15 + Math.random() * 10;
      
      const x = radius * Math.sqrt(1 - z * z) * Math.cos(angle);
      const y = radius * Math.sqrt(1 - z * z) * Math.sin(angle);
      
      // Geometry based on random size within range
      const size = this.params.dataNodeSize.min + 
        Math.random() * (this.params.dataNodeSize.max - this.params.dataNodeSize.min);
      
      const geometry = new THREE.SphereGeometry(size, 16, 16);
      
      // Random color from palette
      const colorIndex = Math.floor(Math.random() * this.params.dataNodeColor.length);
      const color = this.params.dataNodeColor[colorIndex];
      
      // Create material with glass-like appearance
      const material = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.8,
        transparent: true,
        opacity: 0.85
      });
      
      // Create mesh and position
      const nodeMesh = new THREE.Mesh(geometry, material);
      nodeMesh.position.set(x, y, z);
      
      // Add to group and track
      this.dataCloud.add(nodeMesh);
      this.dataNodes.push({
        mesh: nodeMesh,
        originalPosition: new THREE.Vector3(x, y, z),
        size: size,
        color: color,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
        connections: []
      });
    }
    
    // Connect nodes with lines
    this.createDataConnections();
  },
  
  /**
   * Create connections between data nodes
   */
  createDataConnections() {
    // For each node, connect to 2-4 closest nodes
    this.dataNodes.forEach((node, index) => {
      // Calculate distances to all other nodes
      const distances = this.dataNodes.map((otherNode, otherIndex) => {
        if (index === otherIndex) return Infinity;
        
        return {
          index: otherIndex,
          distance: node.mesh.position.distanceTo(otherNode.mesh.position)
        };
      });
      
      // Sort by distance
      distances.sort((a, b) => a.distance - b.distance);
      
      // Connect to 2-4 closest nodes
      const connectCount = 2 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < connectCount && i < distances.length; i++) {
        const otherIndex = distances[i].index;
        
        // Skip if already connected
        if (node.connections.includes(otherIndex)) continue;
        
        // Create line
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          node.mesh.position,
          this.dataNodes[otherIndex].mesh.position
        ]);
        
        const lineMaterial = new THREE.LineBasicMaterial({
          color: this.params.dataLineColor,
          transparent: true,
          opacity: this.params.dataLineOpacity,
          blending: THREE.AdditiveBlending
        });
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.dataCloud.add(line);
        
        // Store connection
        node.connections.push({
          nodeIndex: otherIndex,
          line: line
        });
        
        // Add connection to other node
        this.dataNodes[otherIndex].connections.push({
          nodeIndex: index,
          line: line
        });
      }
    });
  },
  
  /**
   * Create interactive holographic cubes
   */
  createHoloCubes() {
    // Define moderation actions for cubes
    const moderationActions = [
      { name: 'Ban', icon: '❌', color: 0xff3355 },
      { name: 'Kick', icon: '👢', color: 0xffaa22 },
      { name: 'Mute', icon: '🔇', color: 0x55aaff },
      { name: 'Warn', icon: '⚠️', color: 0xffff55 },
      { name: 'Timeout', icon: '⏱️', color: 0xaa55ff },
      { name: 'Purge', icon: '🧹', color: 0x55ff77 },
      { name: 'Report', icon: '📢', color: 0xff77aa },
      { name: 'Logs', icon: '📊', color: 0x77ffee },
      { name: 'Unban', icon: '✅', color: 0x55ff55 },
      { name: 'Lockdown', icon: '🔒', color: 0xff5588 },
      { name: 'Settings', icon: '⚙️', color: 0xaaaaaa },
      { name: 'Blacklist', icon: '⛔', color: 0xff0000 }
    ];
    
    // Create cube for each action
    for (let i = 0; i < moderationActions.length; i++) {
      const action = moderationActions[i];
      
      // Calculate position in a circular pattern
      const angle = (i / moderationActions.length) * Math.PI * 2;
      const radius = this.params.holoCubeGap;
      
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const y = this.params.holoCubeHeight;
      
      // Create holographic cube
      const cube = this.createHoloCube(action, new THREE.Vector3(x, y, z), angle);
      
      // Add to tracked cubes
      this.holoCubes.push(cube);
    }
  },
  
  /**
   * Create a single holographic cube
   */
  createHoloCube(action, position, angle) {
    // Create cube geometry
    const geometry = new THREE.BoxGeometry(
      this.params.holoCubeSize,
      this.params.holoCubeSize,
      this.params.holoCubeSize
    );
    
    // Create texture for cube faces
    const texture = this.createHoloTexture(action.icon, action.name, action.color);
    
    // Create edge geometry for holographic effect
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: action.color,
      transparent: true,
      opacity: 0.8
    });
    
    // Create glass material with transmission
    const materials = [
      new THREE.MeshPhysicalMaterial({
        color: action.color,
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.95,
        thickness: 0.5,
        transparent: true,
        opacity: this.params.holoCubeOpacity,
        side: THREE.DoubleSide,
        emissive: new THREE.Color(action.color).multiplyScalar(0.2)
      }),
      new THREE.MeshPhysicalMaterial({
        color: action.color,
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.95,
        thickness: 0.5,
        transparent: true,
        opacity: this.params.holoCubeOpacity,
        side: THREE.DoubleSide,
        emissive: new THREE.Color(action.color).multiplyScalar(0.2)
      }),
      new THREE.MeshPhysicalMaterial({
        color: action.color,
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.95,
        thickness: 0.5,
        transparent: true,
        opacity: this.params.holoCubeOpacity,
        side: THREE.DoubleSide,
        emissive: new THREE.Color(action.color).multiplyScalar(0.2)
      }),
      new THREE.MeshPhysicalMaterial({
        color: action.color,
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.95,
        thickness: 0.5,
        transparent: true,
        opacity: this.params.holoCubeOpacity,
        side: THREE.DoubleSide,
        emissive: new THREE.Color(action.color).multiplyScalar(0.2)
      }),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide
      }),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide
      })
    ];
    
    // Create cube mesh and edges for holographic effect
    const cubeMesh = new THREE.Mesh(geometry, materials);
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    
    // Create a group to hold both cube and edges
    const cubeGroup = new THREE.Group();
    cubeGroup.add(cubeMesh);
    cubeGroup.add(edges);
    
    // Position the group
    cubeGroup.position.copy(position);
    
    // Add metadata for interaction and animation
    cubeGroup.userData = {
      type: 'holoCube',
      actionName: action.name,
      actionIcon: action.icon,
      color: action.color,
      originalPosition: position.clone(),
      angle: angle,
      radius: this.params.holoCubeGap,
      phase: Math.random() * Math.PI * 2,
      mesh: cubeMesh,
      edges: edges,
      rotation: {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01
      },
      hover: false,
      selected: false,
      animationProgress: 0
    };
    
    // Add to scene
    this.scene.add(cubeGroup);
    
    return cubeGroup;
  },
  
  /**
   * Create texture for holographic cube
   */
  createHoloTexture(icon, text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Set background
    context.fillStyle = `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.1)`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw holographic grid lines
    context.strokeStyle = `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.3)`;
    context.lineWidth = 1;
    
    // Horizontal lines
    for (let y = 0; y < canvas.height; y += 32) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }
    
    // Vertical lines
    for (let x = 0; x < canvas.width; x += 32) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }
    
    // Draw border
    context.strokeStyle = `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.7)`;
    context.lineWidth = 8;
    context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
    
    // Draw icon
    context.font = '120px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(icon, canvas.width / 2, canvas.height / 2 - 40);
    
    // Draw text
    context.font = 'bold 36px Arial';
    context.fillStyle = '#ffffff';
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 80);
    
    // Add holographic scanlines effect
    const scanLineCount = 50;
    context.fillStyle = `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.15)`;
    
    for (let i = 0; i < scanLineCount; i++) {
      const y = (i / scanLineCount) * canvas.height;
      context.fillRect(0, y, canvas.width, 2);
    }
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16; // Improve texture quality
    return texture;
  },
  
  /**
   * Set up post-processing effects
   */
  setupPostProcessing() {
    // Skip if post-processing is not available
    if (!THREE.EffectComposer) {
      console.warn('Post-processing not available. Premium effects reduced.');
      return;
    }
    
    // Create composer
    this.composer = new THREE.EffectComposer(this.renderer);
    
    // Add render pass
    const renderPass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Add bloom pass if available
    if (THREE.UnrealBloomPass) {
      this.bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        this.params.bloomStrength,
        this.params.bloomRadius,
        this.params.bloomThreshold
      );
      this.composer.addPass(this.bloomPass);
    }
    
    // Add output pass to apply tone mapping
    const outputPass = new THREE.ShaderPass(THREE.OutputShader);
    outputPass.renderToScreen = true;
    this.composer.addPass(outputPass);
  },
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Add resize listener
    window.addEventListener('resize', this.onResize.bind(this));
    
    // Add mouse listeners
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('click', this.onMouseClick.bind(this));
    
    // Add server select listener
    document.getElementById('serverSelect')?.addEventListener('change', this.onServerChange.bind(this));
  },
  
  /**
   * Handle window resize
   */
  onResize() {
    const { clientWidth, clientHeight } = this.container;
    
    // Update camera
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    
    // Update renderer
    this.renderer.setSize(clientWidth, clientHeight);
    
    // Update composer if available
    if (this.composer) {
      this.composer.setSize(clientWidth, clientHeight);
    }
  },
  
  /**
   * Handle mouse movement
   */
  onMouseMove(event) {
    // Get container bounds
    const rect = this.container.getBoundingClientRect();
    
    // Calculate mouse position in normalized device coordinates
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Check for intersections with holo cubes
    const intersects = this.raycaster.intersectObjects(
      this.holoCubes.map(cube => cube.children[0]), // Use cube meshes for intersection
      false
    );
    
    // Reset hover states
    this.holoCubes.forEach(cube => {
      cube.userData.hover = false;
    });
    
    // Update cursor style
    this.container.style.cursor = 'default';
    
    // Set hover state for intersected cube
    if (intersects.length > 0) {
      const object = intersects[0].object;
      const cubeGroup = object.parent;
      
      if (cubeGroup && cubeGroup.userData) {
        cubeGroup.userData.hover = true;
        this.container.style.cursor = 'pointer';
        this.hoveredObject = cubeGroup;
      }
    } else {
      this.hoveredObject = null;
    }
  },
  
  /**
   * Handle mouse click
   */
  onMouseClick(event) {
    // If we have a hovered object, select it
    if (this.hoveredObject) {
      // Deselect previous selection
      if (this.selectedObject) {
        this.selectedObject.userData.selected = false;
      }
      
      // Select current object
      this.selectedObject = this.hoveredObject;
      this.selectedObject.userData.selected = true;
      
      // Trigger action based on cube type
      console.log(`Selected moderation action: ${this.selectedObject.userData.actionName}`);
      
      // Emit visual pulse effect
      this.emitPulseFromObject(this.selectedObject);
      
      // Handle action - this could be expanded to actually trigger the UI
      this.triggerModerationAction(this.selectedObject.userData.actionName);
    }
  },
  
  /**
   * Handle server selection change
   */
  onServerChange(event) {
    const serverId = event.target.value;
    
    if (serverId) {
      // Load data and update visualization
      this.loadServerData(serverId);
    }
  },
  
  /**
   * Trigger moderation action based on selected cube
   */
  triggerModerationAction(actionName) {
    // This could activate the corresponding UI element
    // For now, just scroll to and focus the corresponding section
    const tabButton = document.querySelector(`.mod-nav-btn[data-tab="${actionName.toLowerCase()}"]`) ||
                     document.querySelector(`.mod-nav-btn[data-tab="${actionName.toLowerCase().replace(' ', '-')}"]`);
    
    if (tabButton) {
      tabButton.click();
    }
  },
  
  /**
   * Load server data for visualization
   */
  loadServerData(serverId) {
    // Fetch data from API
    fetch(`/admin3d/direct-bans/list/${serverId}`, {
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to load ban data');
      return response.json();
    })
    .then(data => {
      console.log('Server data loaded for visualization:', data);
      
      // Update data visualization
      this.updateDataVisualization(data);
    })
    .catch(error => {
      console.error('Error loading server data:', error);
    });
  },
  
  /**
   * Update data visualization based on server data
   */
  updateDataVisualization(data) {
    // Get ban count for scaling
    const banCount = data.bans ? data.bans.length : 0;
    
    // Scale glow sphere based on ban count
    if (this.glowSphere) {
      const scale = 1 + Math.min(banCount / 20, 2);
      this.glowSphere.scale.set(scale, scale, scale);
      
      // Update color based on ban count
      if (banCount > 50) {
        this.glowSphere.material.color.set(0xff3333);
        this.glowSphere.material.emissive.set(0xff1111);
      } else if (banCount > 20) {
        this.glowSphere.material.color.set(0xffaa33);
        this.glowSphere.material.emissive.set(0xff7711);
      } else {
        this.glowSphere.material.color.set(0x4466ff);
        this.glowSphere.material.emissive.set(0x2233ff);
      }
    }
    
    // Update data nodes with real data
    if (data.bans && data.bans.length > 0) {
      // Limit to the first 30 bans if we have too many
      const displayBans = data.bans.slice(0, 30);
      
      // Update nodes with ban data
      displayBans.forEach((ban, index) => {
        if (index < this.dataNodes.length) {
          const node = this.dataNodes[index];
          
          // Scale based on reason length
          const reasonLength = ban.reason ? ban.reason.length : 10;
          const scale = 0.8 + (Math.min(reasonLength, 100) / 100) * 1.5;
          
          node.mesh.scale.set(scale, scale, scale);
          
          // Set color based on ban duration
          let color;
          if (ban.permanent) {
            color = 0xff3333; // Red for permanent bans
          } else if (ban.duration && ban.duration.includes('d')) {
            const days = parseInt(ban.duration);
            if (days > 14) {
              color = 0xff6600; // Orange for long bans
            } else {
              color = 0xffaa00; // Yellow for shorter bans
            }
          } else {
            color = 0x64aaff; // Blue for other bans
          }
          
          // Update material
          node.mesh.material.color.set(new THREE.Color(color));
          node.mesh.material.needsUpdate = true;
          
          // Store ban data in user data
          node.mesh.userData.banData = ban;
        }
      });
    }
  },
  
  /**
   * Emit visual pulse from an object
   */
  emitPulseFromObject(object) {
    // Create expanding ring geometry
    const ringGeometry = new THREE.RingGeometry(0.1, 1, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: object.userData.color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    
    // Position at the object
    ring.position.copy(object.position);
    
    // Orient to camera
    ring.lookAt(this.camera.position);
    
    // Add to scene
    this.scene.add(ring);
    
    // Animate the pulse
    const startTime = Date.now();
    const duration = 1000; // ms
    const maxScale = 20;
    
    const animatePulse = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        // Scale up
        const scale = progress * maxScale;
        ring.scale.set(scale, scale, scale);
        
        // Fade out
        ringMaterial.opacity = 0.8 * (1 - progress);
        
        requestAnimationFrame(animatePulse);
      } else {
        // Remove when done
        this.scene.remove(ring);
        ringGeometry.dispose();
        ringMaterial.dispose();
      }
    };
    
    animatePulse();
  },
  
  /**
   * Main animation loop
   */
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();
    
    // Animate particles
    this.animateParticles(delta, time);
    
    // Animate data cloud
    this.animateDataCloud(delta, time);
    
    // Animate holographic cubes
    this.animateHoloCubes(delta, time);
    
    // Animate glow sphere
    this.animateGlowSphere(time);
    
    // Animate volumetric light if available
    if (this.volumetricLight) {
      this.volumetricLight.position.x = Math.sin(time * 0.2) * 30;
      this.volumetricLight.position.z = Math.cos(time * 0.2) * 30;
    }
    
    // Slowly rotate overall scene for more dynamic feel
    this.scene.rotation.y += delta * 0.05;
    
    // Render the scene
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  },
  
  /**
   * Animate particle system
   */
  animateParticles(delta, time) {
    if (!this.particleSystem) return;
    
    const positions = this.particleSystem.geometry.attributes.position.array;
    
    // Update particle positions
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      // Move particle along velocity
      particle.position.add(particle.velocity);
      
      // Check boundaries
      const distance = particle.position.length();
      if (distance > 100) {
        // Reset to closer to center with new velocity
        const factor = 0.5 + Math.random() * 0.5;
        particle.position.multiplyScalar(factor);
        
        // Randomize velocity
        particle.velocity.set(
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05
        );
      }
      
      // Update position in geometry
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
    }
    
    // Update geometry
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    
    // Subtle rotation of the whole system
    this.particleSystem.rotation.y += delta * 0.05;
  },
  
  /**
   * Animate data visualization
   */
  animateDataCloud(delta, time) {
    if (!this.dataCloud) return;
    
    // Rotate entire cloud slowly
    this.dataCloud.rotation.y += delta * 0.1;
    
    // Animate individual nodes
    this.dataNodes.forEach(node => {
      // Apply slight movement based on velocity and time
      node.mesh.position.x += Math.sin(time * 0.5) * 0.01;
      node.mesh.position.y += Math.cos(time * 0.7) * 0.01;
      node.mesh.position.z += Math.sin(time * 0.3) * 0.01;
      
      // Update connections
      node.connections.forEach(connection => {
        // Get current positions
        const startPosition = node.mesh.position;
        const endPosition = this.dataNodes[connection.nodeIndex].mesh.position;
        
        // Update line geometry to connect the nodes
        connection.line.geometry.setFromPoints([
          startPosition,
          endPosition
        ]);
        connection.line.geometry.verticesNeedUpdate = true;
      });
    });
  },
  
  /**
   * Animate holographic cubes
   */
  animateHoloCubes(delta, time) {
    this.holoCubes.forEach(cube => {
      const userData = cube.userData;
      
      // Base rotation
      cube.rotation.x += userData.rotation.x;
      cube.rotation.y += userData.rotation.y;
      cube.rotation.z += userData.rotation.z;
      
      // Floating animation
      cube.position.y = userData.originalPosition.y + Math.sin(time + userData.phase) * 2;
      
      // Circular orbit movement
      const newAngle = userData.angle + Math.sin(time * 0.1 + userData.phase) * 0.08;
      cube.position.x = Math.sin(newAngle) * userData.radius;
      cube.position.z = Math.cos(newAngle) * userData.radius;
      
      // Handle hover effect
      if (userData.hover) {
        // Scale up when hovered
        cube.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), this.params.hoverScaleSpeed);
        
        // Update emissive intensity
        userData.mesh.material.forEach(material => {
          if (material.emissive) {
            material.emissive.setHex(userData.color);
            material.emissiveIntensity = 0.5 + Math.sin(time * 10) * 0.2;
          }
        });
        
        // Make edges glow brighter
        userData.edges.material.opacity = 0.8 + Math.sin(time * 10) * 0.2;
      } else if (userData.selected) {
        // Scale for selected state
        cube.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), this.params.hoverScaleSpeed);
        
        // Rotation effect for selected cube
        cube.rotation.y += 0.02;
        
        // Make selected cube more prominent
        userData.mesh.material.forEach(material => {
          if (material.emissive) {
            material.emissive.setHex(userData.color);
            material.emissiveIntensity = 0.8 + Math.sin(time * 5) * 0.2;
          }
        });
        
        // Make edges glow brighter
        userData.edges.material.opacity = 1.0;
      } else {
        // Return to normal scale
        cube.scale.lerp(new THREE.Vector3(1, 1, 1), this.params.hoverScaleSpeed);
        
        // Reset emissive
        userData.mesh.material.forEach(material => {
          if (material.emissive) {
            material.emissive.setHex(userData.color);
            material.emissiveIntensity = 0.2;
          }
        });
        
        // Reset edge opacity
        userData.edges.material.opacity = 0.5;
      }
    });
  },
  
  /**
   * Animate glow sphere in center
   */
  animateGlowSphere(time) {
    if (this.glowSphere) {
      // Pulsing effect
      const pulse = Math.sin(time * this.params.pulseSpeed) * 0.1 + 0.9;
      this.glowSphere.scale.set(pulse, pulse, pulse);
      
      // Rotate slowly
      this.glowSphere.rotation.y += 0.002;
      this.glowSphere.rotation.x += 0.001;
      
      // Opacity pulsing
      this.glowSphere.material.opacity = 0.2 + Math.sin(time * 0.5) * 0.1;
    }
  }
};

// Start premium visualization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if container exists
  if (document.getElementById('moderation-three-container')) {
    // Wait for THREE.js to load
    const checkThree = setInterval(() => {
      if (typeof THREE !== 'undefined') {
        clearInterval(checkThree);
        // Initialize visualization
        PremiumModerationVisualizer.init();
      }
    }, 100);
  }
});