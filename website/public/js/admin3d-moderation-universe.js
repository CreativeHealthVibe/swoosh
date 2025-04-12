/**
 * SWOOSH BOT - Universe-class Premium 3D Visualization
 * 
 * A sophisticated high-end 3D visualization system with:
 * - Reactive holographic data projections
 * - Multi-layered particle systems with physics
 * - Advanced lighting and atmospheric effects
 * - Interactive data manipulation
 * - Adaptive performance optimization
 * - Seamless Discord data integration
 * 
 * This system is designed to provide an unprecedented visual experience
 * that transforms server moderation data into an immersive, interactive 
 * universe that responds to user actions and server changes in real-time.
 */

// Universe Visualization Controller
const UniverseVisualization = {
  // Core components
  scene: null,
  camera: null,
  renderer: null,
  composer: null,
  stats: null,
  container: null,
  clock: new THREE.Clock(),
  raycaster: null,
  mouse: new THREE.Vector2(),
  
  // Scene elements
  universe: null,            // Main container group
  galaxies: [],              // Server groups
  stars: [],                 // User representations
  nebulae: [],               // Activity zones
  blackholes: [],            // Banned users
  dataClouds: [],            // Information clusters
  wormholes: [],             // Connection points
  timelines: [],             // Historical data streams
  
  // Control elements
  orbitControls: null,
  transformControls: null,
  cameraRig: null,
  navPoints: [],
  activeNavPoint: 0,
  
  // State
  isInitialized: false,
  isActive: false,
  isAnimating: true,
  isInteracting: false,
  selectedObject: null,
  hoveredObject: null,
  serverData: null,
  
  // Configuration
  config: {
    // Universe properties
    universeSize: 5000,
    universeScale: 1,
    galaxyCount: 5,
    starDensity: 0.8,
    nebulaDensity: 0.4,
    connectedness: 0.7,
    
    // Visual properties
    visualQuality: 'ultra',    // 'low', 'medium', 'high', 'ultra'
    particleDensity: 50000,     // Number of background particles
    particleSize: 1.8,          // Size of particles
    starSize: 4,                // Size of star objects
    
    // Camera settings
    cameraFov: 60,
    cameraNear: 0.1,
    cameraFar: 10000,
    cameraPosition: new THREE.Vector3(0, 30, 100),
    orbitDamping: 0.1,
    orbitSpeed: 0.5,
    
    // Animation speeds
    rotationSpeed: 0.05,
    pulseSpeed: 0.8,
    flowSpeed: 0.3,
    
    // Colors & lighting
    bgColor: new THREE.Color(0x000510),
    primaryColor: new THREE.Color(0x7e6eef),
    accentColor: new THREE.Color(0xff3366),
    
    // Performance
    useLOD: true,               // Level Of Detail optimization
    useInstancing: true,        // Instance rendering for similar objects
    useAdaptiveQuality: true,   // Reduce quality when performance drops
    targetFrameRate: 60,
    maxParticleCount: 100000
  },
  
  // Shader collections
  shaders: {
    particleVertex: null,
    particleFragment: null,
    nebulaVertex: null,
    nebulaFragment: null,
    galaxyVertex: null,
    galaxyFragment: null,
    hologramVertex: null,
    hologramFragment: null
  },
  
  /**
   * Initialize the visualization system
   */
  init() {
    console.log('Initializing Universe Visualization System...');
    
    // Get container element
    this.container = document.getElementById('moderation-three-container');
    if (!this.container) {
      console.error('Container element not found');
      return false;
    }
    
    // Check THREE.js availability
    if (typeof THREE === 'undefined') {
      console.error('THREE.js not available, visualization disabled');
      return false;
    }
    
    try {
      // Base initialization
      this.initScene();
      this.initCamera();
      this.initRenderer();
      this.initLights();
      this.initControls();
      this.initEffects();
      this.initRaycaster();
      
      // Build universe
      this.initUniverse();
      
      // Add event listeners
      this.initEventListeners();
      
      // Start animation loop
      this.animate();
      
      this.isInitialized = true;
      console.log('✨ Universe Visualization System Initialized');
      
      return true;
      
    } catch (error) {
      console.error('Failed to initialize visualization:', error);
      return false;
    }
  },
  
  /**
   * Initialize the scene
   */
  initScene() {
    // Create scene
    this.scene = new THREE.Scene();
    
    // Set background
    this.scene.background = this.config.bgColor;
    
    // Add fog for depth
    this.scene.fog = new THREE.FogExp2(
      new THREE.Color(0x000814), 
      0.0005
    );
    
    // Start the clock
    this.clock.start();
  },
  
  /**
   * Initialize the camera
   */
  initCamera() {
    // Create perspective camera
    const { clientWidth, clientHeight } = this.container;
    
    this.camera = new THREE.PerspectiveCamera(
      this.config.cameraFov,
      clientWidth / clientHeight,
      this.config.cameraNear,
      this.config.cameraFar
    );
    
    // Position camera
    this.camera.position.copy(this.config.cameraPosition);
    this.camera.lookAt(0, 0, 0);
    
    // Create camera rig for smooth movements
    this.cameraRig = new THREE.Group();
    this.cameraRig.add(this.camera);
    this.scene.add(this.cameraRig);
    
    // Create navigation points for the tour
    this.createNavigationPoints();
  },
  
  /**
   * Initialize the renderer
   */
  initRenderer() {
    const { clientWidth, clientHeight } = this.container;
    
    // Create WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      precision: 'highp',
      logarithmicDepthBuffer: true,
      stencil: false
    });
    
    // Configure renderer
    this.renderer.setSize(clientWidth, clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.sortObjects = true;
    
    // Add to DOM
    this.container.appendChild(this.renderer.domElement);
  },
  
  /**
   * Initialize lighting
   */
  initLights() {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x111122, 0.4);
    this.scene.add(ambientLight);
    
    // Directional light to cast subtle shadows
    const directionalLight = new THREE.DirectionalLight(0xaaccff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.bias = -0.0001;
    
    this.scene.add(directionalLight);
    
    // Add colored point lights for atmospheric effect
    this.addColoredPointLights();
  },
  
  /**
   * Add colored point lights throughout the scene
   */
  addColoredPointLights() {
    // Array of light colors and positions
    const lights = [
      { color: 0x5555ff, position: new THREE.Vector3(50, 30, 40), intensity: 1.2, distance: 200 },
      { color: 0xff5555, position: new THREE.Vector3(-30, 40, -60), intensity: 0.8, distance: 150 },
      { color: 0x55ffaa, position: new THREE.Vector3(0, -50, 30), intensity: 0.6, distance: 120 },
      { color: 0xaa55ff, position: new THREE.Vector3(-60, 20, 40), intensity: 1.0, distance: 180 },
      { color: 0xffaa55, position: new THREE.Vector3(80, -20, -40), intensity: 0.7, distance: 160 },
    ];
    
    // Create and add each light
    lights.forEach(light => {
      const pointLight = new THREE.PointLight(
        light.color,
        light.intensity,
        light.distance
      );
      
      pointLight.position.copy(light.position);
      this.scene.add(pointLight);
      
      // Add subtle pulsing animation effect
      const originalIntensity = light.intensity;
      const pulseSpeed = Math.random() * 0.2 + 0.1;
      const pulseRange = originalIntensity * 0.3;
      
      // Store animation data
      pointLight.userData = {
        originalIntensity,
        pulseSpeed,
        pulseRange,
        animate: time => {
          pointLight.intensity = originalIntensity + 
            Math.sin(time * pulseSpeed) * pulseRange;
        }
      };
    });
  },
  
  /**
   * Initialize orbit and transform controls
   */
  initControls() {
    // Only initialize if OrbitControls is available
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.orbitControls = new THREE.OrbitControls(
        this.camera, 
        this.renderer.domElement
      );
      
      this.orbitControls.enableDamping = true;
      this.orbitControls.dampingFactor = this.config.orbitDamping;
      this.orbitControls.enableZoom = true;
      this.orbitControls.enablePan = false;
      this.orbitControls.enableRotate = true;
      this.orbitControls.autoRotate = false;
      this.orbitControls.autoRotateSpeed = this.config.orbitSpeed;
      this.orbitControls.minDistance = 30;
      this.orbitControls.maxDistance = 500;
      this.orbitControls.minPolarAngle = Math.PI * 0.1; // Limit up
      this.orbitControls.maxPolarAngle = Math.PI * 0.8; // Limit down
      
      // Set initial target to origin
      this.orbitControls.target.set(0, 0, 0);
      this.orbitControls.update();
    } else {
      console.warn('OrbitControls not available, interactive controls disabled');
    }
    
    // Initialize transform controls if available
    if (typeof THREE.TransformControls !== 'undefined') {
      this.transformControls = new THREE.TransformControls(
        this.camera, 
        this.renderer.domElement
      );
      
      this.scene.add(this.transformControls);
      
      // Pause orbit controls when using transform controls
      this.transformControls.addEventListener('dragging-changed', event => {
        if (this.orbitControls) {
          this.orbitControls.enabled = !event.value;
        }
      });
    }
  },
  
  /**
   * Initialize post-processing effects
   */
  initEffects() {
    // Skip if EffectComposer is not available
    if (typeof THREE.EffectComposer === 'undefined') {
      console.warn('EffectComposer not available, advanced effects disabled');
      return;
    }
    
    const { clientWidth, clientHeight } = this.container;
    
    // Create composer
    this.composer = new THREE.EffectComposer(this.renderer);
    
    // Add render pass
    const renderPass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Add UnrealBloomPass for glow effect
    if (typeof THREE.UnrealBloomPass !== 'undefined') {
      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(clientWidth, clientHeight),
        0.8,    // Strength
        0.3,    // Radius
        0.1     // Threshold
      );
      this.composer.addPass(bloomPass);
    }
    
    // Add ShaderPass for color correction
    if (typeof THREE.ShaderPass !== 'undefined' && THREE.OutputShader) {
      const outputPass = new THREE.ShaderPass(THREE.OutputShader);
      outputPass.renderToScreen = true;
      this.composer.addPass(outputPass);
    }
  },
  
  /**
   * Initialize raycaster for interaction
   */
  initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  },
  
  /**
   * Create navigation points for guided camera movement
   */
  createNavigationPoints() {
    // Define navigation points with positions, targets and info
    const points = [
      {
        position: new THREE.Vector3(0, 100, 200),
        target: new THREE.Vector3(0, 0, 0),
        info: 'Universe Overview',
        easing: 'easeOutQuad',
        duration: 2000
      },
      {
        position: new THREE.Vector3(100, 50, 100),
        target: new THREE.Vector3(20, 0, 0),
        info: 'Data Galaxies',
        easing: 'easeInOutCubic',
        duration: 2500
      },
      {
        position: new THREE.Vector3(-80, 30, 80),
        target: new THREE.Vector3(-30, 0, 0),
        info: 'User Activity Zones',
        easing: 'easeInOutQuart',
        duration: 2000
      },
      {
        position: new THREE.Vector3(0, 30, 80),
        target: new THREE.Vector3(0, 0, 0),
        info: 'Central Moderation Hub',
        easing: 'easeOutQuint',
        duration: 1800
      }
    ];
    
    this.navPoints = points;
  },
  
  /**
   * Navigate to a specific point
   * @param {number} index - Index of the navigation point
   */
  navigateTo(index) {
    if (index < 0 || index >= this.navPoints.length) return;
    
    const point = this.navPoints[index];
    this.activeNavPoint = index;
    
    // Animate camera movement
    const startPosition = this.camera.position.clone();
    const startTarget = this.orbitControls.target.clone();
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / point.duration, 1);
      
      // Apply easing
      const easedProgress = this.applyEasing(progress, point.easing);
      
      // Interpolate position and target
      const newPosition = startPosition.clone().lerp(point.position, easedProgress);
      const newTarget = startTarget.clone().lerp(point.target, easedProgress);
      
      // Update camera and controls
      this.camera.position.copy(newPosition);
      this.orbitControls.target.copy(newTarget);
      this.orbitControls.update();
      
      // Continue animation if not complete
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  },
  
  /**
   * Apply easing function to a progress value
   * @param {number} t - Progress value (0-1)
   * @param {string} easingType - Name of easing function
   * @returns {number} - Eased value
   */
  applyEasing(t, easingType) {
    switch (easingType) {
      case 'linear': return t;
      case 'easeInQuad': return t * t;
      case 'easeOutQuad': return t * (2 - t);
      case 'easeInOutQuad': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'easeInCubic': return t * t * t;
      case 'easeOutCubic': return (--t) * t * t + 1;
      case 'easeInOutCubic': return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      case 'easeInQuart': return t * t * t * t;
      case 'easeOutQuart': return 1 - (--t) * t * t * t;
      case 'easeInOutQuart': return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
      case 'easeInQuint': return t * t * t * t * t;
      case 'easeOutQuint': return 1 + (--t) * t * t * t * t;
      case 'easeInOutQuint': return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
      default: return t;
    }
  },
  
  /**
   * Initialize the universe structure
   */
  initUniverse() {
    // Create main container group
    this.universe = new THREE.Group();
    this.scene.add(this.universe);
    
    // Create detailed space background (stars, nebulae)
    this.createSpaceBackground();
    
    // Create core universe elements
    this.createGalaxySystem();
    
    // Create central hub
    this.createCentralHub();
    
    // Create data visualization elements
    this.createDataClouds();
    
    // Add visual flows between elements
    this.createDataFlows();
  },
  
  /**
   * Create detailed space background with stars and nebulae
   */
  createSpaceBackground() {
    // Create distant stars
    this.createStarField(this.config.particleDensity);
    
    // Create colored nebulae
    this.createNebulae();
    
    // Create ambient particles
    this.createAmbientParticles();
  },
  
  /**
   * Create a dense star field
   * @param {number} count - Number of stars to create
   */
  createStarField(count) {
    // Create geometries and materials based on quality setting
    let particleGeometry;
    let particleCount = count;
    
    // Adjust particle count based on current settings
    if (this.config.visualQuality === 'low') {
      particleCount = Math.floor(count * 0.3);
    } else if (this.config.visualQuality === 'medium') {
      particleCount = Math.floor(count * 0.6);
    }
    
    // Create positions and colors for particles
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Add variety to star appearances
    const starTypes = [
      { color: new THREE.Color(0xCCCCFF), size: 1.0, chance: 0.7 }, // Common blue-white
      { color: new THREE.Color(0xFFCCCC), size: 1.1, chance: 0.15 }, // Less common red
      { color: new THREE.Color(0xFFFFCC), size: 1.3, chance: 0.1 }, // Rare yellow
      { color: new THREE.Color(0xAAFFFF), size: 1.6, chance: 0.05 } // Very rare cyan
    ];
    
    // Distribute stars in a spherical pattern with more density toward center
    for (let i = 0; i < particleCount; i++) {
      // Spherical coordinates with bias toward center
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      
      // Use power distribution to cluster more stars at center
      const phi = Math.acos(2 * Math.pow(v, 0.5) - 1);
      
      // Convert to Cartesian coordinates with radius variation
      const radius = this.config.universeSize * (0.3 + 0.7 * Math.random());
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      // Set position
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Determine star type based on chance
      let starType = starTypes[0];
      const starRoll = Math.random();
      let cumulativeChance = 0;
      
      for (const type of starTypes) {
        cumulativeChance += type.chance;
        if (starRoll <= cumulativeChance) {
          starType = type;
          break;
        }
      }
      
      // Set color
      colors[i * 3] = starType.color.r;
      colors[i * 3 + 1] = starType.color.g;
      colors[i * 3 + 2] = starType.color.b;
      
      // Set size with slight random variation
      sizes[i] = starType.size * this.config.particleSize * (0.8 + 0.4 * Math.random());
    }
    
    // Create buffer geometry and set attributes
    particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create star texture
    const texture = this.createStarTexture();
    
    // Create material
    const particleMaterial = new THREE.PointsMaterial({
      size: this.config.particleSize,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    
    // Create particle system
    const starField = new THREE.Points(particleGeometry, particleMaterial);
    this.universe.add(starField);
  },
  
  /**
   * Create a texture for the stars
   * @returns {THREE.Texture} - The generated texture
   */
  createStarTexture() {
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
    gradient.addColorStop(0.15, 'rgba(240, 240, 255, 0.8)');
    gradient.addColorStop(0.35, 'rgba(220, 220, 255, 0.4)');
    gradient.addColorStop(0.7, 'rgba(180, 180, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(180, 180, 255, 0)');
    
    // Fill with gradient
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  },
  
  /**
   * Create colored nebulae in the background
   */
  createNebulae() {
    // Nebula colors
    const nebulaColors = [
      new THREE.Color(0x3311bb), // Blue
      new THREE.Color(0x991183), // Pink
      new THREE.Color(0x118844), // Green
      new THREE.Color(0x773311)  // Orange
    ];
    
    // Create several nebulae
    for (let i = 0; i < 6; i++) {
      const color = nebulaColors[i % nebulaColors.length];
      
      // Random position at distance
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const distance = this.config.universeSize * 0.6 * (0.7 + 0.3 * Math.random());
      
      const position = new THREE.Vector3(
        distance * Math.sin(phi) * Math.cos(theta),
        distance * Math.sin(phi) * Math.sin(theta),
        distance * Math.cos(phi)
      );
      
      // Create nebula cloud
      this.createNebulaCloud(position, color, 80 + Math.random() * 120);
    }
  },
  
  /**
   * Create a nebula cloud at the specified position
   * @param {THREE.Vector3} position - Position of the nebula
   * @param {THREE.Color} color - Base color of the nebula
   * @param {number} size - Size of the nebula
   */
  createNebulaCloud(position, color, size) {
    // Create a large particle system for the nebula
    const particleCount = Math.floor(2000 * this.config.nebulaDensity);
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Color variation
    const colorVariation = 0.2;
    const baseColor = color.clone();
    
    // Create particles in a cloud formation
    for (let i = 0; i < particleCount; i++) {
      // Use gaussian distribution for more realistic cloud
      const u1 = Math.random();
      const u2 = Math.random();
      
      // Box-Muller transform for normal distribution
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const z2 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
      const z3 = Math.sqrt(-2 * Math.log(u2)) * Math.cos(2 * Math.PI * u1);
      
      // Position with gaussian distribution (cloud-like)
      positions[i * 3] = position.x + z1 * size * 0.5;
      positions[i * 3 + 1] = position.y + z2 * size * 0.3;
      positions[i * 3 + 2] = position.z + z3 * size * 0.5;
      
      // Slight color variation
      const particleColor = baseColor.clone();
      particleColor.r += (Math.random() - 0.5) * colorVariation;
      particleColor.g += (Math.random() - 0.5) * colorVariation;
      particleColor.b += (Math.random() - 0.5) * colorVariation;
      
      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;
      
      // Random size
      sizes[i] = (0.5 + Math.random() * 0.5) * 25;
    }
    
    // Set attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create nebula texture
    const texture = this.createNebulaTexture();
    
    // Create material
    const material = new THREE.PointsMaterial({
      size: 30,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create particle system
    const nebula = new THREE.Points(geometry, material);
    
    // Add animation data
    nebula.userData = {
      originalPosition: position.clone(),
      rotation: new THREE.Vector3(
        (Math.random() - 0.5) * 0.0001,
        (Math.random() - 0.5) * 0.0001,
        (Math.random() - 0.5) * 0.0001
      ),
      animate: time => {
        nebula.rotation.x += nebula.userData.rotation.x;
        nebula.rotation.y += nebula.userData.rotation.y;
        nebula.rotation.z += nebula.userData.rotation.z;
      }
    };
    
    this.universe.add(nebula);
    this.nebulae.push(nebula);
  },
  
  /**
   * Create texture for nebula particles
   * @returns {THREE.Texture} - The generated texture
   */
  createNebulaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    // Create circular gradient for soft edge
    const gradient = context.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Fill with gradient
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some noise for texture
    context.globalAlpha = 0.2;
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 3 + 1;
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.fillStyle = 'white';
      context.fill();
    }
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  },
  
  /**
   * Create ambient particles that float around
   */
  createAmbientParticles() {
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    // Create particles in a spherical volume
    for (let i = 0; i < particleCount; i++) {
      // Random position in sphere
      const radius = 200 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Random velocity
      velocities.push({
        x: (Math.random() - 0.5) * 0.05,
        y: (Math.random() - 0.5) * 0.05,
        z: (Math.random() - 0.5) * 0.05
      });
    }
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create material
    const material = new THREE.PointsMaterial({
      size: 0.8,
      color: 0x3355ff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create points
    const particles = new THREE.Points(geometry, material);
    
    // Store velocities for animation
    particles.userData = {
      velocities,
      animate: time => {
        const positions = particles.geometry.attributes.position.array;
        
        for (let i = 0; i < particleCount; i++) {
          // Update position
          positions[i * 3] += velocities[i].x;
          positions[i * 3 + 1] += velocities[i].y;
          positions[i * 3 + 2] += velocities[i].z;
          
          // Check boundaries
          const distance = Math.sqrt(
            positions[i * 3] * positions[i * 3] +
            positions[i * 3 + 1] * positions[i * 3 + 1] +
            positions[i * 3 + 2] * positions[i * 3 + 2]
          );
          
          if (distance > 500) {
            // Reset to new position near center
            const radius = 200 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
          }
        }
        
        geometry.attributes.position.needsUpdate = true;
      }
    };
    
    this.universe.add(particles);
  },
  
  /**
   * Create galaxy system to represent server structure
   */
  createGalaxySystem() {
    // Create galaxies to represent different servers or data clusters
    for (let i = 0; i < this.config.galaxyCount; i++) {
      // Position in a circular pattern around center
      const angle = (i / this.config.galaxyCount) * Math.PI * 2;
      const distance = 80 + Math.random() * 40;
      
      const position = new THREE.Vector3(
        Math.cos(angle) * distance,
        (Math.random() - 0.5) * 40,
        Math.sin(angle) * distance
      );
      
      // Each galaxy has different characteristics
      const size = 30 + Math.random() * 20;
      const density = 0.5 + Math.random() * 0.5;
      const spiralFactor = 0.5 + Math.random() * 1.5;
      const color = new THREE.Color(
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5
      );
      
      // Create the galaxy
      this.createGalaxy(position, size, density, spiralFactor, color, i);
    }
  },
  
  /**
   * Create a galaxy at the specified position
   * @param {THREE.Vector3} position - Position of the galaxy
   * @param {number} size - Size of the galaxy
   * @param {number} density - Particle density
   * @param {number} spiralFactor - How tight the spiral is
   * @param {THREE.Color} color - Base color of the galaxy
   * @param {number} index - Index of the galaxy
   */
  createGalaxy(position, size, density, spiralFactor, color, index) {
    // Calculate particle count based on density
    const particleCount = Math.floor(5000 * density);
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Define spiral arms
    const arms = 3 + Math.floor(Math.random() * 3); // 3-5 arms
    
    // Create galaxy particles
    for (let i = 0; i < particleCount; i++) {
      // Distance from center (with more particles near center)
      const distance = Math.pow(Math.random(), 2) * size;
      
      // Angle around center
      const angle = Math.random() * Math.PI * 2;
      
      // Add spiral pattern
      const armOffset = (i % arms) * (Math.PI * 2 / arms);
      const spiralAngle = angle + armOffset + spiralFactor * distance / size;
      
      // Position with spiral pattern and height variation
      const x = Math.cos(spiralAngle) * distance;
      const z = Math.sin(spiralAngle) * distance;
      
      // Height follows a gaussian distribution
      const heightVariation = Math.exp(-distance / (size * 0.3));
      const verticalRandomness = (Math.random() - 0.5) * 2;
      const y = verticalRandomness * heightVariation * size * 0.2;
      
      // Set position
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Color varies from center to edge
      const centerDistance = distance / size;
      const particleColor = color.clone();
      
      // Brighter in center, color shift toward edges
      const brightness = 1 - centerDistance * 0.5;
      particleColor.r *= brightness * (0.8 + centerDistance * 0.4);
      particleColor.g *= brightness * (0.9 + centerDistance * 0.2);
      particleColor.b *= brightness * (1.0 + centerDistance * 0.1);
      
      // Set color
      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;
      
      // Size decreases toward edges
      sizes[i] = (1 - centerDistance * 0.5) * 3;
    }
    
    // Set attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material
    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    
    // Create galaxy system
    const galaxy = new THREE.Points(geometry, material);
    
    // Position the galaxy
    galaxy.position.copy(position);
    
    // Store original position and rotation for animation
    galaxy.userData = {
      index,
      originalPosition: position.clone(),
      rotationSpeed: 0.0005 + Math.random() * 0.0005,
      oscillation: {
        amplitude: Math.random() * 10,
        speed: 0.0001 + Math.random() * 0.0002,
        phase: Math.random() * Math.PI * 2
      },
      animate: time => {
        // Rotate the galaxy
        galaxy.rotation.y += galaxy.userData.rotationSpeed;
        
        // Slight oscillation
        const osc = galaxy.userData.oscillation;
        galaxy.position.y = position.y + 
          Math.sin(time * osc.speed + osc.phase) * osc.amplitude;
      }
    };
    
    // Create a glowing core for the galaxy
    this.createGalacticCore(galaxy);
    
    // Add to universe and tracking array
    this.universe.add(galaxy);
    this.galaxies.push(galaxy);
    
    return galaxy;
  },
  
  /**
   * Create a glowing core for a galaxy
   * @param {THREE.Points} galaxy - The galaxy to add a core to
   */
  createGalacticCore(galaxy) {
    // Create a glowing sphere for the galactic core
    const coreGeometry = new THREE.SphereGeometry(10, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.scale.set(0.5, 0.2, 0.5);
    
    // Add animation data
    core.userData = {
      originalScale: core.scale.clone(),
      pulseSpeed: 0.002 + Math.random() * 0.001,
      animate: time => {
        const pulse = 0.9 + Math.sin(time * core.userData.pulseSpeed) * 0.1;
        core.scale.copy(core.userData.originalScale).multiplyScalar(pulse);
      }
    };
    
    galaxy.add(core);
    
    // Add a glow effect
    const glowGeometry = new THREE.SphereGeometry(12, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x6688ff) },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          float pulse = 0.8 + 0.2 * sin(time * 2.0);
          gl_FragColor = vec4(glowColor, intensity * pulse);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.set(0.8, 0.3, 0.8);
    
    // Add animation data
    glow.userData = {
      animate: time => {
        glow.material.uniforms.time.value = time;
      }
    };
    
    galaxy.add(glow);
  },
  
  /**
   * Create central moderation hub
   */
  createCentralHub() {
    // Create central platform
    const platform = this.createCentralPlatform();
    
    // Create holographic projections
    this.createHolographicProjections(platform);
    
    // Create floating control panels
    this.createControlPanels(platform);
    
    // Create data streams flowing to/from the hub
    this.createDataStreams(platform);
    
    // Add the platform to the universe
    this.universe.add(platform);
  },
  
  /**
   * Create the central platform for the hub
   * @returns {THREE.Group} - The platform group
   */
  createCentralPlatform() {
    // Create a group for the central hub
    const platform = new THREE.Group();
    
    // Create base for the platform
    const baseGeometry = new THREE.CylinderGeometry(30, 35, 5, 32);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x333355,
      emissive: 0x222233,
      specular: 0x8888ff,
      shininess: 30,
      transparent: true,
      opacity: 0.9
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -2.5;
    platform.add(base);
    
    // Add glowing ring around the base
    const ringGeometry = new THREE.TorusGeometry(32.5, 0.5, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x6633ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0;
    
    ring.userData = {
      originalColor: new THREE.Color(0x6633ff),
      pulseSpeed: 0.005,
      animate: time => {
        const pulse = 0.7 + 0.3 * Math.sin(time * ring.userData.pulseSpeed);
        const color = ring.userData.originalColor.clone();
        color.r *= pulse;
        color.g *= pulse;
        color.b *= pulse;
        ring.material.color.copy(color);
      }
    };
    
    platform.add(ring);
    
    // Add grid pattern on the platform
    const gridGeometry = new THREE.PlaneGeometry(60, 60);
    const gridMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      map: this.createGridTexture()
    });
    
    const grid = new THREE.Mesh(gridGeometry, gridMaterial);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = 0.01;
    platform.add(grid);
    
    // Add central pillar
    const pillarGeometry = new THREE.CylinderGeometry(1.5, 1.5, 30, 16);
    const pillarMaterial = new THREE.MeshPhongMaterial({
      color: 0x222233,
      emissive: 0x111122,
      transparent: true,
      opacity: 0.8
    });
    
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.y = 15;
    platform.add(pillar);
    
    // Add glowing energy core in the pillar
    const coreGeometry = new THREE.CylinderGeometry(0.6, 0.6, 20, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x33aaff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 15;
    
    core.userData = {
      originalColor: new THREE.Color(0x33aaff),
      pulseSpeed: 0.01,
      animate: time => {
        const pulse = 0.7 + 0.3 * Math.sin(time * core.userData.pulseSpeed);
        const color = core.userData.originalColor.clone();
        color.r *= pulse;
        color.g *= pulse;
        color.b *= pulse;
        core.material.color.copy(color);
      }
    };
    
    platform.add(core);
    
    return platform;
  },
  
  /**
   * Create grid texture for the platform
   * @returns {THREE.Texture} - The generated texture
   */
  createGridTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    // Clear canvas
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, size, size);
    
    // Draw grid lines
    context.strokeStyle = 'rgba(100, 100, 255, 0.6)';
    context.lineWidth = 1;
    
    // Major grid lines
    const majorSpacing = size / 8;
    
    context.beginPath();
    
    for (let i = 0; i <= 8; i++) {
      const pos = i * majorSpacing;
      
      // Horizontal line
      context.moveTo(0, pos);
      context.lineTo(size, pos);
      
      // Vertical line
      context.moveTo(pos, 0);
      context.lineTo(pos, size);
    }
    
    context.stroke();
    
    // Minor grid lines
    context.strokeStyle = 'rgba(100, 100, 255, 0.3)';
    context.lineWidth = 0.5;
    
    const minorSpacing = majorSpacing / 4;
    
    context.beginPath();
    
    for (let i = 0; i <= 32; i++) {
      if (i % 4 === 0) continue; // Skip major lines
      
      const pos = i * minorSpacing;
      
      // Horizontal line
      context.moveTo(0, pos);
      context.lineTo(size, pos);
      
      // Vertical line
      context.moveTo(pos, 0);
      context.lineTo(pos, size);
    }
    
    context.stroke();
    
    // Draw center
    context.strokeStyle = 'rgba(100, 150, 255, 0.8)';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(size/2, size/2, majorSpacing/2, 0, Math.PI * 2);
    context.stroke();
    
    // Add radial gradient overlay
    const gradient = context.createRadialGradient(
      size/2, size/2, 0,
      size/2, size/2, size/2
    );
    
    gradient.addColorStop(0, 'rgba(100, 150, 255, 0.2)');
    gradient.addColorStop(0.5, 'rgba(100, 150, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    
    return texture;
  },
  
  /**
   * Create holographic projections above the platform
   * @param {THREE.Group} platform - The platform to add projections to
   */
  createHolographicProjections(platform) {
    // Create a group for the projections
    const projections = new THREE.Group();
    projections.position.y = 20;
    platform.add(projections);
    
    // Add a central holographic sphere
    const sphereGeometry = new THREE.SphereGeometry(8, 64, 32);
    
    // Create custom material for holographic effect
    const sphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x3366ff) },
        opacity: { value: 0.7 }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float opacity;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
          // Base holographic color
          vec3 baseColor = color;
          
          // Add scan lines
          float scanLine = sin(vUv.y * 50.0 + time) * 0.05 + 0.95;
          
          // Add edge highlighting
          float edgeHighlight = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          
          // Add noise pattern
          float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233) * time * 0.1)) * 43758.5453) * 0.1 + 0.9;
          
          // Add radial pattern
          float radius = length(vPosition.xz) / 8.0;
          float radialPattern = abs(sin(radius * 6.0 - time * 0.5)) * 0.5 + 0.5;
          
          // Combine effects
          vec3 finalColor = baseColor * scanLine * noise * (1.0 + edgeHighlight * 0.5) * radialPattern;
          
          // Transparency based on height
          float heightGradient = smoothstep(0.0, 1.0, (vPosition.y + 8.0) / 16.0);
          float alpha = opacity * heightGradient * (0.8 + edgeHighlight * 0.2);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    sphere.userData = {
      animate: time => {
        sphere.material.uniforms.time.value = time;
        sphere.rotation.y = time * 0.1;
      }
    };
    
    projections.add(sphere);
    
    // Add orbiting information panels
    const panelCount = 5;
    
    for (let i = 0; i < panelCount; i++) {
      const panel = this.createInfoPanel(i);
      
      // Position in orbit
      const angle = (i / panelCount) * Math.PI * 2;
      const radius = 15;
      
      panel.position.x = Math.cos(angle) * radius;
      panel.position.z = Math.sin(angle) * radius;
      panel.position.y = Math.sin(i * 1.5) * 2; // Vary height
      
      // Look at center
      panel.lookAt(0, panel.position.y, 0);
      
      // Add animation data
      panel.userData = {
        index: i,
        orbit: {
          angle,
          radius,
          speed: 0.1 + Math.random() * 0.1,
          height: panel.position.y
        },
        animate: time => {
          const orbit = panel.userData.orbit;
          const adjustedAngle = orbit.angle + time * orbit.speed * 0.05;
          
          panel.position.x = Math.cos(adjustedAngle) * orbit.radius;
          panel.position.z = Math.sin(adjustedAngle) * orbit.radius;
          panel.position.y = orbit.height + Math.sin(time * 0.3 + i) * 0.5;
          
          panel.lookAt(0, panel.position.y, 0);
        }
      };
      
      projections.add(panel);
    }
    
    // Add connecting lines between panels
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x3366ff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    
    for (let i = 0; i < panelCount; i++) {
      const points = [];
      points.push(new THREE.Vector3(0, 0, 0)); // Center
      points.push(projections.children[i + 1].position); // Panel
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      
      line.userData = {
        targetIndex: i + 1,
        animate: time => {
          const target = projections.children[line.userData.targetIndex];
          const positions = line.geometry.attributes.position.array;
          
          positions[3] = target.position.x;
          positions[4] = target.position.y;
          positions[5] = target.position.z;
          
          line.geometry.attributes.position.needsUpdate = true;
        }
      };
      
      projections.add(line);
    }
  },
  
  /**
   * Create an information panel
   * @param {number} index - Index of the panel
   * @returns {THREE.Mesh} - The panel mesh
   */
  createInfoPanel(index) {
    // Create panel geometry
    const width = 5;
    const height = 3;
    const panelGeometry = new THREE.PlaneGeometry(width, height);
    
    // Create texture for the panel
    const texture = this.createInfoPanelTexture(index);
    
    // Create material
    const panelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    
    // Create mesh
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    
    return panel;
  },
  
  /**
   * Create texture for an information panel
   * @param {number} index - Index of the panel
   * @returns {THREE.Texture} - The generated texture
   */
  createInfoPanelTexture(index) {
    const width = 512;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    
    // Clear with transparent background
    context.clearRect(0, 0, width, height);
    
    // Panel types based on index
    const panelTypes = [
      { title: 'SERVER STATS', color: '#4466ff', icon: '📊' },
      { title: 'USER ACTIVITY', color: '#ff6644', icon: '👥' },
      { title: 'MODERATOR ACTIONS', color: '#44ff66', icon: '🛡️' },
      { title: 'AUTOMATION STATUS', color: '#ff66ee', icon: '⚙️' },
      { title: 'SECURITY ALERTS', color: '#ffaa44', icon: '⚠️' }
    ];
    
    const panel = panelTypes[index % panelTypes.length];
    
    // Draw panel background
    context.fillStyle = 'rgba(5, 20, 50, 0.7)';
    context.fillRect(0, 0, width, height);
    
    // Draw border
    context.strokeStyle = panel.color;
    context.lineWidth = 4;
    context.strokeRect(4, 4, width - 8, height - 8);
    
    // Add header
    const gradient = context.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, panel.color);
    gradient.addColorStop(1, 'rgba(40, 40, 80, 0.7)');
    
    context.fillStyle = gradient;
    context.fillRect(4, 4, width - 8, 40);
    
    // Add title
    context.font = 'bold 24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(panel.title, width / 2, 24);
    
    // Add icon
    context.font = '32px Arial';
    context.fillText(panel.icon, 30, 24);
    
    // Add data lines
    context.font = '18px monospace';
    context.textAlign = 'left';
    context.fillStyle = 'rgba(160, 200, 255, 0.9)';
    
    const yStart = 60;
    const lineHeight = 24;
    
    // Different data for each panel type
    let data = [];
    
    switch (panel.title) {
      case 'SERVER STATS':
        data = [
          'Members: 3,458',
          'Channels: 42',
          'Roles: 16',
          'Messages/day: 8.7k',
          'Server age: 267 days',
          'Active users: 78%'
        ];
        break;
        
      case 'USER ACTIVITY':
        data = [
          'Peak hours: 18:00-22:00',
          'Most active: #general',
          'Voice chat: 14 users',
          'New joins: 23 today',
          'Retention: 92%',
          'Engagement: High'
        ];
        break;
        
      case 'MODERATOR ACTIONS':
        data = [
          'Bans: 17 active',
          'Warnings: 42 active',
          'Mutes: 3 active',
          'Message deletions: 126',
          'Channel locks: 0',
          'Escalations: 2'
        ];
        break;
        
      case 'AUTOMATION STATUS':
        data = [
          'Auto-mod: ACTIVE',
          'Anti-spam: ENABLED',
          'Content filter: MEDIUM',
          'Verification: ACTIVE',
          'Welcome system: ON',
          'Logging: VERBOSE'
        ];
        break;
        
      case 'SECURITY ALERTS':
        data = [
          'Raid protection: ACTIVE',
          'Threat level: LOW',
          'Unusual activity: NONE',
          'Permissions: SECURE',
          'Integration risks: NONE',
          'Last scan: 17m ago'
        ];
        break;
    }
    
    // Draw data lines
    for (let i = 0; i < data.length; i++) {
      context.fillText(data[i], 20, yStart + i * lineHeight);
    }
    
    // Add scan lines
    context.fillStyle = 'rgba(100, 150, 255, 0.05)';
    for (let y = 0; y < height; y += 4) {
      context.fillRect(0, y, width, 1);
    }
    
    // Add some random data noise elements
    context.fillStyle = 'rgba(100, 150, 255, 0.4)';
    context.font = '10px monospace';
    
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      
      if (y < 40 || y > yStart + data.length * lineHeight) {
        const text = Math.random().toString(16).substring(2, 6);
        context.fillText(text, x, y);
      }
    }
    
    // Add pulsing status indicator in the corner
    context.beginPath();
    context.arc(width - 15, 15, 6, 0, Math.PI * 2);
    context.fillStyle = panel.color;
    context.fill();
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  },
  
  /**
   * Create floating control panels around the platform
   * @param {THREE.Group} platform - The platform to add panels to
   */
  createControlPanels(platform) {
    // Create panels at different positions around platform
    const positions = [
      { x: 25, y: 8, z: 0, rotY: -Math.PI / 2 },
      { x: -25, y: 8, z: 0, rotY: Math.PI / 2 },
      { x: 0, y: 8, z: 25, rotY: Math.PI },
      { x: 0, y: 8, z: -25, rotY: 0 }
    ];
    
    // Panel types
    const panelTypes = [
      'Ban Management',
      'User Statistics',
      'Filter Settings',
      'Server Controls'
    ];
    
    // Create each panel
    positions.forEach((pos, i) => {
      const panel = this.createControlPanel(panelTypes[i], i);
      
      panel.position.set(pos.x, pos.y, pos.z);
      panel.rotation.y = pos.rotY;
      
      // Add animation data
      panel.userData = {
        originalPosition: new THREE.Vector3(pos.x, pos.y, pos.z),
        floatParams: {
          amplitude: 0.5,
          speed: 0.5 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2
        },
        animate: time => {
          // Gentle floating motion
          const floatParams = panel.userData.floatParams;
          panel.position.y = pos.y + 
            Math.sin(time * floatParams.speed * 0.1 + floatParams.phase) * 
            floatParams.amplitude;
        }
      };
      
      platform.add(panel);
    });
  },
  
  /**
   * Create a control panel
   * @param {string} type - Type of panel
   * @param {number} index - Index of the panel
   * @returns {THREE.Group} - The panel group
   */
  createControlPanel(type, index) {
    // Create panel group
    const panel = new THREE.Group();
    
    // Base panel
    const panelWidth = 10;
    const panelHeight = 6;
    
    const baseGeometry = new THREE.BoxGeometry(panelWidth, panelHeight, 0.2);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x222244,
      emissive: 0x111122,
      transparent: true,
      opacity: 0.9
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    panel.add(base);
    
    // Screen display
    const screenGeometry = new THREE.PlaneGeometry(panelWidth - 0.5, panelHeight - 0.5);
    
    // Create texture for the screen
    const texture = this.createControlPanelTexture(type, index);
    
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.z = 0.12;
    panel.add(screen);
    
    // Add light strip at the top
    const stripGeometry = new THREE.BoxGeometry(panelWidth, 0.2, 0.3);
    const stripMaterial = new THREE.MeshBasicMaterial({
      color: this.getPanelColor(index),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const strip = new THREE.Mesh(stripGeometry, stripMaterial);
    strip.position.set(0, panelHeight / 2 + 0.1, 0);
    
    strip.userData = {
      originalColor: this.getPanelColor(index),
      pulseSpeed: 0.01 + index * 0.005,
      animate: time => {
        const pulse = 0.8 + Math.sin(time * strip.userData.pulseSpeed) * 0.2;
        const color = strip.userData.originalColor.clone();
        color.r *= pulse;
        color.g *= pulse;
        color.b *= pulse;
        strip.material.color.copy(color);
      }
    };
    
    panel.add(strip);
    
    return panel;
  },
  
  /**
   * Get color for a panel based on index
   * @param {number} index - Index of the panel
   * @returns {THREE.Color} - Color for the panel
   */
  getPanelColor(index) {
    const colors = [
      new THREE.Color(0xff3366), // Red
      new THREE.Color(0x33ccff), // Blue
      new THREE.Color(0x66ff99), // Green
      new THREE.Color(0xff9933)  // Orange
    ];
    
    return colors[index % colors.length];
  },
  
  /**
   * Create texture for a control panel
   * @param {string} type - Type of panel
   * @param {number} index - Index of the panel
   * @returns {THREE.Texture} - The generated texture
   */
  createControlPanelTexture(type, index) {
    const width = 512;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    
    // Clear canvas
    context.clearRect(0, 0, width, height);
    
    // Fill background
    context.fillStyle = 'rgba(20, 20, 40, 0.7)';
    context.fillRect(0, 0, width, height);
    
    // Header
    const color = this.getPanelColorString(index);
    context.fillStyle = color;
    context.fillRect(0, 0, width, 40);
    
    // Header text
    context.fillStyle = 'white';
    context.font = 'bold 22px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(type.toUpperCase(), width / 2, 20);
    
    // Content based on panel type
    switch (type) {
      case 'Ban Management':
        this.drawBanManagementPanel(context, width, height);
        break;
      case 'User Statistics':
        this.drawUserStatsPanel(context, width, height);
        break;
      case 'Filter Settings':
        this.drawFilterSettingsPanel(context, width, height);
        break;
      case 'Server Controls':
        this.drawServerControlsPanel(context, width, height);
        break;
    }
    
    // Add scan lines
    context.globalAlpha = 0.05;
    context.fillStyle = 'white';
    for (let y = 0; y < height; y += 4) {
      context.fillRect(0, y, width, 1);
    }
    context.globalAlpha = 1;
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  },
  
  /**
   * Get panel color as CSS string
   * @param {number} index - Index of the panel
   * @returns {string} - CSS color string
   */
  getPanelColorString(index) {
    const color = this.getPanelColor(index);
    return `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, 0.8)`;
  },
  
  /**
   * Draw ban management panel content
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  drawBanManagementPanel(ctx, width, height) {
    // Table header
    ctx.fillStyle = 'rgba(100, 100, 150, 0.2)';
    ctx.fillRect(10, 50, width - 20, 30);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    ctx.fillText('USER', 20, 65);
    ctx.fillText('REASON', 150, 65);
    ctx.fillText('DATE', 310, 65);
    ctx.fillText('ACTION', 420, 65);
    
    // Table rows
    ctx.font = '14px Arial';
    
    const users = [
      { name: 'SpamBot#1234', reason: 'Spam', date: '2d ago' },
      { name: 'Toxic_User', reason: 'Harassment', date: '1w ago' },
      { name: 'Hacker123', reason: 'Security Threat', date: '3h ago' },
      { name: 'BadActor', reason: 'Content Policy', date: '5d ago' },
      { name: 'RaidLeader', reason: 'Raid Attempt', date: 'Just now' }
    ];
    
    users.forEach((user, i) => {
      const y = 90 + i * 30;
      
      // Alternating row colors
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(100, 100, 150, 0.1)';
        ctx.fillRect(10, y - 10, width - 20, 30);
      }
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(user.name, 20, y);
      ctx.fillText(user.reason, 150, y);
      ctx.fillText(user.date, 310, y);
      
      // Action button
      ctx.fillStyle = 'rgba(255, 80, 80, 0.7)';
      ctx.fillRect(420, y - 8, 60, 20);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('UNBAN', 450, y + 2);
      ctx.textAlign = 'left';
      ctx.font = '14px Arial';
    });
    
    // Status indicator
    ctx.fillStyle = 'rgba(255, 80, 80, 0.2)';
    ctx.fillRect(10, height - 40, width - 20, 30);
    
    ctx.fillStyle = 'rgba(255, 80, 80, 0.9)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('17 ACTIVE BANS · 3 NEW TODAY', width / 2, height - 25);
  },
  
  /**
   * Draw user statistics panel content
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  drawUserStatsPanel(ctx, width, height) {
    // Draw chart background
    ctx.fillStyle = 'rgba(100, 100, 150, 0.1)';
    ctx.fillRect(10, 50, width - 20, 120);
    
    // Draw chart grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let y = 0; y <= 100; y += 20) {
      const yPos = 170 - y;
      ctx.beginPath();
      ctx.moveTo(10, yPos);
      ctx.lineTo(width - 10, yPos);
      ctx.stroke();
    }
    
    // Chart data - user activity
    ctx.strokeStyle = 'rgba(51, 204, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const activityData = [30, 45, 60, 75, 62, 80, 70, 90, 85, 78];
    
    for (let i = 0; i < activityData.length; i++) {
      const x = 10 + (i / (activityData.length - 1)) * (width - 20);
      const y = 170 - activityData[i];
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Fill under the line
    ctx.lineTo(width - 10, 170);
    ctx.lineTo(10, 170);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 50, 0, 170);
    gradient.addColorStop(0, 'rgba(51, 204, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(51, 204, 255, 0.0)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Chart legend
    ctx.fillStyle = 'rgba(51, 204, 255, 0.8)';
    ctx.fillRect(10, 180, 10, 10);
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('User Activity (24h)', 30, 187);
    
    // Stats summary
    ctx.fillStyle = 'rgba(100, 100, 150, 0.1)';
    ctx.fillRect(10, 200, width - 20, 30);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('3,458 MEMBERS · 78% ACTIVE · 23 NEW TODAY', width / 2, 220);
  },
  
  /**
   * Draw filter settings panel content
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  drawFilterSettingsPanel(ctx, width, height) {
    // Settings groups
    const settings = [
      { name: 'Profanity Filter', state: 'MEDIUM', enabled: true },
      { name: 'Link Protection', state: 'STRICT', enabled: true },
      { name: 'Spam Detection', state: 'HIGH', enabled: true },
      { name: 'Media Scanning', state: 'LOW', enabled: false },
      { name: 'Raid Protection', state: 'ACTIVE', enabled: true }
    ];
    
    settings.forEach((setting, i) => {
      const y = 60 + i * 35;
      
      // Setting row
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(100, 100, 150, 0.1)';
        ctx.fillRect(10, y - 15, width - 20, 30);
      }
      
      // Setting name
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(setting.name, 20, y);
      
      // Setting state
      ctx.fillStyle = setting.enabled ? 'rgba(100, 255, 100, 0.9)' : 'rgba(255, 100, 100, 0.9)';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(setting.state, 350, y);
      
      // Toggle switch
      ctx.fillStyle = setting.enabled ? 'rgba(100, 255, 100, 0.3)' : 'rgba(255, 100, 100, 0.3)';
      ctx.fillRect(420, y - 10, 60, 20);
      
      ctx.fillStyle = setting.enabled ? 'rgba(100, 255, 100, 0.9)' : 'rgba(255, 100, 100, 0.9)';
      ctx.beginPath();
      ctx.arc(setting.enabled ? 470 : 430, y, 10, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Status summary
    ctx.fillStyle = 'rgba(100, 255, 100, 0.1)';
    ctx.fillRect(10, height - 40, width - 20, 30);
    
    ctx.fillStyle = 'rgba(100, 255, 100, 0.9)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AUTOMOD ACTIVE · 126 ACTIONS TODAY', width / 2, height - 25);
  },
  
  /**
   * Draw server controls panel content
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  drawServerControlsPanel(ctx, width, height) {
    // Action buttons
    const actions = [
      { name: 'LOCKDOWN', color: 'rgba(255, 80, 80, 0.7)', icon: '🔒' },
      { name: 'VERIFICATION', color: 'rgba(80, 180, 255, 0.7)', icon: '✓' },
      { name: 'SLOW MODE', color: 'rgba(255, 180, 80, 0.7)', icon: '⏱' },
      { name: 'MEMBER SCAN', color: 'rgba(80, 255, 180, 0.7)', icon: '👥' }
    ];
    
    actions.forEach((action, i) => {
      const y = 70 + i * 40;
      
      // Button background
      ctx.fillStyle = action.color;
      ctx.fillRect(20, y - 15, width - 40, 30);
      
      // Button text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${action.icon} ${action.name}`, width / 2, y);
    });
    
    // Status indicator
    ctx.fillStyle = 'rgba(100, 255, 100, 0.1)';
    ctx.fillRect(10, height - 40, width - 20, 30);
    
    ctx.fillStyle = 'rgba(100, 255, 100, 0.9)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ALL SYSTEMS NORMAL · MONITOR ACTIVE', width / 2, height - 25);
  },
  
  /**
   * Create data streams flowing to/from the hub
   * @param {THREE.Group} platform - The platform to add streams to
   */
  createDataStreams(platform) {
    // Create paths for data to flow
    const paths = [
      // Radial paths from center to edge
      { from: new THREE.Vector3(0, 10, 0), to: new THREE.Vector3(30, 10, 0), color: 0x33aaff },
      { from: new THREE.Vector3(0, 10, 0), to: new THREE.Vector3(-30, 10, 0), color: 0xff3366 },
      { from: new THREE.Vector3(0, 10, 0), to: new THREE.Vector3(0, 10, 30), color: 0x33dd77 },
      { from: new THREE.Vector3(0, 10, 0), to: new THREE.Vector3(0, 10, -30), color: 0xffaa33 },
      
      // Vertical paths
      { from: new THREE.Vector3(0, 0, 0), to: new THREE.Vector3(0, 30, 0), color: 0x9933ff }
    ];
    
    // Create data streams for each path
    paths.forEach(path => {
      this.createDataStream(platform, path.from, path.to, path.color);
    });
  },
  
  /**
   * Create a data stream between two points
   * @param {THREE.Group} parent - Parent group to add the stream to
   * @param {THREE.Vector3} from - Start position
   * @param {THREE.Vector3} to - End position
   * @param {number} color - Color of the stream
   */
  createDataStream(parent, from, to, color) {
    // Create curved path
    const points = [];
    const segments = 30;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      
      // Apply curve
      const midPoint = new THREE.Vector3().lerpVectors(from, to, 0.5);
      midPoint.y += 5; // Add some height in the middle
      
      const p1 = new THREE.Vector3().lerpVectors(from, midPoint, t);
      const p2 = new THREE.Vector3().lerpVectors(midPoint, to, t);
      const point = new THREE.Vector3().lerpVectors(p1, p2, t);
      
      points.push(point);
    }
    
    // Create tube along the path
    const tubeGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      segments,
      0.2,
      8,
      false
    );
    
    const tubeMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending
    });
    
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    parent.add(tube);
    
    // Create flowing particles along the path
    const particleCount = 30;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    // Initialize particles at random positions along the path
    for (let i = 0; i < particleCount; i++) {
      const pathPos = Math.random();
      const pathIndex = Math.floor(pathPos * points.length);
      const point = points[pathIndex];
      
      particlePositions[i * 3] = point.x;
      particlePositions[i * 3 + 1] = point.y;
      particlePositions[i * 3 + 2] = point.z;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: color,
      size: 0.8,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    
    // Store path data for animation
    particles.userData = {
      points: points,
      speeds: Array(particleCount).fill().map(() => 0.002 + Math.random() * 0.004),
      positions: Array(particleCount).fill().map(() => Math.random()),
      animate: time => {
        const positions = particles.geometry.attributes.position.array;
        
        for (let i = 0; i < particleCount; i++) {
          // Update position along path
          particles.userData.positions[i] += particles.userData.speeds[i];
          
          // Loop back to start when reaching the end
          if (particles.userData.positions[i] > 1) {
            particles.userData.positions[i] = 0;
          }
          
          // Calculate position on the path
          const pathPosition = particles.userData.positions[i];
          const pathIndex = Math.floor(pathPosition * (points.length - 1));
          const nextIndex = Math.min(pathIndex + 1, points.length - 1);
          const fraction = pathPosition * (points.length - 1) - pathIndex;
          
          const point = new THREE.Vector3().lerpVectors(
            points[pathIndex],
            points[nextIndex],
            fraction
          );
          
          // Update particle position
          positions[i * 3] = point.x;
          positions[i * 3 + 1] = point.y;
          positions[i * 3 + 2] = point.z;
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
      }
    };
    
    parent.add(particles);
  },
  
  /**
   * Create data clouds representing information clusters
   */
  createDataClouds() {
    // Create data spheres at various positions
    const positions = [
      { x: 80, y: 30, z: 80, size: 25, color: 0x3366ff },
      { x: -70, y: -20, z: 90, size: 35, color: 0xff6633 },
      { x: 90, y: -40, z: -60, size: 20, color: 0x33ff66 }
    ];
    
    positions.forEach(pos => {
      this.createDataCloud(
        new THREE.Vector3(pos.x, pos.y, pos.z),
        pos.size,
        pos.color
      );
    });
  },
  
  /**
   * Create a data cloud at the specified position
   * @param {THREE.Vector3} position - Position of the cloud
   * @param {number} size - Size of the cloud
   * @param {number} color - Base color of the cloud
   */
  createDataCloud(position, size, color) {
    // Create group for the data cloud
    const cloud = new THREE.Group();
    cloud.position.copy(position);
    
    // Create central sphere
    const sphereGeometry = new THREE.SphereGeometry(size * 0.3, 32, 16);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.5
    });
    
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    // Add animation data
    sphere.userData = {
      pulseSpeed: 0.5 + Math.random() * 0.5,
      animate: time => {
        // Pulsing effect
        const scale = 0.9 + Math.sin(time * sphere.userData.pulseSpeed * 0.1) * 0.1;
        sphere.scale.set(scale, scale, scale);
      }
    };
    
    cloud.add(sphere);
    
    // Create particle system around the sphere
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    
    // Base color
    const baseColor = new THREE.Color(color);
    
    // Create particles in a spherical cloud
    for (let i = 0; i < particleCount; i++) {
      // Random spherical coordinates
      const radius = size * (0.3 + Math.random() * 0.7);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Convert to Cartesian
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      // Set position
      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;
      
      // Vary color based on distance from center
      const distanceRatio = radius / size;
      const particleColor = baseColor.clone();
      
      // Fade color with distance
      particleColor.r *= 1 - distanceRatio * 0.5;
      particleColor.g *= 1 - distanceRatio * 0.5;
      particleColor.b *= 1 - distanceRatio * 0.5;
      
      // Set color
      particleColors[i * 3] = particleColor.r;
      particleColors[i * 3 + 1] = particleColor.g;
      particleColors[i * 3 + 2] = particleColor.b;
      
      // Set size (smaller at edges)
      particleSizes[i] = 2 * (1 - distanceRatio * 0.7);
    }
    
    // Set attributes
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    
    // Create material
    const particleMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create particle system
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    
    // Add animation data
    particles.userData = {
      originalPositions: particlePositions.slice(),
      velocities: Array(particleCount).fill().map(() => new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      )),
      animate: time => {
        const positions = particles.geometry.attributes.position.array;
        const original = particles.userData.originalPositions;
        
        for (let i = 0; i < particleCount; i++) {
          const index = i * 3;
          
          // Apply small random motion
          positions[index] += particles.userData.velocities[i].x;
          positions[index + 1] += particles.userData.velocities[i].y;
          positions[index + 2] += particles.userData.velocities[i].z;
          
          // Calculate distance from original position
          const dx = positions[index] - original[index];
          const dy = positions[index + 1] - original[index + 1];
          const dz = positions[index + 2] - original[index + 2];
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          // If too far, pull back toward original position
          if (distance > 2) {
            positions[index] -= dx * 0.05;
            positions[index + 1] -= dy * 0.05;
            positions[index + 2] -= dz * 0.05;
            
            // Also reduce velocity
            particles.userData.velocities[i].multiplyScalar(0.95);
          }
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
      }
    };
    
    cloud.add(particles);
    
    // Create connecting lines from center to several points
    const lineCount = 20;
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(lineCount * 6); // 2 points per line, 3 coords per point
    
    for (let i = 0; i < lineCount; i++) {
      // Start at center
      linePositions[i * 6] = 0;
      linePositions[i * 6 + 1] = 0;
      linePositions[i * 6 + 2] = 0;
      
      // End at random point
      const particleIndex = Math.floor(Math.random() * particleCount);
      linePositions[i * 6 + 3] = particlePositions[particleIndex * 3];
      linePositions[i * 6 + 4] = particlePositions[particleIndex * 3 + 1];
      linePositions[i * 6 + 5] = particlePositions[particleIndex * 3 + 2];
    }
    
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    
    const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending
    });
    
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    
    // Add animation data
    lines.userData = {
      originalPositions: linePositions.slice(),
      animate: time => {
        const positions = lines.geometry.attributes.position.array;
        
        for (let i = 0; i < lineCount; i++) {
          // Only animate end points (leave start points at center)
          const index = i * 6 + 3;
          
          // Get the original position
          const ox = lines.userData.originalPositions[index];
          const oy = lines.userData.originalPositions[index + 1];
          const oz = lines.userData.originalPositions[index + 2];
          
          // Apply subtle motion
          positions[index] = ox + Math.sin(time * 0.001 + i) * 0.5;
          positions[index + 1] = oy + Math.cos(time * 0.001 + i * 0.7) * 0.5;
          positions[index + 2] = oz + Math.sin(time * 0.001 + i * 1.3) * 0.5;
        }
        
        lines.geometry.attributes.position.needsUpdate = true;
      }
    };
    
    cloud.add(lines);
    
    // Add some rotation to the cloud
    cloud.userData = {
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.0001,
        y: (Math.random() - 0.5) * 0.0001,
        z: (Math.random() - 0.5) * 0.0001
      },
      animate: time => {
        cloud.rotation.x += cloud.userData.rotationSpeed.x;
        cloud.rotation.y += cloud.userData.rotationSpeed.y;
        cloud.rotation.z += cloud.userData.rotationSpeed.z;
      }
    };
    
    this.universe.add(cloud);
    this.dataClouds.push(cloud);
  },
  
  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Add resize listener
    window.addEventListener('resize', this.onResize.bind(this));
    
    // Add mouse interaction listeners
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('click', this.onMouseClick.bind(this));
    
    // Add keyboard listeners for camera control
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    
    // Add server selection change listener
    document.getElementById('serverSelect')?.addEventListener('change', event => {
      const serverId = event.target.value;
      if (serverId) {
        this.loadServerData(serverId);
      }
    });
  },
  
  /**
   * Handle window resize
   */
  onResize() {
    if (!this.camera || !this.renderer) return;
    
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
   * @param {MouseEvent} event - Mouse event
   */
  onMouseMove(event) {
    if (!this.raycaster) return;
    
    // Calculate mouse position in normalized device coordinates
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Find intersections
    const intersects = this.raycaster.intersectObjects(this.universe.children, true);
    
    // Reset hover state
    if (this.hoveredObject) {
      // Remove hover effect
      this.hoveredObject = null;
      this.container.style.cursor = 'default';
    }
    
    // Set hover state for intersected object
    if (intersects.length > 0) {
      const object = this.findInteractiveParent(intersects[0].object);
      if (object && object.userData && typeof object.userData.onHover === 'function') {
        this.hoveredObject = object;
        this.container.style.cursor = 'pointer';
        object.userData.onHover(true);
      }
    }
  },
  
  /**
   * Handle mouse click
   * @param {MouseEvent} event - Mouse event
   */
  onMouseClick(event) {
    if (!this.raycaster) return;
    
    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Find intersections
    const intersects = this.raycaster.intersectObjects(this.universe.children, true);
    
    // Handle click on intersected object
    if (intersects.length > 0) {
      const object = this.findInteractiveParent(intersects[0].object);
      if (object && object.userData && typeof object.userData.onClick === 'function') {
        object.userData.onClick();
      }
    }
  },
  
  /**
   * Handle keyboard input
   * @param {KeyboardEvent} event - Keyboard event
   */
  onKeyDown(event) {
    // Navigate with number keys
    if (event.key >= '1' && event.key <= '9') {
      const index = parseInt(event.key) - 1;
      if (index < this.navPoints.length) {
        this.navigateTo(index);
      }
    }
    
    // Arrow keys for manual navigation
    switch (event.key) {
      case 'ArrowLeft':
        this.camera.position.x -= 5;
        break;
      case 'ArrowRight':
        this.camera.position.x += 5;
        break;
      case 'ArrowUp':
        if (event.shiftKey) {
          this.camera.position.y += 5;
        } else {
          this.camera.position.z -= 5;
        }
        break;
      case 'ArrowDown':
        if (event.shiftKey) {
          this.camera.position.y -= 5;
        } else {
          this.camera.position.z += 5;
        }
        break;
    }
    
    // Update orbit controls target
    if (this.orbitControls) {
      this.orbitControls.update();
    }
  },
  
  /**
   * Find the parent object that has interactive properties
   * @param {THREE.Object3D} object - The intersected object
   * @returns {THREE.Object3D|null} - The interactive parent or null
   */
  findInteractiveParent(object) {
    let current = object;
    
    while (current) {
      if (current.userData && 
          (typeof current.userData.onHover === 'function' || 
           typeof current.userData.onClick === 'function')) {
        return current;
      }
      
      current = current.parent;
    }
    
    return null;
  },
  
  /**
   * Load server data for visualization
   * @param {string} serverId - Discord server ID
   */
  loadServerData(serverId) {
    console.log(`Loading server data for visualization: ${serverId}`);
    
    // Fetch server data
    fetch(`/admin3d/direct-bans/list/${serverId}`, {
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to load server data');
      return response.json();
    })
    .then(data => {
      console.log('Server data loaded:', data);
      this.serverData = data;
      
      // Update visualization
      this.updateServerDataVisualization();
    })
    .catch(error => {
      console.error('Error loading server data:', error);
    });
  },
  
  /**
   * Update visualization based on loaded server data
   */
  updateServerDataVisualization() {
    if (!this.serverData || !this.serverData.bans) return;
    
    // Update stats UI elements
    const banCount = this.serverData.bans.length;
    document.getElementById('totalBans').textContent = banCount;
    
    // Create visual representation of banned users
    this.createBannedUserVisualization();
  },
  
  /**
   * Create visual representation of banned users
   */
  createBannedUserVisualization() {
    // Clear existing black holes
    this.blackholes.forEach(blackhole => {
      this.universe.remove(blackhole);
    });
    this.blackholes = [];
    
    // No bans
    if (!this.serverData || !this.serverData.bans || this.serverData.bans.length === 0) {
      return;
    }
    
    // Create a group for black holes
    const blackholeGroup = new THREE.Group();
    this.universe.add(blackholeGroup);
    this.blackholes.push(blackholeGroup);
    
    // Position the group
    blackholeGroup.position.set(50, -30, -50);
    
    // Create black hole for each banned user
    const banCount = Math.min(this.serverData.bans.length, 30); // Limit for performance
    
    for (let i = 0; i < banCount; i++) {
      const ban = this.serverData.bans[i];
      
      // Calculate position in a spiral
      const angle = (i / banCount) * Math.PI * 4;
      const radius = 5 + (i / banCount) * 20;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (i / banCount) * 15 - 7.5;
      
      // Create black hole
      const blackhole = this.createBlackHole(ban, new THREE.Vector3(x, y, z));
      blackholeGroup.add(blackhole);
    }
  },
  
  /**
   * Create a black hole representing a banned user
   * @param {Object} ban - Ban data
   * @param {THREE.Vector3} position - Position
   * @returns {THREE.Group} - Black hole group
   */
  createBlackHole(ban, position) {
    const group = new THREE.Group();
    group.position.copy(position);
    
    // Create event horizon
    const horizonGeometry = new THREE.SphereGeometry(2, 32, 32);
    const horizonMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.8
    });
    
    const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
    group.add(horizon);
    
    // Create accretion disk
    const diskGeometry = new THREE.RingGeometry(2, 5, 32);
    const diskMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    const disk = new THREE.Mesh(diskGeometry, diskMaterial);
    disk.rotation.x = Math.PI / 2;
    group.add(disk);
    
    // Create glow effect
    const glowGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0xff3333) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.8 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(color, intensity * (0.8 + 0.2 * sin(time * 3.0)));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    // Add particle ring
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 3 + Math.random() * 3;
      
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff6666,
      size: 0.2,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);
    
    // Add animation data
    group.userData = {
      ban: ban,
      diskRotationSpeed: 0.01,
      particleRotationSpeed: 0.005,
      animate: time => {
        // Rotate disk
        disk.rotation.z += group.userData.diskRotationSpeed;
        
        // Rotate particles
        particles.rotation.y += group.userData.particleRotationSpeed;
        
        // Update glow effect
        glow.material.uniforms.time.value = time;
      }
    };
    
    return group;
  },
  
  /**
   * Main animation loop
   */
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    if (!this.isInitialized || !this.scene || !this.camera) {
      return;
    }
    
    // Get elapsed time
    const time = this.clock.getElapsedTime() * 1000;
    const delta = this.clock.getDelta();
    
    // Update orbit controls if available
    if (this.orbitControls) {
      this.orbitControls.update();
    }
    
    // Animate universe elements
    this.animateUniverse(time, delta);
    
    // Render the scene
    if (this.composer && this.composer.render) {
      this.composer.render();
    } else if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  },
  
  /**
   * Animate all universe elements
   * @param {number} time - Current time
   * @param {number} delta - Time delta
   */
  animateUniverse(time, delta) {
    // Helper function to animate a group of objects
    const animateGroup = (group) => {
      if (!group) return;
      
      group.forEach(obj => {
        if (obj && obj.userData && typeof obj.userData.animate === 'function') {
          obj.userData.animate(time, delta);
        }
      });
    };
    
    // Animate each group of objects
    animateGroup(this.galaxies);
    animateGroup(this.stars);
    animateGroup(this.nebulae);
    animateGroup(this.blackholes);
    animateGroup(this.dataClouds);
    animateGroup(this.wormholes);
    animateGroup(this.timelines);
    
    // Animate light sources
    this.scene.children.forEach(child => {
      if (child instanceof THREE.PointLight && child.userData && 
          typeof child.userData.animate === 'function') {
        child.userData.animate(time, delta);
      }
    });
    
    // Slightly rotate the entire universe for dynamic feel
    this.universe.rotation.y += delta * 0.02;
  }
};

// Initialize visualization when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if container exists
  if (document.getElementById('moderation-three-container')) {
    // Wait for THREE.js to load
    const checkThree = setInterval(() => {
      if (typeof THREE !== 'undefined') {
        clearInterval(checkThree);
        // Initialize visualization
        UniverseVisualization.init();
      }
    }, 100);
  }
});