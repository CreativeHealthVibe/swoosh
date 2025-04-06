/**
 * Custom cursor implementation for SWOOSH Bot website
 * Creates a smooth, animated cursor that follows mouse movement
 */
document.addEventListener('DOMContentLoaded', function() {
  // Get existing cursor elements
  const cursorDot = document.getElementById('cursor-dot');
  const cursorOutline = document.getElementById('cursor-outline');
  
  // Skip if elements don't exist
  if (!cursorDot || !cursorOutline) return;
  
  // Variables for cursor position
  let mouseX = 0;
  let mouseY = 0;
  let dotX = 0;
  let dotY = 0;
  let outlineX = 0;
  let outlineY = 0;
  
  // Track mouse movement
  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Add custom cursor class to body
    if (!document.body.classList.contains('custom-cursor')) {
      document.body.classList.add('custom-cursor');
    }
  });
  
  // Handle cursor on interactive elements
  const interactiveElements = document.querySelectorAll('a, button, .btn, .interactive, .feature-card, .stat-card, .team-member, .command-card');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorOutline.classList.add('cursor-hover');
    });
    
    el.addEventListener('mouseleave', () => {
      cursorOutline.classList.remove('cursor-hover');
    });
  });
  
  // Hide cursor when mouse leaves the window
  document.addEventListener('mouseout', function(e) {
    if (e.relatedTarget === null) {
      cursorDot.style.opacity = 0;
      cursorOutline.style.opacity = 0;
    }
  });
  
  // Handle touch devices
  document.addEventListener('touchstart', function() {
    cursorDot.style.opacity = 0;
    cursorOutline.style.opacity = 0;
    document.body.classList.remove('custom-cursor');
  });
  
  // Animation loop for smooth cursor movement
  function animateCursor() {
    // Calculate smooth movement with easing
    dotX += (mouseX - dotX) * 0.3;
    dotY += (mouseY - dotY) * 0.3;
    
    outlineX += (mouseX - outlineX) * 0.15;
    outlineY += (mouseY - outlineY) * 0.15;
    
    // Apply positions with transform translate
    if (cursorDot.style.opacity !== '0') {
      cursorDot.style.opacity = 1;
      cursorOutline.style.opacity = 1;
      
      // Update positions with hardware-accelerated transforms
      cursorDot.style.transform = `translate(${dotX}px, ${dotY}px)`;
      cursorOutline.style.transform = `translate(${outlineX}px, ${outlineY}px)`;
    }
    
    // Continue animation
    requestAnimationFrame(animateCursor);
  }
  
  // Start animation
  animateCursor();
});