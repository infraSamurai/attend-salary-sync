import { sql, withDatabaseErrorHandling } from '../utils/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'manager' | 'viewer' | 'teacher';
  name: string;
  created_at?: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  role: 'admin' | 'manager' | 'viewer' | 'teacher';
  name: string;
}

export interface UpdateUserData {
  username?: string;
  password?: string;
  role?: 'admin' | 'manager' | 'viewer' | 'teacher';
  name?: string;
}

export interface SafeUser {
  id: number;
  username: string;
  role: 'admin' | 'manager' | 'viewer' | 'teacher';
  name: string;
  created_at?: string;
}

// Get all users (without password hashes)
export async function getAllUsers(): Promise<SafeUser[]> {
  return withDatabaseErrorHandling(async () => {
    console.log('📖 Fetching all users from database...');
    
    const result = await sql`
      SELECT id, username, role, name, created_at 
      FROM users 
      ORDER BY id ASC
    `;
    
    console.log(`✅ Found ${result.rows.length} users in database`);
    return result.rows as SafeUser[];
  }, 'getAllUsers');
}

// Get user by username (for authentication)
export async function getUserByUsername(username: string): Promise<User | null> {
  return withDatabaseErrorHandling(async () => {
    console.log(`📖 Fetching user by username: ${username}`);
    
    const result = await sql`
      SELECT id, username, password_hash, role, name, created_at 
      FROM users 
      WHERE username = ${username}
    `;
    
    if (result.rows.length === 0) {
      console.log(`❌ User with username ${username} not found`);
      return null;
    }
    
    console.log(`✅ Found user: ${result.rows[0].name} (${result.rows[0].role})`);
    return result.rows[0] as User;
  }, 'getUserByUsername');
}

// Get user by ID (without password hash)
export async function getUserById(id: number): Promise<SafeUser | null> {
  return withDatabaseErrorHandling(async () => {
    console.log(`📖 Fetching user by ID: ${id}`);
    
    const result = await sql`
      SELECT id, username, role, name, created_at 
      FROM users 
      WHERE id = ${id}
    `;
    
    if (result.rows.length === 0) {
      console.log(`❌ User with ID ${id} not found`);
      return null;
    }
    
    console.log(`✅ Found user: ${result.rows[0].name}`);
    return result.rows[0] as SafeUser;
  }, 'getUserById');
}

// Create new user
export async function createUser(userData: CreateUserData): Promise<SafeUser> {
  return withDatabaseErrorHandling(async () => {
    console.log(`💾 Creating new user: ${userData.username}`);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const result = await sql`
      INSERT INTO users (username, password_hash, role, name)
      VALUES (${userData.username}, ${hashedPassword}, ${userData.role}, ${userData.name})
      RETURNING id, username, role, name, created_at
    `;
    
    const newUser = result.rows[0] as SafeUser;
    console.log(`✅ Created user with ID: ${newUser.id}`);
    
    return newUser;
  }, 'createUser');
}

// Update user
export async function updateUser(id: number, updateData: UpdateUserData): Promise<SafeUser | null> {
  return withDatabaseErrorHandling(async () => {
    console.log(`💾 Updating user ID: ${id}`);
    
    // Build dynamic update query based on provided fields
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.username !== undefined) {
      updateFields.push(`username = $${paramCount++}`);
      values.push(updateData.username);
    }
    if (updateData.password !== undefined) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      updateFields.push(`password_hash = $${paramCount++}`);
      values.push(hashedPassword);
    }
    if (updateData.role !== undefined) {
      updateFields.push(`role = $${paramCount++}`);
      values.push(updateData.role);
    }
    if (updateData.name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }

    if (updateFields.length === 0) {
      console.log('❌ No fields to update');
      return null;
    }

    values.push(id); // WHERE clause parameter

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, username, role, name, created_at
    `;

    const result = await sql.query(query, values);
    
    if (result.rows.length === 0) {
      console.log(`❌ User with ID ${id} not found for update`);
      return null;
    }
    
    const updatedUser = result.rows[0] as SafeUser;
    console.log(`✅ Updated user: ${updatedUser.name}`);
    
    return updatedUser;
  }, 'updateUser');
}

// Delete user
export async function deleteUser(id: number): Promise<boolean> {
  return withDatabaseErrorHandling(async () => {
    console.log(`🗑️ Deleting user ID: ${id}`);
    
    const result = await sql`
      DELETE FROM users 
      WHERE id = ${id}
      RETURNING id, username
    `;
    
    if (result.rows.length === 0) {
      console.log(`❌ User with ID ${id} not found for deletion`);
      return false;
    }
    
    console.log(`✅ Deleted user: ${result.rows[0].username}`);
    return true;
  }, 'deleteUser');
}

// Verify user password
export async function verifyPassword(username: string, password: string): Promise<SafeUser | null> {
  return withDatabaseErrorHandling(async () => {
    console.log(`🔐 Verifying password for user: ${username}`);
    
    const user = await getUserByUsername(username);
    if (!user) {
      console.log(`❌ User ${username} not found for password verification`);
      return null;
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log(`❌ Invalid password for user: ${username}`);
      return null;
    }
    
    console.log(`✅ Password verified for user: ${username}`);
    
    // Return safe user data (without password hash)
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      created_at: user.created_at
    };
  }, 'verifyPassword');
}

// Check if username exists
export async function usernameExists(username: string): Promise<boolean> {
  return withDatabaseErrorHandling(async () => {
    const result = await sql`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE username = ${username}
    `;
    
    return parseInt(result.rows[0].count) > 0;
  }, 'usernameExists');
}

// Get user count
export async function getUserCount(): Promise<number> {
  return withDatabaseErrorHandling(async () => {
    const result = await sql`SELECT COUNT(*) as count FROM users`;
    return parseInt(result.rows[0].count);
  }, 'getUserCount');
}