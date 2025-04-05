// Three.js animated background for the status page
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if on the status page
  const statusHeader = document.querySelector('.status-header');
  if (!statusHeader) return;

  // Create canvas container
  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'status-background';
  canvasContainer.style.position = 'absolute';
  canvasContainer.style.top = '0';
  canvasContainer.style.left = '0';
  canvasContainer.style.width = '100%';
  canvasContainer.style.height = '100%';
  canvasContainer.style.zIndex = '-1';
  canvasContainer.style.overflow = 'hidden';
  
  // Insert before the first child
  statusHeader.insertBefore(canvasContainer, statusHeader.firstChild);

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
  
  renderer.setSize(window.innerWidth, Math.max(statusHeader.offsetHeight, 300));
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);

  // Create a network visualization with lines and nodes
  const nodes = [];
  const nodeCount = 25;
  const nodeGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  
  // Materials
  const nodeMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x9c4dff,
    emissive: 0x6a3aff,
    emissiveIntensity: 0.3,
    shininess: 80 
  });
  
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x9c4dff,
    transparent: true,
    opacity: 0.3
  });
  
  // Create nodes
  for (let i = 0; i < nodeCount; i++) {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    
    // Random position within a sphere
    const radius = 15 + Math.random() * 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    node.position.x = radius * Math.sin(phi) * Math.cos(theta);
    node.position.y = radius * Math.sin(phi) * Math.sin(theta);
    node.position.z = radius * Math.cos(phi);
    
    // Add animation parameters
    node.userData = {
      originalPosition: node.position.clone(),
      velocityVector: new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05
      ),
      connections: []
    };
    
    scene.add(node);
    nodes.push(node);
  }
  
  // Create connections between nodes
  const connectionLines = [];
  const maxDistance = 15; // Maximum distance for connection
  
  // Create lines between nearby nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const distance = nodes[i].position.distanceTo(nodes[j].position);
      
      if (distance < maxDistance) {
        // Create line
        const points = [
          nodes[i].position,
          nodes[j].position
        ];
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        
        // Store connection references
        nodes[i].userData.connections.push({ node: nodes[j], line });
        nodes[j].userData.connections.push({ node: nodes[i], line });
        
        // Add to scene
        scene.add(line);
        connectionLines.push(line);
      }
    }
  }
  
  // Add data transmission effect
  const packetGeometry = new THREE.SphereGeometry(0.2, 8, 8);
  const packetMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  });
  
  // Create data packets that travel along connections
  const dataPackets = [];
  
  function createDataPacket() {
    // Choose a random connection line
    if (connectionLines.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * connectionLines.length);
    const line = connectionLines[randomIndex];
    
    // Find the associated nodes
    let startNode, endNode;
    for (let i = 0; i < nodes.length; i++) {
      for (const conn of nodes[i].userData.connections) {
        if (conn.line === line) {
          startNode = nodes[i];
          endNode = conn.node;
          break;
        }
      }
      if (startNode) break;
    }
    
    if (!startNode || !endNode) return null;
    
    // Create packet
    const packet = new THREE.Mesh(packetGeometry, packetMaterial);
    
    // Initialize at start node
    packet.position.copy(startNode.position);
    
    // Add animation data
    packet.userData = {
      startNode,
      endNode,
      progress: 0,
      speed: 0.01 + Math.random() * 0.02
    };
    
    scene.add(packet);
    return packet;
  }
  
  // Create initial data packets
  for (let i = 0; i < 10; i++) {
    const packet = createDataPacket();
    if (packet) dataPackets.push(packet);
  }
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  const pointLight = new THREE.PointLight(0x9c4dff, 2, 50);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);
  
  // Position camera
  camera.position.z = 50;
  
  // Animation loop
  const clock = new THREE.Clock();
  let packetTimer = 0;
  
  function animate() {
    requestAnimationFrame(animate);
    
    const time = clock.getElapsedTime();
    packetTimer += clock.getDelta();
    
    // Animate nodes
    for (const node of nodes) {
      // Move nodes slightly
      const { originalPosition, velocityVector } = node.userData;
      
      node.position.x = originalPosition.x + Math.sin(time * velocityVector.x) * 2;
      node.position.y = originalPosition.y + Math.sin(time * velocityVector.y) * 2;
      node.position.z = originalPosition.z + Math.sin(time * velocityVector.z) * 2;
      
      // Update all connections
      for (const conn of node.userData.connections) {
        const linePoints = [node.position, conn.node.position];
        conn.line.geometry.setFromPoints(linePoints);
      }
    }
    
    // Animate data packets
    for (let i = dataPackets.length - 1; i >= 0; i--) {
      const packet = dataPackets[i];
      const { startNode, endNode, speed } = packet.userData;
      
      // Update progress
      packet.userData.progress += speed;
      
      if (packet.userData.progress >= 1) {
        // Remove packet when it reaches the end
        scene.remove(packet);
        dataPackets.splice(i, 1);
      } else {
        // Interpolate position
        packet.position.lerpVectors(
          startNode.position,
          endNode.position,
          packet.userData.progress
        );
      }
    }
    
    // Create new packets periodically
    if (packetTimer > 0.5) { // Create a new packet every 0.5 seconds
      packetTimer = 0;
      const packet = createDataPacket();
      if (packet) dataPackets.push(packet);
    }
    
    // Rotate scene slowly
    scene.rotation.y = time * 0.1;
    
    // Render
    renderer.render(scene, camera);
  }
  
  animate();
  
  // Handle window resize
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, Math.max(statusHeader.offsetHeight, 300));
  }
  
  window.addEventListener('resize', onWindowResize);
});