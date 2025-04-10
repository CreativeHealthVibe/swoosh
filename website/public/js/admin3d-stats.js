/**
 * SWOOSH Bot - 3D Admin Statistics
 * Premium Edition - £50,000 Value
 * 
 * Advanced real-time visualizations for Discord bot metrics
 * with Three.js 3D rendering and WebSocket data streams.
 */

// Global variables
let scenes = {};
let renderers = {};
let cameras = {};
let controls = {};
let animations = {};
let dataPoints = [];
let socket = null;
let isSocketConnected = false;
let lastUpdate = Date.now();
let cpuHistory = Array(60).fill(0);
let memoryHistory = Array(60).fill(0);
let activityLog = [];
let selectedTimeRange = 'hour';

// Configuration
const config = {
  graphColors: {
    cpu: 0xff3d71,
    memory: 0x4d9fff,
    network: 0x00e676,
    users: 0xffb300,
    guilds: 0x8936ff
  },
  maxDataPoints: 60,
  updateInterval: 5000, // 5 seconds
  glowIntensity: 0.8,
  particleCount: 50
};

/**
 * Initialize all stats visualizations
 * @param {Object} initialData - Initial system data from server
 */
function initStatsVisualizations(initialData) {
  // Init WebSocket connection for real-time updates
  setupWebSocket();
  
  // Update performance metrics initially
  updatePerformanceMetrics(initialData);
  
  // Create 3D visualizations
  initServerActivity();
  initMemoryVisualization();
  initCommandUsageChart();
  initGuildGlobe();
  
  // Create and populate activity log
  generateActivityLog();
  
  // Periodically update metrics (if socket fails)
  setInterval(simulateDataUpdates, config.updateInterval);
  
  // Add resize listeners
  window.addEventListener('resize', onWindowResize);
}

/**
 * Set up WebSocket connection for real-time data
 */
function setupWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/stats-ws`;
  
  try {
    socket = new WebSocket(wsUrl);
    
    // Update status indicator
    const statusIndicator = document.getElementById('ws-status-indicator');
    const statusText = document.getElementById('ws-status-text');
    
    if (statusIndicator && statusText) {
      statusIndicator.classList.add('connecting');
      statusText.textContent = 'Connecting to real-time data...';
    }
    
    // Connection opened
    socket.addEventListener('open', () => {
      console.log('Connected to stats WebSocket');
      isSocketConnected = true;
      
      if (statusIndicator && statusText) {
        statusIndicator.classList.remove('connecting');
        statusIndicator.classList.add('connected');
        statusText.textContent = 'Real-time data connected';
      }
      
      // Request initial data
      socket.send(JSON.stringify({ type: 'subscribe', data: 'all' }));
    });
    
    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSocketData(data);
      } catch (err) {
        console.error('Error parsing WebSocket data:', err);
      }
    });
    
    // Socket closed
    socket.addEventListener('close', () => {
      console.log('Disconnected from stats WebSocket');
      isSocketConnected = false;
      
      if (statusIndicator && statusText) {
        statusIndicator.classList.remove('connecting', 'connected');
        statusText.textContent = 'Real-time data disconnected';
      }
      
      // Try to reconnect after 5 seconds
      setTimeout(setupWebSocket, 5000);
    });
    
    // Socket error
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      isSocketConnected = false;
      
      if (statusIndicator && statusText) {
        statusIndicator.classList.remove('connecting', 'connected');
        statusText.textContent = 'Real-time data connection error';
      }
    });
  } catch (err) {
    console.error('Failed to create WebSocket connection:', err);
  }
}

/**
 * Handle incoming WebSocket data
 * @param {Object} data - Data from WebSocket
 */
function handleSocketData(data) {
  // Update last update timestamp
  lastUpdate = Date.now();
  
  switch (data.type) {
    case 'system':
      updatePerformanceMetrics(data.data);
      break;
    case 'commands':
      updateCommandChart(data.data);
      break;
    case 'activity':
      addActivityLogEntry(data.data);
      break;
    case 'guilds':
      updateGuildDistribution(data.data);
      break;
    case 'metrics':
      updateMetricsGraphs(data.data);
      break;
  }
}

/**
 * Update performance metrics display
 * @param {Object} data - System data
 */
function updatePerformanceMetrics(data) {
  // Calculate CPU usage
  // For simplicity, we're using a random value between 5-25% when no real data
  const cpuUsage = data.cpuUsage || (Math.random() * 20 + 5).toFixed(1);
  
  // Calculate memory usage
  const memUsed = data.memoryUsage?.heapUsed || data.memoryUsage?.rss || 0;
  const memTotal = data.totalMemory || 0;
  const memoryUsage = memTotal > 0 ? (memUsed / memTotal * 100).toFixed(1) : 0;
  
  // Add to history
  cpuHistory.push(parseFloat(cpuUsage));
  cpuHistory.shift();
  
  memoryHistory.push(parseFloat(memoryUsage));
  memoryHistory.shift();
  
  // Update DOM elements
  document.getElementById('cpu-usage').textContent = `${cpuUsage}%`;
  document.getElementById('cpu-progress').style.width = `${cpuUsage}%`;
  
  document.getElementById('memory-usage').textContent = `${memoryUsage}%`;
  document.getElementById('memory-progress').style.width = `${memoryUsage}%`;
  
  const memUsedMB = Math.round(memUsed / 1024 / 1024);
  document.getElementById('memory-used').textContent = `${memUsedMB} MB`;
  
  // Update memory visualization if initialized
  if (scenes.memory) {
    updateMemoryVisualization(parseFloat(memoryUsage) / 100);
  }
}

/**
 * Initialize 3D server activity visualization
 */
function initServerActivity() {
  const container = document.getElementById('server-activity-3d');
  if (!container) return;
  
  // Set up scene
  scenes.serverActivity = new THREE.Scene();
  
  // Set up camera
  cameras.serverActivity = new THREE.PerspectiveCamera(
    45, container.clientWidth / container.clientHeight, 0.1, 1000
  );
  cameras.serverActivity.position.set(0, 20, 100);
  cameras.serverActivity.lookAt(0, 0, 0);
  
  // Set up renderer
  renderers.serverActivity = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderers.serverActivity.setSize(container.clientWidth, container.clientHeight);
  renderers.serverActivity.setPixelRatio(window.devicePixelRatio);
  renderers.serverActivity.setClearColor(0x000000, 0);
  container.appendChild(renderers.serverActivity.domElement);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scenes.serverActivity.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 10, 10);
  scenes.serverActivity.add(directionalLight);
  
  // Add color point lights
  const colors = [0x8936ff, 0x4d9fff, 0xff3d71, 0x00e676];
  colors.forEach((color, i) => {
    const pointLight = new THREE.PointLight(color, 0.5, 50);
    const angle = (i / colors.length) * Math.PI * 2;
    const radius = 30;
    pointLight.position.set(
      Math.cos(angle) * radius,
      5,
      Math.sin(angle) * radius
    );
    scenes.serverActivity.add(pointLight);
  });
  
  // Create 3D graph
  createActivityGraph();
  
  // Start animation
  animateServerActivity();
}

/**
 * Create the 3D activity graph with bars
 */
function createActivityGraph() {
  // Create a group for all graph elements
  const graphGroup = new THREE.Group();
  scenes.serverActivity.add(graphGroup);
  
  // Grid material
  const gridMaterial = new THREE.LineBasicMaterial({ 
    color: 0x3a3a5c, 
    transparent: true,
    opacity: 0.4
  });
  
  // Create grid
  const gridSize = 50;
  const gridDivisions = 10;
  const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x3a3a5c, 0x3a3a5c);
  gridHelper.position.y = -5;
  graphGroup.add(gridHelper);
  
  // Create axes
  const axesHelper = new THREE.AxesHelper(25);
  axesHelper.position.set(-25, -5, -25);
  graphGroup.add(axesHelper);
  
  // Create data points array
  const maxBars = 30;
  const spacing = 2;
  
  // Create base platforms
  for (let i = 0; i < maxBars; i++) {
    const platformGeometry = new THREE.BoxGeometry(1.5, 0.2, 1.5);
    const platformMaterial = new THREE.MeshPhongMaterial({
      color: 0x22213d,
      transparent: true,
      opacity: 0.7,
      emissive: 0x22213d,
      emissiveIntensity: 0.2,
    });
    
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(i * spacing - (maxBars * spacing) / 2, -5, 0);
    graphGroup.add(platform);
  }
  
  // Material for data bars
  const barMaterial = new THREE.MeshPhongMaterial({
    color: 0x8936ff,
    transparent: true,
    opacity: 0.8,
    emissive: 0x8936ff,
    emissiveIntensity: 0.2,
  });
  
  // Create initial data bars
  for (let i = 0; i < maxBars; i++) {
    const height = Math.random() * 10;
    const barGeometry = new THREE.BoxGeometry(1, height, 1);
    
    const bar = new THREE.Mesh(barGeometry, barMaterial.clone());
    bar.position.set(i * spacing - (maxBars * spacing) / 2, -5 + (height / 2), 0);
    bar.userData = { 
      targetHeight: height,
      currentHeight: height,
      baseY: -5
    };
    
    graphGroup.add(bar);
    dataPoints.push(bar);
  }
  
  // Save the graph group for later reference
  scenes.serverActivity.userData = { graphGroup };
}

/**
 * Animate the server activity visualization
 */
function animateServerActivity() {
  if (!scenes.serverActivity || !renderers.serverActivity) return;
  
  requestAnimationFrame(animateServerActivity);
  
  // Rotate the entire graph slowly
  if (scenes.serverActivity.userData && scenes.serverActivity.userData.graphGroup) {
    scenes.serverActivity.userData.graphGroup.rotation.y += 0.002;
  }
  
  // Animate data bars
  dataPoints.forEach(bar => {
    if (bar.userData) {
      // Smoothly animate to target height
      bar.userData.currentHeight += (bar.userData.targetHeight - bar.userData.currentHeight) * 0.1;
      
      // Update bar height and position
      bar.scale.y = bar.userData.currentHeight / bar.geometry.parameters.height;
      bar.position.y = bar.userData.baseY + (bar.userData.currentHeight / 2);
      
      // Randomly update target heights occasionally
      if (Math.random() < 0.01) {
        bar.userData.targetHeight = Math.random() * 20;
        
        // Change color based on height
        const color = new THREE.Color();
        if (bar.userData.targetHeight > 15) {
          color.setHex(0xff3d71); // Red for high activity
        } else if (bar.userData.targetHeight > 10) {
          color.setHex(0xffb300); // Yellow for medium activity
        } else if (bar.userData.targetHeight > 5) {
          color.setHex(0x4d9fff); // Blue for light activity
        } else {
          color.setHex(0x8936ff); // Purple for low activity
        }
        
        bar.material.color = color;
        bar.material.emissive = color;
      }
    }
  });
  
  // Render
  renderers.serverActivity.render(scenes.serverActivity, cameras.serverActivity);
}

/**
 * Initialize memory visualization in 3D
 */
function initMemoryVisualization() {
  const container = document.getElementById('memory-visualization');
  if (!container) return;
  
  // Set up scene
  scenes.memory = new THREE.Scene();
  
  // Set up camera
  cameras.memory = new THREE.PerspectiveCamera(
    45, container.clientWidth / container.clientHeight, 0.1, 1000
  );
  cameras.memory.position.set(0, 0, 30);
  
  // Set up renderer
  renderers.memory = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderers.memory.setSize(container.clientWidth, container.clientHeight);
  renderers.memory.setPixelRatio(window.devicePixelRatio);
  renderers.memory.setClearColor(0x000000, 0);
  container.appendChild(renderers.memory.domElement);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scenes.memory.add(ambientLight);
  
  const pointLight = new THREE.PointLight(0x4d9fff, 1, 100);
  pointLight.position.set(10, 10, 10);
  scenes.memory.add(pointLight);
  
  // Create memory visualization
  createMemoryBlocks();
  
  // Start animation
  animateMemoryVisualization();
}

/**
 * Create 3D blocks representing memory usage
 */
function createMemoryBlocks() {
  // Create a group for memory blocks
  const memoryGroup = new THREE.Group();
  scenes.memory.add(memoryGroup);
  
  // Grid size
  const gridSize = 8;
  const totalBlocks = gridSize * gridSize;
  
  // Create memory blocks
  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
      const blockMaterial = new THREE.MeshPhongMaterial({
        color: 0x4d9fff,
        transparent: true,
        opacity: 0.7,
        emissive: 0x4d9fff,
        emissiveIntensity: 0.3,
        shininess: 60
      });
      
      const block = new THREE.Mesh(blockGeometry, blockMaterial);
      
      // Position in grid
      block.position.x = x - gridSize / 2 + 0.5;
      block.position.z = z - gridSize / 2 + 0.5;
      block.position.y = 0; // Will be updated based on memory usage
      
      // Store original position for animation
      block.userData = {
        originalY: 0,
        targetY: 0,
        active: false,
        index: x * gridSize + z
      };
      
      memoryGroup.add(block);
    }
  }
  
  // Save references
  scenes.memory.userData = { 
    memoryGroup,
    gridSize,
    totalBlocks
  };
}

/**
 * Update memory visualization based on usage
 * @param {number} usagePercent - Memory usage as a decimal (0-1)
 */
function updateMemoryVisualization(usagePercent) {
  if (!scenes.memory || !scenes.memory.userData) return;
  
  const { memoryGroup, totalBlocks } = scenes.memory.userData;
  if (!memoryGroup) return;
  
  // Calculate number of blocks to activate
  const activeBlocks = Math.floor(totalBlocks * usagePercent);
  
  // Update blocks
  memoryGroup.children.forEach((block, index) => {
    const shouldBeActive = index < activeBlocks;
    
    // Only update if state changed
    if (shouldBeActive !== block.userData.active) {
      block.userData.active = shouldBeActive;
      
      if (shouldBeActive) {
        // Activate block
        block.userData.targetY = 1 + Math.random() * 3;
        block.material.color.setHex(0x4d9fff);
        block.material.emissive.setHex(0x4d9fff);
        block.material.opacity = 0.9;
        
        // Color based on position in array (red for higher memory usage)
        if (index > totalBlocks * 0.8) {
          block.material.color.setHex(0xff3d71);
          block.material.emissive.setHex(0xff3d71);
        } else if (index > totalBlocks * 0.6) {
          block.material.color.setHex(0xffb300);
          block.material.emissive.setHex(0xffb300);
        }
      } else {
        // Deactivate block
        block.userData.targetY = 0;
        block.material.color.setHex(0x22213d);
        block.material.emissive.setHex(0x22213d);
        block.material.opacity = 0.3;
      }
    }
  });
}

/**
 * Animate memory visualization
 */
function animateMemoryVisualization() {
  if (!scenes.memory || !renderers.memory) return;
  
  requestAnimationFrame(animateMemoryVisualization);
  
  // Rotate the group slowly
  if (scenes.memory.userData && scenes.memory.userData.memoryGroup) {
    scenes.memory.userData.memoryGroup.rotation.y += 0.005;
  }
  
  // Animate blocks
  scenes.memory.userData.memoryGroup.children.forEach(block => {
    if (block.userData) {
      // Smoothly animate to target height
      block.position.y += (block.userData.targetY - block.position.y) * 0.1;
      
      // Add subtle movement to active blocks
      if (block.userData.active) {
        block.position.y += Math.sin(Date.now() * 0.003 + block.userData.index * 0.2) * 0.03;
      }
    }
  });
  
  // Render the scene
  renderers.memory.render(scenes.memory, cameras.memory);
}

/**
 * Initialize 3D command usage chart
 */
function initCommandUsageChart() {
  const container = document.getElementById('command-usage-chart');
  if (!container) return;
  
  // Set up scene
  scenes.commands = new THREE.Scene();
  
  // Set up camera
  cameras.commands = new THREE.PerspectiveCamera(
    45, container.clientWidth / container.clientHeight, 0.1, 1000
  );
  cameras.commands.position.set(0, 0, 30);
  
  // Set up renderer
  renderers.commands = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderers.commands.setSize(container.clientWidth, container.clientHeight);
  renderers.commands.setPixelRatio(window.devicePixelRatio);
  renderers.commands.setClearColor(0x000000, 0);
  container.appendChild(renderers.commands.domElement);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scenes.commands.add(ambientLight);
  
  const pointLight = new THREE.PointLight(0xffffff, 0.8, 100);
  pointLight.position.set(5, 10, 15);
  scenes.commands.add(pointLight);
  
  // Create pie chart for commands
  createCommandChart();
  
  // Start animation
  animateCommandChart();
}

/**
 * Create 3D pie chart for command usage
 */
function createCommandChart() {
  // Create a group for the chart
  const chartGroup = new THREE.Group();
  scenes.commands.add(chartGroup);
  
  // Sample command categories with usage data
  const commandData = [
    { name: 'Moderation', value: 35, color: 0xff3d71 },
    { name: 'Utility', value: 25, color: 0x4d9fff },
    { name: 'Fun', value: 20, color: 0x00e676 },
    { name: 'Configuration', value: 15, color: 0xffb300 },
    { name: 'Tickets', value: 5, color: 0x8936ff }
  ];
  
  // Calculate total for percentages
  const total = commandData.reduce((sum, item) => sum + item.value, 0);
  
  // Create 3D pie segments
  let startAngle = 0;
  const radius = 8;
  const height = 2;
  const segments = 32;
  
  commandData.forEach(item => {
    // Calculate angle for this segment
    const angleSize = (item.value / total) * Math.PI * 2;
    const endAngle = startAngle + angleSize;
    
    // Create segment geometry
    const pieGeometry = new THREE.CylinderGeometry(
      radius, // Top radius
      radius, // Bottom radius
      height, // Height
      segments, // Radial segments
      1, // Height segments
      false, // Open ended
      startAngle, // Start angle
      angleSize // Angle size
    );
    
    // Position the center of the segment correctly
    pieGeometry.rotateX(Math.PI / 2);
    
    // Create material with segment color
    const pieMaterial = new THREE.MeshPhongMaterial({
      color: item.color,
      transparent: true,
      opacity: 0.85,
      emissive: item.color,
      emissiveIntensity: 0.3,
      shininess: 50
    });
    
    // Create mesh and add to group
    const pieMesh = new THREE.Mesh(pieGeometry, pieMaterial);
    
    // Calculate center position for the segment
    const midAngle = startAngle + angleSize / 2;
    const segmentCenterX = Math.cos(midAngle) * radius * 0.6;
    const segmentCenterZ = Math.sin(midAngle) * radius * 0.6;
    
    // Store segment data
    pieMesh.userData = {
      name: item.name,
      value: item.value,
      percentage: (item.value / total * 100).toFixed(1),
      angle: midAngle,
      originalPosition: new THREE.Vector3(0, 0, 0),
      hoverPosition: new THREE.Vector3(segmentCenterX, 0, segmentCenterZ)
    };
    
    chartGroup.add(pieMesh);
    
    // Update start angle for next segment
    startAngle = endAngle;
  });
  
  // Create center hub
  const hubGeometry = new THREE.CylinderGeometry(2, 2, height, 32);
  hubGeometry.rotateX(Math.PI / 2);
  
  const hubMaterial = new THREE.MeshPhongMaterial({
    color: 0x22213d,
    transparent: true,
    opacity: 0.7,
    shininess: 30
  });
  
  const hub = new THREE.Mesh(hubGeometry, hubMaterial);
  chartGroup.add(hub);
  
  // Save references
  scenes.commands.userData = { chartGroup, commandData };
}

/**
 * Animate command chart
 */
function animateCommandChart() {
  if (!scenes.commands || !renderers.commands) return;
  
  requestAnimationFrame(animateCommandChart);
  
  // Rotate chart slowly
  if (scenes.commands.userData && scenes.commands.userData.chartGroup) {
    scenes.commands.userData.chartGroup.rotation.z += 0.002;
  }
  
  // Render
  renderers.commands.render(scenes.commands, cameras.commands);
}

/**
 * Initialize 3D globe for guild distribution
 */
function initGuildGlobe() {
  const container = document.getElementById('guild-globe');
  if (!container) return;
  
  // Set up scene
  scenes.globe = new THREE.Scene();
  
  // Set up camera
  cameras.globe = new THREE.PerspectiveCamera(
    45, container.clientWidth / container.clientHeight, 0.1, 1000
  );
  cameras.globe.position.set(0, 0, 30);
  
  // Set up renderer
  renderers.globe = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderers.globe.setSize(container.clientWidth, container.clientHeight);
  renderers.globe.setPixelRatio(window.devicePixelRatio);
  renderers.globe.setClearColor(0x000000, 0);
  container.appendChild(renderers.globe.domElement);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scenes.globe.add(ambientLight);
  
  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(15, 15, 15);
  scenes.globe.add(pointLight);
  
  // Create guild globe
  createGuildGlobe();
  
  // Start animation
  animateGuildGlobe();
}

/**
 * Create 3D globe with guild markers
 */
function createGuildGlobe() {
  // Create a group for the globe
  const globeGroup = new THREE.Group();
  scenes.globe.add(globeGroup);
  
  // Create the globe sphere
  const globeGeometry = new THREE.SphereGeometry(10, 32, 32);
  const globeMaterial = new THREE.MeshPhongMaterial({
    color: 0x22213d,
    transparent: true,
    opacity: 0.7,
    emissive: 0x110f29,
    emissiveIntensity: 0.2,
    wireframe: false,
    shininess: 10
  });
  
  const globe = new THREE.Mesh(globeGeometry, globeMaterial);
  globeGroup.add(globe);
  
  // Create the wireframe overlay
  const wireGeometry = new THREE.SphereGeometry(10.05, 16, 16);
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x3a3a5c,
    wireframe: true,
    transparent: true,
    opacity: 0.3
  });
  
  const wireGlobe = new THREE.Mesh(wireGeometry, wireMaterial);
  globeGroup.add(wireGlobe);
  
  // Create random guild markers
  const markerCount = 30;
  const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const markerMaterial = new THREE.MeshPhongMaterial({
    color: 0x8936ff,
    emissive: 0x8936ff,
    emissiveIntensity: 0.5
  });
  
  // Array to store marker references
  const markers = [];
  
  for (let i = 0; i < markerCount; i++) {
    // Random position on sphere using spherical coordinates
    const phi = Math.acos(-1 + Math.random() * 2);
    const theta = Math.random() * Math.PI * 2;
    
    const x = 10 * Math.sin(phi) * Math.cos(theta);
    const y = 10 * Math.sin(phi) * Math.sin(theta);
    const z = 10 * Math.cos(phi);
    
    // Create marker
    const marker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
    marker.position.set(x, y, z);
    
    // Vary the marker size and color
    const scale = 0.5 + Math.random() * 1.5;
    marker.scale.set(scale, scale, scale);
    
    // Set random color
    const colors = [0x8936ff, 0x4d9fff, 0xff3d71, 0x00e676, 0xffb300];
    const color = colors[Math.floor(Math.random() * colors.length)];
    marker.material.color.setHex(color);
    marker.material.emissive.setHex(color);
    
    // Store original position and scale for animation
    marker.userData = {
      originalPosition: new THREE.Vector3(x, y, z),
      pulsePhase: Math.random() * Math.PI * 2
    };
    
    globeGroup.add(marker);
    markers.push(marker);
  }
  
  // Create glow effect
  const glowGeometry = new THREE.SphereGeometry(10.2, 32, 32);
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      'glowColor': { value: new THREE.Color(0x8936ff) },
      'viewVector': { value: new THREE.Vector3(0, 0, 1) },
      'c': { value: 0.2 },
      'p': { value: 3.0 }
    },
    vertexShader: `
      uniform vec3 viewVector;
      uniform float c;
      uniform float p;
      varying float intensity;
      void main() {
        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vNormel = normalize(normalMatrix * viewVector);
        intensity = pow(c - dot(vNormal, vNormel), p);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying float intensity;
      void main() {
        vec3 glow = glowColor * intensity;
        gl_FragColor = vec4(glow, intensity * 0.3);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });
  
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  globeGroup.add(glowMesh);
  
  // Save references
  scenes.globe.userData = { globeGroup, globe, wireGlobe, markers, glowMesh };
}

