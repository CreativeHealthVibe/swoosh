/**
 * Admin 3D Dashboard - Role Management
 * Premium edition with advanced role management features
 */

// Store the currently selected server and roles
let currentServerId = '';
let serverRoles = [];
let autoRoles = [];

// DOM Elements
const serverSelect = document.getElementById('server-select');
const roleManagementSection = document.getElementById('role-management-section');
const rolesList = document.getElementById('roles-list');
const autoRolesList = document.getElementById('autoroles-list');
const autoRoleSelect = document.getElementById('autorole-select');
const bulkRoleSelect = document.getElementById('bulk-role-select');
const createRoleForm = document.getElementById('create-role-form');
const addAutoRoleForm = document.getElementById('add-autorole-form');
const bulkRoleForm = document.getElementById('bulk-role-form');
const editRoleModal = document.getElementById('edit-role-modal');
const editRoleForm = document.getElementById('edit-role-form');
const viewMembersModal = document.getElementById('view-members-modal');
const confirmModal = document.getElementById('confirm-modal');

/**
 * Initialize the roles page
 */
function initRolesPage() {
  // Set up server selection
  if (serverSelect) {
    serverSelect.addEventListener('change', handleServerChange);
  }
  
  // Set up create role form
  if (createRoleForm) {
    createRoleForm.addEventListener('submit', handleCreateRole);
  }
  
  // Set up auto role form
  if (addAutoRoleForm) {
    addAutoRoleForm.addEventListener('submit', handleAddAutoRole);
  }
  
  // Set up bulk role form
  if (bulkRoleForm) {
    bulkRoleForm.addEventListener('submit', handleBulkRoleAssignment);
  }
  
  // Set up edit role form
  if (editRoleForm) {
    const moveUpButton = document.getElementById('move-role-up');
    const moveDownButton = document.getElementById('move-role-down');
    
    if (moveUpButton) {
      moveUpButton.addEventListener('click', () => handleMoveRole('up'));
    }
    
    if (moveDownButton) {
      moveDownButton.addEventListener('click', () => handleMoveRole('down'));
    }
    
    // Save button
    const saveButton = editRoleModal.querySelector('[data-action="save"]');
    if (saveButton) {
      saveButton.addEventListener('click', handleSaveRole);
    }
    
    // Delete button
    const deleteButton = editRoleModal.querySelector('[data-action="delete"]');
    if (deleteButton) {
      deleteButton.addEventListener('click', () => openConfirmModal('delete-role'));
    }
  }
  
  // Set up member search in members modal
  const memberSearch = document.getElementById('member-search');
  if (memberSearch) {
    memberSearch.addEventListener('input', filterMembers);
  }
  
  // Set up modal close buttons
  document.querySelectorAll('.modal-close, [data-action="close"], [data-action="cancel"]').forEach(button => {
    button.addEventListener('click', closeAllModals);
  });
  
  // Set up confirm modal
  const confirmButton = document.querySelector('#confirm-modal [data-action="confirm"]');
  if (confirmButton) {
    confirmButton.addEventListener('click', handleConfirmAction);
  }
  
  // Administrator checkbox logic for permissions
  const adminCheckbox = document.querySelector('input[value="Administrator"]');
  if (adminCheckbox) {
    adminCheckbox.addEventListener('change', (e) => {
      const permissionCheckboxes = document.querySelectorAll('input[name="permissions"]');
      if (e.target.checked) {
        permissionCheckboxes.forEach(checkbox => {
          if (checkbox !== e.target) {
            checkbox.checked = true;
            checkbox.disabled = true;
          }
        });
      } else {
        permissionCheckboxes.forEach(checkbox => {
          if (checkbox !== e.target) {
            checkbox.disabled = false;
          }
        });
      }
    });
  }
}

/**
 * Handle server selection change
 */
async function handleServerChange() {
  const serverId = serverSelect.value;
  
  if (!serverId) {
    roleManagementSection.style.display = 'none';
    return;
  }
  
  currentServerId = serverId;
  roleManagementSection.style.display = 'block';
  
  // Load roles for the selected server
  await loadServerRoles();
  
  // Load auto roles for the selected server
  await loadAutoRoles();
}

