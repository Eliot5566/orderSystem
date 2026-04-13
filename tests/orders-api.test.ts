import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/orders/route';

describe('orders api', () => {
  it('returns validation error for invalid status query', async () => {
    const req = new NextRequest('http://localhost/api/orders?status=INVALID_STATUS');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
