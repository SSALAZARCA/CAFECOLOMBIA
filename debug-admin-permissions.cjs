const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

async function debugAdminPermissions() {
  console.log('🔍 DEBUGGING ADMIN PERMISSIONS');
  console.log('================================\n');

  // 1. Verificar datos en la base de datos
  console.log('1. Verificando datos en la base de datos...');
  const connection = await mysql.createConnection({
    host: '193.203.175.58',
    port: 3306,
    user: 'u689528678_SSALAZARCA',
    password: 'Ssc841209*',
    database: 'u689528678_CAFECOLOMBIA',
    ssl: { rejectUnauthorized: false }
  });

  const [adminRows] = await connection.execute(
    'SELECT id, email, name, is_super_admin, is_active FROM admin_users WHERE email = ?',
    ['admin@cafecolombia.com']
  );

  if (adminRows.length > 0) {
    const admin = adminRows[0];
    console.log('✅ Admin encontrado en BD:', {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      is_super_admin: admin.is_super_admin,
      is_active: admin.is_active,
      type_is_super_admin: typeof admin.is_super_admin
    });
  } else {
    console.log('❌ Admin no encontrado en BD');
    return;
  }

  await connection.end();

  // 2. Probar login y obtener token
  console.log('\n2. Probando login...');
  const loginResponse = await fetch('http://localhost:3001/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin@cafecolombia.com',
      password: 'admin123'
    })
  });

  if (!loginResponse.ok) {
    console.log('❌ Error en login:', await loginResponse.text());
    return;
  }

  const loginData = await loginResponse.json();
  console.log('✅ Login exitoso');
  console.log('Token recibido:', loginData.token ? 'Sí' : 'No');
  console.log('Admin data:', loginData.admin);

  // 3. Decodificar JWT
  console.log('\n3. Decodificando JWT...');
  if (loginData.token) {
    try {
      const decoded = jwt.decode(loginData.token);
      console.log('JWT payload:', decoded);
    } catch (error) {
      console.log('❌ Error decodificando JWT:', error.message);
    }
  }

  // 4. Probar endpoint /me
  console.log('\n4. Probando endpoint /api/admin/auth/me...');
  try {
    const meResponse = await fetch('http://localhost:3001/api/admin/auth/me', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ Endpoint /me exitoso:', meData);
    } else {
      console.log('❌ Error en endpoint /me:', await meResponse.text());
    }
  } catch (error) {
    console.log('❌ Error llamando /me:', error.message);
  }

  // 5. Verificar permisos específicos
  console.log('\n5. Verificando lógica de permisos...');
  const admin = loginData.admin;
  
  console.log('Admin object:', {
    id: admin.id,
    email: admin.email,
    is_super_admin: admin.is_super_admin,
    type_is_super_admin: typeof admin.is_super_admin,
    boolean_check: !!admin.is_super_admin,
    strict_check: admin.is_super_admin === true,
    loose_check: admin.is_super_admin == true,
    number_check: admin.is_super_admin === 1
  });

  // Simular la lógica del hook usePermissions
  const hasPermissionLogic = (permission) => {
    console.log(`\nChecking permission: ${permission}`);
    console.log('is_super_admin value:', admin.is_super_admin);
    console.log('is_super_admin type:', typeof admin.is_super_admin);
    
    if (admin.is_super_admin || admin.role === 'super_admin') {
      console.log('✅ Super admin check passed');
      return true;
    } else {
      console.log('❌ Super admin check failed');
      return false;
    }
  };

  const result = hasPermissionLogic('dashboard:view');
  console.log(`\nFinal result for dashboard:view: ${result}`);
}

debugAdminPermissions().catch(console.error);