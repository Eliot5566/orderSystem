import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getRequiredAdminApiPermission, getRequiredAdminPagePermission } from '@/lib/auth/access-control';

function unauthorizedApi(message = 'Unauthorized', code: 'UNAUTHORIZED' | 'INVALID_TOKEN' = 'UNAUTHORIZED') {
  return NextResponse.json({ success: false, error: { code, message } }, { status: 401 });
}

function forbiddenApi(message = 'Forbidden') {
  return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message } }, { status: 403 });
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isLoginPage = pathname === '/login';
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (!isLoginPage && !isAdminPage && !isAdminApi) return NextResponse.next();

  const token = req.cookies.get('admin_token')?.value;

  if (isLoginPage) {
    if (!token) return NextResponse.next();
    const session = await verifyToken(token);
    if (!session) return NextResponse.next();
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  if (!token) {
    if (isAdminPage) {
      const loginUrl = new URL(`/login?next=${encodeURIComponent(pathname + search)}`, req.url);
      return NextResponse.redirect(loginUrl);
    }
    return unauthorizedApi();
  }

  const session = await verifyToken(token);
  if (!session) {
    if (isAdminPage) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
    return unauthorizedApi('Invalid token', 'INVALID_TOKEN');
  }

  const requiredPermission = isAdminApi ? getRequiredAdminApiPermission(pathname) : getRequiredAdminPagePermission(pathname);
  if (requiredPermission && !session.permissions.includes(requiredPermission)) {
    if (isAdminPage) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    return forbiddenApi();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/admin/:path*', '/api/admin/:path*']
};
