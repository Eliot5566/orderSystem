import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const verifyTokenMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/jwt', () => ({ verifyToken: verifyTokenMock }));

import { requireAuth } from '@/lib/auth/guard';

describe('auth guard', () => {
  it('returns 401 when token is missing', async () => {
    const req = new NextRequest('http://localhost/api/admin/reports');
    const result = await requireAuth(req);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.code).toBe('UNAUTHORIZED');
    }
  });

  it('returns 403 when permission is insufficient', async () => {
    verifyTokenMock.mockResolvedValue({ userId: 'u1', storeId: 's1', roleCode: 'STAFF', permissions: ['order:manage'] });
    const req = new NextRequest('http://localhost/api/admin/reports', {
      headers: { authorization: 'Bearer token123' }
    });

    const result = await requireAuth(req, ['report:view']);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.code).toBe('FORBIDDEN');
    }
  });

  it('returns session when token and permissions are valid', async () => {
    verifyTokenMock.mockResolvedValue({
      userId: 'u1',
      storeId: 's1',
      roleCode: 'MANAGER',
      permissions: ['report:view', 'order:manage']
    });

    const req = new NextRequest('http://localhost/api/admin/reports', {
      headers: { authorization: 'Bearer token123' }
    });

    const result = await requireAuth(req, ['report:view']);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.storeId).toBe('s1');
    }
  });
});
