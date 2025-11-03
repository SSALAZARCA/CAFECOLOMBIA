const bcrypt = require('bcryptjs');

async function testPassword() {
  const storedHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS';
  
  const passwords = ['Admin123!', 'admin123', 'Admin123', 'admin@123'];
  
  for (const password of passwords) {
    const isValid = await bcrypt.compare(password, storedHash);
    console.log(`Password '${password}': ${isValid ? 'VALID' : 'INVALID'}`);
  }
}

testPassword();