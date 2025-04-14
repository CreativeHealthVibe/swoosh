/**
 * Admin3D Server Fix Debug Script
 * This script helps debug server selector issues by logging DOM details
 */

// Run on page load
window.addEventListener('load', function() {
  console.log('DEBUG: Server fix debug script loaded (load event)');
  debugServerSelector();
});

// Also try on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DEBUG: Server fix debug script loaded (DOMContentLoaded)');
  debugServerSelector();
});

// Debug the server selector
function debugServerSelector() {
  console.log('DEBUG: Starting server selector debug...');
  
  // Log all selects on the page
  const allSelects = document.querySelectorAll('select');
  console.log('DEBUG: Found', allSelects.length, 'select elements on the page');
  
  // Try finding by ID
  const serverSelectById = document.getElementById('server-select');
  console.log('DEBUG: server-select by ID:', serverSelectById ? 'FOUND' : 'NOT FOUND');
  
  // Try finding by class combination
  const premiumSelects = document.querySelectorAll('select.premium-select');
  console.log('DEBUG: premium-select selects:', premiumSelects.length);
  
  const formControls = document.querySelectorAll('select.form-control');
  console.log('DEBUG: form-control selects:', formControls.length);
  
  // Try looking for the server selector container
  const selectorContainer = document.querySelector('.server-selector');
  console.log('DEBUG: server-selector container:', selectorContainer ? 'FOUND' : 'NOT FOUND');
  
  if (selectorContainer) {
    const selectsInContainer = selectorContainer.querySelectorAll('select');
    console.log('DEBUG: selects inside server-selector:', selectsInContainer.length);
    
    // Try getting the first select inside the server-selector
    if (selectsInContainer.length > 0) {
      const firstSelect = selectsInContainer[0];
      console.log('DEBUG: First select in container ID:', firstSelect.id || 'NO ID');
      console.log('DEBUG: First select in container classes:', firstSelect.className);
      
      // Fix this select
      fixServerSelect(firstSelect);
    }
  }
}

// Fix a server select element
function fixServerSelect(select) {
  if (!select) {
    console.error('DEBUG: Cannot fix null select element');
    return;
  }
  
  console.log('DEBUG: Fixing select element:', select.id || 'NO ID');
  
  // Add a distinctive style to make sure our JS is affecting the element
  select.style.backgroundColor = '#000000';
  select.style.color = '#ffffff';
  select.style.border = '1px solid #ff0000'; // Red border for debugging
  select.style.padding = '8px 12px';
  select.style.width = '100%';
  
  // Add a change listener
  select.addEventListener('change', function() {
    console.log('DEBUG: Select changed to:', select.value);
  });
  
  console.log('DEBUG: Select fixed successfully');
}