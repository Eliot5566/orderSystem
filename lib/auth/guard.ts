import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyToken } from './jwt';

type AuthFailureCode = 'UNAUTHORIZED' | 'INVALID_TOKEN' | 'FORBIDDEN';

export async function requireAuth(req: NextRequest, requiredPermissions?: string[]) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || req.cookies.get('admin_token')?.value;

  if (!token) return { ok: false as const, reason: 'Unauthorized', code: 'UNAUTHORIZED' as AuthFailureCode, status: 401 };

  const session = await verifyToken(token);
  if (!session) return { ok: false as const, reason: 'Invalid token', code: 'INVALID_TOKEN' as AuthFailureCode, status: 401 };

  if (requiredPermissions && !requiredPermissions.every((p) => session.permissions.includes(p))) {
    return { ok: false as const, reason: 'Forbidden', code: 'FORBIDDEN' as AuthFailureCode, status: 403 };
  }

  return { ok: true as const, session };
}

export function authErrorResponse(auth: { ok: false; reason: string; code: AuthFailureCode; status: number }) {
  return NextResponse.json({ success: false, error: { code: auth.code, message: auth.reason } }, { status: auth.status });
}
