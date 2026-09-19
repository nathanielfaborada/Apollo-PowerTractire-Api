import pg from 'pg';
import { Logger }  from '../utils/Logger.js';

export class RailwayConnection {
  constructor() {
    this.logger = new Logger('RailwayConnection');
    this.pool = null;
    this.isConnected = false;
    this.connectionPromise = null; // Store the connection promise
  }

async connect() {
    // If already connecting, return the existing promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        this.pool = pg.createPool({
          host: process.env.PGHOST,
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
          port: process.env.PGPORT || 3000,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          idleTimeout: 60000,
          enableKeepAlive: true,
          keepAliveInitialDelay: 0
        });

        // Test connection
        const connection = await this.pool.getConnection();
        const [rows] = await connection.query('SELECT 1 as connected');
        connection.release();

        this.isConnected = true;
        this.logger.info('PostgreSQL connected successfully');
        
        return this;
      } catch (error) {
        this.logger.error('Failed to connect to PostgreSQL:', error);
        this.connectionPromise = null; // Reset on error
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
      const [rows] = await this.pool.query(sql, params);
      return rows;
    } catch (error) {
      this.logger.error('PostgreSQL query error:', { sql, params, error });
      throw error;
    }
  }

  async execute(sql, params = []) {
    await this.ensureConnected();
    
    try {
      const [result] = await this.pool.execute(sql, params);
      return result;
    } catch (error) {
      this.logger.error('PostgreSQL execute error:', { sql, params, error });
      throw error;
    }
  }

  async transaction(callback) {
    await this.ensureConnected();
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getConnection() {
    await this.ensureConnected();
    return await this.pool.getConnection();
  }

  escape(value) {
    return mysql.escape(value);
  }

  escapeId(value) {
    return mysql.escapeId(value);
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
const postgresConnection = new PostgreSQLConnection();

// Auto-connect when the module is imported
postgresConnection.connect().catch(error => {
  console.error('Failed to auto-connect PostgreSQL:', error);
});

export { postgresConnection };