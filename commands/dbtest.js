/**
 * Database Test Command
 * Tests and demonstrates the Discord database functionality
 */
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'dbtest',
  description: 'Test the Discord channel database functionality',
  usage: '.dbtest <action> [key] [value]',
  category: 'Admin',
  adminOnly: true,
  
  /**
   * Execute the command
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async execute(message, args, client) {
    // Check if the Discord database is initialized
    if (!client.discordDB || !client.discordDB.initialized) {
      return message.reply('⚠️ Discord database is not initialized!');
    }
    
    // Get the action from arguments
    const action = args[0]?.toLowerCase();
    
    if (!action || action === 'help') {
      return this.showHelp(message);
    }
    
    // Handle different actions
    switch (action) {
      case 'get':
        await this.handleGet(message, args, client);
        break;
      case 'set':
        await this.handleSet(message, args, client);
        break;
      case 'delete':
        await this.handleDelete(message, args, client);
        break;
      case 'list':
        await this.handleList(message, args, client);
        break;
      default:
        message.reply(`❌ Unknown action: \`${action}\`. Use \`.dbtest help\` to see available commands.`);
    }
  },
  
  /**
   * Show help information
   * @param {Object} message - Discord message
   */
  showHelp(message) {
    const embed = new EmbedBuilder()
      .setTitle('Discord Database Commands')
      .setDescription('Use these commands to interact with the Discord channel database')
      .setColor('#3498db')
      .addFields(
        { name: '.dbtest get <collection> <id>', value: 'Get a document from a collection' },
        { name: '.dbtest set <collection> <id> <json data>', value: 'Set a document in a collection' },
        { name: '.dbtest delete <collection> <id>', value: 'Delete a document from a collection' },
        { name: '.dbtest list [collection]', value: 'List all collections or documents in a collection' }
      )
      .setFooter({ text: 'Discord Channel Database - Using a Discord channel as a database' });
    
    return message.reply({ embeds: [embed] });
  },
  
  /**
   * Handle get action
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async handleGet(message, args, client) {
    const collection = args[1];
    const id = args[2];
    
    if (!collection || !id) {
      return message.reply('❌ Usage: `.dbtest get <collection> <id>`');
    }
    
    const data = client.discordDB.getDocument(collection, id);
    
    if (!data) {
      return message.reply(`❌ Document not found: \`${collection}/${id}\``);
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`Document: ${collection}/${id}`)
      .setDescription('```json\n' + JSON.stringify(data, null, 2) + '\n```')
      .setColor('#2ecc71')
      .setFooter({ text: 'Discord Channel Database' });
    
    return message.reply({ embeds: [embed] });
  },
  
  /**
   * Handle set action
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async handleSet(message, args, client) {
    const collection = args[1];
    const id = args[2];
    
    if (!collection || !id) {
      return message.reply('❌ Usage: `.dbtest set <collection> <id> <json data>`');
    }
    
    // Get JSON data from the rest of the message
    let jsonString = message.content.slice(message.content.indexOf(args[2]) + args[2].length).trim();
    
    // Try to parse JSON data
    let data;
    try {
      // If user didn't provide JSON, create an example
      if (!jsonString) {
        data = {
          name: `Test Document ${id}`,
          created: new Date().toISOString(),
          createdBy: message.author.tag,
          values: [1, 2, 3],
          nested: {
            key: 'value',
            isTest: true
          }
        };
      } else {
        data = JSON.parse(jsonString);
      }
    } catch (error) {
      return message.reply(`❌ Invalid JSON format: ${error.message}`);
    }
    
    // Add metadata
    data._metadata = {
      updatedAt: new Date().toISOString(),
      updatedBy: message.author.tag
    };
    
    // Set the document
    const success = await client.discordDB.setDocument(collection, id, data);
    
    if (!success) {
      return message.reply(`❌ Failed to set document: \`${collection}/${id}\``);
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`Document Saved: ${collection}/${id}`)
      .setDescription('Document was successfully saved to the Discord database.')
      .setColor('#2ecc71')
      .addFields(
        { name: 'Collection', value: collection, inline: true },
        { name: 'ID', value: id, inline: true },
        { name: 'JSON Data', value: '```json\n' + JSON.stringify(data, null, 2).substring(0, 1000) + '\n```' }
      )
      .setFooter({ text: 'Discord Channel Database' });
    
    return message.reply({ embeds: [embed] });
  },
  
  /**
   * Handle delete action
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async handleDelete(message, args, client) {
    const collection = args[1];
    const id = args[2];
    
    if (!collection || !id) {
      return message.reply('❌ Usage: `.dbtest delete <collection> <id>`');
    }
    
    const success = await client.discordDB.deleteDocument(collection, id);
    
    if (!success) {
      return message.reply(`❌ Document not found or could not be deleted: \`${collection}/${id}\``);
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`Document Deleted: ${collection}/${id}`)
      .setDescription('Document was successfully deleted from the Discord database.')
      .setColor('#e74c3c')
      .addFields(
        { name: 'Collection', value: collection, inline: true },
        { name: 'ID', value: id, inline: true }
      )
      .setFooter({ text: 'Discord Channel Database' });
    
    return message.reply({ embeds: [embed] });
  },
  
  /**
   * Handle list action
   * @param {Object} message - Discord message
   * @param {Array} args - Command arguments
   * @param {Object} client - Discord client
   */
  async handleList(message, args, client) {
    const collection = args[1];
    
    // If collection is specified, list documents in collection
    if (collection) {
      const documents = client.discordDB.getCollection(collection);
      
      if (!documents || Object.keys(documents).length === 0) {
        return message.reply(`ℹ️ No documents found in collection: \`${collection}\``);
      }
      
      const documentList = Object.keys(documents).map(id => {
        const doc = documents[id];
        return `- ${id}: ${truncateString(JSON.stringify(doc), 50)}`;
      }).join('\n');
      
      const embed = new EmbedBuilder()
        .setTitle(`Collection: ${collection}`)
        .setDescription(`Found ${Object.keys(documents).length} documents:`)
        .setColor('#3498db')
        .addFields(
          { name: 'Documents', value: '```\n' + documentList.substring(0, 1000) + (documentList.length > 1000 ? '\n...' : '') + '\n```' }
        )
        .setFooter({ text: 'Discord Channel Database' });
      
      return message.reply({ embeds: [embed] });
    }
    // Otherwise list all collections
    else {
      const collections = Object.keys(client.discordDB.dataCache);
      
      if (collections.length === 0) {
        return message.reply('ℹ️ No collections found in the database.');
      }
      
      // Get count of documents in each collection
      const collectionInfo = collections.map(coll => {
        const count = Object.keys(client.discordDB.dataCache[coll]).length;
        return `- ${coll}: ${count} document(s)`;
      }).join('\n');
      
      const embed = new EmbedBuilder()
        .setTitle('Database Collections')
        .setDescription(`Found ${collections.length} collections:`)
        .setColor('#3498db')
        .addFields(
          { name: 'Collections', value: '```\n' + collectionInfo + '\n```' }
        )
        .setFooter({ text: 'Discord Channel Database' });
      
      return message.reply({ embeds: [embed] });
    }
  }
};

/**
 * Truncate a string to a specific length and add ellipsis
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated string
 */
function truncateString(str, length) {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}