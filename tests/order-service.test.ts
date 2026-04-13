import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  store: { findFirst: vi.fn() },
  table: { findFirst: vi.fn() },
  product: { findMany: vi.fn() },
  productOption: { findMany: vi.fn() },
  order: { count: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  $transaction: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

import { createOrder, OrderStatusTransitionError, OrderValidationError, transitionOrderStatus } from '@/lib/services/order-service';

describe('order-service core behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recalculates price server-side when creating order', async () => {
    prismaMock.store.findFirst.mockResolvedValue({ id: 'store1', isActive: true });
    prismaMock.table.findFirst.mockResolvedValue({ id: 'table1', storeId: 'store1', isActive: true });
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: 'prod1',
        storeId: 'store1',
        price: 100,
        optionGroups: [
          {
            id: 'group1',
            minSelect: 0,
            maxSelect: 1,
            isRequired: false,
            options: [{ id: 'opt1' }]
          }
        ]
      }
    ]);
    prismaMock.productOption.findMany.mockResolvedValue([{ id: 'opt1', priceDiff: 10, isActive: true }]);
    prismaMock.order.count.mockResolvedValue(0);

    let capturedCreateArgs: any;
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      return cb({
        order: {
          create: vi.fn(async (args: any) => {
            capturedCreateArgs = args;
            return { id: 'order1', orderNo: '20260410-0001', ...args.data };
          })
        }
      });
    });

    await createOrder({
      storeId: 'store1',
      tableId: 'table1',
      mode: 'DINE_IN',
      items: [{ productId: 'prod1', quantity: 2, options: [{ optionId: 'opt1', quantity: 1 }] }]
    });

    expect(Number(capturedCreateArgs.data.subtotal)).toBe(200);
    expect(Number(capturedCreateArgs.data.total)).toBe(220);
    expect(Number(capturedCreateArgs.data.items.create[0].optionPrice)).toBe(10);
  });

  it('rejects unavailable products', async () => {
    prismaMock.store.findFirst.mockResolvedValue({ id: 'store1', isActive: true });
    prismaMock.table.findFirst.mockResolvedValue({ id: 'table1', storeId: 'store1', isActive: true });
    prismaMock.product.findMany.mockResolvedValue([]);

    await expect(
      createOrder({
        storeId: 'store1',
        tableId: 'table1',
        mode: 'DINE_IN',
        items: [{ productId: 'prod-missing', quantity: 1, options: [] }]
      })
    ).rejects.toMatchObject({ code: 'PRODUCT_NOT_AVAILABLE' });
  });

  it('allows valid status transition and blocks invalid transition', async () => {
    prismaMock.order.findUnique.mockResolvedValueOnce({ id: 'order1', status: 'NEW' });
    prismaMock.order.update.mockResolvedValueOnce({ id: 'order1', status: 'PREPARING' });

    const updated = await transitionOrderStatus('order1', 'PREPARING');
    expect(updated.status).toBe('PREPARING');

    prismaMock.order.findUnique.mockResolvedValueOnce({ id: 'order1', status: 'COMPLETED' });
    await expect(transitionOrderStatus('order1', 'NEW')).rejects.toMatchObject({
      code: 'INVALID_STATUS_TRANSITION'
    });
  });
});
