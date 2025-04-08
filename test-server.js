// Test server to debug Express routing issues
const express = require('express');
const path = require('path');
const app = express();

console.log('Starting test server...');

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Try loading our simplified admin router
try {
  const adminRouter = require('./simple-admin');
  app.use('/admin', adminRouter);
  console.log('Successfully loaded simple admin router');
} catch (error) {
  console.error('Error loading simple admin router:', error.message);
}

// Now try loading the actual admin router
try {
  console.log('Attempting to load real admin router...');
  const realAdminRouter = require('./routes/admin');
  app.use('/real-admin', realAdminRouter);
  console.log('Successfully loaded real admin router');
} catch (error) {
  console.error('Error loading real admin router:', error.message);
  console.error(error.stack);
}

// Start test server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});