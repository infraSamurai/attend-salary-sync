// Generate a secure JWT secret for production
const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('hex');
console.log('\n🔐 Generated secure JWT secret for production:');
console.log('\n' + secret);
console.log('\n📋 Copy this value and set it as JWT_SECRET in Vercel environment variables');
console.log('\n⚠️  KEEP THIS SECRET SECURE - Never commit it to version control!\n');