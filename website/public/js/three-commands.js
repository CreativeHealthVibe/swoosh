// Three.js animated background for the commands page
document.addEventListener('DOMContentLoaded', function() {
  console.log("Commands page Three.js script loaded");
  
  // Only initialize if on the commands page
  const commandsHeader = document.querySelector('.commands-header');
  if (!commandsHeader) {
    console.log("Commands header not found, aborting Three.js initialization");
    return;
  }

  // Check if THREE is available
  if (typeof THREE === 'undefined') {
    console.error("THREE.js is not loaded properly");
    return;
  }
  
  console.log("Initializing Three.js background for commands page");
  
  // Create canvas container
  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'commands-background';
  canvasContainer.style.position = 'absolute';
  canvasContainer.style.top = '0';
  canvasContainer.style.left = '0';
  canvasContainer.style.width = '100%';
  canvasContainer.style.height = '100%';
  canvasContainer.style.zIndex = '-1';
  canvasContainer.style.overflow = 'hidden';
  
  // Insert before the first child
  commandsHeader.insertBefore(canvasContainer, commandsHeader.firstChild);

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
  
  renderer.setSize(window.innerWidth, Math.max(commandsHeader.offsetHeight, 300));
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);

  // Create a grid of cubes representing commands
  const cubes = [];
  const gridSize = { x: 15, z: 10 };
  const spacing = 15;
  const cubeSize = 2;
  
  const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  
  // Different materials for various cube types
  const materials = [
    new THREE.MeshPhongMaterial({ color: 0x9c4dff, shininess: 80 }), // Primary
    new THREE.MeshPhongMaterial({ color: 0x6a3aff, shininess: 80 }), // Secondary
    new THREE.MeshPhongMaterial({ color: 0xd6b4fc, shininess: 80 })  // Tertiary
  ];
  
  // Calculate grid center
  const centerX = (gridSize.x - 1) * spacing / 2;
  const centerZ = (gridSize.z - 1) * spacing / 2;
  
  // Create grid of cubes
  for (let x = 0; x < gridSize.x; x++) {
    for (let z = 0; z < gridSize.z; z++) {
      // Determine material based on position or random
      const materialIndex = Math.floor(Math.random() * materials.length);
      const cube = new THREE.Mesh(cubeGeometry, materials[materialIndex]);
      
      // Position in grid
      cube.position.x = x * spacing - centerX;
      cube.position.z = z * spacing - centerZ;
      
      // Randomize height
      cube.position.y = -15 + Math.random() * 10;
      
      // Randomize rotation
      cube.rotation.x = Math.random() * Math.PI * 2;
      cube.rotation.y = Math.random() * Math.PI * 2;
      cube.rotation.z = Math.random() * Math.PI * 2;
      
      // Store animation parameters
      cube.userData = {
        targetY: -5 + Math.random() * 10,
        floatSpeed: 0.2 + Math.random() * 0.3,
        rotateSpeed: {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
          z: (Math.random() - 0.5) * 0.01
        },
        phaseOffset: Math.random() * Math.PI * 2
      };
      
      // Add to scene and store reference
      scene.add(cube);
      cubes.push(cube);
    }
  }
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  const pointLight = new THREE.PointLight(0x9c4dff, 1, 100);
  pointLight.position.set(0, 10, 0);
  scene.add(pointLight);
  
  // Position camera
  camera.position.y = 10;
  camera.position.z = 35;
  camera.lookAt(0, 0, 0);
  
  // Animation loop
  const clock = new THREE.Clock();
  
  function animate() {
    requestAnimationFrame(animate);
    
    const time = clock.getElapsedTime();
    
    // Animate all cubes
    cubes.forEach(cube => {
      const { targetY, floatSpeed, rotateSpeed, phaseOffset } = cube.userData;
      
      // Float up and down
      cube.position.y = targetY + Math.sin(time * floatSpeed + phaseOffset) * 2;
      
      // Rotate slowly
      cube.rotation.x += rotateSpeed.x;
      cube.rotation.y += rotateSpeed.y;
      cube.rotation.z += rotateSpeed.z;
    });
    
    // Rotate camera around the scene
    const cameraRadius = 40;
    const cameraSpeed = 0.1;
    camera.position.x = Math.sin(time * cameraSpeed) * cameraRadius;
    camera.position.z = Math.cos(time * cameraSpeed) * cameraRadius;
    camera.lookAt(0, 0, 0);
    
    // Move point light
    pointLight.position.x = Math.sin(time * 0.5) * 15;
    pointLight.position.z = Math.cos(time * 0.5) * 15;
    
    renderer.render(scene, camera);
  }
  
  animate();
  
  // Handle window resize
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, Math.max(commandsHeader.offsetHeight, 300));
  }
  
  window.addEventListener('resize', onWindowResize);
  
  console.log("Three.js background initialized successfully");
});
