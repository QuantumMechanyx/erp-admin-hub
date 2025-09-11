const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function generateBypassCredentials() {
  console.log('🔐 Generating secure bypass authentication credentials...\n');
  
  // Generate a 64+ character secure username
  const username = `admin_${crypto.randomBytes(32).toString('hex')}`;
  
  // Generate a 64+ character secure password
  const password = crypto.randomBytes(48).toString('hex');
  
  // Generate bcrypt hash
  const passwordHash = bcrypt.hashSync(password, 12);
  
  console.log('Generated credentials (save these securely!):');
  console.log('='.repeat(60));
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
  console.log(`Password Hash: ${passwordHash}`);
  console.log('='.repeat(60));
  console.log('\nAdd to your .env.local file:');
  console.log(`BYPASS_AUTH_USERNAME="${username}"`);
  console.log(`BYPASS_AUTH_PASSWORD_HASH="${passwordHash}"`);
  console.log('\n⚠️  SECURITY NOTICE:');
  console.log('- Save the plain password securely - you cannot recover it from the hash');
  console.log('- The username is 69 characters long (32 bytes hex + "admin_" prefix)');
  console.log('- The password is 96 characters long (48 bytes hex)');
  console.log('- Only the hash is stored in environment variables');
  console.log('- Use these credentials ONLY for testing and diagnostics');
}

generateBypassCredentials();