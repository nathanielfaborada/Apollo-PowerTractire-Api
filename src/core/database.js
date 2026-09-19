import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isRailway = process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('rlwy.net') || process.env.DATABASE_URL.includes('railway'));

const connection = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRailway || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

connection.query('SELECT NOW() as current_time, current_database() as db_name')
  .then((res) => {
    console.log(`✅ PostgreSQL Connected successfully! [DB: ${res.rows[0].db_name}]`);
  })
  .catch((err) => {
    console.error('❌ PostgreSQL Connection Failed:', err.message);
  });

export { connection };