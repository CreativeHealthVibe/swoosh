/**
 * Gauge Component for Server Health Dashboard
 * Creates and updates animated gauge charts for metrics visualization
 */

// Draw gauge with given percentage and color
function drawGauge(canvasId, percentage, color = '#9c4dff', options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Default options
  const defaultOptions = {
    radius: Math.min(width, height) / 2 - 10,
    lineWidth: 15,
    scaleMarks: true,
    scaleMarkCount: 10,
    startAngle: Math.PI * 0.75,  // 135 degrees (start at top-left)
    endAngle: Math.PI * 2.25,    // 405 degrees (end at top-right)
    totalAngle: Math.PI * 1.5,   // 270 degrees (sweep angle)
    gradientEnd: '#7c3acd'       // Secondary color for gradient
  };
  
  // Merge default options with provided options
  const settings = { ...defaultOptions, ...options };
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw background circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, settings.radius, settings.startAngle, settings.endAngle, false);
  ctx.lineWidth = settings.lineWidth;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.stroke();
  
  // Calculate end angle based on percentage
  const gaugeAngle = (percentage / 100) * settings.totalAngle + settings.startAngle;
  
  // Draw percentage arc
  ctx.beginPath();
  ctx.arc(centerX, centerY, settings.radius, settings.startAngle, gaugeAngle, false);
  ctx.lineWidth = settings.lineWidth;
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, settings.gradientEnd);
  ctx.strokeStyle = gradient;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Draw scale marks
  if (settings.scaleMarks) {
    for (let i = 0; i <= settings.scaleMarkCount; i++) {
      const angle = (i / settings.scaleMarkCount) * settings.totalAngle + settings.startAngle;
      const startX = centerX + (settings.radius - 20) * Math.cos(angle);
      const startY = centerY + (settings.radius - 20) * Math.sin(angle);
      const endX = centerX + (settings.radius + 5) * Math.cos(angle);
      const endY = centerY + (settings.radius + 5) * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.lineWidth = i % 5 === 0 ? 3 : 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.stroke();
      
      // Add scale numbers for major markers (0, 50, 100, etc.)
      if (i % 5 === 0) {
        const textX = centerX + (settings.radius - 35) * Math.cos(angle);
        const textY = centerY + (settings.radius - 35) * Math.sin(angle);
        
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i * (100 / settings.scaleMarkCount), textX, textY);
      }
    }
  }
  
  return ctx;
}

// Create a gauge and return functions to update it
function createGauge(canvasId, valueElementId, options = {}) {
  // Initial draw with 0%
  const ctx = drawGauge(canvasId, 0, options.color || '#9c4dff', options);
  if (!ctx) return null;
  
  // Get the value display element
  const valueElement = document.getElementById(valueElementId);
  
  // Return an object with update function
  return {
    update: function(percentage) {
      // Cap percentage at 100
      const limitedPercentage = Math.min(Math.max(percentage, 0), 100);
      
      // Update gauge
      drawGauge(canvasId, limitedPercentage, options.color || '#9c4dff', options);
      
      // Update value text if element exists
      if (valueElement) {
        valueElement.textContent = `${Math.round(limitedPercentage)}%`;
        
        // Add color classes based on value
        valueElement.className = 'gauge-value';
        if (limitedPercentage > 90) {
          valueElement.classList.add('critical');
        } else if (limitedPercentage > 70) {
          valueElement.classList.add('warning');
        }
      }
    }
  };
}

// Initialize multiple gauges
function initGauges() {
  const cpuGauge = createGauge('cpu-canvas', 'cpu-value', {
    color: '#9c4dff',
    gradientEnd: '#7c3acd'
  });
  
  const memoryGauge = createGauge('memory-canvas', 'memory-value', {
    color: '#9c4dff',
    gradientEnd: '#7c3acd'
  });
  
  // Return all gauges for updates
  return {
    cpu: cpuGauge,
    memory: memoryGauge,
    
    // Update all gauges with provided data
    updateAll: function(data) {
      if (cpuGauge && data.cpu !== undefined) {
        cpuGauge.update(data.cpu);
      }
      
      if (memoryGauge && data.memory !== undefined) {
        memoryGauge.update(data.memory);
      }
    }
  };
}

// Export functions
window.drawGauge = drawGauge;
window.createGauge = createGauge;
window.initGauges = initGauges;