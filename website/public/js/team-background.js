/**
 * Three.js background animation for team page
 */
document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('team-bg');
  if (!container) return;

  let scene, camera, renderer, particles;
  const particleCount = 100;
  let time = 0;
  const colors = [
    new THREE.Color(0x9c4dff), // Primary purple
    new THREE.Color(0x7c3acd), // Darker purple
    new THREE.Color(0xb76eff), // Lighter purple
  ];

  init();
  animate();

  function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Set up camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 1000;
    
    // Create particle geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colorArray = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Position particles in a circular area with random distribution
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 900;
      
      positions[i * 3] = Math.cos(angle) * radius;             // x
      positions[i * 3 + 1] = Math.sin(angle) * radius - 400;   // y
      positions[i * 3 + 2] = Math.random() * 500 - 250;         // z
      
      // Random sizes between 5 and 40
      sizes[i] = 5 + Math.random() * 35;
      
      // Assign colors
      const color = colors[Math.floor(Math.random() * colors.length)];
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    // Create shader material for particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          
          // Simple wave animation based on time and position
          vec3 pos = position;
          pos.y += sin(time * 0.5 + position.x * 0.02) * 20.0;
          pos.x += cos(time * 0.3 + position.y * 0.02) * 20.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Create a circular particle with soft edges
          float r = 0.5;
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float c = smoothstep(r, r - 0.1, d);
          
          gl_FragColor = vec4(vColor, c * 0.6); // Semi-transparent
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Create particle system
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Set up renderer
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);
    
    time += 0.01;
    if (particles.material.uniforms) {
      particles.material.uniforms.time.value = time;
    }
    
    // Slowly rotate particles
    particles.rotation.z += 0.001;
    
    renderer.render(scene, camera);
  }
});
