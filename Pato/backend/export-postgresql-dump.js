import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function exportPostgreSQLDump() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set in .env');
    process.exit(1);
  }

  let conn;
  try {
    conn = await mysql.createConnection(databaseUrl);
    const [tables] = await conn.query("SHOW TABLES");
    const tableNames = tables.map(row => Object.values(row)[0]);

    let out = '';
    out += `-- PostgreSQL Dump for Render\n`;
    out += `-- Converted from MySQL\n\n`;
    out += `-- Drop tables if they exist\n`;

    for (const t of tableNames) {
      out += `DROP TABLE IF EXISTS "${t}" CASCADE;\n`;
    }
    out += '\n';

    // Migrate each table
    for (const t of tableNames) {
      // Get table schema from MySQL
      const [schemaResult] = await conn.query(`DESCRIBE \`${t}\``);
      const [data] = await conn.query(`SELECT * FROM \`${t}\``);

      // Map MySQL column info to schema object
      const schema = schemaResult.map(row => ({
        name: row.Field,
        type: row.Type,
        notnull: row.Null === 'NO',
        pk: row.Key === 'PRI'
      }));

      // Build CREATE TABLE for PostgreSQL
      let createTableSQL = `CREATE TABLE "${t}" (\n`;
      const columns = schema.map((col) => {
        let type = 'VARCHAR(255)';
        const upperType = (col.type || '').toUpperCase();

        if (upperType.includes('INT')) type = 'INTEGER';
        else if (upperType.includes('TEXT')) type = 'TEXT';
        else if (upperType.includes('REAL')) type = 'FLOAT';
        else if (upperType.includes('DATETIME')) type = 'TIMESTAMP';
        else if (upperType.includes('BOOLEAN')) type = 'BOOLEAN';

        let colDef = `  "${col.name}" ${type}`;
        if (col.notnull) colDef += ' NOT NULL';
        if (col.pk) colDef += ' PRIMARY KEY';
        return colDef;
      });
      createTableSQL += columns.join(',\n') + '\n);\n';
      out += createTableSQL + '\n';

      // Insert data
      if (data.length > 0) {
        const keys = Object.keys(data[0]);
        for (const row of data) {
          const vals = Object.values(row).map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'number') return v;
            if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
            const s = String(v).replace(/\\/g, '\\\\').replace(/'/g, "''");
            return `'${s}'`;
          }).join(', ');
          const colList = keys.map(k => `"${k}"`).join(', ');
          out += `INSERT INTO "${t}" (${colList}) VALUES (${vals});\n`;
        }
        out += '\n';
      }
    }

    fs.writeFileSync('import-postgresql.sql', out);
    console.log('PostgreSQL dump written to import-postgresql.sql');
    await conn.end();
  } catch (err) {
    console.error('Error exporting dump:', err.message || err);
    if (conn) await conn.end();
    process.exit(1);
  }
}

exportPostgreSQLDump();
