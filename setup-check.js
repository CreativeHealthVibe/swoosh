/**
 * This file checks if all required files and dependencies 
 * are properly set up for the Discord OAuth admin dashboard.
 */
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Define the required files to check
const requiredFiles = [
  '.env',
  '.env.sample',
  'config.js',
  'utils/passport.js',
  'middlewares/auth.js',
  'routes/auth/index.js',
  'routes/admin.js',
  'routes/api.js',
  'website/views/auth/login.ejs',
  'website/views/auth/profile.ejs',
  'website/views/admin/dashboard.ejs',
  'website/views/admin/blacklist.ejs',
  'website/views/admin/logs.ejs',
  'website/views/admin/logs-view.ejs',
  'website/views/admin/partials/sidebar.ejs',
  'website/views/errors/403.ejs',
  'website/views/errors/404.ejs',
  'website/views/errors/500.ejs',
  'website/views/partials/header.ejs',
  'website/views/partials/footer.ejs',
  'website/views/layouts/main.ejs',
  'website/public/css/style.css',
  'website/public/js/main.js',
  'DISCORD_OAUTH_SETUP.md'
];

// Define the required environment variables
const requiredEnvVars = [
  'DISCORD_BOT_TOKEN',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_CALLBACK_URL',
  'SESSION_SECRET',
  'WEBSITE_URL'
];

// Define required dependencies
const requiredDependencies = [
  'express',
  'discord.js',
  'express-session',
  'connect-mongo',
  'passport',
  'passport-discord',
  'cookie-parser',
  'express-ejs-layouts',
  'archiver'
];

// Check if a file exists
function checkFile(filePath) {
  try {
    return fs.existsSync(path.join(__dirname, filePath));
  } catch (error) {
    return false;
  }
}

// Check for required files
console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
console.log(`${colors.blue}Checking if all required files are present...${colors.reset}`);
console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);

let missingFiles = 0;
for (const file of requiredFiles) {
  const exists = checkFile(file);
  if (exists) {
    console.log(`${colors.green}✓${colors.reset} ${file} exists`);
  } else {
    console.log(`${colors.red}✗${colors.reset} ${file} is missing`);
    missingFiles++;
  }
}

console.log(`${colors.blue}\n${'='.repeat(60)}${colors.reset}`);
console.log(`${colors.blue}Checking if required environment variables are defined...${colors.reset}`);
console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);

// Check for environment variables in .env file
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const envLines = envContent.split('\n');
  const envVars = {};
  
  // Extract environment variables
  for (const line of envLines) {
    const match = line.match(/^([^#][A-Za-z0-9_]+)=(.*)$/);
    if (match) {
      envVars[match[1]] = match[2];
    }
  }
  
  let missingEnvVars = 0;
  for (const envVar of requiredEnvVars) {
    if (envVars[envVar]) {
      console.log(`${colors.green}✓${colors.reset} ${envVar} is defined`);
    } else {
      console.log(`${colors.red}✗${colors.reset} ${envVar} is missing or empty`);
      missingEnvVars++;
    }
  }
  
  if (missingEnvVars > 0) {
    console.log(`${colors.yellow}\nWarning: ${missingEnvVars} environment variables are missing or empty.${colors.reset}`);
    console.log(`${colors.yellow}Make sure to add them to your .env file before deploying.${colors.reset}`);
  } else {
    console.log(`${colors.green}\nAll required environment variables are defined.${colors.reset}`);
  }
} catch (error) {
  console.log(`${colors.red}Error reading .env file: ${colors.reset}${error.message}`);
}

console.log(`${colors.blue}\n${'='.repeat(60)}${colors.reset}`);
console.log(`${colors.blue}Checking if required dependencies are installed...${colors.reset}`);
console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);

// Check for dependencies in package.json
try {
  const packageJson = require('./package.json');
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  let missingDependencies = 0;
  for (const dependency of requiredDependencies) {
    if (dependencies[dependency]) {
      console.log(`${colors.green}✓${colors.reset} ${dependency} is installed (${dependencies[dependency]})`);
    } else {
      console.log(`${colors.red}✗${colors.reset} ${dependency} is not installed`);
      missingDependencies++;
    }
  }
  
  if (missingDependencies > 0) {
    console.log(`${colors.yellow}\nWarning: ${missingDependencies} dependencies are missing.${colors.reset}`);
    console.log(`${colors.yellow}Run npm install to install the missing dependencies.${colors.reset}`);
  } else {
    console.log(`${colors.green}\nAll required dependencies are installed.${colors.reset}`);
  }
} catch (error) {
  console.log(`${colors.red}Error reading package.json file: ${colors.reset}${error.message}`);
}

// Summary
console.log(`${colors.blue}\n${'='.repeat(60)}${colors.reset}`);
console.log(`${colors.blue}Summary${colors.reset}`);
console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);

if (missingFiles > 0) {
  console.log(`${colors.yellow}${missingFiles} required files are missing.${colors.reset}`);
} else {
  console.log(`${colors.green}All required files are present.${colors.reset}`);
}

console.log(`${colors.blue}\n${'='.repeat(60)}${colors.reset}`);
console.log(`${colors.blue}Next Steps${colors.reset}`);
console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
console.log(`${colors.cyan}1. Update your .env file with your Discord application credentials.${colors.reset}`);
console.log(`${colors.cyan}2. Configure your Discord application in the Discord Developer Portal.${colors.reset}`);
console.log(`${colors.cyan}3. Start the bot with "npm start" or "node index.js".${colors.reset}`);
console.log(`${colors.cyan}4. Visit http://localhost:3000/admin to access the admin dashboard.${colors.reset}`);