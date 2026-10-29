const { loadTestEnvironment } = require('../src/config/test-environment');
try {
    loadTestEnvironment();
    console.log('Configuração mínima de teste preenchida. Credenciais e ambiente remoto ainda precisam ser validados pelos testes de integração.');
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
