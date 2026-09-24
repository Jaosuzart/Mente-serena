require('./src/server').start().catch(error => {
    console.error('Falha ao iniciar servidor:', error.message);
    process.exitCode = 1;
});
