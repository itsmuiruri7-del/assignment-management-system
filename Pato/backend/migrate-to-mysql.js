import Database from 'better-sqlite3';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const sqliteDbPath = path.join(process.cwd(), 'prisma', 'dev.db');

// MySQL connection config (fallback)
const mysqlConfig = {
  host: 'localhost',
  user: 'root',
  password: 'your_password', // Fallback password if DATABASE_URL is not set
  database: 'assignment_management', // Fallback database name
};

async function migrateToMySQL() {
  try {
    console.log('Starting SQLite to MySQL migration...\n');

    // Connect to SQLite
    console.log('📖 Reading SQLite database...');
    const sqliteDb = new Database(sqliteDbPath);
    
    // Get all table names
    const tables = sqliteDb.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    ).all();

    console.log(`Found ${tables.length} tables\n`);

    // Connect to MySQL using DATABASE_URL if available (this will use credentials from .env)
    console.log('🔌 Connecting to MySQL...');
    let connection;
    if (process.env.DATABASE_URL) {
      connection = await mysql.createConnection(process.env.DATABASE_URL);
    } else {
      connection = await mysql.createConnection({
        host: mysqlConfig.host,
        user: mysqlConfig.user,
        password: mysqlConfig.password,
      });
    }

    // Determine database name
    let dbName = mysqlConfig.database;
    if (process.env.DATABASE_URL) {
      try {
        const parsed = new URL(process.env.DATABASE_URL);
        dbName = parsed.pathname.replace(/^\//, '') || dbName;
      } catch (e) {
        // ignore parse errors and use fallback
      }
    }

    // Create database (drop if exists to ensure a fresh copy)
    await connection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
    await connection.execute(`CREATE DATABASE \`${dbName}\``);
    await connection.changeUser({ database: dbName });

    console.log(`✅ Created database: ${dbName}\n`);

    // Migrate each table
    for (const table of tables) {
      const tableName = table.name;
      console.log(`📋 Migrating table: ${tableName}`);

      // Get table schema from SQLite
      const schema = sqliteDb.prepare(`PRAGMA table_info(${tableName})`).all();
      
      // Get data
      const data = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all();

      // Create table in MySQL
      let createTableSQL = `CREATE TABLE ${tableName} (`;
      const columns = schema.map((col) => {
        let type = 'VARCHAR(255)';
        const upperType = (col.type || '').toUpperCase();
        if (upperType.includes('INT')) type = 'INT';
        else if (upperType.includes('TEXT')) {
          // Use VARCHAR for primary key text columns (MySQL doesn't allow TEXT as PK without length)
          type = col.pk ? 'VARCHAR(255)' : 'LONGTEXT';
        }
        else if (col.type.toUpperCase().includes('REAL')) type = 'FLOAT';
        else if (col.type.toUpperCase().includes('DATETIME')) type = 'DATETIME';
        else if (col.type.toUpperCase().includes('BOOLEAN')) type = 'BOOLEAN';

        let colDef = `${col.name} ${type}`;
        if (col.notnull) colDef += ' NOT NULL';
        if (col.pk) {
          // If primary key is integer type we can use AUTO_INCREMENT, otherwise use PRIMARY KEY without auto-increment
          if (type === 'INT') {
            colDef += ' PRIMARY KEY AUTO_INCREMENT';
          } else {
            colDef += ' PRIMARY KEY';
          }
        }
        return colDef;
      });
      createTableSQL += columns.join(', ') + ')';

      await connection.execute(createTableSQL);

      // Insert data
      if (data.length > 0) {
        const keys = Object.keys(data[0]);
        // Determine which columns should be treated as DATETIME
        const dateCols = schema.filter((c) => (c.type || '').toUpperCase().includes('DATETIME')).map((c) => c.name);

        for (const row of data) {
          const values = keys.map((k) => {
            const val = row[k];
            // If column is DATETIME and value looks like a timestamp (ms since epoch or numeric), convert it
            if (dateCols.includes(k) && val != null) {
              const s = String(val);
              if (/^\d{10,}$/.test(s)) {
                // assume milliseconds or seconds
                const n = Number(s);
                const ms = s.length === 10 ? n * 1000 : n;
                const d = new Date(ms);
                return d.toISOString().slice(0, 19).replace('T', ' ');
              }
              // if already an ISO string, try parsing
              const d = new Date(s);
              if (!isNaN(d.getTime())) return d.toISOString().slice(0, 19).replace('T', ' ');
            }
            return val;
          });
          const placeholders = keys.map(() => '?').join(',');
          const insertSQL = `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`;
          await connection.execute(insertSQL, values);
        }
        console.log(`  ↳ Inserted ${data.length} rows`);
      } else {
        console.log(`  ↳ Table is empty`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log(`\n📊 Database Details:`);
    console.log(`  - Host: ${mysqlConfig.host}`);
    console.log(`  - Database: ${mysqlConfig.database}`);
    console.log(`  - User: ${mysqlConfig.user}`);

    sqliteDb.close();
    await connection.end();

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrateToMySQL();
