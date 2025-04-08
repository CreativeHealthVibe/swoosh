// Debug script to check for route errors
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// Create a simple test server
console.log("Testing with a simple Express server...");

try {
  // Try to load the admin router
  console.log("Attempting to load admin router...");
  const adminRouter = require('./routes/admin');
  
  // If we get here, the router loaded successfully
  console.log("Admin router loaded successfully");
  
  // Set up the router
  app.use('/admin', adminRouter);
  console.log("Admin router mounted successfully");
  
  console.log("All routes processed successfully!");
} catch (error) {
  console.error("Error loading admin router:", error.message);
  
  // Try to identify the problematic route
  if (error.message.includes('Missing parameter')) {
    console.log("This error typically happens with route paths containing invalid characters or syntax.");
    console.log("Attempting to locate problematic route...");
    
    try {
      const routesContent = fs.readFileSync('./routes/admin.js', 'utf8');
      const routeLines = routesContent.split('\n');
      
      // Look for any unusual route definitions
      const suspiciousLines = [];
      routeLines.forEach((line, index) => {
        if (line.includes('router.get(') || line.includes('router.post(')) {
          // Check for any unusual characters or patterns
          if (line.includes('https://') || line.includes('http://') || 
              line.includes(':') && !line.includes('/:') || 
              line.includes('<') || line.includes('>') ||
              line.includes('?') && !line.includes('/?')) {
            suspiciousLines.push({
              lineNumber: index + 1,
              content: line.trim()
            });
          }
        }
      });
      
      if (suspiciousLines.length > 0) {
        console.log("Found potentially problematic route definitions:");
        suspiciousLines.forEach(line => {
          console.log(`Line ${line.lineNumber}: ${line.content}`);
        });
      } else {
        console.log("No obviously problematic routes found. The issue might be more complex.");
      }
    } catch (fsError) {
      console.error("Error reading routes file:", fsError.message);
    }
  }
}

console.log("Route check complete");