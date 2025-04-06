/**
 * Main JavaScript file for SWOOSH Bot website
 */
document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const mobileCloseBtn = document.querySelector('.mobile-close-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  // Create a menu overlay element
  const menuOverlay = document.createElement('div');
  menuOverlay.className = 'menu-overlay';
  document.body.appendChild(menuOverlay);
  
  // Open mobile menu
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
      mobileMenu.classList.add('open');
      menuOverlay.classList.add('open');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    });
  }
  
  // Close mobile menu
  if (mobileCloseBtn) {
    mobileCloseBtn.addEventListener('click', closeMenu);
  }
  
  // Close menu when clicking overlay
  menuOverlay.addEventListener('click', closeMenu);
  
  function closeMenu() {
    mobileMenu.classList.remove('open');
    menuOverlay.classList.remove('open');
    document.body.style.overflow = ''; // Re-enable scrolling
  }
  
  // Navbar scroll effect
  const navbar = document.querySelector('.navbar');
  
  function checkScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  
  // Run once on page load
  checkScroll();
  
  // Add scroll event listener
  window.addEventListener('scroll', checkScroll);
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      
      if (target) {
        e.preventDefault();
        
        // Close mobile menu if open
        if (mobileMenu.classList.contains('open')) {
          closeMenu();
        }
        
        // Smooth scroll to target
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});
