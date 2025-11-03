const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    console.log(`\n🔍 Testing ${method} ${endpoint}...`);
    
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 5000
    };
    
    if (data) {
      config.data = data;
      config.headers = {
        'Content-Type': 'application/json'
      };
    }
    
    const response = await axios(config);
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
    
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || 'Network Error'}`);
    console.log(`📄 Error Response:`, error.response?.data || error.message);
    
    return { 
      success: false, 
      status: error.response?.status || 0, 
      error: error.response?.data || error.message 
    };
  }
}

async function testAllApis() {
  console.log('🚀 Iniciando pruebas de APIs - Café Colombia');
  console.log('=' .repeat(50));
  
  const results = [];
  
  // Test 1: Health Check
  const healthResult = await testAPI('/api/health');
  results.push({ endpoint: '/api/health', ...healthResult });
  
  // Test 2: API Info
  const apiResult = await testAPI('/api');
  results.push({ endpoint: '/api', ...apiResult });
  
  // Test 3: Smart Alerts (NUEVO)
  const alertsResult = await testAPI('/api/alerts/smart');
  results.push({ endpoint: '/api/alerts/smart', ...alertsResult });
  
  // Test 4: AI Analysis Results (NUEVO)
  const aiResult = await testAPI('/api/ai/analysis/results');
  results.push({ endpoint: '/api/ai/analysis/results', ...aiResult });
  
  // Test 5: AI Status (NUEVO)
  const aiStatusResult = await testAPI('/api/ai/status');
  results.push({ endpoint: '/api/ai/status', ...aiStatusResult });
  
  // Test 6: Alerts Stats (NUEVO)
  const alertsStatsResult = await testAPI('/api/alerts/stats');
  results.push({ endpoint: '/api/alerts/stats', ...alertsStatsResult });
  
  // Test 7: Login (con credenciales válidas)
  const loginResult = await testAPI('/api/auth/login', 'POST', {
    email: 'admin@cafecolombia.com',
    password: 'admin123'
  });
  results.push({ endpoint: '/api/auth/login', ...loginResult });
  
  // Resumen de resultados
  console.log('\n' + '=' .repeat(50));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('=' .repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.endpoint} - Status: ${result.status}`);
  });
  
  console.log(`\n📈 Éxito: ${successful}/${total} (${Math.round(successful/total*100)}%)`);
  
  if (successful === total) {
    console.log('🎉 ¡Todas las APIs están funcionando correctamente!');
  } else {
    console.log('⚠️  Algunas APIs necesitan atención.');
  }
}

// Ejecutar las pruebas
testAllApis().catch(console.error);