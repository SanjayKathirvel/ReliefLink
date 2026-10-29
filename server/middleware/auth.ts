import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'relieflink-super-secure-production-jwt-secret-key-change-in-prod-2026';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'CITIZEN' | 'VOLUNTEER' | 'GOVERNMENT' | 'ADMIN';
  status: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHENTICATED', message: 'Authentication token required to access this resource.' },
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    
    // Verify user in database to ensure account is active
    const userRes = await query(
      'SELECT id, email, full_name, phone, role, status FROM users WHERE id = $1',
      [payload.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Authenticated user record no longer exists.' },
      });
    }

    const dbUser = userRes.rows[0];
    if (dbUser.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your ReliefLink account is currently suspended.' },
      });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.full_name,
      phone: dbUser.phone || undefined,
      role: dbUser.role,
      status: dbUser.status,
    };

    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Session expired or invalid token. Please sign in again.' },
    });
  }
}

export async function optionalAuthenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const userRes = await query(
      'SELECT id, email, full_name, phone, role, status FROM users WHERE id = $1',
      [payload.id]
    );
    if (userRes.rows.length > 0 && userRes.rows[0].status === 'ACTIVE') {
      const dbUser = userRes.rows[0];
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.full_name,
        phone: dbUser.phone || undefined,
        role: dbUser.role,
        status: dbUser.status,
      };
    }
  } catch (err) {
    // Ignore invalid tokens for optional authentication
  }
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: `Access forbidden. Role '${req.user.role}' lacks permission for this action. Required roles: ${allowedRoles.join(', ')}`,
        },
      });
    }

    next();
  };
}
