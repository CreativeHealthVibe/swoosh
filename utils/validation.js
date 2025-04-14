/**
 * Validation Utilities
 * Provides validation functions for various data types
 */

/**
 * Check if a string is a valid hex color
 * @param {string} color - The color to validate
 * @returns {boolean} - Whether the color is valid
 */
function isValidHexColor(color) {
  if (!color) return false;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Check if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if a value is a non-empty string
 * @param {*} value - The value to check
 * @returns {boolean} - Whether the value is a non-empty string
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a value is a valid number
 * @param {*} value - The value to check
 * @param {number} [min] - Minimum value (optional)
 * @param {number} [max] - Maximum value (optional)
 * @returns {boolean} - Whether the value is a valid number
 */
function isValidNumber(value, min, max) {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  
  if (min !== undefined && value < min) {
    return false;
  }
  
  if (max !== undefined && value > max) {
    return false;
  }
  
  return true;
}

module.exports = {
  isValidHexColor,
  isValidUrl,
  isNonEmptyString,
  isValidNumber
};