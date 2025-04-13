/**
 * SWOOSH Bot 3D Ticket Management
 * Premium Edition - $55k Value Design
 * 
 * High-end 3D visualization for ticket management interface
 */

(function() {
  'use strict';

  // Main variables
  let camera, scene, renderer, composer;
  let ticketObjects = [];
  let orbitalRing;
  let controls;
  let raycaster, mouse;
  let currentlyIntersected = null;
  let tooltip = null;
  let animationStartTimestamp = Date.now();
  
  // Enterprise Premium Configuration - $55k Value - BLACK EDITION
  const CONFIG = {
    COLORS: {
      BACKGROUND: 0x000000,    // Black background
      RING: 0x333333,          // Dark ring
      RING_INNER: 0x444444,    // Inner ring highlight
      OPEN: 0x1a1a1a,          // Dark for open tickets
      OPEN_GLOW: 0x333333,     // Dark gray ticket glow
      CLOSED: 0x121212,        // Darker grey for closed tickets
      CLOSED_GLOW: 0x222222,   // Dark grey glow
      PRIORITY_HIGH: 0x333333, // High priority
      PRIORITY_MED: 0x222222,  // Medium priority
      GROUND: 0x050505,        // Almost black ground plane
      UI_HIGHLIGHT: 0x333333,  // UI highlight color
      HIGHLIGHT: 0x444444,     // Highlight color
    },
    ORBITAL_RADIUS: 5,
    TICKET_SIZE: 0.4,
    ROTATION_SPEED: 0.2,
    HOVER_SCALE: 1.25,
    ORBIT_HEIGHT: 1.5,
    ANIMATION: {
      FLOAT_SPEED: 0.8,       // Speed of floating animation
      FLOAT_INTENSITY: 0.12,  // Intensity of floating effect
      ROTATION_WOBBLE: 0.02,  // Slight wobble in rotation
      PULSE_SPEED: 1.5,       // Glow pulse speed
      TRAIL_LENGTH: 8,        // Length of particle trails
    },
    POST_PROCESSING: {
      BLOOM_STRENGTH: 0.65,
      BLOOM_RADIUS: 0.5,
      BLOOM_THRESHOLD: 0.7,
      DOF_ENABLED: true,      // Depth of field effect
      DOF_FOCUS: 6,           // Focus distance
      DOF_APERTURE: 0.003,    // Aperture (smaller = more blur)
    },
    CAMERA: {
      FOV: 55,                // Field of view
      NEAR: 0.1,              // Near clipping plane
      FAR: 1000,              // Far clipping plane
      POSITION: {
        X: 0, 
        Y: 3.2, 
        Z: 6.5
      },
      LOOK_AT: {
        X: 0,
        Y: 0.5,
        Z: 0
      },
      AUTO_ROTATE: true,      // Camera slowly rotates around scene
      ROTATE_SPEED: 0.05,     // Auto rotation speed
    },
    PARTICLES: {
      ENABLED: true,
      COUNT: 100,
      SIZE: 0.05,
      COLOR: 0x222222,
    }
  };

  // Initialize function - called when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Create tooltip element for hovering over tickets
    createTooltip();
    
    // Check if THREE.js is available and required DOM containers exist
    if (checkRequirements()) {
      console.log('Premium 3D Ticket System initializing...');
      initScene();
    } else {
      console.warn('Premium 3D Tickets: Requirements not met, falling back to standard view');
    }
  });

  // Check if all requirements are met to enable 3D visualization
  function checkRequirements() {
    // Check for THREE.js
    if (typeof THREE === 'undefined') {
      console.warn('THREE.js not loaded! Falling back to 2D mode.');
      
      // Try to load THREE.js dynamically if not available
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/three@0.151.0/build/three.min.js';
      script.onload = function() {
        console.log('THREE.js loaded successfully from ' + script.src);
        // Re-initialize once loaded
        initScene();
      };
      script.onerror = function() {
        console.warn('Failed to load THREE.js from ' + script.src);
      };
      document.head.appendChild(script);
      
      return false;
    }
    
    // Check for container element
    const container = document.getElementById('three-container');
    if (!container) {
      console.warn('Premium 3D Tickets: #three-container not found');
      return false;
    }
    
    return true;
  }

  // Create tooltip element for hovering over tickets
  // Create premium tooltip element for interactive ticket information
  function createTooltip() {
    tooltip = document.createElement('div');
    tooltip.className = 'ticket3d-tooltip premium-tooltip';
    tooltip.style.opacity = '0';
    tooltip.style.position = 'fixed';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '9999';
    tooltip.style.background = 'rgba(0, 0, 0, 0.85)';
    tooltip.style.borderRadius = '6px';
    tooltip.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)';
    tooltip.style.backdropFilter = 'blur(10px)';
    tooltip.style.border = '1px solid rgba(85, 85, 85, 0.2)';
    tooltip.style.padding = '12px 16px';
    tooltip.style.color = '#ffffff';
    tooltip.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    tooltip.style.transform = 'scale(0.95)';
    tooltip.style.minWidth = '220px';
    
    // Add custom style element for tooltip classes
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .premium-tooltip h4 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #fff;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 8px;
      }
      .premium-tooltip p {
        margin: 5px 0;
        font-size: 13px;
        display: flex;
        justify-content: space-between;
      }
      .premium-tooltip span.label {
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
        margin-right: 12px;
      }
      .premium-tooltip span.value {
        text-align: right;
        font-weight: 600;
      }
      .premium-tooltip .priority {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .premium-tooltip .priority-high {
        background: rgba(255, 82, 82, 0.2);
        color: #ff5252;
        border: 1px solid rgba(255, 82, 82, 0.3);
      }
      .premium-tooltip .priority-medium {
        background: rgba(255, 193, 7, 0.2);
        color: #ffc107;
        border: 1px solid rgba(255, 193, 7, 0.3);
      }
      .premium-tooltip .priority-normal {
        background: rgba(79, 195, 247, 0.2);
        color: #4fc3f7;
        border: 1px solid rgba(79, 195, 247, 0.3);
      }
      .premium-tooltip .status {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .premium-tooltip .status-open {
        background: rgba(0, 191, 154, 0.2);
        color: #00bf9a;
        border: 1px solid rgba(0, 191, 154, 0.3);
      }
      .premium-tooltip .status-closed {
        background: rgba(108, 117, 125, 0.2);
        color: #d6d6d6;
        border: 1px solid rgba(108, 117, 125, 0.3);
      }
    `;
    document.head.appendChild(styleElement);
    document.body.appendChild(tooltip);
  }

  // Initialize the THREE.js scene
  function initScene() {
    try {
      // Get references to DOM elements
      const threeContainer = document.getElementById('three-container');
      const loadingElement = document.querySelector('.ticket3d-loading');
      
      if (!threeContainer) {
        console.error('Could not find three-container element');
        return;
      }
      
      // Setup scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(CONFIG.COLORS.BACKGROUND);
      
      // Setup premium camera with container aspect ratio and enhanced settings
      const aspect = threeContainer.clientWidth / threeContainer.clientHeight;
      camera = new THREE.PerspectiveCamera(
        CONFIG.CAMERA.FOV || 60, 
        aspect, 
        CONFIG.CAMERA.NEAR || 0.1, 
        CONFIG.CAMERA.FAR || 1000
      );
      
      // Position camera for optimal enterprise viewing angle
      camera.position.set(
        CONFIG.CAMERA.POSITION.X || 0, 
        CONFIG.CAMERA.POSITION.Y || 3.2, 
        CONFIG.CAMERA.POSITION.Z || 6.5
      );
      
      // Set camera to look at center point
      camera.lookAt(
        CONFIG.CAMERA.LOOK_AT.X || 0,
        CONFIG.CAMERA.LOOK_AT.Y || 0.5,
        CONFIG.CAMERA.LOOK_AT.Z || 0
      );
      
      // Setup renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      
      // Clear and add renderer to container
      threeContainer.innerHTML = '';
      threeContainer.appendChild(renderer.domElement);
      
      // Hide loading spinner
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
      
      // Add lighting
      addLighting();
      
      // Create orbital ring
      createOrbitalRing();
      
      // Post-processing setup (if available)
      setupPostProcessing();
      
      // Raycaster for mouse interaction
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();
      
      // Add event listeners
      window.addEventListener('resize', onWindowResize);
      window.addEventListener('mousemove', onMouseMove);
      
      // Expose update function globally
      window.update3DTickets = updateTickets3D;
      
      // Start animation loop
      animate();
      
      // Initial update if tickets already exist
      if (window.allTickets && window.allTickets.length > 0) {
        updateTickets3D(window.allTickets);
      }
      
      console.log('Premium 3D Ticket System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize 3D scene:', error);
    }
  }

  // Add lighting to the scene
  function addLighting() {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    // Main directional light with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Point lights for accent lighting
    const purpleLight = new THREE.PointLight(CONFIG.COLORS.RING, 1, 10);
    purpleLight.position.set(3, 2, 3);
    scene.add(purpleLight);
    
    const blueLight = new THREE.PointLight(CONFIG.COLORS.OPEN, 1, 10);
    blueLight.position.set(-3, 2, 3);
    scene.add(blueLight);
  }

  // Setup post-processing effects for visual enhancement
  function setupPostProcessing() {
    try {
      // Check if required classes exist
      if (typeof THREE.EffectComposer === 'undefined' || 
          typeof THREE.RenderPass === 'undefined' || 
          typeof THREE.UnrealBloomPass === 'undefined') {
        console.warn('Post-processing libraries not available, using basic rendering');
        
        // We'll continue without post-processing effects
        // but will still have the basic 3D visualization
        return;
      }
      
      // Create composer
      composer = new THREE.EffectComposer(renderer);
      
      // Add render pass
      const renderPass = new THREE.RenderPass(scene, camera);
      composer.addPass(renderPass);
      
      // Add bloom pass with container dimensions
      const threeContainer = document.getElementById('three-container');
      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(
          threeContainer ? threeContainer.clientWidth : window.innerWidth, 
          threeContainer ? threeContainer.clientHeight : window.innerHeight
        ),
        0.6,   // strength
        0.5,   // radius
        0.7    // threshold
      );
      composer.addPass(bloomPass);
      
      console.log('Post-processing effects enabled');
    } catch (error) {
      console.warn('Failed to setup post-processing:', error);
      // Continue without post-processing
    }
  }

  // Create enterprise-grade orbital ring system for tickets to orbit around
  function createOrbitalRing() {
    // Create main ring geometry with higher resolution for premium look
    const ringGeometry = new THREE.TorusGeometry(
      CONFIG.ORBITAL_RADIUS,  // Radius
      0.05,                   // Tube size
      24,                     // Radial segments (increased)
      128                     // Tubular segments (increased)
    );
    
    // Create premium material with enhanced glow effect
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: CONFIG.COLORS.RING,
      emissive: CONFIG.COLORS.RING,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });
    
    // Create main orbital ring
    orbitalRing = new THREE.Mesh(ringGeometry, ringMaterial);
    orbitalRing.rotation.x = Math.PI / 2;  // Lay flat
    orbitalRing.castShadow = true;
    orbitalRing.receiveShadow = true;
    scene.add(orbitalRing);
    
    // Create inner highlight ring for premium effect
    const innerRingGeometry = new THREE.TorusGeometry(
      CONFIG.ORBITAL_RADIUS * 0.97,  // Slightly smaller
      0.02,                          // Thinner
      16,                            // Radial segments
      100                            // Tubular segments
    );
    
    const innerRingMaterial = new THREE.MeshStandardMaterial({
      color: CONFIG.COLORS.RING_INNER || CONFIG.COLORS.HIGHLIGHT,
      emissive: CONFIG.COLORS.RING_INNER || CONFIG.COLORS.HIGHLIGHT,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.7
    });
    
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRing.rotation.x = Math.PI / 2;
    scene.add(innerRing);
    
    // Add subtle glow particles around the ring for ultra-premium effect
    if (CONFIG.PARTICLES && CONFIG.PARTICLES.ENABLED) {
      try {
        addOrbitalParticles();
      } catch (error) {
        console.warn('Could not add premium particles:', error);
      }
    }
    
    // Create reflection plane beneath for premium look
    createReflectiveSurface();
  }
  
  // Add particle system for premium orbital effect
  function addOrbitalParticles() {
    const particleCount = CONFIG.PARTICLES.COUNT || 100;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    // Create particles in a toroidal distribution around the orbital ring
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = CONFIG.ORBITAL_RADIUS + (Math.random() * 0.4 - 0.2);
      
      particlePositions[i * 3] = Math.cos(angle) * radius;  // x
      particlePositions[i * 3 + 1] = (Math.random() * 0.3 - 0.15);  // y
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;  // z
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    // Create glowing particle material
    const particleMaterial = new THREE.PointsMaterial({
      color: CONFIG.PARTICLES.COLOR || CONFIG.COLORS.UI_HIGHLIGHT,
      size: CONFIG.PARTICLES.SIZE || 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    // Create particle system and add to scene
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
    
    // Add to ticket objects array for animation
    particleSystem.userData = {
      isParticleSystem: true
    };
    ticketObjects.push(particleSystem);
  }
  
  // Create reflective surface beneath the orbital ring
  function createReflectiveSurface() {
    // Create circular plane geometry
    const groundRadius = CONFIG.ORBITAL_RADIUS * 1.2;
    const groundGeometry = new THREE.CircleGeometry(groundRadius, 32);
    
    // Create reflective material
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: CONFIG.COLORS.GROUND,
      metalness: 0.8,
      roughness: 0.3,
      emissive: CONFIG.COLORS.GROUND,
      emissiveIntensity: 0.1
    });
    
    // Create ground plane and position it
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;  // Lay flat
    ground.position.y = -0.2;  // Slightly below the orbital ring
    ground.receiveShadow = true;
    
    scene.add(ground);
  }

  // Update 3D view with new ticket data
  function updateTickets3D(tickets) {
    if (!scene) return;
    
    // Remove existing ticket objects
    clearExistingTickets();
    
    // Create new ticket objects
    if (tickets && tickets.length > 0) {
      tickets.forEach((ticket, index) => {
        createTicket3D(ticket, index, tickets.length);
      });
    }
  }

  // Clear existing ticket objects from the scene
  function clearExistingTickets() {
    // Remove each ticket object from the scene
    ticketObjects.forEach(obj => {
      scene.remove(obj);
      
      // Clean up geometries and materials
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    
    // Clear the array
    ticketObjects = [];
  }

  // Create a premium 3D representation of a ticket with advanced effects
  function createTicket3D(ticket, index, total) {
    // Calculate position on orbital ring with premium spacing
    const angle = (index / total) * Math.PI * 2;
    const height = CONFIG.ORBIT_HEIGHT + (Math.random() * 0.4 - 0.2); // Slight height variation
    
    // Determine color based on status with enhanced glow colors
    let color, glowColor, priority;
    
    // Analyze ticket for priority level (Enterprise feature)
    priority = analyzePriority(ticket);
    
    // Set colors based on status and priority
    if (ticket.status === 'OPEN') {
      color = priority === 'high' ? 
              CONFIG.COLORS.PRIORITY_HIGH : 
              (priority === 'medium' ? 
                CONFIG.COLORS.PRIORITY_MED : 
                CONFIG.COLORS.OPEN);
      
      glowColor = priority === 'high' ? 
                  CONFIG.COLORS.PRIORITY_HIGH : 
                  (priority === 'medium' ? 
                    CONFIG.COLORS.PRIORITY_MED : 
                    CONFIG.COLORS.OPEN_GLOW || CONFIG.COLORS.OPEN);
    } else {
      color = CONFIG.COLORS.CLOSED;
      glowColor = CONFIG.COLORS.CLOSED_GLOW || CONFIG.COLORS.CLOSED;
    }
    
    // Create premium ticket mesh with enhanced geometry
    // Use rounded edges for a more polished look
    const geometry = new THREE.BoxGeometry(
      CONFIG.TICKET_SIZE * 1.4, 
      CONFIG.TICKET_SIZE * 0.8, 
      CONFIG.TICKET_SIZE * 0.1,
      5, 5, 2  // More segments for smoother edges
    );
    
    // Create advanced material with physically-based properties
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: glowColor,
      emissiveIntensity: 0.4,
      metalness: 0.85,
      roughness: 0.15,
      envMapIntensity: 1.0,
    });
    
    // Create mesh
    const ticketMesh = new THREE.Mesh(geometry, material);
    
    // Position on orbital ring
    ticketMesh.position.x = Math.cos(angle) * CONFIG.ORBITAL_RADIUS;
    ticketMesh.position.z = Math.sin(angle) * CONFIG.ORBITAL_RADIUS;
    ticketMesh.position.y = height;
    
    // Face center with slight tilt based on priority
    const lookAtPoint = new THREE.Vector3(0, height, 0);
    ticketMesh.lookAt(lookAtPoint);
    
    // Add slight rotation variation based on priority
    if (priority === 'high') {
      ticketMesh.rotation.z += 0.1; // Slight tilt for high priority
    }
    
    // Store data for animation
    ticketMesh.userData = {
      ticket: ticket,
      originalAngle: angle,
      originalHeight: height,
      originalScale: ticketMesh.scale.clone(),
      priority: priority,
      pulsePhase: Math.random() * Math.PI * 2, // Random phase for pulse animation
      wobblePhase: Math.random() * Math.PI * 2, // Random phase for wobble
    };
    
    // Add to scene and collection
    scene.add(ticketMesh);
    ticketObjects.push(ticketMesh);
    
    // Add premium text label
    addTicketText(ticketMesh, ticket.id, angle, priority);
    
    // Add ticket glow effect for premium visualization
    addTicketGlow(ticketMesh, glowColor, priority);
    
    return ticketMesh;
  }
  
  // Analyze ticket priority based on content, age, and status (AI simulation)
  function analyzePriority(ticket) {
    // Enterprise AI priority detection simulation
    // In a real $55k implementation, this would use natural language processing
    // and machine learning to determine priority
    
    try {
      // Check for high priority indicators
      if (ticket.type && ['urgent', 'critical', 'high', 'important'].some(
          term => ticket.type.toLowerCase().includes(term))) {
        return 'high';
      }
      
      // Check content for urgent terms (simulated)
      const urgentTerms = ['urgent', 'critical', 'emergency', 'immediate', 'asap'];
      if (ticket.content && urgentTerms.some(term => 
        ticket.content.toLowerCase().includes(term))) {
        return 'high';
      }
      
      // Check if ticket is older than 7 days but still open (simulated)
      if (ticket.createdAt && ticket.status === 'OPEN') {
        const created = new Date(ticket.createdAt);
        const now = new Date();
        const daysDiff = (now - created) / (1000 * 60 * 60 * 24);
        if (daysDiff > 7) {
          return 'medium';
        }
      }
      
      // Default priority
      return 'normal';
    } catch (error) {
      console.warn('Error analyzing ticket priority:', error);
      return 'normal';
    }
  }
  
  // Add glow effect to important tickets (premium feature)
  function addTicketGlow(ticketMesh, glowColor, priority) {
    try {
      // Don't add glow to normal priority closed tickets to reduce visual noise
      if (priority === 'normal' && ticketMesh.userData.ticket.status !== 'OPEN') {
        return;
      }
      
      // Create larger but transparent version of the ticket for glow effect
      const glowGeometry = new THREE.BoxGeometry(
        CONFIG.TICKET_SIZE * 1.5, 
        CONFIG.TICKET_SIZE * 0.9, 
        CONFIG.TICKET_SIZE * 0.15
      );
      
      // Create glow material
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: priority === 'high' ? 0.3 : 0.15,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      });
      
      // Create glow mesh
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.copy(ticketMesh.position);
      glowMesh.quaternion.copy(ticketMesh.quaternion);
      glowMesh.scale.multiplyScalar(1.2);
      
      // Add to scene and objects array for animation
      scene.add(glowMesh);
      
      // Store reference to the parent ticket for animation
      glowMesh.userData = {
        isGlow: true,
        parent: ticketMesh,
        originalOpacity: glowMaterial.opacity,
        priority: priority
      };
      
      ticketObjects.push(glowMesh);
    } catch (error) {
      console.warn('Failed to create premium glow effect:', error);
    }
  }

  // Add text label to a ticket
  function addTicketText(ticketMesh, id, angle) {
    try {
      // Create canvas for the text
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 128;
      
      // Set background transparent
      context.fillStyle = 'rgba(0,0,0,0)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw text
      context.font = 'Bold 40px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = '#ffffff';
      context.fillText(id, 128, 64);
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      
      // Create material with transparency
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      // Create text plane
      const textGeometry = new THREE.PlaneGeometry(
        CONFIG.TICKET_SIZE * 1.2, 
        CONFIG.TICKET_SIZE * 0.6
      );
      const textMesh = new THREE.Mesh(textGeometry, material);
      
      // Position slightly in front of ticket
      const offset = 0.06;
      textMesh.position.copy(ticketMesh.position);
      
      // Apply small offset in the local direction the ticket is facing
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(ticketMesh.quaternion);
      direction.normalize();
      
      textMesh.position.x += direction.x * offset;
      textMesh.position.y += direction.y * offset;
      textMesh.position.z += direction.z * offset;
      
      // Match rotation of ticket
      textMesh.quaternion.copy(ticketMesh.quaternion);
      
      // Add to scene and ticket objects
      scene.add(textMesh);
      ticketObjects.push(textMesh);
    } catch (error) {
      console.warn('Failed to create ticket label:', error);
    }
  }

  // Handle window resize
  function onWindowResize() {
    if (!camera || !renderer) return;
    
    // Get container element
    const threeContainer = document.getElementById('three-container');
    if (!threeContainer) return;
    
    // Update camera aspect ratio
    camera.aspect = threeContainer.clientWidth / threeContainer.clientHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    
    // Update composer if it exists
    if (composer) {
      composer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    }
  }

  // Handle mouse movement for interactive hover effect
  function onMouseMove(event) {
    // Get container element and its bounds
    const threeContainer = document.getElementById('three-container');
    if (!threeContainer) return;
    
    const rect = threeContainer.getBoundingClientRect();
    
    // Check if mouse is inside container
    if (
      event.clientX < rect.left || 
      event.clientX > rect.right || 
      event.clientY < rect.top || 
      event.clientY > rect.bottom
    ) {
      // Mouse is outside container
      if (currentlyIntersected) {
        // Reset and hide tooltip
        currentlyIntersected.scale.copy(currentlyIntersected.userData.originalScale);
        if (currentlyIntersected.material) {
          currentlyIntersected.material.emissiveIntensity = 0.3;
        }
        currentlyIntersected = null;
        hideTicketInfo();
      }
      return;
    }
    
    // Calculate mouse position in normalized device coordinates
    // relative to the container
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    mouse.x = x;
    mouse.y = y;
    
    // Update tooltip position
    updateTooltipPosition(event);
    
    // Raycasting is handled in the animation loop for performance
  }

  // Update the tooltip position to follow mouse
  function updateTooltipPosition(event) {
    if (!tooltip) return;
    
    tooltip.style.left = event.clientX + 'px';
    tooltip.style.top = event.clientY + 'px';
  }


  // Show ticket information in premium styled tooltip
  function showTicketInfo(ticketData) {
    if (!tooltip || !ticketData) return;
    
    // Format date
    const created = ticketData.createdAt ? 
                    new Date(ticketData.createdAt).toLocaleDateString() : 
                    'Unknown';
    
    // Analyze priority (re-use the same function from ticket creation)
    const priority = ticketData.priority || analyzePriority(ticketData);
    
    // Determine priority class
    const priorityClass = `priority priority-${priority}`;
    
    // Determine status class
    const statusClass = `status status-${ticketData.status?.toLowerCase() || 'unknown'}`;
    
    // Format time since creation (if date is available)
    let timeSince = 'Unknown';
    if (ticketData.createdAt) {
      const createdDate = new Date(ticketData.createdAt);
      const now = new Date();
      const diffMs = now - createdDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (diffDays > 0) {
        timeSince = `${diffDays}d ${diffHours}h ago`;
      } else {
        timeSince = `${diffHours}h ago`;
      }
    }
    
    // Set premium tooltip content with enhanced formatting
    tooltip.innerHTML = `
      <h4>Ticket #${ticketData.id}</h4>
      <p>
        <span class="label">Priority:</span>
        <span class="value"><span class="${priorityClass}">${priority}</span></span>
      </p>
      <p>
        <span class="label">Status:</span>
        <span class="value"><span class="${statusClass}">${ticketData.status || 'Unknown'}</span></span>
      </p>
      <p>
        <span class="label">User:</span>
        <span class="value">${ticketData.username || 'Unknown'}</span>
      </p>
      <p>
        <span class="label">Type:</span>
        <span class="value">${ticketData.type || 'General'}</span>
      </p>
      <p>
        <span class="label">Created:</span>
        <span class="value" title="${created}">${timeSince}</span>
      </p>
    `;
    
    // Show tooltip with premium animation
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'scale(1)';
  }

  // Hide ticket information tooltip
  // Hide ticket information tooltip with premium animation
  function hideTicketInfo() {
    if (!tooltip) return;
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'scale(0.95)';
  }

  // Enterprise-grade animation loop with premium effects
  function animate() {
    requestAnimationFrame(animate);
    
    // Calculate elapsed time for animation with precision timing
    const now = Date.now();
    const elapsedTime = (now - animationStartTimestamp) / 1000;
    
    // Rotate orbital ring with premium wobble effect
    if (orbitalRing) {
      orbitalRing.rotation.y = elapsedTime * 0.05;
      // Add subtle wobble to ring for premium organic feel
      orbitalRing.position.y = Math.sin(elapsedTime * 0.2) * 0.03;
    }
    
    // Auto-rotate camera if enabled for cinematic view
    if (CONFIG.CAMERA.AUTO_ROTATE) {
      const cameraAngle = elapsedTime * CONFIG.CAMERA.ROTATE_SPEED * 0.05;
      const cameraDistance = Math.sqrt(
        camera.position.x * camera.position.x + 
        camera.position.z * camera.position.z
      );
      
      camera.position.x = Math.sin(cameraAngle) * cameraDistance;
      camera.position.z = Math.cos(cameraAngle) * cameraDistance;
      
      // Keep camera looking at center point
      camera.lookAt(
        CONFIG.CAMERA.LOOK_AT.X || 0,
        CONFIG.CAMERA.LOOK_AT.Y || 0.5,
        CONFIG.CAMERA.LOOK_AT.Z || 0
      );
    }
    
    // Animate all objects including tickets, glows and particles
    ticketObjects.forEach(obj => {
      // Handle different object types
      if (obj.userData.isParticleSystem) {
        // Animate particle system
        animateParticles(obj, elapsedTime);
      } else if (obj.userData.isGlow) {
        // Animate glow effect
        animateGlowEffect(obj, elapsedTime);
      } else if (obj.userData && obj.userData.originalAngle) {
        // Animate main ticket objects
        animateTicket(obj, elapsedTime);
      }
    });
    
    // Handle raycasting for interactive effects
    handleRaycasting();
    
    // Render scene with composer if available, otherwise use standard renderer
    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }
  
  // Premium animation for particle system
  function animateParticles(particleSystem, elapsedTime) {
    if (!particleSystem.geometry || !particleSystem.geometry.attributes.position) return;
    
    const positions = particleSystem.geometry.attributes.position.array;
    const count = positions.length / 3;
    
    // Apply dynamic animation to particle positions
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      // Calculate distance from center
      const dist = Math.sqrt(x*x + z*z);
      
      // Calculate angle from position
      const angle = Math.atan2(z, x);
      
      // Add slight orbit movement
      const newAngle = angle + (0.05 * elapsedTime) / (dist * 2);
      
      // Adjust positions with slight random movement for organic feel
      positions[i3] = Math.cos(newAngle) * dist;
      positions[i3 + 1] = y + Math.sin(elapsedTime * 0.5 + i * 0.2) * 0.02;
      positions[i3 + 2] = Math.sin(newAngle) * dist;
    }
    
    // Update geometry
    particleSystem.geometry.attributes.position.needsUpdate = true;
  }
  
  // Premium animation for glow effects
  function animateGlowEffect(glowObj, elapsedTime) {
    // Skip if no parent reference
    if (!glowObj.userData || !glowObj.userData.parent) return;
    
    // Get parent ticket for reference
    const parentTicket = glowObj.userData.parent;
    
    // Match parent position
    glowObj.position.copy(parentTicket.position);
    glowObj.quaternion.copy(parentTicket.quaternion);
    
    // Add scale pulsing for high priority tickets
    if (glowObj.userData.priority === 'high') {
      const pulseSpeed = CONFIG.ANIMATION.PULSE_SPEED || 1.5;
      const pulseFactor = 1 + Math.sin(elapsedTime * pulseSpeed) * 0.1;
      glowObj.scale.set(pulseFactor, pulseFactor, pulseFactor);
      
      // Adjust opacity for breathing effect
      if (glowObj.material) {
        glowObj.material.opacity = glowObj.userData.originalOpacity * 
                                  (0.8 + Math.sin(elapsedTime * pulseSpeed) * 0.2);
      }
    }
  }
  
  // Premium animation for ticket objects
  function animateTicket(ticketObj, elapsedTime) {
    // Skip objects without proper userData
    if (!ticketObj.userData || !ticketObj.userData.originalAngle) return;
    
    // Get animation configuration
    const floatSpeed = CONFIG.ANIMATION.FLOAT_SPEED || 0.8;
    const floatIntensity = CONFIG.ANIMATION.FLOAT_INTENSITY || 0.12;
    const wobbleIntensity = CONFIG.ANIMATION.ROTATION_WOBBLE || 0.02;
    
    // Get ticket priority for premium effects
    const priority = ticketObj.userData.priority || 'normal';
    const priorityMultiplier = priority === 'high' ? 1.5 : 
                              (priority === 'medium' ? 1.2 : 1.0);
    
    // Calculate new position based on original angle and elapsed time
    const speed = CONFIG.ROTATION_SPEED * 
                 (ticketObj.userData.ticket.status === 'OPEN' ? 1 : 0.7); // Slower for closed tickets
    
    const angle = ticketObj.userData.originalAngle + (elapsedTime * speed);
    ticketObj.position.x = Math.cos(angle) * CONFIG.ORBITAL_RADIUS;
    ticketObj.position.z = Math.sin(angle) * CONFIG.ORBITAL_RADIUS;
    
    // Add enhanced floating animation with ticket-specific phase
    const phase = ticketObj.userData.pulsePhase || 0;
    ticketObj.position.y = ticketObj.userData.originalHeight + 
                          (Math.sin(elapsedTime * floatSpeed + phase) * 
                           floatIntensity * priorityMultiplier);
    
    // Add subtle wobble to rotation based on priority
    if (priority !== 'normal' && ticketObj.userData.wobblePhase) {
      const wobblePhase = ticketObj.userData.wobblePhase;
      ticketObj.rotation.z = Math.sin(elapsedTime * floatSpeed * 0.5 + wobblePhase) * 
                            wobbleIntensity * priorityMultiplier;
    }
    
    // Face center with adjustment for wobble
    ticketObj.lookAt(new THREE.Vector3(0, ticketObj.position.y, 0));
    
    // Enhance material based on status for premium look
    if (ticketObj.material && ticketObj.material.emissive) {
      // Add subtle emissive animation for premium materials
      if (priority === 'high') {
        // Pulse emissive intensity for high priority
        ticketObj.material.emissiveIntensity = 0.4 + 
          Math.sin(elapsedTime * 2 + phase) * 0.15;
      }
    }
  }

  // Handle raycasting for interactive hover effect
  function handleRaycasting() {
    if (!raycaster || !camera || !scene || !mouse) return;
    
    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Find interactions with ticket objects - only include main tickets, not text labels
    const mainTickets = ticketObjects.filter(obj => obj.userData && obj.userData.ticket);
    const intersects = raycaster.intersectObjects(mainTickets);
    
    // Handle mouse over/out effects
    if (intersects.length > 0) {
      // Mouse is over at least one ticket
      const firstIntersected = intersects[0].object;
      
      if (currentlyIntersected !== firstIntersected) {
        // Mouse entered a new ticket
        
        // Reset previous ticket if there was one
        if (currentlyIntersected) {
          // Scale back to original size
          currentlyIntersected.scale.copy(currentlyIntersected.userData.originalScale);
          
          // Reset material intensity
          if (currentlyIntersected.material) {
            currentlyIntersected.material.emissiveIntensity = 0.3;
          }
        }
        
        // Set new intersected object
        currentlyIntersected = firstIntersected;
        
        // Scale up the ticket
        currentlyIntersected.scale.set(
          CONFIG.HOVER_SCALE, 
          CONFIG.HOVER_SCALE, 
          CONFIG.HOVER_SCALE
        );
        
        // Increase glow
        if (currentlyIntersected.material) {
          currentlyIntersected.material.emissiveIntensity = 0.7;
        }
        
        // Show tooltip with ticket info
        showTicketInfo(currentlyIntersected.userData.ticket);
      }
    } else if (currentlyIntersected) {
      // Mouse moved out of all tickets
      
      // Reset current intersected object
      currentlyIntersected.scale.copy(currentlyIntersected.userData.originalScale);
      
      if (currentlyIntersected.material) {
        currentlyIntersected.material.emissiveIntensity = 0.3;
      }
      
      // Clear reference
      currentlyIntersected = null;
      
      // Hide tooltip
      hideTicketInfo();
    }
  }
})();