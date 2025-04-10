/**
 * SWOOSH BOT - Premium Moderation 3D Visualization - £100,000 Edition
 * 
 * This specialized THREE.js implementation is designed specifically for the 
 * moderation page with optimized performance and enhanced visuals
 * that don't interfere with form inputs or button interactions.
 */

// Initialize Scene as soon as DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('moderation-three-container')) return;
  
  // Three.js variables
  let camera, scene, renderer;
  let geometry, material, mesh;
  let particles = [];
  let particleSystem;
  let cubes = [];
  let controls;
  
  // Stats tracking
  let raycaster;
  let mouse;
  let hoveredObject = null;
  
  // Scene dimensions
  const width = document.getElementById('moderation-three-container').clientWidth;
  const height = document.getElementById('moderation-three-container').clientHeight;
  
  // Scene parameters for premium moderation
  const params = {
    particleCount: 150,
    particleSize: 1.5,
    cubeCount: 12,
    cubeSize: 8,
    cubeGap: 25,
    cubeHeight: 0,
    background: new THREE.Color(0x111827),
    particleColor: new THREE.Color(0x7e6eef),
    ambientLight: 0.2,
    directionalLight: 0.8,
    ambientColor: 0xccccff,
    directionalColor: 0xffffff,
    fogDensity: 0.02,
    fogColor: 0x06081a,
    fogNear: 50,
    fogFar: 80,
    cameraDistance: 120,
    rotationSpeed: 0.0005,
  };
  
  // Initialize the scene
  init();
  
  // Create animation loop
  animate();
  
  /**
   * Initialize the 3D scene
   */
  function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = params.background;
    scene.fog = new THREE.FogExp2(params.fogColor, params.fogDensity);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
    camera.position.z = params.cameraDistance;
    camera.position.y = 20;
    camera.lookAt(0, 0, 0);
    
    // Setup lights
    const ambientLight = new THREE.AmbientLight(params.ambientColor, params.ambientLight);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(params.directionalColor, params.directionalLight);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    const pointLight1 = new THREE.PointLight(0x7289da, 1, 100);
    pointLight1.position.set(20, 30, 40);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff7675, 1, 100);
    pointLight2.position.set(-30, 20, -40);
    scene.add(pointLight2);
    
    // Create particle system
    createParticles();
    
    // Create floating cubes
    createCubes();
    
    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Add to DOM
    document.getElementById('moderation-three-container').appendChild(renderer.domElement);
    
    // Setup mouse raycaster for interactivity
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Setup event listeners
    window.addEventListener('resize', onWindowResize);
    document.getElementById('moderation-three-container').addEventListener('mousemove', onMouseMove);
    document.getElementById('moderation-three-container').addEventListener('click', onMouseClick);
  }
  
  /**
   * Create the particle background effect
   */
  function createParticles() {
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(params.particleCount * 3);
    const velocities = new Float32Array(params.particleCount * 3);
    
    for (let i = 0; i < params.particleCount; i++) {
      // Random position
      const x = (Math.random() - 0.5) * 150;
      const y = (Math.random() - 0.5) * 150;
      const z = (Math.random() - 0.5) * 150;
      
      // Store position
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Store velocity
      velocities[i * 3] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
      
      // Create particle object for animation
      particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(
          velocities[i * 3],
          velocities[i * 3 + 1],
          velocities[i * 3 + 2]
        ),
        originalPosition: new THREE.Vector3(x, y, z),
        size: Math.random() * 2 + 0.5
      });
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create material with custom shader for glow effect
    const particleMaterial = new THREE.PointsMaterial({
      color: params.particleColor,
      size: params.particleSize,
      transparent: true,
      opacity: 0.6,
      map: createCircleTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create particle system
    particleSystem = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particleSystem);
  }
  
  /**
   * Create texture for particles
   */
  function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    
    const gradient = context.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(200, 200, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(120, 140, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(120, 140, 255, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  /**
   * Create floating cubes that represent moderation actions
   */
  function createCubes() {
    // Icons to represent each moderation action
    const moderationActions = [
      { name: 'Ban', icon: '❌', color: 0xff5555 },
      { name: 'Kick', icon: '👢', color: 0xffaa22 },
      { name: 'Mute', icon: '🔇', color: 0x55aaff },
      { name: 'Warn', icon: '⚠️', color: 0xffff55 },
      { name: 'Timeout', icon: '⏱️', color: 0xaa55ff },
      { name: 'Purge', icon: '🧹', color: 0x55ff77 },
      { name: 'Report', icon: '📢', color: 0xff77aa },
      { name: 'Logs', icon: '📊', color: 0x77ffee },
      // Add more cubes for other moderation actions
      { name: 'Unban', icon: '✅', color: 0x55ff55 },
      { name: 'Lockdown', icon: '🔒', color: 0xff5588 },
      { name: 'Settings', icon: '⚙️', color: 0xaaaaaa },
      { name: 'Blacklist', icon: '⛔', color: 0xff0000 }
    ];

    // Create a cube for each action
    for (let i = 0; i < moderationActions.length; i++) {
      const action = moderationActions[i];
      
      // Calculate position in a circular pattern
      const angle = (i / moderationActions.length) * Math.PI * 2;
      const radius = params.cubeGap;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      
      // Create cube geometry
      const geometry = new THREE.BoxGeometry(params.cubeSize, params.cubeSize, params.cubeSize);
      
      // Create canvas texture for cube face
      const texture = createCubeTexture(action.icon, action.name, action.color);
      
      // Create transparent glass material with emission
      const materials = [
        new THREE.MeshPhysicalMaterial({
          color: action.color,
          metalness: 0.3,
          roughness: 0.2,
          transmission: 0.9, // Transparency
          thickness: 0.5,     // Glass thickness
          envMapIntensity: 1,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
          emissive: new THREE.Color(action.color).multiplyScalar(0.2)
        }),
        new THREE.MeshPhysicalMaterial({
          color: action.color,
          metalness: 0.3,
          roughness: 0.2,
          transmission: 0.9,
          thickness: 0.5,
          envMapIntensity: 1,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
          emissive: new THREE.Color(action.color).multiplyScalar(0.2)
        }),
        new THREE.MeshPhysicalMaterial({
          color: action.color,
          metalness: 0.3,
          roughness: 0.2,
          transmission: 0.9,
          thickness: 0.5,
          envMapIntensity: 1,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
          emissive: new THREE.Color(action.color).multiplyScalar(0.2)
        }),
        new THREE.MeshPhysicalMaterial({
          color: action.color,
          metalness: 0.3,
          roughness: 0.2,
          transmission: 0.9,
          thickness: 0.5,
          envMapIntensity: 1,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
          emissive: new THREE.Color(action.color).multiplyScalar(0.2)
        }),
        // Front face with icon
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.95,
          side: THREE.DoubleSide
        }),
        // Back face with icon
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.95,
          side: THREE.DoubleSide
        })
      ];
      
      // Create mesh with materials
      const cube = new THREE.Mesh(geometry, materials);
      
      // Position the cube
      cube.position.x = x;
      cube.position.z = z;
      cube.position.y = params.cubeHeight;
      
      // Add animation parameters
      cube.userData = {
        startY: params.cubeHeight,
        targetY: params.cubeHeight,
        actionName: action.name,
        color: action.color,
        originalScale: 1,
        originalRotation: {
          x: Math.random() * 0.1 - 0.05,
          y: Math.random() * 0.1 - 0.05,
          z: Math.random() * 0.1 - 0.05
        },
        angle: angle,
        radius: radius,
        phase: Math.random() * Math.PI * 2 // Random starting phase for floating animation
      };
      
      // Add to scene and to cubes array for animation
      scene.add(cube);
      cubes.push(cube);
    }
  }
  
  /**
   * Create texture for cube faces with icon and text
   */
  function createCubeTexture(icon, text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Background
    context.fillStyle = `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.2)`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    context.strokeStyle = `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.5)`;
    context.lineWidth = 6;
    context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    
    // Icon
    context.font = '80px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(icon, canvas.width / 2, canvas.height / 2 - 20);
    
    // Text
    context.font = 'bold 24px Arial';
    context.fillStyle = '#ffffff';
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 50);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  /**
   * Animate the scene
   */
  function animate() {
    requestAnimationFrame(animate);
    
    // Update particles
    const positions = particleSystem.geometry.attributes.position.array;
    
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      
      // Move particle
      particle.position.add(particle.velocity);
      
      // Check boundaries and reset if needed
      if (particle.position.x > 100 || particle.position.x < -100 ||
          particle.position.y > 100 || particle.position.y < -100 ||
          particle.position.z > 100 || particle.position.z < -100) {
        
        // Reset to original position with a small random offset
        particle.position.copy(particle.originalPosition);
        particle.position.x += (Math.random() - 0.5) * 10;
        particle.position.y += (Math.random() - 0.5) * 10;
        particle.position.z += (Math.random() - 0.5) * 10;
      }
      
      // Update position in geometry
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
    }
    
    particleSystem.geometry.attributes.position.needsUpdate = true;
    
    // Rotate and animate cubes
    const time = Date.now() * 0.001; // Current time in seconds
    
    cubes.forEach(cube => {
      // Get animation parameters
      const { originalRotation, phase, angle, radius } = cube.userData;
      
      // Slow continuous rotation
      cube.rotation.x += originalRotation.x * 0.01;
      cube.rotation.y += originalRotation.y * 0.01;
      cube.rotation.z += originalRotation.z * 0.01;
      
      // Floating animation
      cube.position.y = cube.userData.startY + Math.sin(time + phase) * 1.5;
      
      // Slight circular movement
      const newAngle = angle + Math.sin(time * 0.1 + phase) * 0.05;
      cube.position.x = Math.sin(newAngle) * radius;
      cube.position.z = Math.cos(newAngle) * radius;
      
      // Scale animation for hovered object
      if (hoveredObject === cube) {
        cube.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
        
        // Emit particles from hovered cube (implemented in animation)
        emitParticlesFromCube(cube, time);
      } else {
        cube.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    });
    
    // Render the scene
    renderer.render(scene, camera);
  }
  
  /**
   * Emit particles effect from a cube
   */
  function emitParticlesFromCube(cube, time) {
    // This is a visual effect only - could be enhanced with actual particle emission
    // For now, we just make the cube pulse with light
    const intensity = Math.sin(time * 5) * 0.5 + 0.5;
    const color = cube.userData.color;
    
    // Update emissive intensity
    cube.material.forEach(material => {
      if (material.emissive) {
        material.emissive.setHex(color);
        material.emissiveIntensity = intensity * 0.3;
        material.needsUpdate = true;
      }
    });
  }
  
  /**
   * Handle window resize
   */
  function onWindowResize() {
    const width = document.getElementById('moderation-three-container').clientWidth;
    const height = document.getElementById('moderation-three-container').clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
  }
  
  /**
   * Handle mouse movement for interaction
   */
  function onMouseMove(event) {
    // Get container bounds
    const rect = document.getElementById('moderation-three-container').getBoundingClientRect();
    
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(cubes);
    
    // Reset cursor
    document.getElementById('moderation-three-container').style.cursor = 'default';
    
    // Clear hover state
    hoveredObject = null;
    
    // If we intersect with a cube, set hover state
    if (intersects.length > 0) {
      hoveredObject = intersects[0].object;
      document.getElementById('moderation-three-container').style.cursor = 'pointer';
    }
  }
  
  /**
   * Handle mouse click for interaction
   */
  function onMouseClick(event) {
    // Only proceed if we have a hovered object
    if (hoveredObject) {
      const actionName = hoveredObject.userData.actionName;
      
      // Find the corresponding action button and click it
      handleModerationAction(actionName);
    }
  }
  
  /**
   * Handle moderation action when a cube is clicked
   */
  function handleModerationAction(actionName) {
    console.log(`Moderation action selected: ${actionName}`);
    
    // Match the action name to the actual UI elements
    switch(actionName.toLowerCase()) {
      case 'ban':
        document.querySelector('[data-action="ban-user"]')?.click();
        break;
      case 'kick':
        document.querySelector('[data-action="kick-user"]')?.click();
        break;
      case 'timeout':
      case 'mute':
        document.querySelector('[data-action="timeout-user"]')?.click();
        break;
      case 'purge':
        document.querySelector('[data-action="purge-messages"]')?.click();
        break;
      case 'warn':
        // Focus on the warning form
        document.getElementById('warning-user-id-add')?.focus();
        break;
      case 'logs':
        // Focus on the logs section
        document.getElementById('moderation-log')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'unban':
        // Show unban interface if available
        displayNotification(`Click on the Unban button in the ban list to unban a user`, 'info');
        document.querySelector('.bans-list-container')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'settings':
        // Show settings interface if available
        document.getElementById('automod-form')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'blacklist':
        // Navigate to blacklist page
        window.location.href = '/admin3d/blacklist';
        break;
      default:
        displayNotification(`${actionName} action selected`, 'info');
    }
  }
  
  /**
   * Display a notification message
   */
  function displayNotification(message, type = 'info') {
    // Check if notification area exists
    const notificationArea = document.querySelector('.notification-area');
    if (!notificationArea) return;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="fas fa-${type === 'info' ? 'info-circle' : type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add to notification area
    notificationArea.appendChild(notification);
    
    // Add close button listener
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.add('notification-closing');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('notification-closing');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('notification-visible');
    }, 10);
  }
});