/**
 * Three.js background animation for the bot status dashboard
 * Creates a dynamic 3D visualization with data packets traveling through a network
 */
document.addEventListener('DOMContentLoaded', function() {
  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Transparent background
  
  // Add renderer to the DOM
  const container = document.createElement('div');
  container.className = 'three-bg-container';
  document.body.appendChild(container);
  container.appendChild(renderer.domElement);
  
  // Camera position
  camera.position.z = 30;
  
  // Lights
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Create grid
  const gridSize = 50;
  const gridDivisions = 20;
  const gridColor = 0x9c4dff; // Primary color
  
  const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
  gridHelper.position.y = -10;
  scene.add(gridHelper);
  
  // Create nodes (connection points in network)
  const nodes = [];
  const nodeCount = 15;
  const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const nodeMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffffff,
    emissive: 0x9c4dff,
    emissiveIntensity: 0.5
  });
  
  for (let i = 0; i < nodeCount; i++) {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    
    // Random position within grid
    node.position.x = (Math.random() - 0.5) * gridSize * 0.8;
    node.position.y = (Math.random() - 0.5) * gridSize * 0.4;
    node.position.z = (Math.random() - 0.5) * gridSize * 0.8;
    
    nodes.push(node);
    scene.add(node);
  }
  
  // Create connections between nodes
  const connections = [];
  const lineGeometry = new THREE.BufferGeometry();
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x9c4dff,
    opacity: 0.4,
    transparent: true 
  });
  
  // Connect each node to its closest neighbors
  nodes.forEach((node, index) => {
    // Find 2-3 closest nodes
    const distances = nodes.map((otherNode, otherIndex) => {
      if (index === otherIndex) return Infinity;
      
      return {
        index: otherIndex,
        distance: node.position.distanceTo(otherNode.position)
      };
    }).sort((a, b) => a.distance - b.distance);
    
    // Connect to closest 2-3 nodes
    const connectCount = Math.floor(Math.random() * 2) + 2; // 2-3 connections
    
    for (let i = 0; i < connectCount && i < distances.length - 1; i++) {
      const targetNode = nodes[distances[i].index];
      
      // Create a line between the nodes
      const points = [
        node.position.clone(),
        targetNode.position.clone()
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      
      connections.push({
        line: line,
        startNode: node,
        endNode: targetNode,
        points: points
      });
      
      scene.add(line);
    }
  });
  
  // Data packets that travel along connections
  const packets = [];
  const packetGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const packetMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffffff,
    emissive: 0xb168ff
  });
  
  function createDataPacket() {
    // Choose a random connection
    const connectionIndex = Math.floor(Math.random() * connections.length);
    const connection = connections[connectionIndex];
    
    // Create a packet
    const packet = new THREE.Mesh(packetGeometry, packetMaterial);
    
    // Start at one end of the connection
    packet.position.copy(connection.startNode.position);
    
    // Add to scene and packets array
    scene.add(packet);
    
    packets.push({
      mesh: packet,
      connection: connection,
      progress: 0,
      speed: 0.01 + Math.random() * 0.01, // Random speed
      active: true
    });
    
    // Only keep a certain number of packets at a time
    if (packets.length > 30) {
      const oldPacket = packets.shift();
      scene.remove(oldPacket.mesh);
    }
  }
  
  // Create initial packets
  for (let i = 0; i < 10; i++) {
    createDataPacket();
  }
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Rotate grid slowly
    gridHelper.rotation.y += 0.001;
    
    // Move packets along connections
    packets.forEach(packet => {
      if (!packet.active) return;
      
      // Update progress
      packet.progress += packet.speed;
      
      if (packet.progress >= 1) {
        // Reached end of connection, make inactive
        packet.active = false;
        packet.mesh.visible = false;
        
        // Create a new packet
        setTimeout(createDataPacket, Math.random() * 1000);
      } else {
        // Calculate position along the line
        const startPos = packet.connection.startNode.position;
        const endPos = packet.connection.endNode.position;
        
        packet.mesh.position.lerpVectors(startPos, endPos, packet.progress);
      }
    });
    
    // Pulse nodes
    nodes.forEach((node, i) => {
      const time = Date.now() * 0.001 + i;
      const scale = 1 + 0.1 * Math.sin(time * 2);
      node.scale.set(scale, scale, scale);
    });
    
    renderer.render(scene, camera);
  }
  
  // Handle window resize
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  window.addEventListener('resize', onWindowResize);
  
  // Start animation
  animate();
});
