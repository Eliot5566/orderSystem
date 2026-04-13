import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  order: { findMany: vi.fn() },
  product: { findMany: vi.fn() }
}));

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

import { buildStoreReport } from '@/lib/services/report-service';

describe('report aggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds validated report summary/topProducts/hourly', async () => {
    prismaMock.order.findMany.mockResolvedValue([
      {
        id: 'o1',
        total: 120,
        createdAt: new Date('2026-04-10T09:10:00+08:00'),
        items: [{ productId: 'p1', quantity: 2, unitPrice: 50, optionPrice: 10 }]
      },
      {
        id: 'o2',
        total: 80,
        createdAt: new Date('2026-04-10T11:20:00+08:00'),
        items: [{ productId: 'p2', quantity: 1, unitPrice: 80, optionPrice: 0 }]
      }
    ]);
    prismaMock.product.findMany.mockResolvedValue([
      { id: 'p1', name: '牛肉麵' },
      { id: 'p2', name: '紅茶' }
    ]);

    const report = await buildStoreReport('store1');

    expect(report.empty.isEmpty).toBe(false);
    expect(report.summary.validOrderCount).toBe(2);
    expect(report.summary.totalRevenue).toBe(200);
    expect(report.daily[0].orderCount).toBe(2);
    expect(report.topProducts[0].name).toBe('牛肉麵');
    expect(report.topProducts[0].qty).toBe(2);
    expect(report.hourly).toHaveLength(24);
    expect(report.hourly.some((h) => h.orderCount > 0)).toBe(true);
  });

  it('returns empty state when no valid orders', async () => {
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.product.findMany.mockResolvedValue([]);

    const report = await buildStoreReport('store1');

    expect(report.empty.isEmpty).toBe(true);
    expect(report.summary.validOrderCount).toBe(0);
    expect(report.topProducts).toEqual([]);
    expect(report.hourly).toHaveLength(24);
  });
});
