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
  
  // Configuration
  const CONFIG = {
    ORBITAL_RADIUS: 5,
    TICKET_SIZE: 0.4,
    ROTATION_SPEED: 0.2,
    HOVER_SCALE: 1.2,
    ORBIT_HEIGHT: 1.5,
    COLORS: {
      OPEN: 0x00bf9a,  // Teal for open tickets
      CLOSED: 0x6c757d,  // Gray for closed tickets
      RING: 0x8936ff,  // Purple for the orbital ring
      HIGHLIGHT: 0xb76eff,  // Lighter purple for highlights
      BACKGROUND: 0x0e0e1c  // Dark background
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
      console.warn('Premium 3D Tickets: THREE.js not available');
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
  function createTooltip() {
    tooltip = document.createElement('div');
    tooltip.className = 'ticket3d-tooltip';
    tooltip.style.opacity = '0';
    tooltip.style.position = 'fixed';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '9999';
    document.body.appendChild(tooltip);
  }

  // Initialize the THREE.js scene
  function initScene() {
    try {
      // Setup scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(CONFIG.COLORS.BACKGROUND);
      
      // Setup camera
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 2, 7);
      
      // Setup renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      
      // Get the container element
      const container = document.getElementById('three-container');
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      
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
        console.warn('Post-processing libraries not available, skipping bloom effect');
        return;
      }
      
      // Create composer
      composer = new THREE.EffectComposer(renderer);
      
      // Add render pass
      const renderPass = new THREE.RenderPass(scene, camera);
      composer.addPass(renderPass);
      
      // Add bloom pass
      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.7,   // strength
        0.6,   // radius
        0.75   // threshold
      );
      composer.addPass(bloomPass);
      
      console.log('Post-processing effects enabled');
    } catch (error) {
      console.warn('Failed to setup post-processing:', error);
    }
  }

  // Create orbital ring for tickets to orbit around
  function createOrbitalRing() {
    // Create a ring geometry
    const ringGeometry = new THREE.TorusGeometry(
      CONFIG.ORBITAL_RADIUS,  // Radius
      0.05,                   // Tube size
      16,                     // Radial segments
      100                     // Tubular segments
    );
    
    // Create material with glow effect
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: CONFIG.COLORS.RING,
      emissive: CONFIG.COLORS.RING,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3,
    });
    
    // Create mesh and add to scene
    orbitalRing = new THREE.Mesh(ringGeometry, ringMaterial);
    orbitalRing.rotation.x = Math.PI / 2;  // Lay flat
    orbitalRing.castShadow = true;
    orbitalRing.receiveShadow = true;
    scene.add(orbitalRing);
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

  // Create a 3D representation of a ticket
  function createTicket3D(ticket, index, total) {
    // Calculate position on orbital ring
    const angle = (index / total) * Math.PI * 2;
    const height = CONFIG.ORBIT_HEIGHT + (Math.random() * 0.4 - 0.2); // Slight height variation
    
    // Determine color based on status
    const color = ticket.status === 'OPEN' ? 
                  CONFIG.COLORS.OPEN : 
                  CONFIG.COLORS.CLOSED;
    
    // Create ticket mesh
    const geometry = new THREE.BoxGeometry(
      CONFIG.TICKET_SIZE * 1.4, 
      CONFIG.TICKET_SIZE * 0.8, 
      CONFIG.TICKET_SIZE * 0.1
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
    });
    
    // Create mesh
    const ticketMesh = new THREE.Mesh(geometry, material);
    
    // Position on orbital ring
    ticketMesh.position.x = Math.cos(angle) * CONFIG.ORBITAL_RADIUS;
    ticketMesh.position.z = Math.sin(angle) * CONFIG.ORBITAL_RADIUS;
    ticketMesh.position.y = height;
    
    // Face center
    ticketMesh.lookAt(new THREE.Vector3(0, height, 0));
    
    // Store angle for animation
    ticketMesh.userData = {
      ticket: ticket,
      originalAngle: angle,
      originalHeight: height,
      originalScale: ticketMesh.scale.clone()
    };
    
    // Add to scene and collection
    scene.add(ticketMesh);
    ticketObjects.push(ticketMesh);
    
    // Add text label
    addTicketText(ticketMesh, ticket.id, angle);
    
    return ticketMesh;
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
    
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update composer if it exists
    if (composer) {
      composer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  // Handle mouse movement for interactive hover effect
  function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
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

  // Show ticket information in tooltip
  function showTicketInfo(ticketData) {
    if (!tooltip || !ticketData) return;
    
    // Format date
    const created = ticketData.createdAt ? 
                    new Date(ticketData.createdAt).toLocaleDateString() : 
                    'Unknown';
    
    // Set tooltip content
    tooltip.innerHTML = `
      <h4>#${ticketData.id}</h4>
      <p><span>User:</span> ${ticketData.username || 'Unknown'}</p>
      <p><span>Type:</span> ${ticketData.type || 'General'}</p>
      <p><span>Status:</span> ${ticketData.status || 'Unknown'}</p>
      <p><span>Created:</span> ${created}</p>
    `;
    
    // Show tooltip with fade in
    tooltip.style.opacity = '1';
  }

  // Hide ticket information tooltip
  function hideTicketInfo() {
    if (!tooltip) return;
    tooltip.style.opacity = '0';
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Calculate elapsed time for animation
    const now = Date.now();
    const elapsedTime = (now - animationStartTimestamp) / 1000;
    
    // Rotate orbital ring
    if (orbitalRing) {
      orbitalRing.rotation.y = elapsedTime * 0.05;
    }
    
    // Animate ticket positions
    ticketObjects.forEach(obj => {
      // Skip objects without userData (like text labels)
      if (!obj.userData || !obj.userData.originalAngle) return;
      
      // Calculate new position based on original angle and elapsed time
      const angle = obj.userData.originalAngle + (elapsedTime * CONFIG.ROTATION_SPEED);
      obj.position.x = Math.cos(angle) * CONFIG.ORBITAL_RADIUS;
      obj.position.z = Math.sin(angle) * CONFIG.ORBITAL_RADIUS;
      
      // Add subtle floating animation
      obj.position.y = obj.userData.originalHeight + 
                      (Math.sin(elapsedTime + obj.userData.originalAngle * 3) * 0.1);
      
      // Face center
      obj.lookAt(new THREE.Vector3(0, obj.position.y, 0));
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