// lib/auth.ts
// Real authentication system using your database

import { Pool } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs'; // Use bcryptjs instead

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export const socialAuthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
};

export async function createUserAccount(email: string, password?: string) {
  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return existingUser.rows[0];
    }

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 12);
    }

    // Create new user account
    const userId = randomUUID();
    const walletAddress = `0x${randomUUID().replace(/-/g, '').slice(0, 40)}`;
    const ownerAddress = `0x${randomUUID().replace(/-/g, '').slice(0, 40)}`;

    const newUser = await pool.query(
      `INSERT INTO users (id, email, wallet_address, owner_wallet_address, password_hash, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING *`,
      [userId, email, walletAddress, ownerAddress, passwordHash]
    );

    return newUser.rows[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw new Error('Failed to create user account');
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('User lookup failed:', error);
    return null;
  }
}

export async function getUserById(id: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('User lookup failed:', error);
    return null;
  }
}

export async function createSession(userId: string) {
  try {
    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
      `INSERT INTO sessions (user_id, session_token, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, sessionToken, expiresAt]
    );

    return sessionToken;
  } catch (error) {
    console.error('Session creation failed:', error);
    throw new Error('Failed to create session');
  }
}

export async function validateSession(sessionToken: string) {
  try {
    const result = await pool.query(
      `SELECT s.*, u.* FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.expires_at > NOW()`,
      [sessionToken]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Session validation failed:', error);
    return null;
  }
}

export async function destroySession(sessionToken: string) {
  try {
    await pool.query(
      'DELETE FROM sessions WHERE session_token = $1',
      [sessionToken]
    );
  } catch (error) {
    console.error('Session destruction failed:', error);
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}