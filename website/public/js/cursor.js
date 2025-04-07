/**
 * Custom cursor effects
 */
document.addEventListener('DOMContentLoaded', function() {
  // Only add custom cursor on desktop devices
  if (window.innerWidth > 768) {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    
    // Add active class to show cursor
    document.body.classList.add('cursor-active');
    
    // Update cursor position on mouse move
    document.addEventListener('mousemove', (e) => {
      cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      
      // Add slight delay to outline for smooth effect
      setTimeout(() => {
        cursorOutline.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }, 50);
    });
    
    // Hover effect for interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, .member-card');
    
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursorDot.classList.add('hover');
        cursorOutline.classList.add('hover');
      });
      
      el.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('hover');
        cursorOutline.classList.remove('hover');
      });
    });
    
    // Click effect
    document.addEventListener('mousedown', () => {
      cursorDot.classList.add('click');
      cursorOutline.classList.add('click');
    });
    
    document.addEventListener('mouseup', () => {
      cursorDot.classList.remove('click');
      cursorOutline.classList.remove('click');
    });
    
    // Hide cursor when it leaves the window
    document.addEventListener('mouseleave', () => {
      cursorDot.style.opacity = '0';
      cursorOutline.style.opacity = '0';
    });
    
    document.addEventListener('mouseenter', () => {
      cursorDot.style.opacity = '1';
      cursorOutline.style.opacity = '1';
    });
  }
});
