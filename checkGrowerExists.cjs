const mysql = require('mysql2/promise');

const dbConfig = {
  host: '193.203.175.58',
  user: 'u689528678_SSALAZARCA',
  password: 'Ssc841209*',
  database: 'u689528678_CAFECOLOMBIA',
  port: 3306
};

async function checkGrowerExists() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('🔍 Verificando si existe el caficultor juan.perez@email.com...\n');
    
    const [growers] = await connection.execute(
      'SELECT id, email, full_name, status FROM coffee_growers WHERE email = ?',
      ['juan.perez@email.com']
    );
    
    if (growers.length > 0) {
      console.log('✅ Caficultor encontrado:');
      console.log('   ID:', growers[0].id);
      console.log('   Email:', growers[0].email);
      console.log('   Nombre:', growers[0].full_name);
      console.log('   Estado:', growers[0].status);
    } else {
      console.log('❌ Caficultor NO encontrado');
      
      // Mostrar todos los caficultores disponibles
      console.log('\n📋 Caficultores disponibles en la base de datos:');
      const [allGrowers] = await connection.execute(
        'SELECT id, email, full_name, status FROM coffee_growers LIMIT 10'
      );
      
      allGrowers.forEach((grower, index) => {
        console.log(`   ${index + 1}. ${grower.full_name} (${grower.email}) - ${grower.status}`);
      });
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkGrowerExists();