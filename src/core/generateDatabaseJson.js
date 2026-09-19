import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { railwayConnection } from '../config/railwayConnection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Automatically inspects Railway PostgreSQL database tables and columns
 * and updates src/core/database.json only if schema changes exist.
 */
export async function syncDatabaseJson() {
  try {
    const targetPath = path.join(__dirname, 'database.json');

    const rows = await railwayConnection.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position;
    `);

    const schema = {
      database_name: 'railway',
      tables: {}
    };

    rows.forEach(r => {
      if (!schema.tables[r.table_name]) {
        schema.tables[r.table_name] = {
          columns: {}
        };
      }
      schema.tables[r.table_name].columns[r.column_name] = {
        name: r.column_name,
        type: r.data_type
      };
    });

    const newContent = JSON.stringify(schema, null, 2);

    // Check if database.json already exists and content is identical
    if (fs.existsSync(targetPath)) {
      try {
        const existingData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        delete existingData.generated_at;

        if (JSON.stringify(existingData, null, 2) === newContent) {
          console.log('✅ database.json is already up-to-date.');
          return true;
        }
      } catch (e) {
        // If JSON read/parse fails, rewrite file below
      }
    }

    schema.generated_at = new Date().toISOString();
    fs.writeFileSync(targetPath, JSON.stringify(schema, null, 2));

    console.log('✅ database.json updated with new schema changes!');
    return true;
  } catch (error) {
    console.error('❌ Error syncing database.json:', error.message);
    return false;
  }
}

// Allow running standalone script
if (process.argv[1] && process.argv[1].includes('generateDatabaseJson.js')) {
  syncDatabaseJson().then(() => process.exit(0));
}
