document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('nav');
  
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function() {
      nav.classList.toggle('active');
    });
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