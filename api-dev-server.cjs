// Simple development server for API testing
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'dev-secret-change-in-production';

// Mock users for development
const users = [
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

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify endpoint
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      user: {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        name: decoded.name
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API development server running on http://localhost:${PORT}`);
});