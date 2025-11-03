async function testRegisterEndpoint() {
  try {
    console.log('🧪 Probando endpoint de registro...');
    
    // Probar con datos mínimos primero (formato server.cjs)
    const minimalData = {
      email: 'test.simple@email.com',
      password: 'password123',
      name: 'Test User',
      phone: '+57 300 123 4567',
      farmName: 'Finca Test'
    };

    console.log('📧 Datos mínimos:', minimalData);

    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalData)
    });

    const data = await response.json();

    console.log('📄 Respuesta del servidor:');
    console.log('Status:', response.status);
    console.log('Data:', data);

    if (!response.ok) {
      console.log('\n🔍 Probando con datos completos...');
      
      const fullData = {
        email: 'test.full@email.com',
        password: 'password123',
        name: 'Test User Full',
        phone: '+57 300 123 4567',
        farmName: 'Finca Test',
        location: 'Huila, Pitalito',
        farmSize: 5,
        altitude: 1500,
        coffeeVariety: 'Caturra'
      };

      const fullResponse = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fullData)
      });

      const fullResponseData = await fullResponse.json();

      console.log('\n📄 Respuesta con datos completos:');
      console.log('Status:', fullResponse.status);
      console.log('Data:', fullResponseData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRegisterEndpoint();