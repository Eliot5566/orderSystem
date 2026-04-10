import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const statusFlow: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['PREPARING', 'CANCELLED'],
  PREPARING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

export async function nextOrderNo(storeId: string) {
  const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.order.count({ where: { storeId, createdAt: { gte: new Date(`${new Date().toISOString().slice(0,10)}T00:00:00.000Z`) } } });
  return `${dateCode}-${String(count + 1).padStart(4, '0')}`;
}

export async function createOrder(input: {
  storeId: string;
  tableId?: string;
  mode: 'DINE_IN' | 'TAKEAWAY';
  customerNote?: string;
  items: Array<{ productId: string; quantity: number; note?: string; options: Array<{ optionId: string; quantity: number }> }>;
}) {
  const products = await prisma.product.findMany({ where: { id: { in: input.items.map((i) => i.productId) }, isAvailable: true } });
  if (products.length !== input.items.length) throw new Error('Some products unavailable');

  const options = await prisma.productOption.findMany({
    where: { id: { in: input.items.flatMap((i) => i.options.map((o) => o.optionId)) }, isActive: true }
  });

  const subtotal = input.items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return sum + Number(product.price) * item.quantity;
  }, 0);

  const optionTotal = input.items.reduce((sum, item) => {
    return (
      sum +
      item.options.reduce((optionSum, option) => {
        const optionEntity = options.find((o) => o.id === option.optionId);
        return optionSum + (optionEntity ? Number(optionEntity.priceDiff) * option.quantity * item.quantity : 0);
      }, 0)
    );
  }, 0);

  const total = subtotal + optionTotal;

  return prisma.order.create({
    data: {
      storeId: input.storeId,
      tableId: input.tableId,
      mode: input.mode,
      customerNote: input.customerNote,
      orderNo: await nextOrderNo(input.storeId),
      subtotal: new Prisma.Decimal(subtotal),
      total: new Prisma.Decimal(total),
      items: {
        create: input.items.map((item) => {
          const product = products.find((p) => p.id === item.productId)!;
          const optionPrice = item.options.reduce((sum, option) => {
            const optionEntity = options.find((o) => o.id === option.optionId);
            return sum + (optionEntity ? Number(optionEntity.priceDiff) * option.quantity : 0);
          }, 0);
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
            optionPrice: new Prisma.Decimal(optionPrice),
            note: item.note,
            options: item.options
          };
        })
      }
    },
    include: { items: true, table: true }
  });
}

export async function transitionOrderStatus(orderId: string, target: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  const allowed = statusFlow[order.status];
  if (!allowed.includes(target)) {
    throw new Error(`Invalid status transition ${order.status} -> ${target}`);
  }
  return prisma.order.update({ where: { id: orderId }, data: { status: target } });
}
