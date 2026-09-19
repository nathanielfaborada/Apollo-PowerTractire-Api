import { connection } from '../core/database.js';

class AuthModel {
  /**
   * Find user by email in app_users table
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const query = `
      SELECT id, email, password_hash, created_at 
      FROM app_users 
      WHERE email = $1 
      LIMIT 1
    `;
    const res = await connection.query(query, [email]);
    return res.rows[0] || null;
  }

  /**
   * Find user by ID
   * @param {number|string} id 
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const query = `
      SELECT id, email, created_at 
      FROM app_users 
      WHERE id = $1 
      LIMIT 1
    `;
    const res = await connection.query(query, [id]);
    return res.rows[0] || null;
  }

  /**
   * Create a new user in app_users
   * @param {Object} userData
   * @param {string} userData.email
   * @param {string} userData.passwordHash
   * @returns {Promise<Object>}
   */
  async createUser({ email, passwordHash }) {
    const query = `
      INSERT INTO app_users (email, password_hash, created_at)
      VALUES ($1, $2, NOW())
      RETURNING id, email, created_at
    `;
    const res = await connection.query(query, [email, passwordHash]);
    return res.rows[0];
  }

  /**
   * Update password hash for a user
   * @param {number|string} id 
   * @param {string} newPasswordHash 
   * @returns {Promise<boolean>}
   */
  async updatePassword(id, newPasswordHash) {
    const query = `
      UPDATE app_users 
      SET password_hash = $1 
      WHERE id = $2
    `;
    const res = await connection.query(query, [newPasswordHash, id]);
    return res.rowCount > 0;
  }
}

export default new AuthModel();
