/**
 * Particle effect script for SWOOSH Bot website
 * Creates animated particles in the background
 */
document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return; // Exit if canvas not found
  
  const ctx = canvas.getContext('2d');
  const particles = [];
  const particleCount = 70;
  const connectionDistance = 140;
  const mouseRadius = 120;
  
  let mouse = {
    x: null,
    y: null,
    radius: mouseRadius
  };
  
  // Track mouse position
  window.addEventListener('mousemove', function(event) {
    mouse.x = event.x;
    mouse.y = event.y;
  });
  
  // Resize canvas to fill window
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Re-initialize particles when window resizes
    initializeParticles();
  }
  
  // Particle class
  class Particle {
    constructor() {
      this.reset();
    }
    
    // Initialize or reset particle
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.speedX = Math.random() * 1 - 0.5;
      this.speedY = Math.random() * 1 - 0.5;
      this.color = '#9c4dff';
      
      // Load particle image
      if (!this.image) {
        this.image = new Image();
        this.image.src = '/images/particle.png';
      }
    }
    
    // Update particle position
    update() {
      // Move particle
      this.x += this.speedX;
      this.y += this.speedY;
      
      // Handle mouse interaction
      if (mouse.x != null && mouse.y != null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          const angle = Math.atan2(dy, dx);
          const force = (mouse.radius - distance) / mouse.radius;
          
          // Push particle away from mouse
          this.x -= Math.cos(angle) * force * 3;
          this.y -= Math.sin(angle) * force * 3;
        }
      }
      
      // Wrap around screen edges
      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      
      // Safety check - reset if outside bounds
      if (this.x < -50 || this.x > canvas.width + 50 || 
          this.y < -50 || this.y > canvas.height + 50) {
        this.reset();
      }
    }
    
    // Draw particle
    draw() {
      if (this.image.complete) {
        // Draw particle image with proper center alignment
        const size = this.size * 15; // Scale factor for particle size
        ctx.globalAlpha = 0.7;
        ctx.drawImage(this.image, this.x - size/2, this.y - size/2, size, size);
        ctx.globalAlpha = 1.0;
      } else {
        // Fallback if image not loaded
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }
  }
  
  // Create initial particles
  function createParticles() {
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }
  
  // Re-initialize all particles
  function initializeParticles() {
    particles.length = 0; // Clear array
    createParticles();
  }
  
  // Draw connections between nearby particles
  function drawConnections() {
    ctx.strokeStyle = 'rgba(156, 77, 255, 0.2)';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < connectionDistance) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          
          // Make connection opacity based on distance
          const opacity = 1 - (distance / connectionDistance);
          ctx.strokeStyle = `rgba(156, 77, 255, ${opacity * 0.2})`;
          
          ctx.stroke();
        }
      }
    }
  }
  
  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw all particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    
    // Draw connections between particles
    drawConnections();
    
    requestAnimationFrame(animate);
  }
  
  // Initialize everything
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  createParticles();
  animate();
});