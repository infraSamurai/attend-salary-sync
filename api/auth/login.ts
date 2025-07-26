import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Temporary in-memory user store (will be replaced with database)
const users = [
  {
    id: '1',
    username: 'admin',
    password: '$2a$10$w/Tapc6eGFtvZaGvSLYY6e8jnniF5REP1qmdsYb7F5fMABAsZ9WNi',
    role: 'admin',
    name: 'Administrator'
  },
  {
    id: '2', 
    username: 'manager',
    password: '$2a$10$zH1p.I2gs99wE7FWicCGq.ovn7myMD3gT2pXQ4gdDRzYJAbq7Ehwe',
    role: 'manager',
    name: 'Manager User'
  },
  {
    id: '3',
    username: 'viewer', 
    password: '$2a$10$SbtpYG17EV7UDe5hnnlKceuQ36ZZFgB4MhFJlll8x/9Ne6kHJqcxu',
    role: 'viewer',
    name: 'Viewer User'
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

if (!process.env.JWT_SECRET) {
  console.error('WARNING: JWT_SECRET environment variable is not set!');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}