/**
 * Load roles for the selected server
 */
async function loadServerRoles() {
  if (!currentServerId) return;
  
  // Show loading state
  rolesList.innerHTML = `
    <div class="roles-loading">
      <div class="spinner"></div>
      <p>Loading roles...</p>
    </div>
  `;
  
  // Clear dropdown selects
  autoRoleSelect.innerHTML = '<option value="">Select a role</option>';
  bulkRoleSelect.innerHTML = '<option value="">Select a role</option>';
  
  try {
    // Fetch roles from API
    const response = await fetch(`/api/v2/servers/${currentServerId}/roles`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load roles');
    }
    
    // Store roles
    serverRoles = data.roles || [];
    
    // Render roles
    renderRolesList();
    
    // Populate role selects
    populateRoleSelects();
  } catch (error) {
    console.error('Error loading roles:', error);
    rolesList.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading roles: ${error.message}</p>
      </div>
    `;
    createNotification('error', 'Error', `Failed to load roles: ${error.message}`);
  }
}

/**
 * Render the roles list
 */
function renderRolesList() {
  if (!serverRoles.length) {
    rolesList.innerHTML = '<p class="empty-message">No roles found for this server.</p>';
    return;
  }
  
  // Clear the list
  rolesList.innerHTML = '';
  
  // Render each role
  serverRoles.forEach(role => {
    // Skip @everyone role for editing
    const isEveryoneRole = role.id === currentServerId;
    
    const roleItem = document.createElement('div');
    roleItem.className = 'role-item';
    
    // Convert hex color
    const hexColor = role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#99AAB5';
    
    roleItem.innerHTML = `
      <div class="role-name">
        <div class="role-circle" style="background-color: ${hexColor}"></div>
        <span>${escapeHTML(role.name)}</span>
      </div>
      <div class="role-color">
        <span>${hexColor}</span>
      </div>
      <div class="role-members" data-role-id="${role.id}" data-role-name="${escapeHTML(role.name)}">
        ${role.memberCount || 0}
      </div>
      <div class="role-position">
        ${role.position}
      </div>
      <div class="role-actions">
        <button class="admin3d-btn admin3d-btn-sm admin3d-btn-info" data-action="view-members" data-role-id="${role.id}" data-role-name="${escapeHTML(role.name)}">
          <i class="fas fa-users"></i>
        </button>
        ${!isEveryoneRole ? `
          <button class="admin3d-btn admin3d-btn-sm admin3d-btn-primary" data-action="edit-role" data-role-id="${role.id}">
            <i class="fas fa-edit"></i>
          </button>
        ` : ''}
      </div>
    `;
    
    // Add event listeners
    const viewMembersBtn = roleItem.querySelector('[data-action="view-members"]');
    if (viewMembersBtn) {
      viewMembersBtn.addEventListener('click', () => openViewMembersModal(role.id, role.name));
    }
    
    const editRoleBtn = roleItem.querySelector('[data-action="edit-role"]');
    if (editRoleBtn) {
      editRoleBtn.addEventListener('click', () => openEditRoleModal(role.id));
    }
    
    const membersElement = roleItem.querySelector('.role-members');
    if (membersElement) {
      membersElement.addEventListener('click', () => openViewMembersModal(role.id, role.name));
    }
    
    rolesList.appendChild(roleItem);
  });
}

/**
 * Populate role select dropdowns
 */
function populateRoleSelects() {
  // Clear dropdowns
  autoRoleSelect.innerHTML = '<option value="">Select a role</option>';
  bulkRoleSelect.innerHTML = '<option value="">Select a role</option>';
  
  // Add roles to dropdowns
  serverRoles.forEach(role => {
    // Skip @everyone role
    if (role.id === currentServerId) return;
    
    const option = document.createElement('option');
    option.value = role.id;
    option.textContent = role.name;
    
    // Clone option for each dropdown
    autoRoleSelect.appendChild(option.cloneNode(true));
    bulkRoleSelect.appendChild(option.cloneNode(true));
  });
}

/**
 * Load auto roles for the selected server
 */
async function loadAutoRoles() {
  if (!currentServerId) return;
  
  // Show loading state
  autoRolesList.innerHTML = `
    <div class="autoroles-loading">
      <div class="spinner"></div>
      <p>Loading auto-roles...</p>
    </div>
  `;
  
  try {
    // Fetch auto roles from API
    const response = await fetch(`/api/v2/servers/${currentServerId}/autoroles`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load auto-roles');
    }
    
    // Store auto roles
    autoRoles = data.autoroles || [];
    
    // Render auto roles
    renderAutoRolesList();
  } catch (error) {
    console.error('Error loading auto-roles:', error);
    autoRolesList.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading auto-roles: ${error.message}</p>
      </div>
    `;
  }
}

