const mysql = require('mysql2/promise');
const { buildDatabaseOptions } = require('./database-options');

// Importar o módulo não abre conexões nem altera o schema.
module.exports = mysql.createPool(buildDatabaseOptions());
