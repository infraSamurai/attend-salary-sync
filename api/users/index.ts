import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

// Temporary in-memory user store (will be replaced with database)
let users = [
  {
    id: '1',
    username: 'admin',
    password: '$2a$10$w/Tapc6eGFtvZaGvSLYY6e8jnniF5REP1qmdsYb7F5fMABAsZ9WNi',
    role: 'admin',
    name: 'Administrator',
    email: 'admin@school.com',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: '2', 
    username: 'manager',
    password: '$2a$10$zH1p.I2gs99wE7FWicCGq.ovn7myMD3gT2pXQ4gdDRzYJAbq7Ehwe',
    role: 'manager',
    name: 'Manager User',
    email: 'manager@school.com',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: '3',
    username: 'viewer', 
    password: '$2a$10$SbtpYG17EV7UDe5hnnlKceuQ36ZZFgB4MhFJlll8x/9Ne6kHJqcxu',
    role: 'viewer',
    name: 'Viewer User',
    email: 'viewer@school.com',
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const { method } = req;
  const user = req.user!;

  // Only admin can manage users
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can manage users' });
  }

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res, user);
    case 'PUT':
      return handlePut(req, res, user);
    case 'DELETE':
      return handleDelete(req, res, user);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    // Return users without passwords
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    res.status(200).json({ users: safeUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: AuthenticatedRequest, res: VercelResponse, currentUser: any) {
  try {
    const { username, password, role, name, email } = req.body;

    if (!username || !password || !role || !name) {
      return res.status(400).json({ error: 'Username, password, role, and name are required' });
    }

    // Validate role
    if (!['admin', 'manager', 'viewer', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if username already exists
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now().toString(),
      username,
      password: hashedPassword,
      role,
      name,
      email: email || '',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    users.push(newUser);

    // Return user without password
    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePut(req: AuthenticatedRequest, res: VercelResponse, currentUser: any) {
  try {
    const { id } = req.query;
    const updates = req.body;

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow updating password through this endpoint
    if (updates.password) {
      delete updates.password;
    }

    // Validate role if being updated
    if (updates.role && !['admin', 'manager', 'viewer', 'teacher'].includes(updates.role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    users[userIndex] = { ...users[userIndex], ...updates };

    // Return user without password
    const { password, ...safeUser } = users[userIndex];
    res.status(200).json({ user: safeUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDelete(req: AuthenticatedRequest, res: VercelResponse, currentUser: any) {
  try {
    const { id } = req.query;
    
    // Don't allow deleting self
    if (id === currentUser.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users.splice(userIndex, 1);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Export the handler with authentication middleware (admin only)
export default withAuth(handler, ['admin']);