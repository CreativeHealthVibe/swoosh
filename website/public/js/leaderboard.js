/**
 * Leaderboard JavaScript
 * Handles fetching and displaying the top servers using SWOOSH Bot
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const leaderboardList = document.getElementById('leaderboard-list');
  const leaderboardLoading = document.getElementById('leaderboard-loading');
  const leaderboardError = document.getElementById('leaderboard-error');
  const lastUpdated = document.getElementById('last-updated');
  const totalServerCount = document.getElementById('total-server-count');
  const totalUserCount = document.getElementById('total-user-count');
  const template = document.getElementById('leaderboard-item-template');
  
  // Fetch server data from API
  fetchLeaderboardData();
  
  // Auto refresh every 2 minutes
  setInterval(fetchLeaderboardData, 120000);
  
  // Helper function to fetch and render leaderboard data
  function fetchLeaderboardData() {
    fetch('/api/leaderboard/top-servers')
      .then(response => {
        if (!response.ok) {
          throw new Error('API request failed');
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.servers && data.servers.length > 0) {
          renderLeaderboard(data.servers);
          updateStats();
          showLeaderboard();
        } else {
          showError();
        }
      })
      .catch(error => {
        console.error('Error fetching leaderboard data:', error);
        showError();
      });
  }
  
  // Display leaderboard data
  function renderLeaderboard(servers) {
    // Clear existing items
    leaderboardList.innerHTML = '';
    
    // Add each server to the list
    servers.forEach((server, index) => {
      const item = template.content.cloneNode(true);
      const rank = index + 1;
      
      // Set rank
      const rankEl = item.querySelector('.rank');
      rankEl.textContent = rank;
      rankEl.classList.add(`rank-${rank}`);
      
      // Set server icon
      const iconImg = item.querySelector('.server-icon img');
      if (server.icon) {
        iconImg.src = server.icon;
        iconImg.alt = `${server.name} icon`;
      } else {
        // Use first letter of server name as fallback
        iconImg.remove();
        const iconContainer = item.querySelector('.server-icon');
        iconContainer.textContent = server.name.charAt(0).toUpperCase();
      }
      
      // Set server info
      item.querySelector('.server-name').textContent = server.name;
      item.querySelector('.server-members').textContent = formatNumber(server.memberCount) + ' members';
      
      // Set join button if invite URL is available
      const joinBtn = item.querySelector('.server-join-btn');
      
      // For now we'll hide the join button since we don't have invite links
      joinBtn.style.display = 'none';
      
      // Add to the leaderboard
      leaderboardList.appendChild(item);
    });
    
    // Update last updated time
    lastUpdated.textContent = new Date().toLocaleString();
  }
  
  // Fetch and update global stats
  function updateStats() {
    fetch('/api/status')
      .then(response => response.json())
      .then(data => {
        totalServerCount.textContent = formatNumber(data.guilds);
        
        // Get user count from server health API
        fetch('/api/server-health')
          .then(response => response.json())
          .then(healthData => {
            if (healthData.discord && healthData.discord.users) {
              totalUserCount.textContent = formatNumber(healthData.discord.users);
            } else {
              totalUserCount.textContent = 'N/A';
            }
          })
          .catch(() => {
            totalUserCount.textContent = 'N/A';
          });
      })
      .catch(error => {
        console.error('Error fetching stats:', error);
      });
  }
  
  // Show leaderboard, hide loading and error
  function showLeaderboard() {
    leaderboardLoading.style.display = 'none';
    leaderboardError.style.display = 'none';
    leaderboardList.style.display = 'block';
  }
  
  // Show error message, hide loading and leaderboard
  function showError() {
    leaderboardLoading.style.display = 'none';
    leaderboardError.style.display = 'flex';
    leaderboardList.style.display = 'none';
  }
  
  // Format numbers with commas (e.g., 1,234,567)
  function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }
  
  // WebSocket connection for real-time updates
  function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected for leaderboard updates');
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Update user count if available
        if (data.users) {
          totalUserCount.textContent = formatNumber(data.users);
        }
        
        // Update server count if available
        if (data.servers) {
          totalServerCount.textContent = formatNumber(data.servers);
        }
      } catch (error) {
        console.error('Error parsing WebSocket data:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed, reconnecting in 5 seconds...');
      setTimeout(connectWebSocket, 5000);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      socket.close();
    };
  }
  
  // Initialize WebSocket for real-time updates
  connectWebSocket();
});