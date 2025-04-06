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
        let roleClass = 'developer';
        if (member.role.toLowerCase().includes('owner')) {
          roleClass = 'owner';
        } else if (member.role.toLowerCase().includes('manager')) {
          roleClass = 'manager';
        }
        
        // Use the fetched avatar URL or fallback to a default
        const avatarUrl = member.avatarURL || '/img/default-avatar.png';
        
        // Status indicator (online, idle, dnd, offline)
        const statusClass = member.status ? `status-${member.status}` : 'status-offline';
        
        // Social links
        const discordLink = member.discordId ? `https://discord.com/users/${member.discordId}` : null;
        const githubLink = member.github ? `https://github.com/${member.github}` : null;
        const twitterLink = member.twitter ? `https://twitter.com/${member.twitter}` : null;
        
        // Create HTML for social links
        let socialLinks = '';
        if (discordLink) {
          socialLinks += `<a href="${discordLink}" class="social-link" target="_blank" title="Discord Profile"><i class="fab fa-discord"></i></a>`;
        }
        if (githubLink) {
          socialLinks += `<a href="${githubLink}" class="social-link" target="_blank" title="GitHub Profile"><i class="fab fa-github"></i></a>`;
        }
        if (twitterLink) {
          socialLinks += `<a href="${twitterLink}" class="social-link" target="_blank" title="Twitter Profile"><i class="fab fa-twitter"></i></a>`;
        }
        
        memberElement.innerHTML = `
          <div class="member-banner"></div>
          <div class="member-avatar">
            <img src="${avatarUrl}" alt="${member.name}">
            <div class="status-indicator ${statusClass}"></div>
          </div>
          ${member.badge ? `<div class="member-badge" title="${member.badge.title}"><i class="${member.badge.icon}"></i></div>` : ''}
          <div class="member-content">
            <h3 class="member-name">${member.name}</h3>
            <span class="member-role ${roleClass}">${member.role}</span>
            <p class="member-bio">${member.description || 'Team member of SWOOSH Bot'}</p>
            <div class="member-social">
              ${socialLinks}
            </div>
          </div>
        `;
        
        teamContainer.appendChild(memberElement);
      });
      
      // Add animation to team members
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      
      document.querySelectorAll('.team-member').forEach((member) => {
        observer.observe(member);
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
