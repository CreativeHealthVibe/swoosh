// developers.js - Command to display info about bot developers and owners
const { 
  SlashCommandBuilder, 
  EmbedBuilder,
  AttachmentBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const https = require('https');

// Team members with their role and Discord IDs
const teamMembers = [
  {
    id: '930131254106550333',
    name: 'gh_Sman',
    role: 'Bot Owner',
    description: 'Project Lead & Core Developer',
    color: '#FFD700', // Gold color for Owner
    savedImage: 'images/developer_gh_Sman.png'
  },
  {
    id: '1196042021488570391',
    name: 'fl4ddie',
    role: 'Bot Owner',
    description: 'Systems Engineer & Feature Developer',
    color: '#FFD700', // Gold color for Owner
    savedImage: 'images/developer_fl4ddie.png'
  },
  {
    id: '506323791140356106',
    name: 'cdn.gov',
    role: 'Bot Developer',
    description: 'Backend Developer & Integration Specialist',
    color: '#0099ff', // Blue color for Developer
    savedImage: 'images/developer_cdn.png'
  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('developers')
    .setDescription('Shows information about the bot developers and owners'),

  /**
   * Execute the command
   * @param {Object} interaction - Discord interaction
   * @param {Object} client - Discord client
   */
  async execute(interaction, client) {
    await interaction.deferReply();
    
    try {
      // Directory for saving profile pictures
      const imagesDir = path.join(process.cwd(), 'images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      
      // Update developer profile pictures from Discord
      await updateDeveloperImages(client);
      
      // Create embeds for each team member
      const embeds = [];
      
      for (const member of teamMembers) {
        const embed = new EmbedBuilder()
          .setTitle(`${getRoleEmoji(member.role)} ${member.name} - ${member.role}`)
          .setDescription(member.description)
          .setColor(member.color)
          .setThumbnail(`attachment://${path.basename(member.savedImage)}`);
          
        embeds.push(embed);
      }
      
      // Create attachments for all developer images
      const attachments = teamMembers.map(member => {
        const imagePath = member.savedImage;
        if (fs.existsSync(imagePath)) {
          return new AttachmentBuilder(imagePath);
        }
        return null;
      }).filter(attachment => attachment !== null);
      
      // Send the response with all embeds
      await interaction.editReply({ 
        content: '**Meet the SWOOSH Bot Team:**',
        embeds: embeds,
        files: attachments
      });
      
    } catch (error) {
      console.error('Error in developers command:', error);
      await interaction.editReply({ 
        content: 'Failed to load developer information. Please try again later.'
      });
    }
  }
};

/**
 * Get emoji based on team member role
 * @param {string} role - Team member role
 * @returns {string} - Emoji for the role
 */
function getRoleEmoji(role) {
  switch (role) {
    case 'Bot Owner':
      return '👑'; // Crown for owners
    case 'Bot Developer':
      return '💻'; // Computer for developers
    default:
      return '🔧'; // Wrench for other roles
  }
}

/**
 * Update developer images from Discord
 * @param {Object} client - Discord client
 * @returns {Promise} - Promise that resolves when all images are updated
 */
async function updateDeveloperImages(client) {
  const updatePromises = teamMembers.map(async (member) => {
    try {
      const imagePath = member.savedImage;
      const now = Date.now();
      let shouldUpdate = true;
      
      if (fs.existsSync(imagePath)) {
        const stats = fs.statSync(imagePath);
        const fileAge = now - stats.mtimeMs;
        // Only update if file is older than 1 day (86400000 ms)
        shouldUpdate = fileAge > 86400000;
      }
      
      if (shouldUpdate) {
        // Fetch user from Discord
        const user = await client.users.fetch(member.id);
        if (!user) {
          console.warn(`Could not find user with ID ${member.id}`);
          return;
        }
        
        // Get avatar URL with size 256 (Discord's API)
        const avatarURL = user.displayAvatarURL({ size: 256, format: 'png' });
        if (!avatarURL) {
          console.warn(`User ${member.name} has no avatar`);
          return;
        }
        
        // Download and process the image
        await downloadImage(avatarURL, imagePath);
        console.log(`Updated avatar for ${member.name}`);
      }
    } catch (error) {
      console.error(`Failed to update image for ${member.name}:`, error);
      // Continue with other members even if one fails
    }
  });
  
  await Promise.all(updatePromises);
}

/**
 * Download and process an image
 * @param {string} url - Image URL
 * @param {string} outputPath - Path to save the image
 * @returns {Promise} - Promise that resolves when the image is saved
 */
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image, status code: ${response.statusCode}`));
        return;
      }
      
      const data = [];
      response.on('data', (chunk) => {
        data.push(chunk);
      });
      
      response.on('end', async () => {
        try {
          const buffer = Buffer.concat(data);
          
          // Process the image with sharp
          await sharp(buffer)
            .resize(128, 128) // Resize to 128x128
            .png() // Convert to PNG
            .toFile(outputPath);
            
          resolve(outputPath);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}