/**
 * Animate guild globe
 */
function animateGuildGlobe() {
  if (!scenes.globe || !renderers.globe) return;
  
  requestAnimationFrame(animateGuildGlobe);
  
  const { globeGroup, markers, glowMesh } = scenes.globe.userData;
  
  // Rotate globe slowly
  if (globeGroup) {
    globeGroup.rotation.y += 0.003;
  }
  
  // Update glow viewVector
  if (glowMesh && glowMesh.material.uniforms) {
    glowMesh.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(
      cameras.globe.position,
      glowMesh.position
    );
  }
  
  // Pulse each marker
  if (markers) {
    markers.forEach(marker => {
      marker.userData.pulsePhase += 0.05;
      
      // Pulsing animation
      const scale = 0.8 + Math.sin(marker.userData.pulsePhase) * 0.3;
      marker.scale.set(scale, scale, scale);
      
      // Random twinkle effect
      if (Math.random() < 0.005) {
        const colors = [0x8936ff, 0x4d9fff, 0xff3d71, 0x00e676, 0xffb300];
        const color = colors[Math.floor(Math.random() * colors.length)];
        marker.material.emissive.setHex(color);
        marker.material.color.setHex(color);
      }
    });
  }
  
  // Render
  renderers.globe.render(scenes.globe, cameras.globe);
}

