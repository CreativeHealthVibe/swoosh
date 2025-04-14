/**
 * Admin3D Server Fix Script for Tickets
 * Fixes server list display issues in the ticket management interface
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Server fix script loaded');

  // Try to find the server selector element - add a small delay as it might not be immediately available
  setTimeout(() => {
    // Server selector element
    const serverSelect = document.getElementById('server-select');
    
    if (!serverSelect) {
      console.warn('Server select element not found on initial load, will retry...');
      // Try again with a longer delay
      setTimeout(() => {
        const serverSelectRetry = document.getElementById('server-select');
        if (serverSelectRetry) {
          console.log('Server select element found on retry');
          initializeServerSelect(serverSelectRetry);
        } else {
          console.error('Server select element not found after retry!');
        }
      }, 1000);
      return;
    } else {
      initializeServerSelect(serverSelect);
    }
  }, 100);
  
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
});