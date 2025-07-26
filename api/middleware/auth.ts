import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    userId: string;
    username: string;
    role: string;
    name: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: VercelResponse, next?: () => void) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      name: decoded.name
    };
    
    if (next) next();
    return true;
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: VercelResponse, next?: () => void) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (next) next();
    return true;
  };
}

export function withAuth(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>, allowedRoles?: string[]) {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    // Authenticate token
    const authResult = authenticateToken(req, res);
    if (authResult !== true) return; // Error response already sent

    // Check role permissions if specified
    if (allowedRoles && req.user) {
      const roleResult = requireRole(allowedRoles)(req, res);
      if (roleResult !== true) return; // Error response already sent
    }

    // Call the actual handler
    return handler(req, res);
  };
}