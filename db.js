const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'rootpassword',
  database: 'gestao_projetos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3305
});


module.exports = pool.promise();