import { connection } from '../core/database.js';

class AccessRequestModel {
  /**
   * Create access request
   * @param {string} email 
   * @returns {Promise<Object>}
   */
  async createRequest(email) {
    const query = `
      INSERT INTO access_requests (email, status, created_at)
      VALUES ($1, 'pending', NOW())
      RETURNING id, email, status, created_at
    `;
    const res = await connection.query(query, [email]);
    return res.rows[0];
  }

  /**
   * Get request by email
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const query = `
      SELECT id, email, status, created_at 
      FROM access_requests 
      WHERE email = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const res = await connection.query(query, [email]);
    return res.rows[0] || null;
  }

  /**
   * Update request status (e.g., approved, rejected)
   * @param {number|string} id 
   * @param {string} status 
   * @returns {Promise<Object|null>}
   */
  async updateStatus(id, status) {
    const query = `
      UPDATE access_requests 
      SET status = $1 
      WHERE id = $2
      RETURNING id, email, status, created_at
    `;
    const res = await connection.query(query, [status, id]);
    return res.rows[0] || null;
  }

  /**
   * List all access requests
   * @returns {Promise<Array>}
   */
  async getAllRequests() {
    const query = `
      SELECT id, email, status, created_at 
      FROM access_requests 
      ORDER BY created_at DESC
    `;
    const res = await connection.query(query);
    return res.rows;
  }
}

export default new AccessRequestModel();

