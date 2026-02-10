// src/dbSpec.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const poolSpec = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: 'sistema_voos_spec', // <- banco SPEC de usuário/LGPD
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = poolSpec;