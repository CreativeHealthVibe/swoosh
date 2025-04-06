/**
 * Gauge chart for server metrics visualization
 */
class Gauge {
  constructor(element, options = {}) {
    this.element = element;
    this.options = Object.assign({
      min: 0,
      max: 100,
      value: 0,
      color: '#9c4dff',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      width: 10,
      animationDuration: 500,
      label: '%',
      showValue: true
    }, options);
    
    this.canvas = document.createElement('canvas');
    this.element.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    this.valueElement = document.createElement('div');
    this.valueElement.className = 'gauge-value';
    this.element.appendChild(this.valueElement);
    
    this.currentValue = this.options.value;
    this.targetValue = this.options.value;
    
    this.resize();
    this.draw();
    
    // Handle resize
    window.addEventListener('resize', () => {
      this.resize();
      this.draw();
    });
  }
  
  resize() {
    const rect = this.element.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height * 2);
    
    this.canvas.width = size;
    this.canvas.height = size / 2;
    
    // Position value label
    this.valueElement.style.bottom = '5px';
    this.valueElement.style.width = '100%';
    this.valueElement.style.textAlign = 'center';
    
    // Calculate dimensions
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height;
    this.radius = Math.min(this.centerX, this.centerY) * 0.9;
  }
  
  setValue(value) {
    this.targetValue = Math.max(this.options.min, Math.min(this.options.max, value));
    
    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
  }
  
  animate() {
    // Calculate step based on animation duration
    const diff = this.targetValue - this.currentValue;
    const step = diff * (16 / this.options.animationDuration);
    
    // If difference is small enough, jump to target
    if (Math.abs(diff) < 0.1) {
      this.currentValue = this.targetValue;
      this.draw();
      this.animationFrameId = null;
      return;
    }
    
    // Apply step
    this.currentValue += step;
    
    // Draw updated gauge
    this.draw();
    
    // Continue animation
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
  
  draw() {
    const ctx = this.ctx;
    const centerX = this.centerX;
    const centerY = this.centerY;
    const radius = this.radius;
    
    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
    ctx.lineWidth = this.options.width;
    ctx.strokeStyle = this.options.backgroundColor;
    ctx.stroke();
    
    // Calculate value as percent
    const percent = (this.currentValue - this.options.min) / (this.options.max - this.options.min);
    
    // Draw value arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, Math.PI - (Math.PI * percent), true);
    ctx.lineWidth = this.options.width;
    
    // Create gradient
    let gradient;
    if (typeof this.options.color === 'string') {
      // Use solid color
      ctx.strokeStyle = this.options.color;
    } else if (Array.isArray(this.options.color)) {
      // Create gradient from array of colors
      gradient = ctx.createLinearGradient(0, 0, this.canvas.width, 0);
      this.options.color.forEach((color, index) => {
        gradient.addColorStop(index / (this.options.color.length - 1), color);
      });
      ctx.strokeStyle = gradient;
    }
    
    ctx.stroke();
    
    // Draw ticks
    for (let i = 0; i <= 10; i++) {
      const angle = i / 10 * Math.PI;
      const x1 = centerX + (radius - 15) * Math.cos(angle);
      const y1 = centerY - (radius - 15) * Math.sin(angle);
      const x2 = centerX + (radius + 5) * Math.cos(angle);
      const y2 = centerY - (radius + 5) * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = i % 5 === 0 ? 2 : 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.stroke();
      
      // Add labels at 0, 50, 100
      if (i % 5 === 0) {
        const tx = centerX + (radius - 30) * Math.cos(angle);
        const ty = centerY - (radius - 30) * Math.sin(angle);
        const value = this.options.min + (i / 10) * (this.options.max - this.options.min);
        
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, tx, ty);
      }
    }
    
    // Update value text
    if (this.options.showValue) {
      this.valueElement.textContent = `${Math.round(this.currentValue)}${this.options.label}`;
    } else {
      this.valueElement.textContent = '';
    }
  }
}

// Make available globally
window.Gauge = Gauge;
