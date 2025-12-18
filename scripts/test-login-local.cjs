const axios = require('axios');

const API_URL = 'http://127.0.0.1:3001/api/auth/login';

async function testLocalLogin() {
    console.log('🧪 Probando login contra SQLite local...');
    console.log(`📡 URL: ${API_URL}`);

    try {
        // 1. Probar Admin
        console.log('\n🔵 Intentando Admin (admin@test.com / password123)...');
        const adminRes = await axios.post(API_URL, {
            email: 'admin@test.com',
            password: 'password123'
        });

        if (adminRes.data.success) {
            console.log('✅ Admin Login EXITOSO');
            console.log('   Token:', adminRes.data.token ? 'Sí (Recibido)' : 'No');
            console.log('   User:', adminRes.data.user.email);
        } else {
            console.error('❌ Admin Login FALLÓ (Success false)');
        }

    } catch (error) {
        console.error('❌ Admin Login ERROR:', error.response ? error.response.data : error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('🔥 CRÍTICO: El servidor NO está escuchando en localhost:3001. Necesita reinicio.');
        }
    }

    try {
        // 2. Probar Caficultor
        console.log('\n🟢 Intentando Caficultor (caficultor@test.com / password123)...');
        const growerRes = await axios.post(API_URL, {
            email: 'caficultor@test.com',
            password: 'password123'
        });

        if (growerRes.data.success) {
            console.log('✅ Caficultor Login EXITOSO');
            console.log('   User:', growerRes.data.user.email);
        }

    } catch (error) {
        console.error('❌ Caficultor Login ERROR:', error.response ? error.response.data : error.message);
    }
}

testLocalLogin();