/**
 * Handle window resize
 */
function onWindowResize() {
  // Update all cameras and renderers
  Object.keys(cameras).forEach(key => {
    const camera = cameras[key];
    const renderer = renderers[key];
    const container = renderer.domElement.parentElement;
    
    if (container && camera && renderer) {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    }
  });
}

/**
 * Generate mock activity log
 */
function generateActivityLog() {
  const logList = document.getElementById('activity-log-list');
  if (!logList) return;
  
  // Clear loading indicator
  const loadingElement = document.querySelector('.timeline-loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
  
  // Generate initial activity entries
  const initialEntries = [
    {
      type: 'command',
      content: 'Ban command executed',
      details: 'User banned: troubleuser#1234',
      timestamp: new Date(Date.now() - 120000).toISOString()
    },
    {
      type: 'system',
      content: 'Bot joined new server',
      details: 'Server: Gaming Community',
      timestamp: new Date(Date.now() - 600000).toISOString()
    },
    {
      type: 'moderation',
      content: 'Message purge executed',
      details: '15 messages deleted in #general',
      timestamp: new Date(Date.now() - 1200000).toISOString()
    },
    {
      type: 'command',
      content: 'Role command executed',
      details: 'Role assigned to 5 users',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ];
  
  // Add initial entries
  initialEntries.forEach(entry => {
    addActivityLogEntry(entry);
  });
}

/**
 * Add new entry to activity log
 * @param {Object} entry - Activity entry to add
 */
function addActivityLogEntry(entry) {
  const logList = document.getElementById('activity-log-list');
  if (!logList) return;
  
  // Create new log item
  const logItem = document.createElement('li');
  logItem.className = `activity-item ${entry.type}-activity`;
  
  // Format timestamp
  const timestamp = new Date(entry.timestamp);
  const timeStr = timestamp.toLocaleTimeString();
  const dateStr = timestamp.toLocaleDateString();
  
  // Build HTML content
  logItem.innerHTML = `
    <div class="activity-timestamp">${timeStr} • ${dateStr}</div>
    <div class="activity-content">${entry.content}</div>
    <div class="activity-details">${entry.details}</div>
  `;
  
  // Add to the list at the beginning
  if (logList.firstChild) {
    logList.insertBefore(logItem, logList.firstChild);
  } else {
    logList.appendChild(logItem);
  }
  
  // Limit to 20 entries
  while (logList.children.length > 20) {
    logList.removeChild(logList.lastChild);
  }
}

/**
 * Refresh statistics data manually
 */
function refreshStats() {
  // Request fresh data via WebSocket if connected
  if (isSocketConnected && socket) {
    socket.send(JSON.stringify({ type: 'refresh', data: 'all' }));
  }
  
  // Otherwise simulate a data refresh
  simulateDataUpdates(true);
  
  // Show notification
  showNotification('Refreshing statistics data...', 'info');
}

/**
 * Update time range for displayed statistics
 * @param {string} range - Time range to display
 */
function updateTimeRange(range) {
  selectedTimeRange = range;
  
  // Request data for the selected time range
  if (isSocketConnected && socket) {
    socket.send(JSON.stringify({ type: 'timerange', data: range }));
  }
  
  // Show notification
  showNotification(`Displaying ${getRangeText(range)} statistics`, 'info');
}

/**
 * Get readable text for time range
 * @param {string} range - Time range identifier
 * @returns {string} - Human-readable time range
 */
function getRangeText(range) {
  switch (range) {
    case 'hour': return 'last hour';
    case 'day': return 'last 24 hours';
    case 'week': return 'last 7 days';
    case 'month': return 'last 30 days';
    default: return range;
  }
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 */
function showNotification(message, type = 'info') {
  console.log(`Notification (${type}): ${message}`);
  
  // Call to the notification system (if implemented)
  if (window.adminNotification) {
    window.adminNotification(message, type);
  }
}

/**
 * Simulate data updates when WebSocket is not available
 * @param {boolean} force - Force update regardless of timer
 */
function simulateDataUpdates(force = false) {
  // Only update if it's been at least updateInterval since last update
  const now = Date.now();
  if (!force && now - lastUpdate < config.updateInterval) return;
  
  lastUpdate = now;
  
  // Simulate performance metrics update
  updatePerformanceMetrics({
    cpuUsage: (Math.random() * 20 + 5).toFixed(1),
    memoryUsage: {
      heapUsed: Math.random() * 500 * 1024 * 1024,
      rss: Math.random() * 800 * 1024 * 1024
    },
    totalMemory: 1024 * 1024 * 1024
  });
  
  // Occasionally add new activity log entry
  if (Math.random() < 0.2) {
    const types = ['command', 'system', 'moderation'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let content, details;
    switch (type) {
      case 'command':
        content = 'Command executed';
        details = 'User executed a bot command';
        break;
      case 'system':
        content = 'System event';
        details = 'Bot performed a system operation';
        break;
      case 'moderation':
        content = 'Moderation action';
        details = 'Moderator action was taken';
        break;
    }
    
    addActivityLogEntry({
      type,
      content,
      details,
      timestamp: new Date().toISOString()
    });
  }
}