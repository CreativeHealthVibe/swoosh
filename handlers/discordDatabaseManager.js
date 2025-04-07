/**
 * Discord Database Manager
 * Uses a specific Discord channel to store and retrieve data
 */
const fs = require('fs');
const path = require('path');
const { MessageAttachment } = require('discord.js');

class DiscordDatabaseManager {
  constructor(client) {
    this.client = client;
    this.databaseChannelId = '1358789970776817915'; // The channel used for storage
    this.dataCache = {}; // In-memory cache
    this.initialized = false;
    this.pendingWrites = new Map(); // Track pending write operations
    this.writeQueue = []; // Queue for write operations
    this.processingQueue = false; // Flag to prevent multiple queue processing
  }

  /**
   * Initialize the database - fetch all existing data from channel
   */
  async initialize() {
    try {
      // Get database channel
      const channel = await this.client.channels.fetch(this.databaseChannelId);
      if (!channel) {
        console.error('❌ Discord database channel not found!');
        return false;
      }

      console.log('📊 Initializing Discord database from channel...');
      
      // Fetch messages (up to 100 most recent)
      const messages = await channel.messages.fetch({ limit: 100 });
      console.log(`📥 Found ${messages.size} database records in Discord channel`);
      
      // Process each message
      for (const [_, message] of messages) {
        // Skip messages without valid data
        if (!message.content.startsWith('DB:')) continue;
        
        try {
          // Format: DB:collection:id followed by content
          const parts = message.content.split(':');
          
          // Skip invalid format - need at least 3 parts (DB, collection, id)
          if (parts.length < 3 || parts[0] !== 'DB') continue;
          
          const prefix = parts[0];
          const collection = parts[1];
          // The id might contain colons or be followed by a newline before JSON, so handle carefully
          let id = parts[2];
          
          // If there's a newline in the ID, truncate it at that point
          if (id.includes('\n')) {
            id = id.split('\n')[0];
          }
          
          // If the ID is empty after processing, skip this message
          if (!id.trim()) continue;
          
          // Retrieve data from message attachments or content
          let data;
          if (message.attachments.size > 0) {
            // For large data stored as JSON attachment
            const attachment = message.attachments.first();
            const response = await fetch(attachment.url);
            if (!response.ok) continue;
            data = await response.json();
          } else {
            // For small data embedded in message content after the DB:collection:id prefix
            try {
              // Check if JSON is wrapped in a code block
              const content = message.content;
              let jsonString;
              
              if (content.includes('```json')) {
                // Extract JSON from code block
                const codeBlockStart = content.indexOf('```json\n') + 8;
                const codeBlockEnd = content.lastIndexOf('\n```');
                jsonString = content.substring(codeBlockStart, codeBlockEnd);
              } else if (content.indexOf('{') !== -1) {
                // Legacy format: extract JSON directly
                jsonString = content.substring(content.indexOf('{'));
              } else {
                console.error(`Invalid message format in ${message.id}`);
                continue;
              }
              
              data = JSON.parse(jsonString);
            } catch (e) {
              console.error(`Failed to parse JSON from message ${message.id}:`, e);
              continue;
            }
          }
          
          // Initialize collection if it doesn't exist
          if (!this.dataCache[collection]) {
            this.dataCache[collection] = {};
          }
          
          // Store data in memory with message ID for later updates
          this.dataCache[collection][id] = {
            data,
            messageId: message.id
          };
        } catch (error) {
          console.error(`Error processing database message ${message.id}:`, error);
        }
      }
      
      this.initialized = true;
      console.log('✅ Discord database initialized successfully');
      console.log(`📊 Loaded ${Object.keys(this.dataCache).length} collections`);
      
      // Log collections and their entry counts
      for (const collection in this.dataCache) {
        console.log(`   - ${collection}: ${Object.keys(this.dataCache[collection]).length} entries`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Discord database:', error);
      return false;
    }
  }

  /**
   * Get a collection of data
   * @param {string} collection - Collection name
   * @returns {Object} - Collection data
   */
  getCollection(collection) {
    if (!this.initialized) {
      console.warn('⚠️ Discord database not initialized');
      return {};
    }
    
    // Return data objects without messageId metadata
    const result = {};
    if (this.dataCache[collection]) {
      for (const id in this.dataCache[collection]) {
        result[id] = this.dataCache[collection][id].data;
      }
    }
    
    return result;
  }

  /**
   * Get a specific document from a collection
   * @param {string} collection - Collection name
   * @param {string} id - Document ID
   * @returns {Object|null} - Document data or null if not found
   */
  getDocument(collection, id) {
    if (!this.initialized) {
      console.warn('⚠️ Discord database not initialized');
      return null;
    }
    
    if (this.dataCache[collection] && this.dataCache[collection][id]) {
      return this.dataCache[collection][id].data;
    }
    
    return null;
  }

  /**
   * Add or update a document in a collection
   * @param {string} collection - Collection name
   * @param {string} id - Document ID
   * @param {Object} data - Document data
   * @returns {Promise<boolean>} - Success status
   */
  async setDocument(collection, id, data) {
    if (!this.initialized) {
      console.warn('⚠️ Discord database not initialized');
      return false;
    }
    
    try {
      // Add to write queue to prevent rate limiting
      return await new Promise((resolve) => {
        const operationId = `${collection}:${id}`;
        
        // Create write operation
        const writeOperation = async () => {
          try {
            const channel = await this.client.channels.fetch(this.databaseChannelId);
            if (!channel) {
              console.error('❌ Discord database channel not found!');
              return false;
            }
            
            // Prepare the data with clean formatting
            const formattedData = this.formatDataForStorage(data);
            const jsonData = JSON.stringify(formattedData, null, 2);
            let dataMessage;
            // Make sure the ID is clean for storage (no newlines or special characters)
            const cleanId = String(id).trim();
            let messageContent = `DB:${collection}:${cleanId}`;
            
            // For larger data, use file attachment
            let attachment = null;
            if (jsonData.length > 1500) {
              // Create temporary file
              const tempFilePath = path.join(__dirname, `../temp_${collection}_${id}.json`);
              fs.writeFileSync(tempFilePath, jsonData, 'utf8');
              attachment = new MessageAttachment(tempFilePath, `${collection}_${id}.json`);
            } else {
              // For smaller data, embed nicely formatted code block with JSON
              messageContent += `\n\`\`\`json\n${jsonData}\n\`\`\``;
            }
            
            // Check if we're updating an existing document
            if (this.dataCache[collection] && this.dataCache[collection][id] && this.dataCache[collection][id].messageId) {
              try {
                // Get existing message
                const existingMessage = await channel.messages.fetch(this.dataCache[collection][id].messageId);
                if (existingMessage) {
                  // Update existing message
                  if (attachment) {
                    dataMessage = await existingMessage.edit({ content: messageContent, files: [attachment] });
                  } else {
                    dataMessage = await existingMessage.edit({ content: messageContent });
                  }
                } else {
                  throw new Error('Message not found');
                }
              } catch (err) {
                // Message might have been deleted, create new one
                if (attachment) {
                  dataMessage = await channel.send({ content: messageContent, files: [attachment] });
                } else {
                  dataMessage = await channel.send({ content: messageContent });
                }
              }
            } else {
              // Create new message
              if (attachment) {
                dataMessage = await channel.send({ content: messageContent, files: [attachment] });
              } else {
                dataMessage = await channel.send({ content: messageContent });
              }
            }
            
            // Clean up temp file if used
            if (attachment) {
              const tempFilePath = path.join(__dirname, `../temp_${collection}_${id}.json`);
              if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
              }
            }
            
            // Initialize collection if it doesn't exist
            if (!this.dataCache[collection]) {
              this.dataCache[collection] = {};
            }
            
            // Update cache with data and message ID
            this.dataCache[collection][id] = {
              data,
              messageId: dataMessage.id
            };
            
            return true;
          } catch (error) {
            console.error(`Error saving document ${collection}/${id} to Discord database:`, error);
            return false;
          }
        };
        
        // Add to queue
        this.writeQueue.push({
          operationId,
          operation: writeOperation,
          resolve
        });
        
        // Start processing queue if not already running
        if (!this.processingQueue) {
          this.processWriteQueue();
        }
      });
    } catch (error) {
      console.error(`Error queueing write operation for ${collection}/${id}:`, error);
      return false;
    }
  }

  /**
   * Process the write queue with rate limiting
   */
  async processWriteQueue() {
    if (this.processingQueue || this.writeQueue.length === 0) {
      return;
    }
    
    this.processingQueue = true;
    
    while (this.writeQueue.length > 0) {
      const { operationId, operation, resolve } = this.writeQueue.shift();
      
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        console.error(`Error in write operation ${operationId}:`, error);
        resolve(false);
      }
      
      // Rate limiting: wait between operations
      if (this.writeQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    this.processingQueue = false;
  }

  /**
   * Delete a document from a collection
   * @param {string} collection - Collection name
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteDocument(collection, id) {
    if (!this.initialized) {
      console.warn('⚠️ Discord database not initialized');
      return false;
    }
    
    try {
      // Check if document exists
      if (!this.dataCache[collection] || !this.dataCache[collection][id]) {
        return false;
      }
      
      // Get message ID
      const messageId = this.dataCache[collection][id].messageId;
      if (!messageId) {
        return false;
      }
      
      // Delete message from Discord
      const channel = await this.client.channels.fetch(this.databaseChannelId);
      if (!channel) {
        return false;
      }
      
      try {
        const message = await channel.messages.fetch(messageId);
        if (message) {
          await message.delete();
        }
      } catch (err) {
        console.warn(`Message ${messageId} already deleted or not found`);
      }
      
      // Remove from cache
      delete this.dataCache[collection][id];
      
      return true;
    } catch (error) {
      console.error(`Error deleting document ${collection}/${id} from Discord database:`, error);
      return false;
    }
  }

  /**
   * Find documents in a collection that match a filter function
   * @param {string} collection - Collection name
   * @param {Function} filterFn - Filter function that takes document data and returns boolean
   * @returns {Array} - Array of matching documents
   */
  findDocuments(collection, filterFn) {
    if (!this.initialized) {
      console.warn('⚠️ Discord database not initialized');
      return [];
    }
    
    if (!this.dataCache[collection]) {
      return [];
    }
    
    const results = [];
    for (const id in this.dataCache[collection]) {
      const doc = this.dataCache[collection][id].data;
      if (filterFn(doc)) {
        results.push({
          id,
          ...doc
        });
      }
    }
    
    return results;
  }
  
  /**
   * Format data for storage in Discord messages
   * @param {Object} data - The data to format
   * @returns {Object} - Formatted data
   */
  formatDataForStorage(data) {
    // Create a standardized format for data
    // This ensures a more consistent, clean appearance in Discord messages
    
    // Add timestamp if not already present
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }
    
    // Sort keys alphabetically for consistency
    return Object.keys(data).sort().reduce((result, key) => {
      result[key] = data[key];
      return result;
    }, {});
  }
}

module.exports = DiscordDatabaseManager;