/**
 * Custom Cursor Implementation
 * Creates an interactive cursor that follows mouse movement and reacts to interactive elements
 */

document.addEventListener('DOMContentLoaded', function() {
  // Create custom cursor elements
  const cursor = document.getElementById('custom-cursor');
  if (!cursor) return;
  
  // Track mouse position
  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;
  
  // Find all interactive elements
  const interactiveElements = document.querySelectorAll('a, button, .card, .feature-card, input, select, textarea, [role="button"]');
  
  // Update mouse position on mouse move
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Hide the default cursor
    document.body.style.cursor = 'none';
    
    // Show the custom cursor
    cursor.style.display = 'block';
  });
  
  // Handle interactive elements hover
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('cursor-hover');
    });
    
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('cursor-hover');
    });
  });
  
  // Handle mouse clicks
  document.addEventListener('mousedown', () => {
    cursor.classList.add('cursor-click');
  });
  
  document.addEventListener('mouseup', () => {
    cursor.classList.remove('cursor-click');
  });
  
  // Hide cursor when mouse leaves window
  document.addEventListener('mouseleave', () => {
    cursor.style.display = 'none';
  });
  
  document.addEventListener('mouseenter', () => {
    cursor.style.display = 'block';
  });
  
  // Smoothly animate cursor position
  function animateCursor() {
    // Calculate the distance between current cursor position and target (mouse position)
    const dx = mouseX - cursorX;
    const dy = mouseY - cursorY;
    
    // Move cursor smoothly towards mouse (easing)
    cursorX += dx * 0.2;
    cursorY += dy * 0.2;
    
    // Apply positions to cursor element
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    
    // Continue animation loop
    requestAnimationFrame(animateCursor);
  }
  
  // Start animation
  animateCursor();
  
  // Add cursor styles if not already in CSS
  if (!document.querySelector('style#cursor-styles')) {
    const style = document.createElement('style');
    style.id = 'cursor-styles';
    style.textContent = `
      .custom-cursor {
        position: fixed;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: rgba(156, 77, 255, 0.3);
        border: 2px solid #9c4dff;
        pointer-events: none;
        z-index: 9999;
        transition: width 0.2s, height 0.2s, background-color 0.2s, transform 0.01s;
        transform: translate(-50%, -50%);
        mix-blend-mode: difference;
      }
      
      .custom-cursor::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 4px;
        height: 4px;
        background-color: white;
        border-radius: 50%;
        transition: width 0.2s, height 0.2s;
      }
      
      .cursor-hover {
        width: 40px;
        height: 40px;
        background-color: rgba(156, 77, 255, 0.2);
        border-width: 1px;
      }
      
      .cursor-hover::after {
        width: 6px;
        height: 6px;
      }
      
      .cursor-click {
        width: 15px;
        height: 15px;
        background-color: rgba(156, 77, 255, 0.7);
      }
      
      body {
        cursor: none;
      }
    `;
    document.head.appendChild(style);
  }
});