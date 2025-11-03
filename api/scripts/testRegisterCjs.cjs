const fetch = require('node-fetch');

async function testRegisterCjs() {
  console.log('🧪 Probando endpoint /api/auth/register con estructura CJS...');
  
  const testData = {
    name: 'Carlos Méndez',
    email: 'carlos.mendez@cafecolombia.com',
    password: 'MiPassword123!',
    farmName: 'Finca El Paraíso',
    location: 'Huila, Pitalito, Vereda La Esperanza',
    farmSize: 15.5,
    altitude: 1650,
    coffeeVariety: 'Caturra, Colombia, Castillo',
    phone: '+57 300 123 4567'
  };

  try {
    console.log('📤 Enviando datos de registro:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const responseText = await response.text();
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response: ${responseText}`);

    if (response.ok) {
      console.log('✅ Registro exitoso!');
      const data = JSON.parse(responseText);
      console.log('👤 Usuario creado:', data);
    } else {
      console.log('❌ Error en registro');
      try {
        const errorData = JSON.parse(responseText);
        console.log('💥 Error:', errorData.error || errorData.message);
      } catch (e) {
        console.log('💥 Error parsing response:', responseText);
      }
    }

  } catch (error) {
    console.error('💥 Error en la petición:', error.message);
  }
}

testRegisterCjs()