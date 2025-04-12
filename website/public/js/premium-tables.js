/**
 * Premium Table Functionality
 * Enhanced table interactions, sorting, filtering, and animations
 */

document.addEventListener('DOMContentLoaded', () => {
  initPremiumTables();
});

// Initialize premium table enhancements
function initPremiumTables() {
  // Find all tables to enhance
  const tables = document.querySelectorAll('.admin3d-table, .premium-table');
  
  tables.forEach(table => {
    // Apply premium class
    table.classList.add('premium-table');
    
    // Enhance table wrapper
    const wrapper = table.closest('.admin3d-table-wrapper');
    if (wrapper) {
      wrapper.classList.add('premium-table-wrapper');
    }
    
    // Setup sortable columns
    const headers = table.querySelectorAll('th');
    headers.forEach(header => {
      if (header.getAttribute('data-sortable') !== 'false') {
        header.classList.add('sortable');
        header.addEventListener('click', () => sortTable(table, header));
      }
    });
    
    // Enhance table actions
    const actionButtons = table.querySelectorAll('.btn-sm, .action-btn');
    actionButtons.forEach(button => {
      button.classList.add('premium-table-action');
      
      // Add specific action classes
      if (button.innerHTML.includes('fa-pencil') || button.innerHTML.includes('fa-edit')) {
        button.classList.add('edit');
      } else if (button.innerHTML.includes('fa-trash')) {
        button.classList.add('delete');
      } else if (button.innerHTML.includes('fa-eye')) {
        button.classList.add('view');
      }
      
      // Add tooltip attributes if not present
      if (!button.hasAttribute('data-tooltip')) {
        if (button.title) {
          button.setAttribute('data-tooltip', button.title);
        } else if (button.classList.contains('edit')) {
          button.setAttribute('data-tooltip', 'Edit');
        } else if (button.classList.contains('delete')) {
          button.setAttribute('data-tooltip', 'Delete');
        } else if (button.classList.contains('view')) {
          button.setAttribute('data-tooltip', 'View');
        }
      }
    });
    
    // Enhance status badges
    const badges = table.querySelectorAll('.badge, .status-badge');
    badges.forEach(badge => {
      badge.classList.add('premium-table-badge');
      
      // Add specific badge classes based on content
      if (badge.textContent.toLowerCase().includes('active') || 
          badge.textContent.toLowerCase().includes('success') ||
          badge.textContent.toLowerCase().includes('online')) {
        badge.classList.add('premium-table-badge-success');
      } else if (badge.textContent.toLowerCase().includes('pending') || 
                badge.textContent.toLowerCase().includes('waiting') ||
                badge.textContent.toLowerCase().includes('processing')) {
        badge.classList.add('premium-table-badge-warning');
      } else if (badge.textContent.toLowerCase().includes('error') || 
                badge.textContent.toLowerCase().includes('failed') ||
                badge.textContent.toLowerCase().includes('offline') ||
                badge.textContent.toLowerCase().includes('inactive')) {
        badge.classList.add('premium-table-badge-danger');
      } else {
        badge.classList.add('premium-table-badge-primary');
      }
    });
    
    // Enhance empty state message
    const emptyState = table.querySelector('.empty-state');
    if (emptyState) {
      emptyState.classList.add('premium-table-empty');
    }
    
    // Enhance loading state
    const loadingState = table.querySelector('.loading-state');
    if (loadingState) {
      loadingState.classList.add('premium-table-loading');
    }
  });
  
  // Enhance search boxes
  const searchBoxes = document.querySelectorAll('.admin3d-search-box');
  searchBoxes.forEach(box => {
    box.classList.add('premium-table-search');
    
    // Add search event listener
    const input = box.querySelector('input');
    if (input) {
      input.addEventListener('input', debounce(() => {
        const searchTerm = input.value.toLowerCase();
        const table = box.closest('.mod-section-content, .admin3d-section')
                        .querySelector('.premium-table');
        
        if (table) {
          const rows = table.querySelectorAll('tbody tr:not(.empty-state):not(.loading-state)');
          
          rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
              row.style.display = '';
              animateRowIn(row);
            } else {
              animateRowOut(row);
            }
          });
          
          // Show empty state if no results
          const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
          const emptyStateRow = table.querySelector('.empty-state');
          
          if (visibleRows.length === 0 && searchTerm.length > 0) {
            if (emptyStateRow) {
              // Update empty state message for search
              const emptyStateMsg = emptyStateRow.querySelector('p');
              if (emptyStateMsg) {
                emptyStateMsg.textContent = `No results found for "${searchTerm}"`;
              }
              emptyStateRow.style.display = '';
            } else {
              // Create empty state for search if none exists
              const newEmptyRow = document.createElement('tr');
              newEmptyRow.className = 'empty-state premium-table-empty';
              
              const emptyCell = document.createElement('td');
              emptyCell.colSpan = table.querySelectorAll('th').length;
              emptyCell.innerHTML = `
                <div class="empty-state-message">
                  <i class="fas fa-search"></i>
                  <p>No results found for "${searchTerm}"</p>
                </div>
              `;
              
              newEmptyRow.appendChild(emptyCell);
              table.querySelector('tbody').appendChild(newEmptyRow);
            }
          } else if (emptyStateRow && (visibleRows.length > 0 || searchTerm.length === 0)) {
            // Hide empty state if we have results or search is cleared
            emptyStateRow.style.display = 'none';
          }
        }
      }, 300));
    }
  });
  
  // Setup pagination if present
  const paginationControls = document.querySelectorAll('.pagination, .page-controls');
  paginationControls.forEach(control => {
    control.classList.add('premium-pagination');
    
    // Enhance page buttons
    const buttons = control.querySelectorAll('.page-item, .page-button');
    buttons.forEach(button => {
      button.classList.add('premium-page-button');
      
      if (button.classList.contains('active')) {
        button.classList.add('active');
      }
      
      if (button.classList.contains('disabled')) {
        button.classList.add('disabled');
      }
    });
  });
}

