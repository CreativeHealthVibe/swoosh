/**
 * Fix for server select dropdown
 * This file contains the fix for the server selection dropdown in the admin3d-tickets page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for the DOM to be fully loaded
  console.log('Fix-select script loaded');
  
  // Get the server select dropdown
  const serverSelect = document.getElementById('server-select');
  
  if (serverSelect) {
    console.log('Server select element found, applying fix');
    
    // Ensure the dropdown has a proper z-index and is clickable
    serverSelect.style.position = 'relative';
    serverSelect.style.zIndex = '100';
    
    // Fix appearance and remove any pointer-events issues
    serverSelect.style.appearance = 'auto';
    serverSelect.style.webkitAppearance = 'auto';
    serverSelect.style.MozAppearance = 'auto';
    serverSelect.style.pointerEvents = 'auto';
    
    // Log the number of options for debugging
    console.log(`Server select has ${serverSelect.options.length} options after fix`);
    
    // Ensure the change event works
    serverSelect.addEventListener('change', function() {
      console.log('Server select changed to:', serverSelect.value);
      
      // Show ticket section when a server is selected
      const ticketSection = document.getElementById('ticket-section');
      if (ticketSection) {
        if (serverSelect.value) {
          console.log('Showing ticket section');
          ticketSection.style.display = 'block';
        } else {
          console.log('Hiding ticket section');
          ticketSection.style.display = 'none';
        }
      }
    });
    
    // Log option values for debugging
    Array.from(serverSelect.options).forEach((option, index) => {
      console.log(`Option ${index}: ${option.value} - ${option.text}`);
    });
  } else {
    console.error('Server select element not found!');
  }
});