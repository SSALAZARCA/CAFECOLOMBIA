async function registerTestCoffeeGrower() {
  try {
    console.log('📝 Registrando caficultor de prueba...');
    
    const registerData = {
      email: 'test.caficultor@email.com',
      password: 'password123',
      firstName: 'Carlos',
      lastName: 'Mendoza',
      phone: '+57 300 123 4567',
      farmName: 'Finca La Esperanza',
      farmLocation: {
        department: 'Huila',
        municipality: 'Pitalito',
        address: 'Vereda El Paraíso, Finca La Esperanza',
        coordinates: {
          latitude: 1.8533,
          longitude: -76.0492
        }
      },
      farmSize: 5.5,
      coffeeVarieties: ['Caturra', 'Colombia', 'Castillo'],
      certifications: ['Organico'],
      experience: 10
    };

    console.log('📧 Email:', registerData.email);
    console.log('🏡 Finca:', registerData.farmName);
    console.log('📍 Ubicación:', `${registerData.farmLocation.municipality}, ${registerData.farmLocation.department}`);

    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Registro exitoso!');
      console.log('📄 Respuesta:', data);
      
      // Ahora intentar login
      console.log('\n🔐 Intentando login con las nuevas credenciales...');
      
      const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password
        })
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        console.log('✅ Login exitoso!');
        console.log('👤 Usuario:', loginData.user);
        console.log('🏡 Finca ID:', loginData.user.farmId);
        console.log('🌱 Finca:', loginData.user.farmName);
        console.log('🎫 Token generado:', loginData.token ? 'SÍ' : 'NO');
        
        return {
          success: true,
          credentials: {
            email: registerData.email,
            password: registerData.password
          },
          user: loginData.user,
          token: loginData.token
        };
      } else {
        console.log('❌ Error en login:', loginData);
        console.log('💡 Nota: El usuario puede necesitar verificación de email');
        
        return {
          success: false,
          registered: true,
          credentials: {
            email: registerData.email,
            password: registerData.password
          },
          error: loginData
        };
      }
    } else {
      console.error('❌ Error en registro:', data);
      
      if (data.error && data.error.includes('ya está registrado')) {
        console.log('\n🔄 El usuario ya existe, intentando login...');
        
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: registerData.email,
            password: registerData.password
          })
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
          console.log('✅ Login exitoso con usuario existente!');
          console.log('👤 Usuario:', loginData.user);
          
          return {
            success: true,
            credentials: {
              email: registerData.email,
              password: registerData.password
            },
            user: loginData.user,
            token: loginData.token
          };
        } else {
          console.log('❌ Error en login con usuario existente:', loginData);
        }
      }
      
      return {
        success: false,
        error: data
      };
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

registerTestCoffeeGrower().then(result => {
  if (result.success) {
    console.log('\n🎉 ¡Caficultor de prueba listo!');
    console.log('📧 Email:', result.credentials.email);
    console.log('🔑 Password:', result.credentials.password);
  } else {
    console.log('\n❌ No se pudo configurar el caficultor de prueba');
  }
})