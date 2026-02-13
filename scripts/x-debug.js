#!/usr/bin/env node

/**
 * Debug X API authentication
 */

const { TwitterApi } = require('twitter-api-v2');

console.log('X API Debug');
console.log('===========\n');

// Check env vars
const vars = ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET'];
vars.forEach(v => {
  const val = process.env[v];
  console.log(`${v}: ${val ? val.substring(0, 10) + '...' : 'NOT SET'}`);
});

console.log('\n--- Testing Auth ---\n');

const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET
});

client.v2.me()
  .then(user => {
    console.log('✅ Auth SUCCESS');
    console.log('Username:', user.data.username);
    console.log('User ID:', user.data.id);
  })
  .catch(err => {
    console.log('❌ Auth FAILED');
    console.log('Error code:', err.code);
    console.log('Error message:', err.message);
    
    if (err.code === 401) {
      console.log('\nPossible causes:');
      console.log('- Tokens expired or revoked');
      console.log('- Wrong app permissions (need Write access)');
      console.log('- Account suspended or limited');
      console.log('- Regenerated tokens not updated in env');
    }
  });
