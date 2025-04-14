/**
 * Admin3D Server Fix Script with Direct DOM Manipulation
 * This script directly fixes issues with server selection by manipulating the DOM
 */

// Instead of using event listeners, we'll use a self-executing function
(function() {
  console.log('Direct server fix script executing immediately');
  
  // Directly get the server selector
  let serverSelect = document.getElementById('server-select');
  
  // If it doesn't exist, look more broadly
  if (!serverSelect) {
    // Try by class combination
    serverSelect = document.querySelector('select.form-control.premium-select');
  }
  
  // If still not found, create one
  if (!serverSelect) {
    console.log('Server select not found, checking for container');
    const selectorContainer = document.querySelector('.select-container');
    
    if (selectorContainer) {
      console.log('Found select container, creating select element');
      // Create a new select element
      serverSelect = document.createElement('select');
      serverSelect.id = 'server-select';
      serverSelect.className = 'form-control premium-select';
      
      // Add the default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.disabled = true;
      defaultOption.selected = true;
      defaultOption.textContent = '- Select a server';
      serverSelect.appendChild(defaultOption);
      
      // Check if there are any guilds in the page data
      const guildsScript = document.querySelector('script[data-guilds]');
      if (guildsScript) {
        try {
          const guilds = JSON.parse(guildsScript.getAttribute('data-guilds'));
          guilds.forEach(guild => {
            const option = document.createElement('option');
            option.value = guild.id;
            option.textContent = `${guild.name} (${guild.memberCount || 'N/A'} members)`;
            serverSelect.appendChild(option);
          });
        } catch (e) {
          console.error('Error parsing guilds data:', e);
        }
      }
      
      // Clear and add the new select
      selectorContainer.innerHTML = '';
      selectorContainer.appendChild(serverSelect);
      
      // Add the arrow icon
      const arrowDiv = document.createElement('div');
      arrowDiv.className = 'select-arrow';
      arrowDiv.innerHTML = '<i class="fas fa-chevron-down"></i>';
      selectorContainer.appendChild(arrowDiv);
    }
  }
  
  // If we have a server select now, style it
  if (serverSelect) {
    console.log('Applying styles to server select');
    
    // Make sure the select is visible and styled properly
    serverSelect.style.backgroundColor = '#000000';
    serverSelect.style.color = '#ffffff';
    serverSelect.style.border = '1px solid #333333';
    serverSelect.style.borderRadius = '4px';
    serverSelect.style.padding = '8px 12px';
    serverSelect.style.width = '100%';
    
    // Style options
    const options = serverSelect.querySelectorAll('option');
    options.forEach(option => {
      option.style.color = '#ffffff';
      option.style.padding = '8px';
      option.style.lineHeight = '1.5';
    });
    
    // Add change event handler
    serverSelect.addEventListener('change', function(e) {
      console.log('Server selected:', this.value);
      
      // Show a loading indicator if needed
      const loadingOverlay = document.querySelector('.loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
      }
      
      // Force redraw
      setTimeout(() => {
        // Update URL or navigation
        window.location.href = `/admin3d/tickets?server=${this.value}`;
      }, 100);
    });
    
    console.log('Server select initialized successfully');
  } else {
    console.error('Failed to find or create server select!');
  }
  
  // Initialize tabs
  const tabButtons = document.querySelectorAll('[data-toggle="tab"]');
  console.log('Found', tabButtons.length, 'tab buttons');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get target tab
      const targetId = this.getAttribute('href');
      
      // Hide all tabs
      document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('show');
        tab.classList.remove('active');
      });
      
      // Remove active from all buttons
      document.querySelectorAll('.nav-link').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Show target tab
      const targetTab = document.querySelector(targetId);
      if (targetTab) {
        targetTab.classList.add('show');
        targetTab.classList.add('active');
        this.classList.add('active');
      }
    });
  });
})();