const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in the project root
const dbPath = path.join(__dirname, '../db/', 'keys.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  return new Promise((resolve, reject) => {
    console.log('Initializing SQLite database...');
    
    db.serialize(() => {      // Create keys table with SQLite syntax
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL UNIQUE,
            ipAddress TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            expiresAt INTEGER
        )
      `;

      db.run(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating keys table:', err);
          reject(err);
        } else {
          console.log('Keys table created or already exists');
          resolve();
        }
      });
    });
  });
}

function querySQL(query, params = []) {
  return new Promise((resolve, reject) => {
    if (query.trim().toUpperCase().startsWith('SELECT')) {
      db.all(query, params, (error, rows) => {
        if (error) {
          console.error('SQL query error:', error);
          reject(error);
        } else {
          resolve(rows);
        }
      });
    } else {
      db.run(query, params, function(error) {
        if (error) {
          console.error('SQL query error:', error);
          reject(error);
        } else {
          resolve({ insertId: this.lastID, changes: this.changes });
        }
      });
    }
  });
}

function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing the database connection:', err);
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
}

module.exports = {
    initDatabase,
    querySQL,
    closeDatabase
}