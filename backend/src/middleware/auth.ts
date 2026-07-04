import { Request, Response, NextFunction } from 'express';
import { config } from '@/config';
import { supabaseAdmin } from '@/lib/supabase';
import type { User, AppRole, AuthenticatedRequest } from '@/types';

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = (req.headers as unknown as Record<string, string | undefined>).authorization ?? (req.headers as unknown as Record<string, string | undefined>).Authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const userObj: User = {
      id: user.id,
      email: user.email!,
      role: (roleData?.role as AppRole) || 'viewer',
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
    };

    req.user = userObj;
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

export function requireRole(...allowedRoles: AppRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireEditor = requireRole('admin', 'editor');
export const requireViewer = requireRole('admin', 'editor', 'viewer');