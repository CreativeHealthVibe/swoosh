/**
 * Fix for server list not showing in admin3d/tickets page
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Server list fix script loaded');

  // Function to fix the server selector
  function fixServerSelector() {
    const serverSelect = document.getElementById('server-select');
    if (!serverSelect) {
      console.error('Server select element not found!');
      return;
    }

    console.log('Server selector found, checking functionality');

    // Check if the server list is populating correctly
    if (serverSelect.options.length <= 1) {
      console.log('Server list appears empty, trying to fix...');
      
      // Fetch server list directly from API
      fetch('/api/v2/servers')
        .then(response => response.json())
        .then(data => {
          if (data.success && data.servers && data.servers.length > 0) {
            console.log(`Found ${data.servers.length} servers, repopulating select`);
            
            // Clear existing options except the first one
            while (serverSelect.options.length > 1) {
              serverSelect.remove(1);
            }
            
            // Add server options
            data.servers.forEach(server => {
              const option = document.createElement('option');
              option.value = server.id;
              option.textContent = server.name;
              serverSelect.appendChild(option);
            });
            
            console.log('Server list repopulated successfully');
            
            // Attach change event listener to handle server selection
            serverSelect.addEventListener('change', handleServerChange);
          } else {
            console.error('Failed to fetch servers or no servers available');
          }
        })
        .catch(error => {
          console.error('Error fetching servers:', error);
        });
    } else {
      console.log('Server list appears to be populated correctly');
      
      // Make sure the change event handler is attached
      serverSelect.addEventListener('change', handleServerChange);
    }
  }

  // Handler for server selection change
  function handleServerChange() {
    const serverId = this.value;
    
    if (!serverId) {
      console.log('No server selected');
      return;
    }
    
    console.log(`Server changed to: ${serverId}`);
    
    // Update hidden server-id input for the ticket setup form
    const serverIdInput = document.getElementById('server-id');
    if (serverIdInput) {
      serverIdInput.value = serverId;
      console.log(`Updated server-id input to: ${serverId}`);
    }
    
    // Load server-specific data
    loadServerData(serverId);
  }

  // Load server-specific data
  function loadServerData(serverId) {
    // Fetch tickets
    fetch(`/api/v2/servers/${serverId}/tickets`)
      .then(response => response.json())
      .then(data => {
        console.log('Tickets data loaded');
      })
      .catch(error => {
        console.error('Error loading tickets:', error);
      });
    
    // Fetch ticket panels
    fetch(`/api/v2/servers/${serverId}/ticket-panels`)
      .then(response => response.json())
      .then(data => {
        console.log('Ticket panels data loaded');
      })
      .catch(error => {
        console.error('Error loading ticket panels:', error);
      });
    
    // Fetch channels for ticket setup
    fetch(`/api/v2/servers/${serverId}/channels`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          populateChannelDropdowns(data.channels);
        }
      })
      .catch(error => {
        console.error('Error loading channels:', error);
      });
  }

  // Populate channel dropdowns
  function populateChannelDropdowns(channels) {
    if (!channels || channels.length === 0) {
      console.log('No channels available');
      return;
    }
    
    // Find all channel dropdown elements
    const dropdowns = [
      document.getElementById('ticket-channel'),
      document.getElementById('panel-channel-id'),
      document.getElementById('category-id'),
      document.getElementById('log-channel-id')
    ];
    
    // Filter text channels
    const textChannels = channels.filter(channel => 
      channel.type === 'GUILD_TEXT' || channel.type === 0
    );
    
    // Filter categories
    const categories = channels.filter(channel => 
      channel.type === 'GUILD_CATEGORY' || channel.type === 4
    );
    
    // Update each dropdown
    dropdowns.forEach(dropdown => {
      if (!dropdown) return;
      
      // Clear existing options
      while (dropdown.options.length > 1) {
        dropdown.remove(1);
      }
      
      // Use appropriate channel list based on dropdown id
      const channelList = dropdown.id === 'category-id' ? categories : textChannels;
      
      // Sort channels alphabetically
      channelList.sort((a, b) => a.name.localeCompare(b.name));
      
      // Add channel options
      channelList.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = channel.name;
        dropdown.appendChild(option);
      });
      
      console.log(`Populated ${dropdown.id} with ${channelList.length} channels`);
    });
  }

  // Run the fix
  setTimeout(fixServerSelector, 500);
});