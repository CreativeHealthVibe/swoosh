document.addEventListener('DOMContentLoaded', function() {
  // Set up the background scene
  const container = document.getElementById('team-bg');
  
  // Initialize the scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  // Create renderer with transparent background
  const renderer = new THREE.WebGLRenderer({ 
    alpha: true,
    antialias: true
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  
  // Create geometry for particles
  const particlesGeometry = new THREE.BufferGeometry();
  const particleCount = 1500;
  
  // Create positions array for particles
  const positions = new Float32Array(particleCount * 3);
  const scales = new Float32Array(particleCount);
  
  // Set random positions and scales
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;     // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10; // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
    
    scales[i] = Math.random() * 2.0;
  }
  
  // Add positions and scales to geometry
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
  
  // Create custom shader material
  const particlesMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(0x9370DB) }, // Purple color
    },
    vertexShader: `
      attribute float scale;
      uniform float time;
      
      void main() {
        vec3 pos = position;
        
        // Add subtle animation to particles
        pos.x += sin(pos.y * 0.2 + time * 0.5) * 0.1;
        pos.y += cos(pos.x * 0.2 + time * 0.5) * 0.1;
        pos.z += cos(pos.x * pos.y * 0.1 + time * 0.3) * 0.1;
        
        // Position particles
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Scale particles
        gl_PointSize = scale * (20.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      
      void main() {
        // Create circular particles
        float dist = length(gl_PointCoord - vec2(0.5, 0.5));
        if (dist > 0.5) discard;
        
        // Smooth edges
        float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
        
        gl_FragColor = vec4(color, alpha * 0.7);  // semi-transparent
      }
    `,
    transparent: true,
    depthWrite: false
  });
  
  // Create particle system
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);
  
  // Set camera position
  camera.position.z = 5;
  
  // Handle window resize
  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  window.addEventListener('resize', handleResize);
  
  // Animation loop
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    
    time += 0.01;
    particlesMaterial.uniforms.time.value = time;
    
    // Rotate particles slightly
    particles.rotation.x = Math.sin(time * 0.1) * 0.05;
    particles.rotation.y = Math.cos(time * 0.1) * 0.05;
    
    renderer.render(scene, camera);
  }
  
  animate();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', function() {
    window.removeEventListener('resize', handleResize);
    renderer.dispose();
    particlesGeometry.dispose();
    particlesMaterial.dispose();
  });
});
