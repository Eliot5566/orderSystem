import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';

export async function requireAuth(req: NextRequest, requiredPermissions?: string[]) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || req.cookies.get('admin_token')?.value;

  if (!token) return { ok: false as const, reason: 'Unauthorized' };

  const session = await verifyToken(token);
  if (!session) return { ok: false as const, reason: 'Invalid token' };

  if (requiredPermissions && !requiredPermissions.every((p) => session.permissions.includes(p))) {
    return { ok: false as const, reason: 'Forbidden' };
  }

  return { ok: true as const, session };
}
