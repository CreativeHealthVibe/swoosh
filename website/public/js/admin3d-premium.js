/**
 * SWOOSH Bot Premium Enhancement
 * 
 * JavaScript functionality for premium UI features and animations
 */

// Initialize premium theme features
document.addEventListener('DOMContentLoaded', () => {
  initPremiumTheme();
  initPremiumAnimations();
  enhanceUIComponents();
  initPremiumNavPills();
  initPremiumStatCards();
  initPremium3DEffects();
});

// Apply premium theme classes to body and containers
function initPremiumTheme() {
  // Add premium theme class to body
  document.body.classList.add('premium-theme');
  
  // Convert standard containers to premium containers
  document.querySelectorAll('.admin3d-dashboard, .admin3d-moderation').forEach(container => {
    container.classList.add('premium-container');
  });
  
  // Convert standard cards to premium cards
  document.querySelectorAll('.admin3d-card').forEach(card => {
    card.classList.add('premium-card');
    
    // Convert card header
    const header = card.querySelector('.admin3d-card-header');
    if (header) header.classList.add('premium-card-header');
    
    // Convert card title
    const title = card.querySelector('.admin3d-card-title');
    if (title) title.classList.add('premium-card-title');
    
    // Convert card icon
    const icon = card.querySelector('.admin3d-card-icon');
    if (icon) icon.classList.add('premium-card-icon');
    
    // Convert card content
    const content = card.querySelector('.admin3d-card-content');
    if (content) content.classList.add('premium-card-body');
    
    // Convert buttons
    card.querySelectorAll('.admin3d-btn').forEach(btn => {
      btn.classList.add('premium-btn');
      if (btn.classList.contains('admin3d-btn-primary')) {
        btn.classList.add('premium-btn-primary');
      }
    });
  });
  
  // Apply premium styling to moderation page if present
  const modPage = document.querySelector('.admin3d-moderation');
  if (modPage) {
    // Enhance the moderation header
    const header = document.querySelector('.mod-header');
    if (header) header.classList.add('premium-moderation-header');
    
    // Enhance the moderation title
    const title = document.querySelector('.mod-title');
    if (title) title.classList.add('premium-moderation-title');
    
    // Enhance the moderation subtitle
    const subtitle = document.querySelector('.mod-subtitle');
    if (subtitle) subtitle.classList.add('premium-moderation-subtitle');
    
    // Enhance the server selector
    const serverSelector = document.querySelector('.mod-server-selector');
    if (serverSelector) serverSelector.classList.add('premium-server-selector');
    
    // Enhance statistics cards
    const statsCards = document.querySelector('.mod-stats-cards');
    if (statsCards) {
      statsCards.classList.add('premium-stats');
      
      // Enhance individual stat cards
      statsCards.querySelectorAll('.mod-stat-card').forEach(card => {
        card.classList.add('premium-stat-card');
        
        // Enhance stat icon
        const icon = card.querySelector('.mod-stat-icon');
        if (icon) icon.classList.add('premium-stat-icon');
        
        // Enhance stat content
        const content = card.querySelector('.mod-stat-content');
        if (content) {
          // Enhance value
          const value = content.querySelector('h3');
          if (value) value.classList.add('premium-stat-value');
        }
      });
    }
    
    // Enhance tab navigation
    const tabNav = document.querySelector('.mod-tab-navigation');
    if (tabNav) {
      tabNav.classList.add('premium-nav-pills');
      
      // Add indicator element
      const indicator = document.createElement('span');
      indicator.classList.add('premium-nav-pill-indicator');
      tabNav.appendChild(indicator);
      
      // Enhance tab buttons
      const tabButtons = tabNav.querySelectorAll('.mod-nav-btn');
      tabButtons.forEach(btn => {
        btn.classList.add('premium-nav-pill');
        
        // Position indicator on the active tab
        if (btn.classList.contains('active')) {
          positionIndicator(btn, indicator);
        }
        
        // Update indicator position on click
        btn.addEventListener('click', () => {
          tabButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          positionIndicator(btn, indicator);
        });
      });
    }
    
    // Enhance tab content areas
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('premium-tab-content');
    });
    
    // Enhance section headers
    document.querySelectorAll('.mod-section-header').forEach(header => {
      header.classList.add('premium-card-header');
    });
    
    // Enhance tables
    document.querySelectorAll('.admin3d-table-wrapper').forEach(wrapper => {
      wrapper.classList.add('premium-table-wrapper');
      
      const table = wrapper.querySelector('.admin3d-table');
      if (table) table.classList.add('premium-table');
    });
    
    // Enhance form elements
    document.querySelectorAll('input[type="text"], input[type="number"], textarea, select').forEach(input => {
      if (!input.classList.contains('premium-form-input')) {
        if (input.tagName === 'SELECT') {
          input.classList.add('premium-form-select');
        } else if (input.tagName === 'TEXTAREA') {
          input.classList.add('premium-form-textarea');
        } else {
          input.classList.add('premium-form-input');
        }
      }
    });
    
    // Enhance buttons
    document.querySelectorAll('.mod-btn').forEach(btn => {
      btn.classList.add('premium-btn');
      
      if (btn.classList.contains('danger-btn')) {
        btn.classList.add('premium-btn-danger');
      } else {
        btn.classList.add('premium-btn-primary');
      }
    });
    
    // Enhance premium badges
    document.querySelectorAll('.mod-premium-badge').forEach(badge => {
      badge.classList.add('premium-badge', 'premium-badge-gold');
    });
    
    // Three.js container enhancement
    const threeContainer = document.getElementById('moderation-three-container');
    if (threeContainer) {
      threeContainer.classList.add('premium-three-container');
    }
  }
}

