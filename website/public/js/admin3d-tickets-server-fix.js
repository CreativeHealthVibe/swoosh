/**
 * Admin3D Server Fix Script for Tickets
 * Fixes server list display issues in the ticket management interface
 */

// IMPORTANT: Run this script FIRST in the head section
console.log('Server select fix running from head section');

// Create a direct URL method to change server
window.changeServer = function(serverId) {
  console.log('Changing server to:', serverId);
  window.location.href = '/admin3d/tickets?server=' + serverId;
};

// Run script once page has fully loaded (including images and styles)
window.addEventListener('load', function() {
  console.log('Fix-select script loaded');
  initServerSelection();
  createServerSelector();
});

// Also try on DOMContentLoaded as a fallback
document.addEventListener('DOMContentLoaded', function() {
  console.log('Server fix DOMContentLoaded');
  initServerSelection();
  createServerSelector();
});

// Try early execution as well
setTimeout(() => {
  // Check if we already have a server select
  if (!document.getElementById('fixed-server-select')) {
    console.log('Server select not found in early script');
    createServerSelector();
  }
}, 500);

// Function to create a server selector if one doesn't exist
function createServerSelector() {
  // If we already created the fixed selector, don't recreate
  if (document.getElementById('fixed-server-select')) {
    return;
  }
  
  // Get guilds from the original selector if it exists
  const originalSelect = document.getElementById('server-select');
  if (!originalSelect) {
    console.error('Server select element not found!');
    return;
  }
  
  // Create a container for the new selector
  const fixedSelectorContainer = document.createElement('div');
  fixedSelectorContainer.className = 'server-selector premium-server-selector';
  fixedSelectorContainer.style.margin = '15px 0';
  
  // Add the selector HTML
  fixedSelectorContainer.innerHTML = `
    <div class="server-select-wrapper">
      <label for="fixed-server-select">Select a Server:</label>
      <div class="select-container">
        <select id="fixed-server-select" class="form-control premium-select">
          <option value="" selected disabled>- Select a server</option>
          ${Array.from(originalSelect.options).map(option => 
            `<option value="${option.value}" ${option.selected ? 'selected' : ''}>${option.text}</option>`
          ).join('')}
        </select>
        <div class="select-arrow">
          <i class="fas fa-chevron-down"></i>
        </div>
      </div>
    </div>
  `;
  
  // Insert the new selector at the beginning of the container
  const container = document.querySelector('.tickets-container');
  if (container) {
    if (container.firstChild) {
      container.insertBefore(fixedSelectorContainer, container.firstChild.nextSibling);
    } else {
      container.appendChild(fixedSelectorContainer);
    }
    
    // Set up the change event
    const fixedSelect = document.getElementById('fixed-server-select');
    if (fixedSelect) {
      fixedSelect.addEventListener('change', function() {
        window.changeServer(this.value);
      });
      
      // Style the fixed selector
      fixedSelect.style.backgroundColor = '#000000';
      fixedSelect.style.color = '#ffffff'; 
      fixedSelect.style.padding = '8px 12px';
      fixedSelect.style.borderRadius = '4px';
      fixedSelect.style.border = '1px solid #333';
      
      // Try to match the URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const serverParam = urlParams.get('server');
      if (serverParam) {
        fixedSelect.value = serverParam;
      }
    }
  }
}

function initServerSelection() {
  // Try to find all possible server select elements
  const serverSelect = document.getElementById('server-select');
  const serverSelects = document.querySelectorAll('select.form-control.premium-select');
  
  if (serverSelect) {
    console.log('Found server select by ID');
    initializeServerSelect(serverSelect);
    return;
  }
  
  if (serverSelects.length > 0) {
    console.log('Found server select by class');
    initializeServerSelect(serverSelects[0]);
    return;
  }
  
  // If not found, try again with a longer delay
  console.warn('Server select element not found, will retry in 1 second...');
  setTimeout(() => {
    const retrySelect = document.getElementById('server-select') || 
                        document.querySelector('select.form-control.premium-select');
    
    if (retrySelect) {
      console.log('Server select found on retry');
      initializeServerSelect(retrySelect);
    } else {
      console.error('Server select element not found after retry!');
      createServerSelector(); // Create our own selector if all else fails
    }
  }, 1000);
}

// Initialize all server select functionality
function initializeServerSelect(serverSelect) {
    // Ensure server options are properly displayed
    function fixServerOptions() {
      const options = serverSelect.querySelectorAll('option');
      
      options.forEach(option => {
        // Ensure text is visible
        option.style.color = '#ffffff';
        
        // Ensure option is properly sized
        option.style.padding = '8px';
        option.style.lineHeight = '1.5';
      });
      
      // Fix select container styling
      const selectContainer = document.querySelector('.select-container');
      if (selectContainer) {
        selectContainer.style.minWidth = '250px';
      }
    }
    
    // Fix server select dropdown appearance
    function fixServerSelect() {
      if (!serverSelect) return;
      
      // Ensure select has proper styling
      serverSelect.style.backgroundColor = '#000000';
      serverSelect.style.color = '#ffffff';
      serverSelect.style.border = '1px solid #333333';
      serverSelect.style.borderRadius = '4px';
      serverSelect.style.padding = '8px 12px';
      serverSelect.style.width = '100%';
      serverSelect.style.appearance = 'none';
      
      // Fix option display
      fixServerOptions();
      
      // Add change event to update page when server is selected
      serverSelect.addEventListener('change', function() {
        updateLoadingStatus(true);
        
        // Slight delay to allow for UI update
        setTimeout(() => {
          updateLoadingStatus(false);
        }, 500);
      });
    }
    
    // Show/hide loading state when changing servers
    function updateLoadingStatus(isLoading) {
      const loadingOverlay = document.querySelector('.loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = isLoading ? 'flex' : 'none';
      }
    }
    
    // Initialize fix
    fixServerSelect();
    
    // Fix tabs navigation
    function initializeTabs() {
      console.log('Initializing tabs...');
      
      // Tab buttons with data-toggle attribute
      const tabButtons = document.querySelectorAll('[data-toggle="tab"]');
      console.log('Found', tabButtons.length, 'regular tab buttons');
      
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
    }
    
    // Initialize tabs
    initializeTabs();
  }