const fetch = require('node-fetch');

async function testRegister() {
  console.log('🧪 Probando endpoint /api/auth/register...');
  
  const testData = {
    email: 'carlos.mendez@cafecolombia.com',
    password: 'MiPassword123!',
    firstName: 'Carlos',
    lastName: 'Méndez',
    phone: '+57 300 123 4567',
    farmName: 'Finca El Paraíso',
    farmLocation: {
      department: 'Huila',
      municipality: 'Pitalito',
      address: 'Vereda La Esperanza, Km 5 vía Pitalito-Isnos'
    },
    farmSize: 15.5,
    coffeeVarieties: ['Caturra', 'Colombia', 'Castillo'],
    certifications: ['Orgánico', 'Comercio Justo'],
    experience: 12
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
      console.log('👤 Usuario creado:', data.user);
    } else {
      console.log('❌ Error en registro');
      try {
        const errorData = JSON.parse(responseText);
        console.log('💥 Error:', errorData.message || errorData.error);
      } catch (e) {
        console.log('💥 Error parsing response:', responseText);
      }
    }

  } catch (error) {
    console.error('💥 Error en la petición:', error.message);
  }
}

testRegister();