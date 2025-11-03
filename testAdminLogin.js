// Script para probar el login de administrador desde el navegador
// Ejecutar en la consola del navegador en http://localhost:5173/admin/login

async function testAdminLogin() {
  console.log('🧪 Iniciando prueba de login de administrador...');
  
  try {
    // Datos de login
    const loginData = {
      email: 'admin@cafecolombia.com',
      password: 'admin123'
    };
    
    console.log('📤 Enviando solicitud de login...');
    
    // Hacer la solicitud de login
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    console.log('📥 Respuesta recibida:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error en login:', errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Login exitoso:', data);
    
    // Verificar que tenemos los datos necesarios
    if (data.user && data.token) {
      console.log('👤 Usuario:', data.user.email);
      console.log('🔑 Token recibido:', data.token.substring(0, 20) + '...');
      
      // Simular redirección a dashboard de admin
      console.log('🔄 Redirigiendo a /admin/dashboard...');
      window.location.href = '/admin/dashboard';
      
      return true;
    } else {
      console.error('❌ Respuesta incompleta del servidor');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    return false;
  }
}

// Ejecutar la prueba
testAdminLogin();