// Initialize premium animations
function initPremiumAnimations() {
  // Add entrance animations to stat cards
  const statCards = document.querySelectorAll('.premium-stat-card, .mod-stat-card');
  if (statCards.length > 0) {
    statCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 100 + (index * 100));
    });
  }
  
  // Add entrance animations to premium cards
  const premiumCards = document.querySelectorAll('.premium-card, .admin3d-card');
  if (premiumCards.length > 0) {
    premiumCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px) scale(0.98)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
      }, 300 + (index * 100));
    });
  }
  
  // Add subtle hover animations to various elements
  addHoverEffects();
}

// Add hover effects to interactive elements
function addHoverEffects() {
  // Add glow effect on hover for icons
  document.querySelectorAll('.premium-card-icon, .premium-stat-icon, .mod-stat-icon').forEach(icon => {
    icon.addEventListener('mouseenter', () => {
      icon.style.transform = 'scale(1.1)';
      icon.style.boxShadow = '0 0 20px rgba(137, 54, 255, 0.5)';
    });
    
    icon.addEventListener('mouseleave', () => {
      icon.style.transform = 'scale(1)';
      icon.style.boxShadow = '0 0 15px rgba(137, 54, 255, 0.3)';
    });
  });
  
  // Add hover effects for table rows
  document.querySelectorAll('.premium-table tr, .admin3d-table tr').forEach(row => {
    if (!row.closest('thead') && !row.classList.contains('empty-state')) {
      row.addEventListener('mouseenter', () => {
        row.style.transform = 'translateX(5px)';
        row.style.transition = 'transform 0.3s ease';
      });
      
      row.addEventListener('mouseleave', () => {
        row.style.transform = 'translateX(0)';
      });
    }
  });
}

// Enhance various UI components
function enhanceUIComponents() {
  // Add tooltip functionality
  initTooltips();
  
  // Add subtle parallax effects to cards
  addParallaxEffects();
  
  // Add click effects to buttons
  document.querySelectorAll('.premium-btn, .mod-btn, .admin3d-btn').forEach(btn => {
    btn.addEventListener('mousedown', () => {
      btn.style.transform = 'scale(0.98)';
    });
    
    btn.addEventListener('mouseup', () => {
      btn.style.transform = 'scale(1)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
    });
  });
}

// Initialize tooltips
function initTooltips() {
  document.querySelectorAll('[data-tooltip]').forEach(element => {
    const tooltipText = element.getAttribute('data-tooltip');
    if (!tooltipText) return;
    
    element.addEventListener('mouseenter', (e) => {
      const tooltip = document.createElement('div');
      tooltip.className = 'premium-tooltip';
      tooltip.textContent = tooltipText;
      document.body.appendChild(tooltip);
      
      // Position the tooltip
      const rect = element.getBoundingClientRect();
      tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
      
      // Add a class to show the tooltip with animation
      setTimeout(() => tooltip.classList.add('show'), 10);
      
      // Store reference to the tooltip
      element._tooltip = tooltip;
    });
    
    element.addEventListener('mouseleave', () => {
      if (element._tooltip) {
        element._tooltip.classList.remove('show');
        setTimeout(() => {
          if (element._tooltip && element._tooltip.parentNode) {
            element._tooltip.parentNode.removeChild(element._tooltip);
          }
          element._tooltip = null;
        }, 300);
      }
    });
  });
}

