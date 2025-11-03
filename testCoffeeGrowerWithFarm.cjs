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

async function testCoffeeGrowerWithFarm() {
  console.log('🧪 Probando login de caficultor con finca...\n');

  // Configuración de la petición
  const loginOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // Probar login de caficultor con finca
  console.log('🌱 Probando login de Juan Pérez (tiene finca)...');
  try {
    const loginResponse = await makeRequest(loginOptions, {
      email: 'juan.perez@email.com',
      password: 'password123'
    });

    console.log(`   Status: ${loginResponse.status}`);
    console.log(`   Response:`, loginResponse.body);
    
    if (loginResponse.status === 200 && loginResponse.body.user?.role === 'coffee_grower') {
      console.log('   ✅ Login de caficultor EXITOSO');
      console.log(`   👤 Usuario: ${loginResponse.body.user.name}`);
      console.log(`   📧 Email: ${loginResponse.body.user.email}`);
      console.log(`   🏡 Finca ID: ${loginResponse.body.user.farmId}`);
      console.log(`   🌱 Finca: ${loginResponse.body.user.farmName}`);
      console.log(`   🔑 Token: ${loginResponse.body.token}`);
      
      // Guardar el token para pruebas posteriores
      const token = loginResponse.body.token;
      const farmId = loginResponse.body.user.farmId;
      
      if (farmId) {
        console.log('\n🔍 Probando acceso a datos específicos de la finca...');
        
        // Probar acceso a dashboard (debería mostrar solo datos de su finca)
        const dashboardOptions = {
          hostname: 'localhost',
          port: 3001,
          path: '/api/dashboard',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        try {
          const dashboardResponse = await makeRequest(dashboardOptions);
          console.log(`   Dashboard Status: ${dashboardResponse.status}`);
          console.log(`   Dashboard Response:`, dashboardResponse.body);
        } catch (error) {
          console.log(`   ❌ Error accediendo al dashboard: ${error.message}`);
        }
      }
      
    } else {
      console.log('   ❌ Login de caficultor FALLÓ');
    }
  } catch (error) {
    console.log('   ❌ Error en login de caficultor:', error.message);
  }

  console.log('\n🏁 Prueba completada');
}

// Ejecutar las pruebas
testCoffeeGrowerWithFarm().catch(console.error);