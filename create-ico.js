const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function createIcoFromPng() {
  // Get source PNG file
  const inputPath = process.argv[2] || path.join(__dirname, 'images/bot-icon.png');
  
  // Set output ICO file path
  const outputDir = path.join(__dirname, 'images');
  const outputPath = path.join(outputDir, 'icon.ico');
  
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`Creating ICO file from ${inputPath}...`);
    
    // Load the PNG image
    const image = await loadImage(inputPath);
    
    // Create a canvas with appropriate dimensions (256x256 for a good quality icon)
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    
    // Draw the image on the canvas
    ctx.drawImage(image, 0, 0, 256, 256);
    
    // Get the PNG data
    const pngData = canvas.toBuffer('image/png');
    
    // In a real-world scenario, you would convert this to ICO format
    // However, for simplicity, we'll just use the PNG as-is (Electron can handle PNG icons)
    fs.writeFileSync(outputPath, pngData);
    
    console.log(`ICO file created at ${outputPath}`);
    console.log('Note: This is actually a PNG file renamed to .ico - for a proper ICO file,');
    console.log('you would need a specialized library or online converter.');
  } catch (error) {
    console.error('Error creating ICO file:', error);
  }
}

// Run the function
createIcoFromPng();