async function testCoffeeGrowerLogin() {
  try {
    console.log('🧪 Probando login de caficultor...');
    
    // Intentar login con credenciales de caficultor recién registrado
    const loginData = {
      email: 'test.simple@email.com',
      password: 'password123'
    };

    console.log('📧 Email:', loginData.email);
    console.log('🔑 Password:', loginData.password);

    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Login exitoso!');
      console.log('👤 Usuario:', data.user);
      console.log('🎫 Token:', data.token ? 'Generado' : 'No generado');
      console.log('🏡 Finca ID:', data.user.farmId);
      console.log('🌱 Finca:', data.user.farmName);

      // Verificar el token
      if (data.token) {
        console.log('\n🔍 Verificando token...');
        
        const verifyResponse = await fetch('http://localhost:3001/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });

        const verifyData = await verifyResponse.json();

        if (verifyResponse.ok) {
          console.log('✅ Token válido');
          console.log('👤 Usuario verificado:', verifyData.user);
        } else {
          console.log('❌ Error verificando token:', verifyData);
        }
      }
    } else {
      console.error('❌ Error en login:', data);
    }

  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Posibles causas:');
      console.log('- Las columnas de autenticación no existen en la tabla coffee_growers');
      console.log('- El usuario no tiene contraseña configurada');
      console.log('- La contraseña es incorrecta');
    }
  }
}

testCoffeeGrowerLogin();