/**
 * Render the auto roles list
 */
function renderAutoRolesList() {
  if (!autoRoles || !autoRoles.length) {
    autoRolesList.innerHTML = '<p class="empty-message">No auto-roles configured for this server.</p>';
    return;
  }
  
  // Clear the list
  autoRolesList.innerHTML = '';
  
  // Render each auto role
  autoRoles.forEach(roleId => {
    // Find role details
    const role = serverRoles.find(r => r.id === roleId);
    if (!role) return;
    
    const hexColor = role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#99AAB5';
    
    const autoroleItem = document.createElement('div');
    autoroleItem.className = 'autorole-item';
    autoroleItem.innerHTML = `
      <div class="autorole-info">
        <div class="role-circle" style="background-color: ${hexColor}"></div>
        <span>${escapeHTML(role.name)}</span>
      </div>
      <button class="admin3d-btn admin3d-btn-sm admin3d-btn-danger" data-action="remove-autorole" data-role-id="${roleId}">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add event listener for remove button
    const removeBtn = autoroleItem.querySelector('[data-action="remove-autorole"]');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => handleRemoveAutoRole(roleId));
    }
    
    autoRolesList.appendChild(autoroleItem);
  });
}

/**
 * Handle creating a new role
 * @param {Event} e - Form submit event
 */
async function handleCreateRole(e) {
  e.preventDefault();
  
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  try {
    // Show loading state on button
    const submitButton = createRoleForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    
    // Get form data
    const formData = new FormData(createRoleForm);
    
    // Process permissions
    const permissionCheckboxes = createRoleForm.querySelectorAll('input[name="permissions"]:checked');
    const permissions = Array.from(permissionCheckboxes).map(checkbox => checkbox.value);
    
    // Convert color from hex to decimal
    const hexColor = formData.get('color').replace('#', '');
    const decimalColor = parseInt(hexColor, 16);
    
    // Prepare data for API
    const roleData = {
      name: formData.get('name'),
      color: decimalColor,
      hoist: formData.get('hoist') === 'on',
      mentionable: formData.get('mentionable') === 'on',
      permissions: permissions
    };
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(roleData)
    });
    
    const data = await response.json();
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-plus"></i> Create Role';
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to create role');
    }
    
    // Show success notification
    createNotification('success', 'Success', `Role "${roleData.name}" created successfully`);
    
    // Reset form
    createRoleForm.reset();
    
    // Reload roles
    await loadServerRoles();
  } catch (error) {
    console.error('Error creating role:', error);
    createNotification('error', 'Error', `Failed to create role: ${error.message}`);
    
    // Reset button state
    const submitButton = createRoleForm.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-plus"></i> Create Role';
  }
}

/**
 * Handle adding an auto role
 * @param {Event} e - Form submit event
 */
async function handleAddAutoRole(e) {
  e.preventDefault();
  
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  const roleId = autoRoleSelect.value;
  
  if (!roleId) {
    createNotification('error', 'Error', 'Please select a role');
    return;
  }
  
  try {
    // Show loading state on button
    const submitButton = addAutoRoleForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/autoroles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roleId })
    });
    
    const data = await response.json();
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-plus"></i> Add Auto-Role';
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to add auto-role');
    }
    
    // Show success notification
    const roleName = serverRoles.find(r => r.id === roleId)?.name || 'Unknown';
    createNotification('success', 'Success', `"${roleName}" added to auto-roles successfully`);
    
    // Reset form
    addAutoRoleForm.reset();
    
    // Reload auto roles
    await loadAutoRoles();
  } catch (error) {
    console.error('Error adding auto-role:', error);
    createNotification('error', 'Error', `Failed to add auto-role: ${error.message}`);
    
    // Reset button state
    const submitButton = addAutoRoleForm.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-plus"></i> Add Auto-Role';
  }
}

/**
 * Handle removing an auto role
 * @param {string} roleId - The role ID to remove
 */
async function handleRemoveAutoRole(roleId) {
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  try {
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/autoroles/${roleId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to remove auto-role');
    }
    
    // Show success notification
    const roleName = serverRoles.find(r => r.id === roleId)?.name || 'Unknown';
    createNotification('success', 'Success', `"${roleName}" removed from auto-roles successfully`);
    
    // Reload auto roles
    await loadAutoRoles();
  } catch (error) {
    console.error('Error removing auto-role:', error);
    createNotification('error', 'Error', `Failed to remove auto-role: ${error.message}`);
  }
}

/**
 * Handle bulk role assignment
 * @param {Event} e - Form submit event
 */
async function handleBulkRoleAssignment(e) {
  e.preventDefault();
  
  if (!currentServerId) {
    createNotification('error', 'Error', 'No server selected');
    return;
  }
  
  const roleId = bulkRoleSelect.value;
  
  if (!roleId) {
    createNotification('error', 'Error', 'Please select a role');
    return;
  }
  
  // Get assignment type
  const assignmentType = document.querySelector('input[name="assignmentType"]:checked').value;
  
  // Get confirmation
  const confirmed = document.getElementById('bulk-confirmation').checked;
  
  if (!confirmed) {
    createNotification('error', 'Error', 'Please confirm the action');
    return;
  }
  
  try {
    // Show loading state on button
    const submitButton = bulkRoleForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Assigning...';
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/roles/${roleId}/bulk-assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: assignmentType })
    });
    
    const data = await response.json();
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-user-tag"></i> Assign to Multiple Users';
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to assign role');
    }
    
    // Show success notification
    const roleName = serverRoles.find(r => r.id === roleId)?.name || 'Unknown';
    createNotification('success', 'Success', `"${roleName}" assigned to ${data.count || 'multiple'} members successfully`);
    
    // Reset form
    bulkRoleForm.reset();
    
    // Reload roles to update member counts
    await loadServerRoles();
  } catch (error) {
    console.error('Error assigning role:', error);
    createNotification('error', 'Error', `Failed to assign role: ${error.message}`);
    
    // Reset button state
    const submitButton = bulkRoleForm.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-user-tag"></i> Assign to Multiple Users';
  }
}

/**
 * Open the edit role modal
 * @param {string} roleId - The role ID to edit
 */
function openEditRoleModal(roleId) {
  const role = serverRoles.find(r => r.id === roleId);
  
  if (!role) {
    createNotification('error', 'Error', 'Role not found');
    return;
  }
  
  // Set role ID in form
  document.getElementById('edit-role-id').value = roleId;
  
  // Set role name
  document.getElementById('edit-role-name').value = role.name;
  
  // Set role color
  const hexColor = role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#99AAB5';
  document.getElementById('edit-role-color').value = hexColor;
  
  // Set checkboxes
  document.getElementById('edit-role-hoist').checked = role.hoist;
  document.getElementById('edit-role-mentionable').checked = role.mentionable;
  
  // Enable/disable move buttons based on position
  const moveUpButton = document.getElementById('move-role-up');
  const moveDownButton = document.getElementById('move-role-down');
  
  if (moveUpButton) {
    // Disable if it's the highest role (excluding @everyone)
    const highestRole = serverRoles
      .filter(r => r.id !== currentServerId) // Filter out @everyone
      .sort((a, b) => b.position - a.position)[0];
    
    moveUpButton.disabled = role.id === highestRole?.id;
  }
  
  if (moveDownButton) {
    // Disable if it's the lowest role (excluding @everyone)
    const highestPositionValue = Math.max(...serverRoles.map(r => r.position));
    const lowestRole = serverRoles
      .filter(r => r.id !== currentServerId && r.position !== highestPositionValue) // Filter out @everyone and highest role
      .sort((a, b) => a.position - b.position)[0];
    
    moveDownButton.disabled = role.id === lowestRole?.id;
  }
  
  // Update title
  editRoleModal.querySelector('.modal-title').textContent = `Edit Role: ${role.name}`;
  
  // Show the modal
  editRoleModal.classList.add('active');
}

/**
 * Open the view members modal
 * @param {string} roleId - The role ID
 * @param {string} roleName - The role name
 */
async function openViewMembersModal(roleId, roleName) {
  // Update title
  viewMembersModal.querySelector('.modal-title').textContent = `Members with role: ${roleName}`;
  
  // Show loading state
  const membersList = document.getElementById('role-members-list');
  membersList.innerHTML = `
    <div class="members-loading">
      <div class="spinner"></div>
      <p>Loading members...</p>
    </div>
  `;
  
  // Show the modal
  viewMembersModal.classList.add('active');
  
  // Clear search
  document.getElementById('member-search').value = '';
  
  try {
    // Fetch members from API
    const response = await fetch(`/api/v2/servers/${currentServerId}/roles/${roleId}/members`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load members');
    }
    
    // Render members
    renderRoleMembers(data.members || []);
  } catch (error) {
    console.error('Error loading role members:', error);
    membersList.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading members: ${error.message}</p>
      </div>
    `;
  }
}

/**
 * Render role members in the modal
 * @param {Array} members - The members to render
 */
function renderRoleMembers(members) {
  const membersList = document.getElementById('role-members-list');
  
  if (!members.length) {
    membersList.innerHTML = '<p class="empty-message">No members found with this role.</p>';
    return;
  }
  
  // Clear the list
  membersList.innerHTML = '';
  
  // Add data attribute for filtering
  membersList.setAttribute('data-members', JSON.stringify(members));
  
  // Render each member
  members.forEach(member => {
    const memberItem = document.createElement('div');
    memberItem.className = 'member-item';
    memberItem.setAttribute('data-search', `${member.username} ${member.nickname || ''}`);
    
    memberItem.innerHTML = `
      <div class="member-avatar">
        ${member.avatar ? `<img src="${member.avatar}" alt="${escapeHTML(member.username)}">` : `<i class="fas fa-user"></i>`}
      </div>
      <div class="member-info">
        <div class="member-name">${escapeHTML(member.nickname || member.username)}</div>
        <div class="member-tag">${escapeHTML(member.username)}#${member.discriminator}</div>
      </div>
    `;
    
    membersList.appendChild(memberItem);
  });
}

/**
 * Filter members in the view members modal
 */
function filterMembers() {
  const searchInput = document.getElementById('member-search');
  const search = searchInput.value.toLowerCase();
  const memberItems = document.querySelectorAll('#role-members-list .member-item');
  
  memberItems.forEach(item => {
    const searchText = item.getAttribute('data-search').toLowerCase();
    if (searchText.includes(search)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

/**
 * Handle saving role changes
 */
async function handleSaveRole() {
  const roleId = document.getElementById('edit-role-id').value;
  
  if (!roleId || !currentServerId) {
    createNotification('error', 'Error', 'Invalid role or server');
    return;
  }
  
  try {
    // Show loading state on button
    const saveButton = editRoleModal.querySelector('[data-action="save"]');
    saveButton.disabled = true;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Get form data
    const name = document.getElementById('edit-role-name').value;
    const hexColor = document.getElementById('edit-role-color').value.replace('#', '');
    const decimalColor = parseInt(hexColor, 16);
    const hoist = document.getElementById('edit-role-hoist').checked;
    const mentionable = document.getElementById('edit-role-mentionable').checked;
    
    // Prepare data for API
    const roleData = {
      name,
      color: decimalColor,
      hoist,
      mentionable
    };
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/roles/${roleId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(roleData)
    });
    
    const data = await response.json();
    
    // Reset button state
    saveButton.disabled = false;
    saveButton.innerHTML = 'Save Changes';
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to save role');
    }
    
    // Show success notification
    createNotification('success', 'Success', `Role "${name}" updated successfully`);
    
    // Close modal
    closeAllModals();
    
    // Reload roles
    await loadServerRoles();
  } catch (error) {
    console.error('Error saving role:', error);
    createNotification('error', 'Error', `Failed to save role: ${error.message}`);
    
    // Reset button state
    const saveButton = editRoleModal.querySelector('[data-action="save"]');
    saveButton.disabled = false;
    saveButton.innerHTML = 'Save Changes';
  }
}

/**
 * Handle moving a role up or down
 * @param {string} direction - The direction to move the role ('up' or 'down')
 */
async function handleMoveRole(direction) {
  const roleId = document.getElementById('edit-role-id').value;
  
  if (!roleId || !currentServerId) {
    createNotification('error', 'Error', 'Invalid role or server');
    return;
  }
  
  try {
    // Show loading state on button
    const button = document.getElementById(`move-role-${direction}`);
    button.disabled = true;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Moving...`;
    
    // Send request to API
    const response = await fetch(`/api/v2/servers/${currentServerId}/roles/${roleId}/position`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ direction })
    });
    
    const data = await response.json();
    
    // Reset button state
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-arrow-${direction}"></i> Move ${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
    
    if (!data.success) {
      throw new Error(data.message || `Failed to move role ${direction}`);
    }
    
    // Show success notification
    const role = serverRoles.find(r => r.id === roleId);
    createNotification('success', 'Success', `Role "${role?.name}" moved ${direction} successfully`);
    
    // Close modal
    closeAllModals();
    
    // Reload roles
    await loadServerRoles();
  } catch (error) {
    console.error(`Error moving role ${direction}:`, error);
    createNotification('error', 'Error', `Failed to move role ${direction}: ${error.message}`);
    
    // Reset button state
    const button = document.getElementById(`move-role-${direction}`);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-arrow-${direction}"></i> Move ${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
  }
}

/**
 * Open the confirmation modal
 * @param {string} action - The action to confirm
 */
function openConfirmModal(action) {
  const roleId = document.getElementById('edit-role-id').value;
  const role = serverRoles.find(r => r.id === roleId);
  
  // Set modal data
  confirmModal.setAttribute('data-action', action);
  confirmModal.setAttribute('data-role-id', roleId);
  
  // Set confirm message
  const confirmMessage = document.getElementById('confirm-message');
  
  switch (action) {
    case 'delete-role':
      confirmMessage.textContent = `Are you sure you want to delete the role "${role?.name}"? This action cannot be undone.`;
      break;
    default:
      confirmMessage.textContent = 'Are you sure you want to perform this action?';
  }
  
  // Show the modal
  confirmModal.classList.add('active');
}

/**
 * Handle confirming an action in the confirm modal
 */
async function handleConfirmAction() {
  const action = confirmModal.getAttribute('data-action');
  const roleId = confirmModal.getAttribute('data-role-id');
  
  if (!action || !roleId || !currentServerId) {
    closeAllModals();
    return;
  }
  
  // Disable confirm button
  const confirmButton = confirmModal.querySelector('[data-action="confirm"]');
  confirmButton.disabled = true;
  confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  try {
    switch (action) {
      case 'delete-role':
        await handleDeleteRole(roleId);
        break;
    }
    
    // Close modals
    closeAllModals();
  } catch (error) {
    console.error(`Error performing action ${action}:`, error);
    createNotification('error', 'Error', `Failed to perform action: ${error.message}`);
    
    // Reset button state
    confirmButton.disabled = false;
    confirmButton.innerHTML = 'Confirm';
  }
}

/**
 * Handle deleting a role
 * @param {string} roleId - The role ID to delete
 */
async function handleDeleteRole(roleId) {
  if (!roleId || !currentServerId) {
    throw new Error('Invalid role or server');
  }
  
  // Get role name for notification
  const role = serverRoles.find(r => r.id === roleId);
  const roleName = role?.name || 'Unknown';
  
  // Send request to API
  const response = await fetch(`/api/v2/servers/${currentServerId}/roles/${roleId}`, {
    method: 'DELETE'
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to delete role');
  }
  
  // Show success notification
  createNotification('success', 'Success', `Role "${roleName}" deleted successfully`);
  
  // Reload roles
  await loadServerRoles();
}

/**
 * Close all open modals
 */
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('active');
  });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - The text to escape
 * @returns {string} - The escaped text
 */
function escapeHTML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initRolesPage);