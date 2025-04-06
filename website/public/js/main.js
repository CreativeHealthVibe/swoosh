document.addEventListener('DOMContentLoaded', function() {
  // Toggle mobile navigation
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  
  if (navToggle) {
    navToggle.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      navToggle.classList.toggle('active');
    });
  }
  
  // Close mobile nav when clicking outside
  document.addEventListener('click', function(event) {
    const isClickInside = navToggle.contains(event.target) || navLinks.contains(event.target);
    
    if (!isClickInside && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      navToggle.classList.remove('active');
    }
  });
  
  // Add scroll class to header
  window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    header.classList.toggle('scrolled', window.scrollY > 50);
  });
});
