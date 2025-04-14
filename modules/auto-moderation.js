/**
 * Auto-Moderation System 
 * Simplified version with in-memory storage
 */
const { TextChannel } = require('discord.js');
const logger = require('./logging');

class AutoModerationSystem {
  constructor(client) {
    this.client = client;
    this.settings = new Map();
    this.filters = new Map();
    this.logs = new Map();
    this.userViolations = new Map(); // Track user violations for escalation
    this.initialized = false;
  }
  
  /**
   * Initialize the auto-moderation system
   */
  async init() {
    try {
      console.log('Initializing Auto-Moderation System...');
      
      // Load settings from Discord database if available
      if (this.client.discordDB && this.client.discordDB.initialized) {
        // Get auto-mod settings from database
        const autoModSettings = this.client.discordDB.getCollection('automod-settings');
        
        // Load settings into memory
        if (autoModSettings) {
          for (const serverId in autoModSettings) {
            this.settings.set(serverId, autoModSettings[serverId]);
          }
        }
        
        // Get custom filters from database
        const autoModFilters = this.client.discordDB.getCollection('automod-filters');
        
        // Load filters into memory
        if (autoModFilters) {
          for (const serverId in autoModFilters) {
            if (Array.isArray(autoModFilters[serverId])) {
              this.filters.set(serverId, autoModFilters[serverId]);
            }
          }
        }
        
        // Get logs from database
        const autoModLogs = this.client.discordDB.getCollection('automod-logs');
        
        // Load logs into memory
        if (autoModLogs) {
          for (const serverId in autoModLogs) {
            if (Array.isArray(autoModLogs[serverId])) {
              this.logs.set(serverId, autoModLogs[serverId]);
            }
          }
        }
        
        // Get user violations from database
        const autoModViolations = this.client.discordDB.getCollection('automod-violations');
        
        // Load user violations into memory
        if (autoModViolations) {
          for (const key in autoModViolations) {
            this.userViolations.set(key, autoModViolations[key]);
          }
        }
      }
      
      this.initialized = true;
      console.log('✅ Auto-Moderation System initialized');
      
      // Set up message handler for content filtering
      this.client.on('messageCreate', this.handleMessage.bind(this));
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing auto-moderation system:', error);
      return false;
    }
  }
  