// Sort table by column
function sortTable(table, header) {
  const index = Array.from(header.parentNode.children).indexOf(header);
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr:not(.empty-state):not(.loading-state)'));
  const isAsc = !header.classList.contains('asc');
  
  // Remove sorting classes from all headers
  table.querySelectorAll('th').forEach(th => {
    th.classList.remove('asc', 'desc');
  });
  
  // Add sorting class to current header
  header.classList.add(isAsc ? 'asc' : 'desc');
  
  // Sort rows
  rows.sort((a, b) => {
    const cellA = a.querySelectorAll('td')[index];
    const cellB = b.querySelectorAll('td')[index];
    
    if (!cellA || !cellB) return 0;
    
    const valueA = getCellValue(cellA);
    const valueB = getCellValue(cellB);
    
    // Check if values are numbers
    const numA = parseFloat(valueA);
    const numB = parseFloat(valueB);
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return isAsc ? numA - numB : numB - numA;
    } else {
      // String comparison
      return isAsc
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
  });
  
  // Reorder rows with animation
  rows.forEach((row, i) => {
    // Remove row and reinsert at new position with a slight delay
    setTimeout(() => {
      row.remove();
      tbody.appendChild(row);
      row.style.opacity = '0';
      row.style.transform = 'translateX(10px)';
      
      // Trigger reflow
      row.offsetHeight;
      
      // Animate in
      row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      row.style.opacity = '1';
      row.style.transform = 'translateX(0)';
    }, i * 30);
  });
}

// Get comparable value from cell
function getCellValue(cell) {
  // Check for data attribute
  if (cell.hasAttribute('data-sort-value')) {
    return cell.getAttribute('data-sort-value');
  }
  
  // Check for input or select value
  const input = cell.querySelector('input, select');
  if (input && input.value) {
    return input.value;
  }
  
  // Get text content, removing extra whitespace
  return cell.textContent.trim().toLowerCase();
}

// Animate row in
function animateRowIn(row) {
  row.style.display = '';
  row.style.opacity = '0';
  row.style.transform = 'translateX(-10px)';
  
  // Trigger reflow
  row.offsetHeight;
  
  row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  row.style.opacity = '1';
  row.style.transform = 'translateX(0)';
}

// Animate row out
function animateRowOut(row) {
  row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  row.style.opacity = '0';
  row.style.transform = 'translateX(10px)';
  
  setTimeout(() => {
    row.style.display = 'none';
  }, 300);
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}