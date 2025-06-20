const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  port: 6969,
  user: 'root',
  password: 'plsNoSSRFVuln',
  database: 'keys'
});

export function initDatabase() {
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return;
    }
    console.log('Connected to the database');

    // Structure is actually keys database -> keys table
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key VARCHAR(64) NOT NULL UNIQUE,
        ipAddress VARCHAR(45) NOT NULL,
        timestamp DATETIME NOT NULL,
        expiresAt DATETIME,
    )
    `;

    connection.query(createTableQuery, (err, results) => {
    if (err) {
        console.error('Error creating keys table:', err);
    } else {
        console.log('Keys table created or already exists');
    }

    });
  });
}

function querySQL(query) {
  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        console.error('SQL query error:', error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

function closeDatabase() {
  connection.end((err) => {
    if (err) {
      console.error('Error closing the database connection:', err);
    } else {
      console.log('Database connection closed');
    }
  });
}