// Add subtle parallax effects to cards
function addParallaxEffects() {
  document.querySelectorAll('.premium-card, .admin3d-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;
      
      const moveX = (e.clientX - cardCenterX) / 20;
      const moveY = (e.clientY - cardCenterY) / 20;
      
      card.style.transform = `perspective(1000px) rotateY(${moveX * -1}deg) rotateX(${moveY}deg) translateZ(10px)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateZ(0)';
    });
  });
}

// Initialize premium nav pills
function initPremiumNavPills() {
  const navPills = document.querySelectorAll('.premium-nav-pills');
  navPills.forEach(nav => {
    const buttons = nav.querySelectorAll('.premium-nav-pill');
    const indicator = nav.querySelector('.premium-nav-pill-indicator');
    
    if (!indicator || buttons.length === 0) return;
    
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        // Set active class
        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Animate indicator
        positionIndicator(button, indicator);
        
        // Handle tab content if available
        const tabId = button.getAttribute('data-tab');
        if (tabId) {
          document.querySelectorAll('.premium-tab-content, .tab-content').forEach(content => {
            content.classList.remove('active');
          });
          
          const tabContent = document.getElementById(tabId);
          if (tabContent) {
            tabContent.classList.add('active');
          }
        }
      });
    });
    
    // Position indicator on initial active tab
    const activeTab = nav.querySelector('.premium-nav-pill.active');
    if (activeTab) {
      positionIndicator(activeTab, indicator);
    }
  });
}

// Position the indicator element under a nav pill
function positionIndicator(button, indicator) {
  if (!button || !indicator) return;
  
  const buttonRect = button.getBoundingClientRect();
  const navRect = button.parentElement.getBoundingClientRect();
  
  indicator.style.width = `${buttonRect.width}px`;
  indicator.style.left = `${buttonRect.left - navRect.left}px`;
}

// Initialize premium stat cards
function initPremiumStatCards() {
  document.querySelectorAll('.premium-stat-card, .mod-stat-card').forEach(card => {
    // Add hover animation
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px)';
      card.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(137, 54, 255, 0.2)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
    
    // Animate stat value on visibility
    const statValue = card.querySelector('.premium-stat-value');
    if (statValue) {
      // Observe when the card comes into view
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(statValue);
            observer.unobserve(card);
          }
        });
      }, { threshold: 0.1 });
      
      observer.observe(card);
    }
  });
}

// Animate counter from 0 to target number
function animateCounter(element) {
  if (!element) return;
  
  const targetValue = parseInt(element.textContent);
  if (isNaN(targetValue)) return;
  
  const duration = 1500;
  const startTime = performance.now();
  
  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out cubic function for smooth deceleration
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(easeOutCubic * targetValue);
    
    element.textContent = currentValue;
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = targetValue;
    }
  }
  
  requestAnimationFrame(updateCounter);
}

// Initialize premium 3D effects
function initPremium3DEffects() {
  // Only add 3D effects if THREE.js is available
  if (window.THREE) {
    const threeDContainers = document.querySelectorAll('.premium-three-container, #moderation-three-container');
    
    threeDContainers.forEach(container => {
      // Initialize abstract particles background
      initAbstractParticlesBackground(container);
    });
  }
}

// Create an abstract particles background with THREE.js
function initAbstractParticlesBackground(container) {
  if (!window.THREE) return;
  
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // Create scene, camera, and renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x6928c5, 0.2);
  scene.add(ambientLight);
  
  // Add point light
  const pointLight = new THREE.PointLight(0x8936ff, 1);
  pointLight.position.set(0, 0, 5);
  scene.add(pointLight);
  
  // Create particles
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 500;
  
  const posArray = new Float32Array(particlesCount * 3);
  const scaleArray = new Float32Array(particlesCount);
  
  for (let i = 0; i < particlesCount * 3; i += 3) {
    // Position particles in a sphere
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI * 2;
    const radius = 50 + Math.random() * 200;
    
    posArray[i] = Math.cos(angle1) * Math.sin(angle2) * radius;      // x
    posArray[i + 1] = Math.sin(angle1) * Math.sin(angle2) * radius;  // y
    posArray[i + 2] = Math.cos(angle2) * radius;                     // z
    
    // Set random particle scale
    scaleArray[i / 3] = Math.random() * 2 + 0.5;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scaleArray, 1));
  
  // Add shader material
  const particleMaterial = new THREE.PointsMaterial({
    size: 2,
    sizeAttenuation: true,
    map: createParticleTexture(),
    alphaTest: 0.5,
    transparent: true,
    color: 0xa264ff
  });
  
  // Create particle system
  const particleSystem = new THREE.Points(particlesGeometry, particleMaterial);
  scene.add(particleSystem);
  
  // Position camera
  camera.position.z = 300;
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Rotate particle system
    particleSystem.rotation.x += 0.0005;
    particleSystem.rotation.y += 0.0008;
    
    // Add wave motion to particles
    const positions = particlesGeometry.attributes.position.array;
    const time = Date.now() * 0.0001;
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
      const px = positions[i];
      const py = positions[i + 1];
      const pz = positions[i + 2];
      
      // Apply wave motion
      const distance = Math.sqrt(px * px + py * py + pz * pz);
      const wave = Math.sin(distance * 0.03 + time) * 2;
      
      positions[i] += px / distance * wave * 0.2;
      positions[i + 1] += py / distance * wave * 0.2;
      positions[i + 2] += pz / distance * wave * 0.2;
    }
    
    particlesGeometry.attributes.position.needsUpdate = true;
    
    renderer.render(scene, camera);
  }
  
  animate();
  
  // Handle window resize
  window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(newWidth, newHeight);
  });
}

// Create a soft particle texture
function createParticleTexture() {
  const canvas = document.createElement('canvas');
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  
  const context = canvas.getContext('2d');
  
  // Create gradient
  const gradient = context.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(200, 200, 255, 0.8)');
  gradient.addColorStop(0.8, 'rgba(137, 54, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(100, 50, 255, 0)');
  
  // Draw particle
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  context.fill();
  
  // Create texture
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}