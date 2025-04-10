/**
 * GIF Command
 * Applies a simple effect to the last sent image in the channel
 */
// Use MessageAttachment for older Discord.js or AttachmentBuilder for v14+
const { MessageAttachment } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const GIFEncoder = require('gifencoder');

module.exports = {
  name: 'gif',
  category: 'fun',
  description: 'Convert the last image in the channel to a GIF with effects',
  usage: '.gif [effect]',
  examples: ['.gif', '.gif bounce', '.gif fade', '.gif flip'],
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    try {
      // Send loading message
      const loadingMessage = await message.channel.send('🔍 Looking for the last image...');
      
      // Get effect type if provided
      const effectType = args[0]?.toLowerCase() || 'bounce';
      const validEffects = ['bounce', 'fade', 'flip', 'slide'];
      
      if (args[0] && !validEffects.includes(effectType)) {
        return loadingMessage.edit(`⚠️ Invalid effect type. Available effects: ${validEffects.join(', ')}`);
      }
      
      // Find the last image in the channel
      const messages = await message.channel.messages.fetch({ limit: 25 });
      const imageMessage = messages.find(msg => {
        // Check for attachments with images
        if (msg.attachments.size > 0) {
          const attachment = msg.attachments.first();
          return attachment.contentType && attachment.contentType.startsWith('image/') && 
                 !attachment.contentType.includes('gif'); // Skip existing GIFs
        }
        
        // Check for embeds with images
        if (msg.embeds.length > 0) {
          const embed = msg.embeds[0];
          return embed.image || (embed.thumbnail && embed.thumbnail.url);
        }
        
        return false;
      });
      
      if (!imageMessage) {
        await loadingMessage.edit('❌ No recent images found in this channel.');
        return;
      }
      
      // Get the image URL
      let imageUrl;
      if (imageMessage.attachments.size > 0) {
        imageUrl = imageMessage.attachments.first().url;
      } else if (imageMessage.embeds.length > 0) {
        const embed = imageMessage.embeds[0];
        imageUrl = embed.image ? embed.image.url : embed.thumbnail.url;
      }
      
      if (!imageUrl) {
        await loadingMessage.edit('❌ Failed to extract image URL.');
        return;
      }
      
      // Update loading message
      await loadingMessage.edit(`⚙️ Creating a ${effectType} GIF animation...`);
      
      // Create temporary directory if it doesn't exist
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      try {
        // Download the image
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
        
        // Generate unique names for temporary files
        const timestamp = Date.now();
        const originalImagePath = path.join(tempDir, `original_${timestamp}.png`);
        const outputGifPath = path.join(tempDir, `animated_${timestamp}.gif`);
        
        // Save the original image
        fs.writeFileSync(originalImagePath, buffer);
        
        // Resize the image (to make GIFs smaller and faster to create)
        const imageBuffer = await sharp(originalImagePath)
          .resize({ width: 300, height: 300, fit: 'inside' })
          .toBuffer();
          
        // Create frames for the GIF
        const frames = await createFrames(imageBuffer, effectType, tempDir, timestamp);
        
        // Create GIF from frames
        await createGifFromFrames(frames, outputGifPath, effectType);
        
        // Send the GIF
        const attachment = new MessageAttachment(outputGifPath);
        await message.channel.send({
          content: `🎬 Here's your GIF with the ${effectType} effect:`,
          files: [attachment]
        });
        
        // Delete loading message
        await loadingMessage.delete();
        
        // Clean up the temporary files
        setTimeout(() => {
          try {
            // Delete the frames and output GIF
            fs.unlinkSync(originalImagePath);
            fs.unlinkSync(outputGifPath);
            
            // Delete the frame files
            for (const frame of frames) {
              if (fs.existsSync(frame)) {
                fs.unlinkSync(frame);
              }
            }
          } catch (err) {
            console.error('Error deleting temporary files:', err);
          }
        }, 10000);
        
      } catch (error) {
        console.error('Error processing image:', error);
        await loadingMessage.edit('❌ Error processing the image.');
      }
    } catch (error) {
      console.error('Error in GIF command:', error);
      message.reply('❌ An error occurred while creating the GIF.');
    }
  }
};

