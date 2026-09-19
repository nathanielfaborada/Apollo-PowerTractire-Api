import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigration } from './MigrateTable.js';
import { syncDatabaseJson } from './generateDatabaseJson.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase() {
  const jsonPath = path.join(__dirname, 'database.json');
  const databaseJsonExists = fs.existsSync(jsonPath);

  // 1. Check and run table migrations
  await runMigration();

  // 2. Check if database.json exists or generate it
  if (!databaseJsonExists) {
    console.log('📌 database.json not found! Generating schema JSON...');
    await syncDatabaseJson();
  } else {
    await syncDatabaseJson();
  }
}

