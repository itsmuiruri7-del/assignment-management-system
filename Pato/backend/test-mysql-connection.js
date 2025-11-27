import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('No DATABASE_URL in .env');
    process.exit(1);
  }

  try {
    // mysql2 supports connectionUri
    const conn = await mysql.createConnection(databaseUrl);
    const [rows] = await conn.query('SELECT 1 as ok');
    console.log('Connection successful:', rows);
    await conn.end();
  } catch (err) {
    console.error('Connection error:');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
}

test();