/**
 * Create frames for the GIF animation
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} effectType - Type of effect
 * @param {string} tempDir - Temporary directory
 * @param {number} timestamp - Timestamp for unique filenames
 * @returns {Promise<string[]>} - Array of frame file paths
 */
async function createFrames(imageBuffer, effectType, tempDir, timestamp) {
  const frameCount = 10; // Number of frames for the animation
  const framePaths = [];
  
  for (let i = 0; i < frameCount; i++) {
    const framePath = path.join(tempDir, `frame_${timestamp}_${i}.png`);
    framePaths.push(framePath);
    
    // Apply different effects based on the selected type
    let image = sharp(imageBuffer);
    
    switch (effectType) {
      case 'bounce':
        // Create a bouncing effect by scaling the image up and down
        const scale = 1 - 0.2 * Math.abs(Math.sin((i / frameCount) * Math.PI));
        
        await image
          .resize({ 
            width: Math.round(300 * scale), 
            height: Math.round(300 * scale),
            fit: 'inside'
          })
          .extend({
            top: Math.round((300 - 300 * scale) / 2),
            bottom: Math.round((300 - 300 * scale) / 2),
            left: Math.round((300 - 300 * scale) / 2),
            right: Math.round((300 - 300 * scale) / 2),
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toFile(framePath);
        break;
        
      case 'fade':
        // Create a fade in/out effect by adjusting opacity
        const opacity = Math.abs(Math.sin((i / frameCount) * Math.PI));
        
        await image
          .composite([{
            input: Buffer.from([
              0, 0, 0, Math.round(255 * (1 - opacity))
            ]),
            raw: {
              width: 1,
              height: 1,
              channels: 4
            },
            tile: true,
            blend: 'dest-in'
          }])
          .toFile(framePath);
        break;
        
      case 'flip':
        // Create a flipping effect
        const flipProgress = i / frameCount;
        const flipScale = Math.cos(flipProgress * Math.PI);
        
        await image
          .resize({ 
            width: Math.abs(Math.round(300 * flipScale)), 
            height: 300,
            fit: 'inside' 
          })
          .extend({
            left: Math.round((300 - Math.abs(300 * flipScale)) / 2),
            right: Math.round((300 - Math.abs(300 * flipScale)) / 2),
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .flop(flipProgress >= 0.5) // Flip horizontally in the second half
          .toFile(framePath);
        break;
        
      case 'slide':
        // Create a sliding effect
        const offset = Math.round(300 * Math.sin((i / frameCount) * Math.PI * 2));
        
        await image
          .extend({
            left: offset > 0 ? offset : 0,
            right: offset < 0 ? -offset : 0,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .extract({
            left: Math.abs(offset),
            top: 0,
            width: 300,
            height: 300
          })
          .toFile(framePath);
        break;
    }
  }
  
  return framePaths;
}

/**
 * Create a GIF from individual frames
 * @param {string[]} framePaths - Paths to the frame files
 * @param {string} outputGifPath - Path to save the GIF
 * @param {string} effectType - Type of effect for determining timing
 */
async function createGifFromFrames(framePaths, outputGifPath, effectType) {
  // Use GIFEncoder
  const encoder = new GIFEncoder();
  const outputStream = fs.createWriteStream(outputGifPath);
  encoder.createReadStream().pipe(outputStream);
  
  // Configure the encoder
  encoder.start();
  encoder.setRepeat(0); // 0 for infinite loops
  
  // Set delay based on effect type
  let delay;
  switch (effectType) {
    case 'flip':
      delay = 100;
      break;
    case 'fade':
      delay = 150;
      break;
    case 'slide':
      delay = 80;
      break;
    case 'bounce':
    default:
      delay = 100;
      break;
  }
  encoder.setDelay(delay);
  
  // Read each frame and add to the GIF
  for (const framePath of framePaths) {
    const frameData = fs.readFileSync(framePath);
    const metadata = await sharp(frameData).metadata();
    
    // Convert frame to raw pixel data
    const rawData = await sharp(frameData)
      .ensureAlpha()
      .raw()
      .toBuffer();
    
    // Add the frame to the GIF
    encoder.addFrame(rawData);
  }
  
  // Finish the encoding
  encoder.finish();
  
  // Return a promise that resolves when the file is written
  return new Promise((resolve, reject) => {
    outputStream.on('finish', resolve);
    outputStream.on('error', reject);
  });
}