/**
 * Create Test Admin User
 * This script creates a test admin user for development purposes
 */
require('dotenv').config();
const db = require('./utils/database');

async function createTestAdmin() {
  try {
    // Test admin credentials
    const testUser = {
      username: 'testadmin',
      password: 'TestPassword123!',
      email: 'test@example.com',
      is_admin: true,
      permissions: {
        admin_management: true,
        user_management: true,
        logs_management: true,
        server_management: true,
        blacklist_management: true
      }
    };

    // Check if user already exists
    const existingUser = await db.getLocalUserByUsername(testUser.username);
    if (existingUser) {
      console.log(`✅ Test user '${testUser.username}' already exists`);
      console.log('Username: testadmin');
      console.log('Password: TestPassword123!');
      process.exit(0);
    }

    // Create the user
    await db.createLocalUser(testUser);
    
    console.log('✅ Test admin user created successfully');
    console.log('----------------------------------------');
    console.log('Username: testadmin');
    console.log('Password: TestPassword123!');
    console.log('----------------------------------------');
    console.log('You can now login with these credentials');
  } catch (error) {
    console.error('❌ Error creating test admin user:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
createTestAdmin();