/**
 * Premium Backgrounds
 * Dynamic, interactive background effects for premium admin sections
 */

document.addEventListener('DOMContentLoaded', () => {
  initPremiumBackgrounds();
});

// Initialize premium background effects
function initPremiumBackgrounds() {
  // Apply dynamic background to admin wrapper if not already applied
  const adminWrapper = document.querySelector('.admin-wrapper');
  if (adminWrapper && !adminWrapper.classList.contains('premium-bg-applied')) {
    // Add dynamic background layer
    const bgLayer = document.createElement('div');
    bgLayer.className = 'premium-bg-layer';
    
    // Add animated gradient elements
    for (let i = 0; i < 4; i++) {
      const gradient = document.createElement('div');
      gradient.className = `premium-bg-gradient gradient-${i + 1}`;
      bgLayer.appendChild(gradient);
    }
    
    // Add grid pattern overlay
    const gridPattern = document.createElement('div');
    gridPattern.className = 'premium-bg-grid';
    bgLayer.appendChild(gridPattern);
    
    // Add particles container
    const particles = document.createElement('div');
    particles.className = 'premium-bg-particles';
    
    // Create particles
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'premium-particle';
      
      // Random position
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      
      // Random size
      const size = 1 + Math.random() * 4;
      
      // Random opacity
      const opacity = 0.2 + Math.random() * 0.5;
      
      // Random animation duration
      const duration = 20 + Math.random() * 40;
      
      // Apply styles
      particle.style.left = `${posX}%`;
      particle.style.top = `${posY}%`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.opacity = opacity;
      particle.style.animationDuration = `${duration}s`;
      
      particles.appendChild(particle);
    }
    
    bgLayer.appendChild(particles);
    
    // Add to admin wrapper before any other children
    adminWrapper.insertBefore(bgLayer, adminWrapper.firstChild);
    adminWrapper.classList.add('premium-bg-applied');
    
    // Create mouse parallax effect
    createParallaxEffect();
  }
  
  // Check for specific dashboard sections that need enhanced backgrounds
  const admin3dSections = document.querySelectorAll('.admin3d-section, .mod-section, .stats-section');
  
  admin3dSections.forEach((section, index) => {
    // Don't apply to all sections to avoid performance issues
    // Only apply to key sections like stats or highlighted modules
    const shouldEnhance = section.classList.contains('stats-section') || 
                          section.classList.contains('featured') || 
                          section.classList.contains('highlight') ||
                          section.classList.contains('tier-section') ||
                          index === 0; // First section
    
    if (shouldEnhance && !section.classList.contains('premium-section-bg')) {
      section.classList.add('premium-section-bg');
      
      // Add light burst effect to section
      const lightBurst = document.createElement('div');
      lightBurst.className = 'premium-light-burst';
      section.appendChild(lightBurst);
      
      // Add section background gradient
      const sectionBg = document.createElement('div');
      sectionBg.className = 'premium-section-bg-gradient';
      section.appendChild(sectionBg);
    }
  });
}

// Create parallax effect for background elements
function createParallaxEffect() {
  const bgLayer = document.querySelector('.premium-bg-layer');
  if (!bgLayer) return;
  
  const gradients = bgLayer.querySelectorAll('.premium-bg-gradient');
  const particles = bgLayer.querySelectorAll('.premium-particle');
  
  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    // Calculate mouse position as percentage of window
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    // Move gradients slightly based on mouse position
    gradients.forEach((gradient, index) => {
      const factorX = (index + 1) * 2;
      const factorY = (index + 1) * 2;
      
      const translateX = (mouseX - 0.5) * factorX;
      const translateY = (mouseY - 0.5) * factorY;
      
      gradient.style.transform = `translate(${translateX}%, ${translateY}%)`;
    });
    
    // Subtle movement for particles
    particles.forEach((particle) => {
      const translateX = (mouseX - 0.5) * 5;
      const translateY = (mouseY - 0.5) * 5;
      
      particle.style.transform = `translate(${translateX}px, ${translateY}px)`;
    });
  });
}

// Function to add dynamic cards that respond to cursor movement
function enhanceCardElements() {
  const cards = document.querySelectorAll('.stat-card, .admin3d-card, .feature-card');
  
  cards.forEach(card => {
    // Skip already enhanced cards
    if (card.classList.contains('premium-card-enhanced')) return;
    
    // Mark as enhanced
    card.classList.add('premium-card-enhanced');
    
    // Add shine effect layer
    const shine = document.createElement('div');
    shine.className = 'premium-card-shine';
    card.appendChild(shine);
    
    // Add tilt effect on mouse move
    card.addEventListener('mousemove', (e) => {
      // Get position of cursor within card
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // X position within card
      const y = e.clientY - rect.top; // Y position within card
      
      // Calculate rotation based on cursor position
      // Convert to percentage and then to degrees (-10 to 10)
      const rotateX = ((y / rect.height) - 0.5) * -10;
      const rotateY = ((x / rect.width) - 0.5) * 10;
      
      // Apply the rotation
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      
      // Update shine effect
      const percentX = x / rect.width * 100;
      const percentY = y / rect.height * 100;
      shine.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)`;
    });
    
    // Reset on mouse leave
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
      shine.style.background = 'none';
    });
  });
}

// Periodically check for new card elements to enhance
setInterval(enhanceCardElements, 2000);

// Initial call to enhance existing cards
setTimeout(enhanceCardElements, 1000);