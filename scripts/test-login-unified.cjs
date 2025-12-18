const axios = require('axios');

const API_URL = 'http://127.0.0.1:3001/api/auth/login';

async function testLogin() {
    console.log('🧪 Iniciando pruebas de login unificado...');

    // 1. Prueba Admin
    try {
        console.log('\n🔵 Probando Login Admin (admin@test.com)...');
        const res = await axios.post(API_URL, {
            email: 'admin@test.com',
            password: 'password123'
        });
        if (res.data.success && res.data.token && res.data.user.role.includes('admin')) {
            console.log('✅ Admin Login OK');
            console.log('   Token:', res.data.token.substring(0, 20) + '...');
        } else {
            console.error('❌ Admin Login Falló:', res.data);
        }
    } catch (error) {
        console.error('❌ Admin Login Error:', error.response?.data || error.message);
    }

    // 2. Prueba Caficultor (usaremos credenciales dummy si no tenemos reales a mano, o inyectar un usuario temporal)
    // Pero primero intentemos fallar
    try {
        console.log('\n🔴 Probando Login Fallido...');
        await axios.post(API_URL, {
            email: 'fake@user.com',
            password: 'wrongpassword'
        });
        console.error('❌ Falló la prueba (Debería haber dado error)');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Login Fallido OK (401 recibido)');
        } else {
            console.error('❌ Error inesperado:', error.response?.status);
            console.error('   Detalle:', error.response?.data);
        }
    }
}

testLogin();
