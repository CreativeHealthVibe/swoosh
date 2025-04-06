  // Function to fetch team members from API
  function fetchTeamData() {
    // Add a cache-busting parameter to force fresh data
    const url = `/api/team?_t=${new Date().getTime()}`;
    
    fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.team && data.team.length > 0) {
          renderTeamMembers(data.team);
          console.log('Team data refreshed at:', new Date().toLocaleTimeString());
        } else {
          showError('Failed to load team data');
        }
      })
      .catch(error => {
        console.error('Error fetching team data:', error);
        showError('An error occurred while fetching team data');
      });
  }
  
  // Initial fetch
  fetchTeamData();
  
  // Refresh team data every 30 seconds to get updated avatars and statuses
  const teamRefreshInterval = setInterval(fetchTeamData, 30000);
