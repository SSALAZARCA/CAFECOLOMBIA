const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        console.log('🔍 Probando conexión a MySQL...');
        
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'root',
            database: 'cafe_colombia'
        });
        
        console.log('✅ Conexión exitosa a MySQL');
        
        // Probar una consulta simple
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Consulta de prueba exitosa:', rows);
        
        // Mostrar bases de datos
        const [databases] = await connection.execute('SHOW DATABASES');
        console.log('📋 Bases de datos disponibles:');
        databases.forEach(db => console.log(`   - ${Object.values(db)[0]}`));
        
        await connection.end();
        console.log('🔌 Conexión cerrada');
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        console.error('Código de error:', error.code);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Sugerencias:');
            console.log('   - Verificar que MySQL esté ejecutándose');
            console.log('   - Verificar el puerto 3306');
            console.log('   - Verificar las credenciales (usuario: root, password: root)');
        }
    }
}

testConnection();