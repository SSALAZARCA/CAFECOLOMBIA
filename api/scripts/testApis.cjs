const fetch = require('node-fetch');

const apiEndpoints = [
  {
    name: 'Health Check',
    url: 'http://localhost:3001/api/health',
    method: 'GET',
    requiresAuth: false
  },
  {
    name: 'API Info',
    url: 'http://localhost:3001/api',
    method: 'GET',
    requiresAuth: false
  },
  {
    name: 'Smart Alerts',
    url: 'http://localhost:3001/api/alerts/smart',
    method: 'GET',
    requiresAuth: true
  },
  {
    name: 'AI Analysis Results',
    url: 'http://localhost:3001/api/ai/analysis/results',
    method: 'GET',
    requiresAuth: true
  },
  {
    name: 'Auth Login Test',
    url: 'http://localhost:3001/api/auth/login',
    method: 'POST',
    requiresAuth: false,
    body: {
      email: 'carlos.mendez@cafecolombia.com',
      password: 'MiPassword123!'
    }
  }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🧪 Probando: ${endpoint.name}`);
    console.log(`📍 URL: ${endpoint.url}`);
    
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }

    const startTime = Date.now();
    const response = await fetch(endpoint.url, options);
    const responseTime = Date.now() - startTime;
    
    const responseText = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`⏱️ Tiempo: ${responseTime}ms`);
    
    if (response.ok) {
      console.log('✅ Respuesta exitosa');
      try {
        const data = JSON.parse(responseText);
        if (endpoint.name === 'API Info') {
          console.log('📋 Endpoints disponibles:', Object.keys(data.endpoints || {}));
        } else if (endpoint.name === 'Health Check') {
          console.log('🏥 Estado:', data.status);
        } else if (endpoint.name === 'Auth Login Test') {
          console.log('🔑 Token recibido:', data.token ? 'Sí' : 'No');
        } else {
          console.log('📄 Datos:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
        }
      } catch (e) {
        console.log('📄 Respuesta (texto):', responseText.substring(0, 200) + '...');
      }
    } else {
      console.log('❌ Error en respuesta');
      try {
        const errorData = JSON.parse(responseText);
        console.log('💥 Error:', errorData.error || errorData.message);
      } catch (e) {
        console.log('💥 Error (texto):', responseText.substring(0, 200));
      }
    }

    return {
      name: endpoint.name,
      url: endpoint.url,
      status: response.status,
      success: response.ok,
      responseTime,
      error: response.ok ? null : responseText
    };

  } catch (error) {
    console.log(`💥 Error en petición: ${error.message}`);
    return {
      name: endpoint.name,
      url: endpoint.url,
      status: 0,
      success: false,
      responseTime: 0,
      error: error.message
    };
  }
}

async function testAllApis() {
  console.log('🚀 Iniciando pruebas de APIs...');
  console.log('=' .repeat(50));
  
  const results = [];
  
  for (const endpoint of apiEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Pequeña pausa entre peticiones
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('=' .repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Exitosas: ${successful}`);
  console.log(`❌ Fallidas: ${failed}`);
  console.log(`📈 Tasa de éxito: ${((successful / results.length) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detalle por endpoint:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status} (${result.responseTime}ms)`);
    if (!result.success && result.error) {
      console.log(`   💥 ${result.error.substring(0, 100)}...`);
    }
  });
  
  console.log('\n🔍 APIs específicas solicitadas:');
  const smartAlerts = results.find(r => r.name === 'Smart Alerts');
  const aiAnalysis = results.find(r => r.name === 'AI Analysis Results');
  
  console.log(`📡 /api/alerts/smart: ${smartAlerts?.success ? '✅ Funcionando' : '❌ No disponible'}`);
  console.log(`🤖 /api/ai/analysis/results: ${aiAnalysis?.success ? '✅ Funcionando' : '❌ No disponible'}`);
}

testAllApis();