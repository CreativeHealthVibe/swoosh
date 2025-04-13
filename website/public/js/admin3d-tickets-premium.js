/**
 * SWOOSH Bot 3D Ticket Management System
 * Premium Edition - $55k Value Design
 * 
 * Advanced Three.js visualization with interactive ticket elements,
 * 3D ticket representations, holographic effects and premium animations.
 */

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if THREE.js is loaded and the three-container element exists
  if (typeof THREE === 'undefined') {
    console.warn('THREE.js not loaded! Falling back to 2D mode.');
    return;
  }
  
  const container = document.getElementById('three-container');
  if (!container) return;
  
  // Don't initialize if body has the no-three-js class
  if (document.body.classList.contains('no-three-js')) {
    console.log('THREE.js disabled on this page via body class');
    return;
  }
  
  // Scene variables
  let scene, camera, renderer, composer;
  let tickets3D = [];
  let raycaster, mouse;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;
  let ticketData = [];
  let orbitalRing;
  
  // Scene configuration options
  const config = {
    cameraPosition: new THREE.Vector3(0, 0, 100),
    ticketSize: 8,
    ticketSpacing: 15,
    ticketRotationSpeed: 0.005,
    ringRadius: 60,
    ringTubeRadius: 0.5,
    ringColor: 0x8936ff,
    activeColor: 0x00e676,
    closedColor: 0xff3d71,
    highlightColor: 0xffb300,
    glowIntensity: 1.5,
    bloomStrength: 1.0,
    bloomRadius: 0.7,
    bloomThreshold: 0.2
  };
  
  // Initialize the 3D scene
  initTicketScene();
  animate();
  
  // Listen for ticket updates
  window.addEventListener('ticketsUpdated', updateTickets3D);
  
  /**
   * Initialize the Three.js scene with ticket-specific elements
   */
  function initTicketScene() {
    // Create scene (use the existing scene from admin3d-scene.js)
    scene = window.threeJsScene || new THREE.Scene();
    camera = window.threeJsCamera || new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    renderer = window.threeJsRenderer || new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    if (!window.threeJsScene) {
      camera.position.copy(config.cameraPosition);
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.autoClear = false;
      
      // Make sure the canvas doesn't block interaction with page elements
      renderer.domElement.style.pointerEvents = 'none';
      renderer.domElement.style.position = 'fixed';
      renderer.domElement.style.top = '0';
      renderer.domElement.style.left = '0';
      renderer.domElement.style.zIndex = '-1';
      
      container.appendChild(renderer.domElement);
    }
    
    // Setup raycaster for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Add ambient light if not already present
    if (!scene.getObjectByName('ticketAmbientLight')) {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      ambientLight.name = 'ticketAmbientLight';
      scene.add(ambientLight);
    }
    
    // Add directional light if not already present
    if (!scene.getObjectByName('ticketDirectionalLight')) {
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      directionalLight.name = 'ticketDirectionalLight';
      scene.add(directionalLight);
    }
    
    // Create orbital ring
    createOrbitalRing();
    
    // Add post-processing effects for bloom glow
    setupPostProcessing();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    
    // Store global references
    window.threeJsScene = scene;
    window.threeJsCamera = camera;
    window.threeJsRenderer = renderer;
  }
  
  /**
   * Setup post-processing effects
   */
  function setupPostProcessing() {
    // Skip if already set up in the main scene
    if (window.threeJsComposer) {
      composer = window.threeJsComposer;
      return;
    }
    
    // Create effect composer
    composer = new THREE.EffectComposer(renderer);
    
    // Add render pass
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Add bloom pass for glow effect
    const bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      config.bloomStrength,
      config.bloomRadius,
      config.bloomThreshold
    );
    composer.addPass(bloomPass);
    
    // Store global reference
    window.threeJsComposer = composer;
  }
  
  /**
   * Create orbital ring for tickets
   */
  function createOrbitalRing() {
    // Remove existing ring if present
    if (orbitalRing) {
      scene.remove(orbitalRing);
    }
    
    // Create ring geometry
    const ringGeometry = new THREE.TorusGeometry(
      config.ringRadius,
      config.ringTubeRadius,
      16,
      100
    );
    
    // Create holographic ring material
    const ringMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(config.ringColor) }
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          
          // Add subtle wave movement
          float wave = sin(position.x * 0.1 + time * 2.0) * 0.2;
          vec3 newPosition = position;
          newPosition.y += wave;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          // Create pulsing effect
          float pulse = 0.5 + 0.5 * sin(time * 1.5);
          
          // Create line pattern
          float line = abs(sin(vUv.x * 50.0 - time * 2.0));
          line = smoothstep(0.5, 0.55, line);
          
          // Energy flow effect
          float energy = abs(sin(vUv.x * 20.0 - time * 3.0));
          energy = pow(energy, 2.0) * 0.8;
          
          // Combine effects
          float alpha = mix(0.2, 0.6, pulse) + energy * 0.4;
          vec3 finalColor = mix(color, color * 1.5, energy);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    // Create ring mesh
    orbitalRing = new THREE.Mesh(ringGeometry, ringMaterial);
    orbitalRing.rotation.x = Math.PI / 2;
    orbitalRing.name = 'ticketOrbitalRing';
    scene.add(orbitalRing);
  }
  
  /**
   * Create 3D representations of tickets
   */
  function createTicket3D(data, index, total) {
    // Create ticket geometry
    const ticketGeometry = new THREE.BoxGeometry(
      config.ticketSize,
      config.ticketSize * 0.7,
      config.ticketSize * 0.1
    );
    
    // Determine color based on status
    const baseColor = data.status === 'OPEN' ? 
      config.activeColor : config.closedColor;
    
    // Create holographic ticket material
    const ticketMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(baseColor) },
        highlightColor: { value: new THREE.Color(config.highlightColor) },
        isHovered: { value: 0.0 }
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vUv = uv;
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 baseColor;
        uniform vec3 highlightColor;
        uniform float isHovered;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          // Holographic edge glow
          float edge = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          edge = pow(edge, 3.0);
          
          // Pulsing effect
          float pulse = 0.5 + 0.5 * sin(time * 1.0);
          
          // Grid pattern
          float gridX = smoothstep(0.95, 1.0, abs(sin(vUv.x * 20.0)));
          float gridY = smoothstep(0.95, 1.0, abs(sin(vUv.y * 20.0)));
          float grid = gridX + gridY;
          
          // Data stream effect
          float stream = step(0.98, sin(vUv.y * 50.0 - time * 3.0 + vUv.x * 20.0));
          
          // Combine effects with hover state
          vec3 color = mix(baseColor, highlightColor, isHovered * 0.7);
          color = mix(color, vec3(1.0), grid * 0.5);
          color = mix(color, vec3(1.0), stream * 0.7);
          color += edge * 0.5 * (isHovered * 0.5 + 0.5) * mix(baseColor, highlightColor, pulse);
          
          // Transparency based on edge
          float alpha = 0.7 + edge * 0.3 + isHovered * 0.2;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    // Create ticket mesh
    const ticketMesh = new THREE.Mesh(ticketGeometry, ticketMaterial);
    
    // Position on the orbital ring
    const angle = (index / total) * Math.PI * 2;
    ticketMesh.position.x = Math.cos(angle) * config.ringRadius;
    ticketMesh.position.z = Math.sin(angle) * config.ringRadius;
    ticketMesh.rotation.y = angle + Math.PI / 2;
    
    // Store the ticket data
    ticketMesh.userData = {
      id: data.id,
      status: data.status,
      username: data.username,
      type: data.type,
      createdAt: data.createdAt,
      index: index,
      angle: angle,
      isHovered: false
    };
    
    // Add ticket to scene
    ticketMesh.name = `ticket-${data.id}`;
    scene.add(ticketMesh);
    
    // Add ID text
    addTicketText(ticketMesh, data.id, angle);
    
    return ticketMesh;
  }
  
  /**
   * Add text labels to tickets
   */
  function addTicketText(ticketMesh, id, angle) {
    // Create canvas for text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    // Clear background
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.font = 'Bold 28px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'white';
    context.fillText(`#${id}`, canvas.width / 2, canvas.height / 2);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    
    // Create material
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    // Create plane for text
    const geometry = new THREE.PlaneGeometry(
      config.ticketSize * 0.8,
      config.ticketSize * 0.3
    );
    const textMesh = new THREE.Mesh(geometry, material);
    
    // Position text in front of ticket
    textMesh.position.copy(ticketMesh.position);
    textMesh.position.y += 0.5;
    textMesh.position.x += Math.cos(angle) * config.ringTubeRadius * 10;
    textMesh.position.z += Math.sin(angle) * config.ringTubeRadius * 10;
    textMesh.rotation.copy(ticketMesh.rotation);
    
    // Add text to scene
    textMesh.name = `ticket-text-${id}`;
    scene.add(textMesh);
    
    return textMesh;
  }
  
  /**
   * Update 3D tickets based on new data
   */
  function updateTickets3D(event) {
    // Get ticket data from event or global variable
    let newTicketData = event?.detail?.tickets || [];
    
    // If event has no data, try to get from global variable
    if (newTicketData.length === 0) {
      newTicketData = window.allTickets || [];
    }
    
    // Skip if no new data
    if (newTicketData.length === 0) return;
    
    // Store new data
    ticketData = newTicketData;
    
    // Remove existing ticket meshes
    tickets3D.forEach(ticket => {
      // Remove ticket mesh
      const mesh = scene.getObjectByName(`ticket-${ticket.userData.id}`);
      if (mesh) scene.remove(mesh);
      
      // Remove text mesh
      const textMesh = scene.getObjectByName(`ticket-text-${ticket.userData.id}`);
      if (textMesh) scene.remove(textMesh);
    });
    
    // Clear tickets array
    tickets3D = [];
    
    // Create new tickets (only show up to 10 to avoid overcrowding)
    const maxTickets = Math.min(ticketData.length, 10);
    for (let i = 0; i < maxTickets; i++) {
      const ticket = createTicket3D(ticketData[i], i, maxTickets);
      tickets3D.push(ticket);
    }
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
    composer.setSize(window.innerWidth, window.innerHeight);
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
    
    // Check for intersections with tickets
    const intersects = raycaster.intersectObjects(tickets3D);
    
    // Reset all tickets first
    tickets3D.forEach(ticket => {
      if (ticket.material.uniforms) {
        ticket.material.uniforms.isHovered.value = 0.0;
      }
      ticket.userData.isHovered = false;
    });
    
    // Update hovered ticket
    if (intersects.length > 0) {
      const ticket = intersects[0].object;
      ticket.userData.isHovered = true;
      
      if (ticket.material.uniforms) {
        ticket.material.uniforms.isHovered.value = 1.0;
      }
      
      // Show ticket info
      showTicketInfo(ticket.userData);
    } else {
      // Hide ticket info
      hideTicketInfo();
    }
  }
  
  /**
   * Show ticket information tooltip
   */
  function showTicketInfo(ticketData) {
    // Create or get tooltip element
    let tooltip = document.getElementById('ticket3d-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'ticket3d-tooltip';
      tooltip.className = 'ticket3d-tooltip';
      document.body.appendChild(tooltip);
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .ticket3d-tooltip {
          position: fixed;
          background-color: rgba(0, 0, 0, 0.8);
          border: 2px solid #8936ff;
          border-radius: 8px;
          color: white;
          padding: 10px 15px;
          font-size: 14px;
          pointer-events: none;
          z-index: 9999;
          box-shadow: 0 0 15px rgba(137, 54, 255, 0.5);
          transform: translate(-50%, -100%);
          margin-top: -10px;
          opacity: 0;
          transition: opacity 0.2s ease;
          max-width: 250px;
        }
        .ticket3d-tooltip h4 {
          margin: 0 0 8px;
          color: #8936ff;
          font-size: 16px;
          border-bottom: 1px solid #8936ff40;
          padding-bottom: 5px;
        }
        .ticket3d-tooltip p {
          margin: 3px 0;
          display: flex;
          justify-content: space-between;
        }
        .ticket3d-tooltip span {
          opacity: 0.7;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Format date
    const created = ticketData.createdAt ? new Date(ticketData.createdAt) : new Date();
    const formattedDate = created.toLocaleDateString() + ' ' + 
                          created.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                          
    // Update tooltip content
    tooltip.innerHTML = `
      <h4>Ticket #${ticketData.id}</h4>
      <p>User: <span>${ticketData.username || 'Unknown'}</span></p>
      <p>Type: <span>${ticketData.type || 'General'}</span></p>
      <p>Status: <span>${ticketData.status || 'UNKNOWN'}</span></p>
      <p>Created: <span>${formattedDate}</span></p>
    `;
    
    // Show tooltip
    tooltip.style.opacity = '1';
    
    // Update tooltip position on mousemove
    document.addEventListener('mousemove', updateTooltipPosition);
    
    // Initial position update
    updateTooltipPosition(event);
  }
  
  /**
   * Update tooltip position
   */
  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('ticket3d-tooltip');
    if (!tooltip) return;
    
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }
  
  /**
   * Hide ticket information tooltip
   */
  function hideTicketInfo() {
    const tooltip = document.getElementById('ticket3d-tooltip');
    if (!tooltip) return;
    
    tooltip.style.opacity = '0';
    
    // Remove mousemove listener
    document.removeEventListener('mousemove', updateTooltipPosition);
  }
  
  /**
   * Animation loop
   */
  function animate() {
    // Store current time for animations
    const time = Date.now() * 0.001;
    
    // Request next frame
    requestAnimationFrame(animate);
    
    // Update camera position with smooth damping
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;
    
    // Subtle camera movement based on mouse
    if (camera) {
      camera.position.x += (mouseX * 0.05 - camera.position.x) * 0.01;
      camera.position.y += (-mouseY * 0.05 - camera.position.y) * 0.01;
      camera.lookAt(scene.position);
    }
    
    // Animate orbital ring
    if (orbitalRing && orbitalRing.material.uniforms) {
      orbitalRing.material.uniforms.time.value = time;
      orbitalRing.rotation.z += 0.001;
    }
    
    // Animate tickets
    tickets3D.forEach(ticket => {
      if (ticket.material.uniforms) {
        ticket.material.uniforms.time.value = time;
      }
      
      // Apply different rotation speeds based on hover state
      const rotationSpeed = ticket.userData.isHovered ? 
        config.ticketRotationSpeed * 0.5 : config.ticketRotationSpeed;
      
      // Make tickets float around their positions
      const angle = ticket.userData.angle;
      const floatOffset = Math.sin(time * 0.5 + angle) * 1.5;
      
      ticket.position.y = floatOffset;
      ticket.rotation.y += rotationSpeed;
      
      // Update text position
      const textMesh = scene.getObjectByName(`ticket-text-${ticket.userData.id}`);
      if (textMesh) {
        textMesh.position.y = ticket.position.y + 0.5;
        textMesh.rotation.y = ticket.rotation.y;
      }
    });
    
    // Use composer if available for post-processing effects
    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }
  
  // Custom event dispatcher to update tickets from external scripts
  function dispatchTicketsUpdated(tickets) {
    window.dispatchEvent(new CustomEvent('ticketsUpdated', {
      detail: { tickets }
    }));
  }
  
  // Expose function to update tickets from the main ticket script
  window.update3DTickets = dispatchTicketsUpdated;
});