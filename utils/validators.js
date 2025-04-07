// validators.js - Input validation utilities
const config = require('../config');

module.exports = {
  /**
   * Validates a Roblox user ID
   * @param {string} id - The Roblox ID to validate
   * @returns {boolean} - Whether the ID is valid
   */
  validateRobloxID: (id) => {
    // Roblox IDs are numeric only
    return /^\d+$/.test(id);
  },
  
  /**
   * Validates a bounty amount
   * @param {number} amount - The bounty amount to validate
   * @returns {boolean} - Whether the amount is valid
   */
  validateBountyAmount: (amount) => {
    // Check if amount is within acceptable range
    return amount >= config.validation.bountyMin && 
           amount <= config.validation.bountyMax;
  },
  
  /**
   * Validates if a file is an image
   * @param {Object} attachment - Discord attachment object
   * @returns {boolean} - Whether the attachment is a valid image
   */
  validateImage: (attachment) => {
    return config.validation.allowedImageTypes.includes(attachment.contentType);
  },
  
  /**
   * Validates if a file is a valid image for emoji conversion
   * @param {Object} attachment - Discord attachment object
   * @returns {boolean} - Whether the attachment is a valid image
   */
  isValidImage: (attachment) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    return attachment && validTypes.includes(attachment.contentType);
  },
  
  /**
   * Validates a Discord channel
   * @param {Object} channel - Discord channel
   * @param {Array} types - Array of valid channel types
   * @returns {boolean} - Whether the channel is valid
   */
  validateChannel: (channel, types) => {
    return channel && types.includes(channel.type);
  }
};
