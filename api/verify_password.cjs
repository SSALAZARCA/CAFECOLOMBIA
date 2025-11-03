const bcrypt = require('bcryptjs');

async function verifyPassword() {
  const password = 'admin123';
  const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS';
  
  const isValid = await bcrypt.compare(password, hash);
  console.log('Contraseña válida:', isValid);
  
  // También generar un nuevo hash para comparar
  const newHash = await bcrypt.hash(password, 12);
  console.log('Nuevo hash:', newHash);
}

verifyPassword();