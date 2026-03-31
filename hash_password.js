const crypto = require('crypto');

const password = process.argv[2];

if (!password) {
  console.log('Usage: node hash_password.js <your_new_password>');
  process.exit(1);
}

const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);
