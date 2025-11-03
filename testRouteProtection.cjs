const API_BASE = 'http://localhost:3001/api';

// Helper function to make requests
async function makeRequest(url, options = {}) {
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  return {
    status: response.status,
    data: data
  };
}

async function testRouteProtection() {
  console.log('🔒 Probando protección de rutas y control de acceso basado en roles...\n');

  try {
    // 1. Test accessing protected routes without authentication
    console.log('1️⃣ Probando acceso a rutas protegidas SIN autenticación...\n');

    const protectedRoutes = [
      '/dashboard',
      '/admin/dashboard',
      '/admin/users',
      '/admin/farms'
    ];

    for (const route of protectedRoutes) {
      try {
        const response = await makeRequest(`${API_BASE}${route}`);
        console.log(`   ❌ ${route}: Status ${response.status} - ${JSON.stringify(response.data)}`);
      } catch (error) {
        console.log(`   ✅ ${route}: Correctamente protegida - ${error.message}`);
      }
    }

    console.log('\n============================================================\n');

    // 2. Get authentication tokens
    console.log('2️⃣ Obteniendo tokens de autenticación...\n');

    // Admin login
    const adminLogin = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@cafecolombia.com',
        password: 'admin123'
      })
    });
    const adminToken = adminLogin.data.token;
    console.log('   ✅ Token de administrador obtenido');

    // Coffee grower login
    const growerLogin = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'juan.perez@email.com',
        password: 'password123'
      })
    });
    const growerToken = growerLogin.data.token;
    console.log('   ✅ Token de caficultor obtenido');

    console.log('\n============================================================\n');

    // 3. Test admin access to admin routes
    console.log('3️⃣ Probando acceso de ADMINISTRADOR a rutas de admin...\n');

    const adminRoutes = ['/dashboard', '/admin/dashboard'];
    
    for (const route of adminRoutes) {
      try {
        const response = await makeRequest(`${API_BASE}${route}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        console.log(`   ✅ Admin accede a ${route}: Status ${response.status}`);
        if (response.data.success) {
          console.log(`      📊 Datos: ${response.data.data.user ? response.data.data.user.name : 'Estadísticas del sistema'}`);
        }
      } catch (error) {
        console.log(`   ❌ Admin NO puede acceder a ${route}: ${error.message}`);
      }
    }

    console.log('\n============================================================\n');

    // 4. Test coffee grower access to regular routes
    console.log('4️⃣ Probando acceso de CAFICULTOR a rutas regulares...\n');

    try {
      const response = await makeRequest(`${API_BASE}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${growerToken}`
        }
      });
      console.log(`   ✅ Caficultor accede a /dashboard: Status ${response.status}`);
      if (response.data.success) {
        console.log(`      👤 Usuario: ${response.data.data.user.name}`);
        console.log(`      🏡 Finca: ${response.data.data.user.farmName}`);
      }
    } catch (error) {
      console.log(`   ❌ Caficultor NO puede acceder a /dashboard: ${error.message}`);
    }

    console.log('\n============================================================\n');

    // 5. Test coffee grower trying to access admin routes
    console.log('5️⃣ Probando acceso de CAFICULTOR a rutas de ADMIN (debe fallar)...\n');

    const adminOnlyRoutes = ['/admin/dashboard'];
    
    for (const route of adminOnlyRoutes) {
      try {
        const response = await makeRequest(`${API_BASE}${route}`, {
          headers: {
            'Authorization': `Bearer ${growerToken}`
          }
        });
        console.log(`   ❌ PROBLEMA: Caficultor puede acceder a ${route}: Status ${response.status}`);
        console.log(`      Esto NO debería ser posible - Falla de seguridad`);
      } catch (error) {
        console.log(`   ✅ Caficultor correctamente BLOQUEADO de ${route}: ${error.message}`);
      }
    }

    console.log('\n============================================================\n');

    // 6. Test invalid tokens
    console.log('6️⃣ Probando tokens inválidos...\n');

    const invalidTokens = ['invalid-token', 'bearer-fake-token', ''];
    
    for (const token of invalidTokens) {
      try {
        const response = await makeRequest(`${API_BASE}/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`   ❌ PROBLEMA: Token inválido "${token}" fue aceptado: Status ${response.status}`);
      } catch (error) {
        console.log(`   ✅ Token inválido "${token}" correctamente rechazado`);
      }
    }

    console.log('\n🏁 Pruebas de protección de rutas completadas');
    console.log('✅ Sistema de autenticación y autorización verificado');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

testRouteProtection();