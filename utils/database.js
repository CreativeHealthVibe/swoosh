/**
 * Database utility functions
 * Handles database operations for the application
 */
const { Pool } = require('pg');
const crypto = require('crypto');
const config = require('../config');

// Create database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Initialize database tables
 */
const initDatabase = async () => {
  try {
    console.log('Initializing database tables...');
    
    // Create users table for local authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS local_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        discord_id VARCHAR(255),
        email VARCHAR(255),
        is_admin BOOLEAN DEFAULT false,
        is_super_admin BOOLEAN DEFAULT false,
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create server_logs table for enhanced logging
    await pool.query(`
      CREATE TABLE IF NOT EXISTS server_logs (
        id SERIAL PRIMARY KEY,
        guild_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        target_id VARCHAR(255),
        content TEXT,
        metadata JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create server_members table for tracking member activity
    await pool.query(`
      CREATE TABLE IF NOT EXISTS server_members (
        id SERIAL PRIMARY KEY,
        guild_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        joined_at TIMESTAMP WITH TIME ZONE,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        UNIQUE(guild_id, user_id)
      )
    `);

    console.log('✅ Database tables initialized successfully');
    
    // Create default super admin user if it doesn't exist
    const username = 'gh_sman';
    const password = generateSecurePassword();
    
    // Check if super admin exists
    const existingAdmin = await pool.query(
      'SELECT * FROM local_users WHERE username = $1',
      [username]
    );
    
    if (existingAdmin.rows.length === 0) {
      // If not, create the super admin user
      const hashedPassword = await hashPassword(password);
      
      await pool.query(
        'INSERT INTO local_users (username, password, is_admin, is_super_admin, permissions) VALUES ($1, $2, $3, $4, $5)',
        [username, hashedPassword, true, true, JSON.stringify({
          admin_management: true,
          user_management: true,
          logs_management: true,
          server_management: true,
          blacklist_management: true,
          can_generate_users: true
        })]
      );
      
      console.log(`✅ Created default super admin user: ${username}`);
      console.log(`⚠️ TEMPORARY PASSWORD: ${password}`);
      console.log('Please change this password immediately after first login');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

/**
 * Hash a password with salt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password with salt
 */
const hashPassword = async (password) => {
  return new Promise((resolve, reject) => {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Hash the password with the salt
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
};

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash with salt
 * @returns {Promise<boolean>} - Whether the password matches
 */
const verifyPassword = async (password, hash) => {
  return new Promise((resolve, reject) => {
    // Split the hash and salt
    const [key, salt] = hash.split('.');
    
    // Hash the password with the same salt
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
};

/**
 * Generate a secure random password
 * @param {number} length - Length of the password
 * @returns {string} - Random password
 */
const generateSecurePassword = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  
  return password;
};

/**
 * Create a new local user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} - Created user
 */
const createLocalUser = async (userData) => {
  const { username, password, discord_id, email, is_admin, permissions } = userData;
  const hashedPassword = await hashPassword(password);
  
  const result = await pool.query(
    'INSERT INTO local_users (username, password, discord_id, email, is_admin, permissions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [username, hashedPassword, discord_id, email, is_admin, JSON.stringify(permissions || {})]
  );
  
  return result.rows[0];
};

/**
 * Get a local user by username
 * @param {string} username - Username
 * @returns {Promise<Object|null>} - User object or null
 */
const getLocalUserByUsername = async (username) => {
  const result = await pool.query(
    'SELECT * FROM local_users WHERE username = $1',
    [username]
  );
  
  return result.rows[0] || null;
};

/**
 * Get a local user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} - User object or null
 */
const getLocalUserById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM local_users WHERE id = $1',
    [id]
  );
  
  return result.rows[0] || null;
};

/**
 * Update a local user
 * @param {number} id - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} - Updated user
 */
const updateLocalUser = async (id, userData) => {
  const { username, password, discord_id, email, is_admin, is_super_admin, permissions } = userData;
  
  // Build query dynamically based on provided fields
  let query = 'UPDATE local_users SET updated_at = CURRENT_TIMESTAMP';
  const values = [id];
  let paramCounter = 2;
  
  if (username !== undefined) {
    query += `, username = $${paramCounter++}`;
    values.push(username);
  }
  
  if (password !== undefined) {
    const hashedPassword = await hashPassword(password);
    query += `, password = $${paramCounter++}`;
    values.push(hashedPassword);
  }
  
  if (discord_id !== undefined) {
    query += `, discord_id = $${paramCounter++}`;
    values.push(discord_id);
  }
  
  if (email !== undefined) {
    query += `, email = $${paramCounter++}`;
    values.push(email);
  }
  
  if (is_admin !== undefined) {
    query += `, is_admin = $${paramCounter++}`;
    values.push(is_admin);
  }
  
  if (is_super_admin !== undefined) {
    query += `, is_super_admin = $${paramCounter++}`;
    values.push(is_super_admin);
  }
  
  if (permissions !== undefined) {
    query += `, permissions = $${paramCounter++}`;
    values.push(JSON.stringify(permissions));
  }
  
  query += ' WHERE id = $1 RETURNING *';
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Delete a local user
 * @param {number} id - User ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteLocalUser = async (id) => {
  const result = await pool.query(
    'DELETE FROM local_users WHERE id = $1 RETURNING id',
    [id]
  );
  
  return result.rows.length > 0;
};

/**
 * Get all local users
 * @returns {Promise<Array>} - Array of users
 */
const getAllLocalUsers = async () => {
  const result = await pool.query('SELECT * FROM local_users ORDER BY username');
  return result.rows;
};

/**
 * Add a server log entry
 * @param {Object} logData - Log data
 * @returns {Promise<Object>} - Created log
 */
const addServerLog = async (logData) => {
  const { guild_id, event_type, user_id, target_id, content, metadata } = logData;
  
  const result = await pool.query(
    'INSERT INTO server_logs (guild_id, event_type, user_id, target_id, content, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [guild_id, event_type, user_id, target_id, content, JSON.stringify(metadata || {})]
  );
  
  return result.rows[0];
};

/**
 * Get server logs with filtering
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>} - Array of logs
 */
const getServerLogs = async (filters = {}) => {
  let query = 'SELECT * FROM server_logs';
  const queryParams = [];
  const whereConditions = [];
  
  // Add filters as needed
  if (filters.guild_id) {
    whereConditions.push(`guild_id = $${queryParams.length + 1}`);
    queryParams.push(filters.guild_id);
  }
  
  if (filters.event_type) {
    whereConditions.push(`event_type = $${queryParams.length + 1}`);
    queryParams.push(filters.event_type);
  }
  
  if (filters.user_id) {
    whereConditions.push(`user_id = $${queryParams.length + 1}`);
    queryParams.push(filters.user_id);
  }
  
  if (filters.target_id) {
    whereConditions.push(`target_id = $${queryParams.length + 1}`);
    queryParams.push(filters.target_id);
  }
  
  if (filters.search) {
    whereConditions.push(`content ILIKE $${queryParams.length + 1}`);
    queryParams.push(`%${filters.search}%`);
  }
  
  if (filters.from_date) {
    whereConditions.push(`timestamp >= $${queryParams.length + 1}`);
    queryParams.push(filters.from_date);
  }
  
  if (filters.to_date) {
    whereConditions.push(`timestamp <= $${queryParams.length + 1}`);
    queryParams.push(filters.to_date);
  }
  
  // Add WHERE clause if filters are present
  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }
  
  // Add ordering
  query += ' ORDER BY timestamp DESC';
  
  // Add pagination
  if (filters.limit) {
    query += ` LIMIT $${queryParams.length + 1}`;
    queryParams.push(filters.limit);
  } else {
    query += ' LIMIT 100'; // Default limit
  }
  
  if (filters.offset) {
    query += ` OFFSET $${queryParams.length + 1}`;
    queryParams.push(filters.offset);
  }
  
  const result = await pool.query(query, queryParams);
  return result.rows;
};

/**
 * Track a new server member or update existing member
 * @param {Object} memberData - Member data
 * @returns {Promise<Object>} - Created or updated member
 */
const trackServerMember = async (memberData) => {
  const { guild_id, user_id, username, joined_at, metadata } = memberData;
  
  // Upsert (update or insert) the member
  const result = await pool.query(`
    INSERT INTO server_members (guild_id, user_id, username, joined_at, last_active, metadata)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
    ON CONFLICT (guild_id, user_id) DO UPDATE SET
      username = $3,
      last_active = CURRENT_TIMESTAMP,
      metadata = 
        CASE 
          WHEN server_members.metadata IS NULL THEN $5
          ELSE server_members.metadata || $5
        END
    RETURNING *
  `, [guild_id, user_id, username, joined_at || new Date(), JSON.stringify(metadata || {})]);
  
  return result.rows[0];
};

/**
 * Get server members with filtering
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>} - Array of members
 */
const getServerMembers = async (filters = {}) => {
  let query = 'SELECT * FROM server_members';
  const queryParams = [];
  const whereConditions = [];
  
  // Add filters as needed
  if (filters.guild_id) {
    whereConditions.push(`guild_id = $${queryParams.length + 1}`);
    queryParams.push(filters.guild_id);
  }
  
  if (filters.user_id) {
    whereConditions.push(`user_id = $${queryParams.length + 1}`);
    queryParams.push(filters.user_id);
  }
  
  if (filters.username) {
    whereConditions.push(`username ILIKE $${queryParams.length + 1}`);
    queryParams.push(`%${filters.username}%`);
  }
  
  if (filters.joined_after) {
    whereConditions.push(`joined_at >= $${queryParams.length + 1}`);
    queryParams.push(filters.joined_after);
  }
  
  if (filters.joined_before) {
    whereConditions.push(`joined_at <= $${queryParams.length + 1}`);
    queryParams.push(filters.joined_before);
  }
  
  // Add WHERE clause if filters are present
  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }
  
  // Add ordering
  query += ' ORDER BY last_active DESC';
  
  // Add pagination
  if (filters.limit) {
    query += ` LIMIT $${queryParams.length + 1}`;
    queryParams.push(filters.limit);
  } else {
    query += ' LIMIT 100'; // Default limit
  }
  
  if (filters.offset) {
    query += ` OFFSET $${queryParams.length + 1}`;
    queryParams.push(filters.offset);
  }
  
  const result = await pool.query(query, queryParams);
  return result.rows;
};

/**
 * Get a local user by Discord ID
 * @param {string} discordId - Discord user ID
 * @returns {Promise<Object|null>} - User object or null
 */
const getLocalUserByDiscordId = async (discordId) => {
  if (!discordId) return null;
  
  const result = await pool.query(
    'SELECT * FROM local_users WHERE discord_id = $1',
    [discordId]
  );
  
  return result.rows[0] || null;
};

module.exports = {
  pool,
  initDatabase,
  hashPassword,
  verifyPassword,
  generateSecurePassword,
  createLocalUser,
  getLocalUserByUsername,
  getLocalUserById,
  getLocalUserByDiscordId,
  updateLocalUser,
  deleteLocalUser,
  getAllLocalUsers,
  addServerLog,
  getServerLogs,
  trackServerMember,
  getServerMembers
};