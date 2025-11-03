const fetch = require('node-fetch');

const testUsers = [
  {
    name: 'María González',
    email: 'maria.gonzalez@cafecolombia.com',
    password: 'Password123!',
    farmName: 'Finca La Esperanza',
    location: 'Nariño, Pasto, Vereda El Encano',
    farmSize: 8.2,
    altitude: 2100,
    coffeeVariety: 'Geisha, Bourbon',
    phone: '+57 310 456 7890'
  },
  {
    name: 'José Ramírez',
    email: 'jose.ramirez@cafecolombia.com',
    password: 'MiClave456!',
    farmName: 'Finca Los Andes',
    location: 'Caldas, Manizales, Vereda La Palma',
    farmSize: 12.0,
    altitude: 1800,
    coffeeVariety: 'Colombia, Castillo, Caturra',
    phone: '+57 320 789 0123'
  },
  {
    name: 'Ana Morales',
    email: 'ana.morales@cafecolombia.com',
    password: 'Segura789!',
    farmName: 'Finca El Mirador',
    location: 'Quindío, Armenia, Vereda La Tebaida',
    farmSize: 6.5,
    altitude: 1450,
    coffeeVariety: 'Typica, Bourbon',
    phone: '+57 315 234 5678'
  }
];

async function createTestUser(userData) {
  try {
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const responseText = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log(`✅ Usuario creado: ${userData.name} (ID: ${data.user.id})`);
      return { success: true, user: data.user };
    } else {
      const errorData = JSON.parse(responseText);
      console.log(`❌ Error creando ${userData.name}: ${errorData.error}`);
      return { success: false, error: errorData.error };
    }

  } catch (error) {
    console.log(`💥 Error en petición para ${userData.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function createAllTestUsers() {
  console.log('🧪 Creando usuarios de prueba...\n');
  
  const results = [];
  
  for (const userData of testUsers) {
    console.log(`📤 Registrando: ${userData.name} (${userData.email})`);
    const result = await createTestUser(userData);
    results.push(result);
    
    // Pequeña pausa entre registros
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Resumen de registros:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Exitosos: ${successful}`);
  console.log(`❌ Fallidos: ${failed}`);
  
  if (successful > 0) {
    console.log('\n👥 Usuarios creados exitosamente:');
    results.forEach((result, index) => {
      if (result.success) {
        const userData = testUsers[index];
        console.log(`  - ${userData.name} (${userData.email})`);
        console.log(`    Finca: ${userData.farmName}`);
        console.log(`    Ubicación: ${userData.location}`);
        console.log(`    Tamaño: ${userData.farmSize} hectáreas`);
        console.log('');
      }
    });
  }
}

createAllTestUsers()