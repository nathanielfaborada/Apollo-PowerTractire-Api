import { connection } from '../core/database.js';

class UserProfileModel {
  /**
   * Get user profile by account ID
   * @param {number|string} accountId 
   * @returns {Promise<Object|null>}
   */
  async getProfileByAccountId(accountId) {
    const query = `
      SELECT p.profile_id, p.account_id, p.first_name, p.last_name, 
             p.birthdate, p.department_id, p.profile_pic, a.email, a.created_at
      FROM user_profiles p
      JOIN accounts a ON a.account_id = p.account_id
      WHERE p.account_id = $1
      LIMIT 1
    `;
    const res = await connection.query(query, [accountId]);
    return res.rows[0] || null;
  }

  /**
   * Create user profile record
   * @param {Object} profileData 
   * @returns {Promise<Object>}
   */
  async createProfile({ accountId, firstName, lastName, birthdate = null, departmentId = null, profilePic = null }) {
    const query = `
      INSERT INTO user_profiles (account_id, first_name, last_name, birthdate, department_id, profile_pic, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    const res = await connection.query(query, [
      accountId,
      firstName,
      lastName,
      birthdate,
      departmentId,
      profilePic
    ]);
    return res.rows[0];
  }

  /**
   * Update existing user profile
   * @param {number|string} accountId 
   * @param {Object} profileData 
   * @returns {Promise<Object|null>}
   */
  async updateProfile(accountId, { firstName, lastName, birthdate, departmentId, profilePic }) {
    const query = `
      UPDATE user_profiles
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          birthdate = COALESCE($3, birthdate),
          department_id = COALESCE($4, department_id),
          profile_pic = COALESCE($5, profile_pic)
      WHERE account_id = $6
      RETURNING *
    `;
    const res = await connection.query(query, [
      firstName || null,
      lastName || null,
      birthdate || null,
      departmentId || null,
      profilePic || null,
      accountId
    ]);
    return res.rows[0] || null;
  }
}

export default new UserProfileModel();