  /**
   * Handle message for auto-moderation
   */
  async handleMessage(message) {
    try {
      // Skip messages from bots or system
      if (message.author.bot || !message.guild) return false;
      
      // Get server settings
      const serverId = message.guild.id;
      const settings = this.getServerSettings(serverId);
      
      // Skip if auto-mod is disabled for this server
      if (!settings || !settings.enabled) return false;
      
      // Check if user has admin or mod roles that bypass auto-mod
      if (message.member.permissions.has('Administrator') || 
          message.member.permissions.has('ModerateMembers')) {
        return false;
      }
      
      let violation = null;
      
      // Check for spam if enabled
      if (settings.antiSpam && settings.antiSpam.enabled) {
        // Simple implementation for now
        // TODO: Add more sophisticated spam detection
      }
      
      // Check filters if enabled
      if (settings.filters) {
        // Check for invite links
        if (settings.filters.invites && this.containsInviteLink(message.content)) {
          violation = {
            type: 'invite_link',
            description: 'Discord invite link detected'
          };
        }
        
        // Check for links
        if (!violation && settings.filters.links && this.containsLinks(message.content)) {
          violation = {
            type: 'external_link',
            description: 'External link detected'
          };
        }
        
        // Check for mass mentions
        if (!violation && settings.filters.massMentions) {
          const mentionCount = (message.content.match(/<@!?\d+>/g) || []).length;
          if (mentionCount >= settings.mentionThreshold) {
            violation = {
              type: 'mass_mentions',
              description: `Mass mentions detected (${mentionCount})`
            };
          }
        }
        
        // Check for excessive caps
        if (!violation && settings.filters.caps) {
          const capsPercentage = this.calculateCapsPercentage(message.content);
          if (capsPercentage >= settings.capsThreshold) {
            violation = {
              type: 'excessive_caps',
              description: `Excessive caps detected (${Math.round(capsPercentage)}%)`
            };
          }
        }
        
        // Check for profanity
        if (!violation && settings.filters.profanity && this.containsProfanity(message.content)) {
          violation = {
            type: 'profanity',
            description: 'Profanity detected'
          };
        }
      }
      
      // Check custom filters
      if (!violation) {
        const customFilters = this.getServerFilters(serverId);
        for (const filter of customFilters) {
          if (this.matchesFilter(message.content, filter)) {
            violation = {
              type: 'custom_filter',
              description: `Matched custom filter: ${filter.type}`,
              filter: filter
            };
            break;
          }
        }
      }
      
      // Take action if violation found
      if (violation) {
        console.log(`Auto-mod violation in ${serverId}: ${violation.type} by ${message.author.tag}`);
        
        // Determine action to take
        let action = settings.defaultAction || 'delete';
        if (violation.filter && violation.filter.action) {
          action = violation.filter.action;
        }
        
        // Take appropriate action
        await this.takeAction(message, action, violation, settings);
        
        // Log the violation
        this.logViolation(serverId, message.author, violation, action);
        
        // Send log message if enabled
        if (settings.logActions && settings.logChannel) {
          await this.sendLogMessage(message, violation, action, settings.logChannel);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in auto-moderation message handler:', error);
      return false;
    }
  }
  
  /**
   * Take action based on violation
   */
  async takeAction(message, action, violation, settings) {
    try {
      // Check for escalation if enabled
      if (settings.escalateRepeated) {
        action = await this.handleEscalation(message.guild.id, message.author.id, action, violation, settings);
      }
      
      // Always delete the message unless action is 'warn' only
      if (action !== 'warn') {
        await message.delete().catch(err => console.error('Error deleting message:', err));
      }
      
      // Take additional action if needed
      switch (action) {
        case 'warn':
          // Send warning message to user
          await message.author.send({
            content: `⚠️ **Warning:** Your message in ${message.guild.name} contained ${violation.description}. Please review the server rules.`
          }).catch(() => {
            // DMs might be closed
            message.channel.send({
              content: `⚠️ **Warning @${message.author.tag}:** Your message contained ${violation.description}. Please review the server rules.`
            }).catch(err => console.error('Error sending warning in channel:', err));
          });
          break;
          
        case 'mute':
          // Timeout the user
          const duration = this.parseMuteTime(settings.muteTime || '10m');
          await message.member.timeout(duration, `Auto-mod: ${violation.description}`)
            .catch(err => console.error('Error timing out member:', err));
          break;
          
        case 'kick':
          // Kick the user
          await message.member.kick(`Auto-mod: ${violation.description}`)
            .catch(err => console.error('Error kicking member:', err));
          break;
          
        case 'ban':
          // Ban the user
          await message.member.ban({
            reason: `Auto-mod: ${violation.description}`,
            deleteMessageSeconds: 86400 // Delete last 24h of messages
          }).catch(err => console.error('Error banning member:', err));
          break;
      }
      
      return true;
    } catch (error) {
      console.error('Error taking auto-mod action:', error);
      return false;
    }
  }
  
  /**
   * Handle escalation of repeated violations
   * @param {string} serverId - Server ID
   * @param {string} userId - User ID
   * @param {string} baseAction - Base action without escalation
   * @param {Object} violation - Violation details
   * @param {Object} settings - Server settings
   * @returns {string} - Final action to take
   */
  async handleEscalation(serverId, userId, baseAction, violation, settings) {
    try {
      // Create server-user violation tracking if not exists
      const key = `${serverId}-${userId}`;
      if (!this.userViolations.has(key)) {
        this.userViolations.set(key, { 
          count: 0, 
          lastViolation: 0,
          violations: []
        });
      }
      
      const userData = this.userViolations.get(key);
      const now = Date.now();
      
      // Reset count if last violation was more than 24 hours ago
      if (now - userData.lastViolation > 24 * 60 * 60 * 1000) {
        userData.count = 0;
        userData.violations = [];
      }
      
      // Increment counter
      userData.count++;
      userData.lastViolation = now;
      
      // Add violation to history
      userData.violations.push({
        type: violation.type,
        timestamp: now,
        action: baseAction
      });
      
      // Keep only last 10 violations in history
      if (userData.violations.length > 10) {
        userData.violations = userData.violations.slice(-10);
      }
      
      // Update the map
      this.userViolations.set(key, userData);
      
      // Save to database if available
      if (this.client.discordDB && this.client.discordDB.initialized) {
        // Save to Discord database (async, don't await to avoid blocking)
        this.client.discordDB.setDocument('automod-violations', key, userData)
          .catch(err => console.error('Error saving user violations to database:', err));
      }
      
      // Determine escalated action based on violation count
      if (settings.escalateRepeated) {
        // Calculate tier thresholds based on maxViolations setting
        const maxViolations = parseInt(settings.maxViolations) || 7;
        const tier4Threshold = maxViolations;
        const tier3Threshold = Math.max(Math.floor(maxViolations * 0.75), 1);
        const tier2Threshold = Math.max(Math.floor(maxViolations * 0.5), 1);
        const tier1Threshold = 1; // First violation

        console.log(`[AutoMod] User ${userId} has ${userData.count} violations. Thresholds: T1=${tier1Threshold}, T2=${tier2Threshold}, T3=${tier3Threshold}, T4=${tier4Threshold}`);
        
        // Apply appropriate tier action based on violation count
        if (userData.count >= tier4Threshold && settings.tier4Action) {
          console.log(`[AutoMod] Applying tier 4 action: ${settings.tier4Action}`);
          return settings.tier4Action;
        } else if (userData.count >= tier3Threshold && settings.tier3Action) {
          console.log(`[AutoMod] Applying tier 3 action: ${settings.tier3Action}`);
          return settings.tier3Action;
        } else if (userData.count >= tier2Threshold && settings.tier2Action) {
          console.log(`[AutoMod] Applying tier 2 action: ${settings.tier2Action}`);
          return settings.tier2Action;
        } else if (userData.count >= tier1Threshold && settings.tier1Action) {
          console.log(`[AutoMod] Applying tier 1 action: ${settings.tier1Action}`);
          return settings.tier1Action;
        }
        
        // Legacy array-based escalation (if configured)
        if (settings.escalation && Array.isArray(settings.escalation)) {
          for (const escalation of settings.escalation) {
            if (userData.count >= escalation.violations) {
              return escalation.action;
            }
          }
        }
        
        // Fallback to legacy escalation system if tier actions aren't set
        if (userData.count >= maxViolations) {
          return 'ban';
        } else if (userData.count >= Math.ceil(maxViolations * 0.75)) {
          return 'kick';
        } else if (userData.count >= Math.ceil(maxViolations * 0.5)) {
          return 'mute';
        } else if (userData.count >= Math.ceil(settings.maxViolations * 0.25)) {
          return 'warn';
        }
      }
      
      // If no escalation rule matched, return the original action
      return baseAction;
    } catch (error) {
      console.error('Error handling escalation:', error);
      return baseAction;
    }
  }
  
  /**
   * Log violation to database
   */
  logViolation(serverId, user, violation, action) {
    try {
      if (!this.logs.has(serverId)) {
        this.logs.set(serverId, []);
      }
      
      const log = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        userId: user.id,
        username: user.tag || user.username,
        violation: violation.description,
        type: violation.type,
        action: action,
        serverId: serverId
      };
      
      // Add to in-memory logs (most recent first)
      this.logs.get(serverId).unshift(log);
      
      // Trim logs if needed
      if (this.logs.get(serverId).length > 1000) {
        this.logs.get(serverId).length = 1000;
      }
      
      // Save to database if available
      if (this.client.discordDB && this.client.discordDB.initialized) {
        // Save logs to database (async, don't await to avoid blocking message handler)
        this.client.discordDB.setDocument('automod-logs', serverId, this.logs.get(serverId))
          .then(() => console.log(`Auto-mod logs saved to database for server ${serverId}`))
          .catch(err => console.error('Error saving auto-mod logs to database:', err));
      }
      
      return log;
    } catch (error) {
      console.error('Error logging violation:', error);
      return null;
    }
  }
  
  /**
   * Send log message to Discord channel
   */
  async sendLogMessage(message, violation, action, logChannelId) {
    try {
      const logChannel = await this.client.channels.fetch(logChannelId).catch(() => null);
      if (!logChannel) return false;
      
      const actionEmoji = {
        'delete': '🗑️',
        'warn': '⚠️',
        'mute': '🔇',
        'kick': '👢',
        'ban': '🔨'
      };
      
      const embed = {
        title: `${actionEmoji[action] || '🛡️'} Auto-Moderation Action`,
        color: 0xff0000,
        description: `**User:** ${message.author.tag} (${message.author.id})\n**Channel:** ${message.channel.name}\n**Action:** ${this.capitalizeFirstLetter(action)}\n**Violation:** ${violation.description}`,
        timestamp: new Date().toISOString(),
        footer: {
          text: `Message ID: ${message.id}`
        }
      };
      
      await logChannel.send({ embeds: [embed] }).catch(err => {
        console.error('Error sending log message:', err);
      });
      
      return true;
    } catch (error) {
      console.error('Error sending log message:', error);
      return false;
    }
  }
  
  /**
   * Check if content contains Discord invite links
   */
  containsInviteLink(content) {
    const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[a-zA-Z0-9]+/i;
    return inviteRegex.test(content);
  }
  
  /**
   * Check if content contains external links
   */
  containsLinks(content) {
    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    return linkRegex.test(content);
  }
  
  /**
   * Check if content contains profanity (enhanced implementation)
   */
  containsProfanity(content) {
    // Enhanced list of common profanity words with variations
    const profanityList = [
      // Common swear words
      'asshole', 'a$$hole', 'a**hole', 'a-hole',
      'bitch', 'b!tch', 'b*tch', 'b1tch', 'biatch',
      'fuck', 'f*ck', 'f**k', 'fuk', 'fck', 'f***', 'fvck', 'f@ck', 'f#ck', 'fu*k',
      'shit', 'sh*t', 'sh!t', 'sh1t', '$hit', 's**t', 's***',
      'damn', 'crap', 
      'bastard', 'b@stard',
      'whore', 'wh*re', 'w*ore', 'h0e',
      'dick', 'd*ck', 'd!ck', 'd1ck', 'dik',
      'pussy', 'p*ssy', 'pu$$y', 'puss', 'p*ss',
      'nigger', 'n!gger', 'n*gger', 'n1gger', 'negro',
      'nigga', 'n!gga', 'n*gga', 'n1gga',
      'faggot', 'f@ggot', 'f*ggot', 'f@g', 'f*g', 'fag',
      'retard', 'r*tard', 'r3tard', 
      'slut', 'sl*t', '$lut',
      'cunt', 'c*nt', 'cvnt', 'c**t',
      'cock', 'c*ck', 'c0ck', 'cok',

      // Other offensive terms
      'idiot', 'stupid', 'dumb',
      'motherfucker', 'mofo', 'm0f0', 
      'bullshit', 'bullsh*t', 'bs',
      'jackass', 'j@ck@ss', 
      'ass', '@ss', '@$$', 'a$$', 'a$$',
      'tits', 't*ts', 't1ts', 'titties',
      'moron', 'imbecile',
      'stfu', 'gtfo', 'wtf', 'lmfao', 'lmao',
      'anal', '@nal', 'cumshot', 'cum', 'jizz'
    ];
    
    // Check for exact matches using word boundaries
    const contentLower = content.toLowerCase().replace(/\s+/g, ' ');
    
    // First check for exact matches
    for (const word of profanityList) {
      const regex = new RegExp(`\\b${this.escapeRegExp(word)}\\b`, 'i');
      if (regex.test(contentLower)) {
        return true;
      }
    }
    
    // Then check for intentional obfuscation: separated letters, dotted words
    for (const word of profanityList) {
      if (word.length <= 3) continue; // Skip short words to avoid false positives
      
      // Check for separated letters: "f u c k"
      try {
        const separatedPattern = word.split('').join('[\\s.*_-]+');
        const separatedRegex = new RegExp(`\\b${separatedPattern}\\b`, 'i');
        if (separatedRegex.test(contentLower)) {
          return true;
        }
      } catch (regexError) {
        console.warn(`Invalid regex pattern for word "${word}": ${regexError.message}`);
        // Try a simpler pattern instead
        try {
          const simplePattern = word.split('').join('\\s*');
          const simpleRegex = new RegExp(`\\b${simplePattern}\\b`, 'i');
          if (simpleRegex.test(contentLower)) {
            return true;
          }
        } catch (error) {
          console.error(`Failed to create fallback regex for "${word}": ${error.message}`);
        }
      }
      
      // Check for dotted words: "f.u.c.k"
      try {
        const dottedPattern = word.split('').join('\\.');
        const dottedRegex = new RegExp(`\\b${dottedPattern}\\b`, 'i');
        if (dottedRegex.test(contentLower)) {
          return true;
        }
      } catch (regexError) {
        console.warn(`Invalid dotted regex pattern for word "${word}": ${regexError.message}`);
      }
    }
    
    return false;
  }
  
  /**
   * Calculate percentage of capital letters in content
   */
  calculateCapsPercentage(content) {
    if (!content || content.length < 8) return 0;
    
    const letters = content.replace(/[^a-zA-Z]/g, '');
    if (letters.length === 0) return 0;
    
    const capsCount = letters.replace(/[^A-Z]/g, '').length;
    return (capsCount / letters.length) * 100;
  }
  
  /**
   * Check if content matches a custom filter
   */
  matchesFilter(content, filter) {
    try {
      switch (filter.type) {
        case 'word':
          const wordRegex = new RegExp(`\\b${this.escapeRegExp(filter.content)}\\b`, 'i');
          return wordRegex.test(content);
          
        case 'regex':
          try {
            const customRegex = new RegExp(filter.content, 'i');
            return customRegex.test(content);
          } catch {
            return false; // Invalid regex
          }
          
        case 'domain':
          const domainRegex = new RegExp(`https?:\\/\\/([^\\s]+\\.)?${this.escapeRegExp(filter.content)}(\\/|\\s|$)`, 'i');
          return domainRegex.test(content);
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Error matching filter:', error);
      return false;
    }
  }
  
  /**
   * Parse mute time string to milliseconds
   */
  parseMuteTime(timeString) {
    const match = timeString.match(/^(\d+)([hmd])$/);
    if (!match) return 10 * 60 * 1000; // Default 10 minutes
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'm': return value * 60 * 1000; // minutes
      case 'h': return value * 60 * 60 * 1000; // hours
      case 'd': return value * 24 * 60 * 60 * 1000; // days
      default: return 10 * 60 * 1000; // Default 10 minutes
    }
  }
  
  /**
   * Escape string for use in regex
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * Capitalize first letter of string
   */
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  /**
   * Get server auto-moderation settings
   * @param {string} serverId - Discord server ID
   * @returns {Object} - Server auto-moderation settings
   */
  getServerSettings(serverId) {
    return this.settings.get(serverId) || {
      serverId,
      enabled: false,
      logActions: true,
      logChannel: '',
      filters: {
        profanity: false,
        links: false,
        invites: false,
        massMentions: false,
        caps: false
      },
      mentionThreshold: 5,
      antiSpam: {
        enabled: false,
        messageThreshold: 5,
        timeWindow: 5
      },
      capsThreshold: 70,
      defaultAction: 'delete',
      muteTime: '10m',
      escalateRepeated: false,
      maxViolations: 7,
      // New tier-based escalation system
      tier1Action: 'warn',      // First offense
      tier2Action: 'mute',      // After 3 violations
      tier3Action: 'kick',      // After 5 violations
      tier4Action: 'ban'        // After maxViolations violations
    };
  }
  
  /**
   * Save server auto-moderation settings
   * @param {string} serverId - Discord server ID
   * @param {Object} settings - Server auto-moderation settings
   */
  async saveServerSettings(serverId, settings) {
    try {
      const serverSettings = {
        ...this.getServerSettings(serverId),
        ...settings,
        serverId
      };
      
      // Save to in-memory settings
      this.settings.set(serverId, serverSettings);
      
      // Add server to logs if not exists
      if (!this.logs.has(serverId)) {
        this.logs.set(serverId, []);
      }
      
      // Add server to filters if not exists
      if (!this.filters.has(serverId)) {
        this.filters.set(serverId, []);
      }
      
      // Save to database if available
      if (this.client.discordDB && this.client.discordDB.initialized) {
        // Collect all server settings
        const allSettings = {};
        for (const [sid, sSettings] of this.settings.entries()) {
          allSettings[sid] = sSettings;
        }
        
        // Save to Discord database
        await this.client.discordDB.setDocument('automod-settings', serverId, serverSettings);
        console.log(`Auto-mod settings saved to database for server ${serverId}`);
      }
      
      return serverSettings;
    } catch (error) {
      console.error('Error saving auto-moderation settings:', error);
      throw error;
    }
  }
  
  /**
   * Get custom filters for a server
   * @param {string} serverId - Discord server ID
   * @returns {Array} - Custom filters
   */
  getServerFilters(serverId) {
    return this.filters.get(serverId) || [];
  }
  
  /**
   * Add custom filter for a server
   * @param {string} serverId - Discord server ID
   * @param {Object} filter - Filter object
   */
  async addFilter(serverId, filter) {
    try {
      const newFilter = {
        ...filter,
        id: Date.now().toString(),
        serverId
      };
      
      // Add to in-memory filters
      if (!this.filters.has(serverId)) {
        this.filters.set(serverId, []);
      }
      this.filters.get(serverId).push(newFilter);
      
      // Save to database if available
      if (this.client.discordDB && this.client.discordDB.initialized) {
        // Save the updated filters list to database
        await this.client.discordDB.setDocument('automod-filters', serverId, this.filters.get(serverId));
        console.log(`Auto-mod filters saved to database for server ${serverId}`);
      }
      
      return newFilter;
    } catch (error) {
      console.error('Error adding auto-moderation filter:', error);
      throw error;
    }
  }
  
  /**
   * Remove custom filter from a server
   * @param {string} serverId - Discord server ID
   * @param {string} filterId - Filter ID
   */
  async removeFilter(serverId, filterId) {
    try {
      // Remove from in-memory filters
      if (this.filters.has(serverId)) {
        const serverFilters = this.filters.get(serverId);
        const updatedFilters = serverFilters.filter(filter => filter.id !== filterId);
        this.filters.set(serverId, updatedFilters);
        
        // Save to database if available
        if (this.client.discordDB && this.client.discordDB.initialized) {
          // Save the updated filters list to database
          await this.client.discordDB.setDocument('automod-filters', serverId, updatedFilters);
          console.log(`Auto-mod filters updated in database for server ${serverId}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error removing auto-moderation filter:', error);
      throw error;
    }
  }
  
  /**
   * Get auto-moderation logs for a server
   * @param {string} serverId - Discord server ID
   * @param {number} limit - Maximum number of logs to return
   * @returns {Array} - Auto-moderation logs
   */
  getServerLogs(serverId, limit = 100) {
    const logs = this.logs.get(serverId) || [];
    return logs.slice(0, limit);
  }
  
  /**
   * Get channels for a server that can be used for logging
   * @param {string} serverId - Discord server ID
   * @returns {Array} - Array of text channels
   */
  async getServerLogChannels(serverId) {
    try {
      const guild = await this.client.guilds.fetch(serverId);
      if (!guild) return [];
      
      const channels = await guild.channels.fetch();
      const textChannels = channels.filter(channel => 
        channel.type === 0 && // 0 is TextChannel
        channel.permissionsFor(guild.members.me).has(['SendMessages', 'ViewChannel'])
      );
      
      return Array.from(textChannels.values()).map(channel => ({
        id: channel.id,
        name: channel.name
      }));
    } catch (error) {
      console.error('Error fetching server log channels:', error);
      return [];
    }
  }
}

let instance = null;

module.exports = {
  /**
   * Initialize auto-moderation system
   * @param {Client} client - Discord client
   * @returns {AutoModerationSystem} - Auto-moderation system instance
   */
  init(client) {
    if (!instance) {
      instance = new AutoModerationSystem(client);
      instance.init();
    }
    return instance;
  },
  
  /**
   * Get auto-moderation system instance
   * @returns {AutoModerationSystem} - Auto-moderation system instance
   */
  getInstance() {
    return instance;
  }
};