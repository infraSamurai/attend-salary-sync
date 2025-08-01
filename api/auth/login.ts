import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { verifyPassword } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

if (!process.env.JWT_SECRET) {
  console.error('WARNING: JWT_SECRET environment variable is not set!');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`🔐 [AUTH-LOGIN] Request received: ${req.method} ${req.url}`);
  console.log(`🔐 [AUTH-LOGIN] Request headers:`, {
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']?.substring(0, 50),
    timestamp: new Date().toISOString()
  });
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    console.log(`✅ [AUTH-LOGIN] CORS preflight handled`);
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log(`❌ [AUTH-LOGIN] Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log(`🔐 Login attempt for username: ${username}`);
    
    // Verify user credentials using database
    const user = await verifyPassword(username, password);
    if (!user) {
      console.log(`❌ Invalid credentials for username: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log(`✅ Login successful for user: ${user.name} (${user.role})`);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id.toString(), 
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
        id: user.id.toString(),
        username: user.username,
        role: user.role,
        name: user.name
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}