const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Input and output paths
const inputPngPath = path.join(__dirname, 'website', 'public', 'img', 'logo.png');
const outputIcoPath = path.join(__dirname, 'website', 'public', 'img', 'logo.ico');

// Function to create an ICO file (which is essentially just a .png renamed to .ico for Electron)
// Electron is not strict about the ICO format, it can use PNG files renamed to .ico
async function createIcoFromPng() {
  try {
    // Ensure input file exists
    if (!fs.existsSync(inputPngPath)) {
      console.error(`Error: Input PNG file not found at ${inputPngPath}`);
      return;
    }
    
    // Resize the image to 256x256 (common size for icons)
    // We're making a square icon regardless of input dimensions
    await sharp(inputPngPath)
      .resize(256, 256)
      .toBuffer()
      .then(data => {
        // Write buffer to output file
        fs.writeFileSync(outputIcoPath, data);
        console.log(`Successfully created ICO at ${outputIcoPath}`);
      });
  } catch (error) {
    console.error('Error creating ICO file:', error);
  }
}

// Execute the conversion
createIcoFromPng();