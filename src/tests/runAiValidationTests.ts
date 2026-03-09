import { testAIValidationStrictMode } from './aiValidationServiceTest';

// Simple run script
const runTests = () => {
  console.log('--- Iniciando conjunto de pruebas de validación de IA ---');

  const result = testAIValidationStrictMode();

  if (result.success) {
    console.log('✅ Todas las pruebas de validación de IA pasaron correctamente.');
    process.exit(0);
  } else {
    console.error('❌ Fallaron las pruebas de validación de IA.');
    process.exit(1);
  }
};

runTests();