/**
 * Discord OAuth Admin Panel Setup Check
 * This script checks if all necessary files and configurations are in place
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n==== SWOOSH Bot Admin Panel Setup Check ====\n');

// Check required files
const requiredFiles = [
  { path: '.env', description: 'Environment variables' },
  { path: 'utils/passport/discord.js', description: 'Discord authentication strategy' },
  { path: 'middlewares/auth.js', description: 'Authentication middleware' },
  { path: 'routes/auth/index.js', description: 'Authentication routes' },
  { path: 'routes/admin.js', description: 'Admin routes' },
  { path: 'website/views/auth/login.ejs', description: 'Login page template' },
  { path: 'website/views/layouts/auth.ejs', description: 'Auth layout template' },
  { path: 'website/views/layouts/admin.ejs', description: 'Admin layout template' },
  { path: 'website/views/admin/dashboard.ejs', description: 'Admin dashboard template' },
  { path: 'website/views/admin/blacklist.ejs', description: 'Blacklist management template' },
  { path: 'website/public/css/admin.css', description: 'Admin styles' },
  { path: 'website/public/js/admin.js', description: 'Admin scripts' }
];

console.log('Checking required files...');
let fileErrors = 0;

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file.path);
  if (fs.existsSync(filePath)) {
    console.log(`✅ Found: ${file.path} (${file.description})`);
  } else {
    console.error(`❌ Missing: ${file.path} (${file.description})`);
    fileErrors++;
  }
}

// Check environment variables
console.log('\nChecking environment variables...');
const requiredEnvVars = [
  { name: 'DISCORD_CLIENT_ID', value: process.env.DISCORD_CLIENT_ID },
  { name: 'DISCORD_CLIENT_SECRET', value: process.env.DISCORD_CLIENT_SECRET },
  { name: 'DISCORD_CALLBACK_URL', value: process.env.DISCORD_CALLBACK_URL },
  { name: 'SESSION_SECRET', value: process.env.SESSION_SECRET },
  { name: 'WEBSITE_URL', value: process.env.WEBSITE_URL }
];

let envErrors = 0;

for (const envVar of requiredEnvVars) {
  if (envVar.value) {
    // Mask secret values for security
    const displayValue = envVar.name.includes('SECRET') ? 
      '********' : envVar.value;
    console.log(`✅ Set: ${envVar.name}=${displayValue}`);
  } else {
    console.error(`❌ Missing: ${envVar.name}`);
    envErrors++;
  }
}

// Check dependencies in package.json
console.log('\nChecking dependencies in package.json...');
const packageJsonPath = path.join(__dirname, 'package.json');

if (fs.existsSync(packageJsonPath)) {
  const packageJson = require(packageJsonPath);
  const requiredDependencies = [
    'express-session',
    'connect-mongo',
    'passport',
    'passport-discord',
    'express-flash'
  ];
  
  let depErrors = 0;
  
  for (const dep of requiredDependencies) {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ Installed: ${dep} (${packageJson.dependencies[dep]})`);
    } else {
      console.error(`❌ Missing: ${dep}`);
      depErrors++;
    }
  }
  
  if (depErrors > 0) {
    console.log(`\n⚠️ Some dependencies are missing. Run the following command to install them:`);
    console.log(`npm install --save ${requiredDependencies.join(' ')}`);
  }
} else {
  console.error('❌ package.json file not found!');
}

// Summary
console.log('\n==== Setup Check Summary ====');
if (fileErrors + envErrors === 0) {
  console.log('✅ All necessary files and environment variables are in place.');
  console.log('✅ Admin panel is ready to use!');
  console.log('\n🔗 Access the admin panel at: https://swooshfinal.onrender.com/auth/login');
} else {
  console.error(`❌ Found ${fileErrors} missing files and ${envErrors} missing environment variables.`);
  console.error('❌ Please fix the issues above before continuing.');
}

// OAuth URL Instructions
console.log('\n==== OAuth URL Information ====');
if (process.env.DISCORD_CLIENT_ID) {
  const website = process.env.WEBSITE_URL || 'https://swooshfinal.onrender.com';
  const encodedRedirectUri = encodeURIComponent(website + '/');
  const oauthUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${encodedRedirectUri}&scope=guilds.join+identify`;
  
  console.log('OAuth2 URL for login button:');
  console.log(oauthUrl);
} else {
  console.error('Cannot generate OAuth URL because DISCORD_CLIENT_ID is missing.');
}

console.log('\n==== End of Setup Check ====\n');