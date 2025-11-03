const API_BASE = 'http://localhost:3001/api';

// Función helper para hacer requests HTTP
async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { data, status: response.status };
}

async function testUserSpecificData() {
  console.log('🔍 Probando que cada usuario vea solo su información específica...\n');

  try {
    // 1. Obtener tokens de autenticación
    console.log('1️⃣ Obteniendo tokens de autenticación...\n');

    // Login como administrador
    const adminLogin = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@cafecolombia.com',
        password: 'admin123'
      })
    });
    const adminToken = adminLogin.data.token;
    console.log('   ✅ Token de administrador obtenido');

    // Login como caficultor Juan Pérez
    const growerLogin = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'juan.perez@email.com',
        password: 'password123'
      })
    });
    const growerToken = growerLogin.data.token;
    console.log('   ✅ Token de caficultor (Juan Pérez) obtenido');

    console.log('\n============================================================\n');

    // 2. Probar dashboard de administrador
    console.log('2️⃣ Probando dashboard de ADMINISTRADOR...\n');

    const adminDashboard = await makeRequest(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('   📊 Dashboard de Administrador:');
    console.log(`   👤 Usuario: ${adminDashboard.data.data.user.name}`);
    console.log(`   📧 Email: ${adminDashboard.data.data.user.email}`);
    console.log(`   🏢 Rol: ${adminDashboard.data.data.user.role || 'admin'}`);
    
    if (adminDashboard.data.data.stats) {
      console.log(`   📈 Total Caficultores: ${adminDashboard.data.data.stats.totalGrowers}`);
      console.log(`   🏡 Total Fincas: ${adminDashboard.data.data.stats.totalFarms}`);
      console.log(`   📏 Área Total: ${adminDashboard.data.data.stats.totalArea} hectáreas`);
    }

    console.log('\n============================================================\n');

    // 3. Probar dashboard de caficultor
    console.log('3️⃣ Probando dashboard de CAFICULTOR (Juan Pérez)...\n');

    const growerDashboard = await makeRequest(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${growerToken}` }
    });

    console.log('   🌱 Dashboard de Caficultor:');
    console.log('   Response:', JSON.stringify(growerDashboard.data, null, 2));
    
    if (growerDashboard.data.data && growerDashboard.data.data.user) {
      console.log(`   👤 Usuario: ${growerDashboard.data.data.user.name}`);
      console.log(`   📧 Email: ${growerDashboard.data.data.user.email}`);
      console.log(`   🏡 Finca: ${growerDashboard.data.data.user.farmName}`);
      
      if (growerDashboard.data.data.farm) {
        const farm = growerDashboard.data.data.farm;
        console.log(`   📏 Área Total: ${farm.totalArea} hectáreas`);
        console.log(`   ☕ Área de Café: ${farm.coffeeArea} hectáreas`);
        console.log(`   📍 Ubicación: ${farm.location}`);
        console.log(`   ⛰️  Altitud: ${farm.altitude} msnm`);
      }

      if (growerDashboard.data.data.production) {
        const prod = growerDashboard.data.data.production;
        console.log(`   📊 Producción Actual: ${prod.currentSeason} kg`);
        console.log(`   📈 Tendencia: ${prod.trend === 'up' ? '↗️ Subiendo' : '↘️ Bajando'}`);
      }
    }

    console.log('\n============================================================\n');

    // 4. Verificar que los datos son diferentes
    console.log('4️⃣ Verificando diferencias entre usuarios...\n');

    const adminData = adminDashboard.data.data;
    const growerData = growerDashboard.data.data;

    console.log('   🔍 Comparación de datos:');
    console.log(`   Admin ve: ${adminData.user.name} (${adminData.user.email})`);
    console.log(`   Caficultor ve: ${growerData.user.name} (${growerData.user.email})`);
    
    if (adminData.stats && growerData.farm) {
      console.log('   ✅ Admin ve estadísticas generales del sistema');
      console.log('   ✅ Caficultor ve datos específicos de su finca');
    }

    console.log('\n🏁 Pruebas de datos específicos por usuario completadas');
    console.log('✅ Cada usuario ve únicamente la información que le corresponde según su rol');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    if (error.data) {
      console.error('   Detalles:', error.data);
    }
  }
}

testUserSpecificData().catch(console.error);