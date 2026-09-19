// src/core/MigrateTable.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connection } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dynamically builds CREATE TABLE statements based on database.json tables and columns
 */
export function buildSqlFromDatabaseJson() {
  const jsonPath = path.join(__dirname, 'database.json');
  if (!fs.existsSync(jsonPath)) return null;

  try {
    const schema = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const tables = schema.tables || {};

    const sqlStatements = Object.keys(tables).map(tableName => {
      const columnsObj = tables[tableName].columns || {};
      const columnDefs = Object.keys(columnsObj).map(colName => {
        const col = columnsObj[colName];
        const rawType = (typeof col === 'object' && col.type) ? col.type : 'VARCHAR(255)';
        
        let type = rawType.toUpperCase();
        if (type.includes('CHARACTER VARYING')) type = 'VARCHAR(255)';
        if (type.includes('TIMESTAMP')) type = 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';

        let extra = '';
        if (colName === 'id' && (type.includes('INT') || type.includes('INTEGER'))) {
          type = 'SERIAL PRIMARY KEY';
        } else if (colName === 'id') {
          extra = 'PRIMARY KEY';
        }
        
        if (colName === 'email') extra = 'NOT NULL';
        if (colName === 'status' && tableName === 'access_requests') extra = "DEFAULT 'pending'";
        if (colName === 'role' && tableName === 'system_users') extra = "DEFAULT 'staff'";

        return `    "${colName}" ${type} ${extra}`.trimEnd();
      }).join(',\n');

      return `-- Table: ${tableName}\nCREATE TABLE IF NOT EXISTS "${tableName}" (\n${columnDefs}\n);`;
    });

    return sqlStatements.join('\n\n');
  } catch (err) {
    console.error('Error parsing database.json for migration:', err.message);
    return null;
  }
}

/**
 * Migration Script runner for Railway PostgreSQL.
 */
export async function runMigration() {
  try {
    console.log('🚀 Checking & executing database migrations...');

    // Read dynamically from database.json if available
    const dynamicSql = buildSqlFromDatabaseJson();

    const sqlQuery = dynamicSql || `
      -- 1. Table: access_requests
      CREATE TABLE IF NOT EXISTS access_requests (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Table: app_users
      CREATE TABLE IF NOT EXISTS app_users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. Table: chat_history
      CREATE TABLE IF NOT EXISTS chat_history (
          id SERIAL PRIMARY KEY,
          user_id INT,
          message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. Table: facebook_users
      CREATE TABLE IF NOT EXISTS facebook_users (
          id SERIAL PRIMARY KEY,
          psid VARCHAR(255),
          name VARCHAR(255),
          chat_count INT,
          last_active_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          profile_pic TEXT,
          locale VARCHAR(50),
          timezone INT
      );

      -- 5. Table: sync_meta
      CREATE TABLE IF NOT EXISTS sync_meta (
          key TEXT PRIMARY KEY,
          value TEXT
      );

      -- 6. Table: system_users
      CREATE TABLE IF NOT EXISTS system_users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          role VARCHAR(50) DEFAULT 'staff',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 7. Table: tires
      CREATE TABLE IF NOT EXISTS tires (
          id VARCHAR(255) PRIMARY KEY,
          tire_size VARCHAR(255),
          brand VARCHAR(255),
          model VARCHAR(255),
          available_qty INT,
          warehouse VARCHAR(255),
          dot VARCHAR(255),
          category VARCHAR(255),
          sku VARCHAR(255),
          status VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE
      );
    `;

    await connection.query(sqlQuery);
    console.log('✅ Migrations verified/applied successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration Error:', error.message);
    return false;
  }
}

// Allow running standalone script
if (process.argv[1] && process.argv[1].includes('MigrateTable.js')) {
  runMigration().then(() => process.exit(0));
}
