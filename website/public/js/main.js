document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('nav');
  
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function() {
      nav.classList.toggle('active');
    });
  }
  
  // Team members loading
  const teamContainer = document.getElementById('team-members-container');
  if (teamContainer) {
    loadTeamMembers();
  }
  
  // Command search functionality
  const searchInput = document.getElementById('command-search');
  const commandCards = document.querySelectorAll('.command-card');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      
      commandCards.forEach(card => {
        const commandName = card.querySelector('.command-name').textContent.toLowerCase();
        const commandDesc = card.querySelector('.command-description').textContent.toLowerCase();
        
        if (commandName.includes(searchTerm) || commandDesc.includes(searchTerm)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
  
  // Category filter
  const categoryItems = document.querySelectorAll('#category-list li');
  
  if (categoryItems.length > 0) {
    categoryItems.forEach(item => {
      item.addEventListener('click', function() {
        // Remove active class from all items
        categoryItems.forEach(cat => cat.classList.remove('active'));
        
        // Add active class to clicked item
        this.classList.add('active');
        
        const category = this.getAttribute('data-category');
        
        commandCards.forEach(card => {
          if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }
  
  // Status page auto-refresh
  if (document.querySelector('.status-overview')) {
    // Refresh the page every 60 seconds if on the status page
    setTimeout(() => {
      window.location.reload();
    }, 60000);
  }
});

/**
 * Load team members from the API
 */
function loadTeamMembers() {
  const teamContainer = document.getElementById('team-members-container');
  
  fetch('/api/team')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch team data');
      }
      return response.json();
    })
    .then(teamMembers => {
      // Clear loading indicator
      teamContainer.innerHTML = '';
      
      // Add each team member to the container
      teamMembers.forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.className = 'team-member';
        
        // Determine role class for styling
        const roleClass = member.role.toLowerCase().includes('owner') ? 'owner' : 'developer';
        const roleEmoji = member.role.toLowerCase().includes('owner') ? '👑' : '💻';
        
        // Use the fetched avatar URL or fallback to a default
        const avatarUrl = member.avatarURL || '/img/logo.png';
        
        memberElement.innerHTML = `
          <div class="member-avatar">
            <img src="${avatarUrl}" alt="${member.name}" class="${roleClass}-avatar">
            <div class="role-badge ${roleClass}">${roleEmoji} ${member.role.split(' ')[1] || member.role}</div>
          </div>
          <h3>${member.name}</h3>
          <p>${member.description}</p>
        `;
        
        teamContainer.appendChild(memberElement);
      });
    })
    .catch(error => {
      console.error('Error fetching team data:', error);
      teamContainer.innerHTML = `
        <div class="team-error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load team information. Please try again later.</p>
        </div>
      `;
    });
}
/**
 * Smooth scroll functionality
 */
document.addEventListener('DOMContentLoaded', function() {
  const scrollDown = document.querySelector('.scroll-down');
  
  if (scrollDown) {
    scrollDown.addEventListener('click', function() {
      // Smooth scroll to features section
      const featuresSection = document.querySelector('.features');
      if (featuresSection) {
        featuresSection.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }
    });
  }
  
  // Add glowing effect to primary buttons on hover
  const primaryButtons = document.querySelectorAll('.btn-primary');
  primaryButtons.forEach(btn => {
    btn.addEventListener('mouseenter', function() {
      this.style.boxShadow = '0 0 20px rgba(156, 77, 255, 0.7)';
    });
    
    btn.addEventListener('mouseleave', function() {
      this.style.boxShadow = '';
    });
  });
});
