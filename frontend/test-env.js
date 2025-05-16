const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('Environment variables loaded from root .env file:');
console.log('-------------------------------------------------');
Object.keys(process.env).forEach(key => {
  // Only show NEXT_PUBLIC_ variables or a few other selected ones for privacy/security
  if (key.startsWith('NEXT_PUBLIC_') || ['NODE_ENV', 'PORT'].includes(key)) {
    console.log(`${key}: ${process.env[key]}`);
  }
});
console.log('-------------------------------------------------');
console.log('If you see your environment variables above, the setup is working correctly!'); 