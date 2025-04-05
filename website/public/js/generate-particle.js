// Node.js script to generate a particle texture
const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a 64x64 canvas
const size = 64;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Clear the canvas
ctx.clearRect(0, 0, size, size);

// Create a radial gradient
const gradient = ctx.createRadialGradient(
  size/2, size/2, 0,
  size/2, size/2, size/2
);

// Add color stops
gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
gradient.addColorStop(0.5, 'rgba(200, 200, 255, 0.5)');
gradient.addColorStop(1, 'rgba(200, 200, 255, 0)');

// Fill with gradient
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, size, size);

// Write to file
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./website/public/images/particle.png', buffer);

console.log('Particle image generated successfully');