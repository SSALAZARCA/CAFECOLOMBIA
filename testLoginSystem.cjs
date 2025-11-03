const http = require('http');

// Función para hacer peticiones HTTP
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testLoginSystem() {
  console.log('🧪 Probando sistema de autenticación...\n');

  // Configuración de la petición
  const baseOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // 1. Probar login de administrador
  console.log('1️⃣ Probando login de ADMINISTRADOR...');
  try {
    const adminResponse = await makeRequest(baseOptions, {
      email: 'admin@cafecolombia.com',
      password: 'admin123'
    });

    console.log(`   Status: ${adminResponse.status}`);
    console.log(`   Response:`, adminResponse.body);
    
    if (adminResponse.status === 200 && adminResponse.body.user?.role === 'admin') {
      console.log('   ✅ Login de administrador EXITOSO');
      console.log(`   👤 Usuario: ${adminResponse.body.user.name}`);
      console.log(`   🔑 Token: ${adminResponse.body.token}`);
    } else {
      console.log('   ❌ Login de administrador FALLÓ');
    }
  } catch (error) {
    console.log('   ❌ Error en login de administrador:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 2. Probar login de caficultor
  console.log('2️⃣ Probando login de CAFICULTOR...');
  try {
    const growerResponse = await makeRequest(baseOptions, {
      email: 'test.simple@email.com',
      password: 'password123'
    });

    console.log(`   Status: ${growerResponse.status}`);
    console.log(`   Response:`, growerResponse.body);
    
    if (growerResponse.status === 200 && growerResponse.body.user?.role === 'coffee_grower') {
      console.log('   ✅ Login de caficultor EXITOSO');
      console.log(`   👤 Usuario: ${growerResponse.body.user.name}`);
      console.log(`   🏡 Finca ID: ${growerResponse.body.user.farmId}`);
      console.log(`   🌱 Finca: ${growerResponse.body.user.farmName}`);
      console.log(`   🔑 Token: ${growerResponse.body.token}`);
    } else {
      console.log('   ❌ Login de caficultor FALLÓ');
    }
  } catch (error) {
    console.log('   ❌ Error en login de caficultor:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 3. Probar credenciales inválidas
  console.log('3️⃣ Probando credenciales INVÁLIDAS...');
  try {
    const invalidResponse = await makeRequest(baseOptions, {
      email: 'invalid@email.com',
      password: 'wrongpassword'
    });

    console.log(`   Status: ${invalidResponse.status}`);
    console.log(`   Response:`, invalidResponse.body);
    
    if (invalidResponse.status === 401) {
      console.log('   ✅ Rechazo de credenciales inválidas CORRECTO');
    } else {
      console.log('   ❌ Debería rechazar credenciales inválidas');
    }
  } catch (error) {
    console.log('   ❌ Error en prueba de credenciales inválidas:', error.message);
  }

  console.log('\n🏁 Pruebas de autenticación completadas');
}

// Ejecutar las pruebas
testLoginSystem().catch(console.error);