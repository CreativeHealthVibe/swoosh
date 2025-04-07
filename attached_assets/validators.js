// validators.js
module.exports = {
    validateRobloxID: (id) => /^\d+$/.test(id),
    validateBountyAmount: (amount) => amount >= 15 && amount <= 30000,
    validateImage: (attachment) => 
      ['image/png', 'image/jpeg'].includes(attachment.contentType)
  };