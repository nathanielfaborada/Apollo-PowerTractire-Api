import pg from 'pg';
import dotenv from 'dotenv';
import { Logger } from '../utils/Logger.js';

dotenv.config();

export class RailwayConnection {
  constructor() {
    this.logger = new Logger('RailwayConnection');
    this.pool = null;
    this.isConnected = false;
    this.connectionPromise = null;
  }

  async connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        const connectionString = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

        const isRailway = connectionString && (connectionString.includes('rlwy.net') || connectionString.includes('railway'));

        const poolConfig = connectionString
          ? {
              connectionString,
              ssl: isRailway || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            }
          : {
              host: process.env.PGHOST || 'localhost',
              user: process.env.PGUSER || 'postgres',
              password: process.env.PGPASSWORD,
              database: process.env.PGDATABASE || 'railway',
              port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
              ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            };

        this.pool = new pg.Pool(poolConfig);

        // Test connection
        const client = await this.pool.connect();
        const res = await client.query('SELECT 1 as connected, current_database() as db');
        client.release();

        this.isConnected = true;
        this.logger.info(`PostgreSQL connected successfully [DB: ${res.rows[0].db}]`);
        
        return this;
      } catch (error) {
        this.logger.error('Failed to connect to PostgreSQL:', { error: error.message });
        this.connectionPromise = null;
        throw error;
      }
    })();

    return this.connectionPromise;
  }

  async ensureConnected() {
    if (!this.isConnected && !this.connectionPromise) {
      await this.connect();
    } else if (this.connectionPromise) {
      await this.connectionPromise;
    }
    return this;
  }

  async query(sql, params = []) {
    await this.ensureConnected();
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      this.logger.error('PostgreSQL query error:', { sql, params, error: error.message });
      throw error;
    }
  }

  async execute(sql, params = []) {
    return this.query(sql, params);
  }

  async transaction(callback) {
    await this.ensureConnected();
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('PostgreSQL transaction rollback:', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  async getClient() {
    await this.ensureConnected();
    return await this.pool.connect();
  }

  async getConnection() {
    return this.getClient();
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      this.pool = null;
      this.connectionPromise = null;
      this.logger.info('PostgreSQL disconnected');
    }
  }
}

// Create singleton instance
const railwayConnection = new RailwayConnection();

export { railwayConnection };
