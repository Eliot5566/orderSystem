import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canTransitionStatus, getAllowedNextStatuses, type OrderWorkflowStatus } from '@/lib/constants/order-status';

export class OrderValidationError extends Error {
  constructor(
    message: string,
    public code:
      | 'STORE_NOT_FOUND'
      | 'TABLE_INVALID'
      | 'PRODUCT_NOT_AVAILABLE'
      | 'OPTION_INVALID'
      | 'OPTION_RULE_VIOLATION',
    public details?: unknown
  ) {
    super(message);
    this.name = 'OrderValidationError';
  }
}

export class OrderStatusTransitionError extends Error {
  constructor(
    message: string,
    public code: 'ORDER_NOT_FOUND' | 'INVALID_STATUS_TRANSITION',
    public details?: unknown
  ) {
    super(message);
    this.name = 'OrderStatusTransitionError';
  }
}

export class OrderQueryError extends Error {
  constructor(
    message: string,
    public code: 'ORDER_NOT_FOUND',
    public details?: unknown
  ) {
    super(message);
    this.name = 'OrderQueryError';
  }
}

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
  const store = await prisma.store.findFirst({ where: { id: input.storeId, isActive: true } });
  if (!store) {
    throw new OrderValidationError('Store not found or inactive', 'STORE_NOT_FOUND');
  }

  if (input.tableId) {
    const table = await prisma.table.findFirst({ where: { id: input.tableId, storeId: input.storeId, isActive: true } });
    if (!table) {
      throw new OrderValidationError('Table not found in this store or inactive', 'TABLE_INVALID');
    }
  }

  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, storeId: input.storeId, isAvailable: true },
    include: {
      optionGroups: {
        include: {
          options: {
            where: { isActive: true }
          }
        }
      }
    }
  });

  const productById = new Map(products.map((p) => [p.id, p]));
  const missingProducts = productIds.filter((id) => !productById.has(id));
  if (missingProducts.length > 0) {
    throw new OrderValidationError('Some products are unavailable', 'PRODUCT_NOT_AVAILABLE', { productIds: missingProducts });
  }

  const optionIds = [...new Set(input.items.flatMap((i) => i.options.map((o) => o.optionId)))];
  const options = optionIds.length
    ? await prisma.productOption.findMany({
        where: { id: { in: optionIds }, isActive: true }
      })
    : [];
  const optionById = new Map(options.map((o) => [o.id, o]));

  const subtotal = input.items.reduce((sum, item) => {
    const product = productById.get(item.productId)!;
    return sum + Number(product.price) * item.quantity;
  }, 0);

  const normalizedItems = input.items.map((item) => {
    const normalizedOptionsMap = item.options.reduce((acc, option) => {
      const current = acc.get(option.optionId) ?? 0;
      acc.set(option.optionId, current + option.quantity);
      return acc;
    }, new Map<string, number>());

    const normalizedOptions = [...normalizedOptionsMap.entries()].map(([optionId, quantity]) => ({ optionId, quantity }));
    return { ...item, options: normalizedOptions };
  });

  for (const item of normalizedItems) {
    const product = productById.get(item.productId)!;
    const optionGroupById = new Map(product.optionGroups.map((g) => [g.id, g]));
    const optionToGroupMap = new Map(
      product.optionGroups.flatMap((group) => group.options.map((option) => [option.id, group.id] as const))
    );

    const selectedByGroup = new Map<string, number>();
    for (const selectedOption of item.options) {
      const optionEntity = optionById.get(selectedOption.optionId);
      const groupId = optionToGroupMap.get(selectedOption.optionId);
      if (!optionEntity || !groupId) {
        throw new OrderValidationError('Invalid option for product', 'OPTION_INVALID', {
          productId: item.productId,
          optionId: selectedOption.optionId
        });
      }
      selectedByGroup.set(groupId, (selectedByGroup.get(groupId) ?? 0) + selectedOption.quantity);
    }

    for (const [groupId, group] of optionGroupById.entries()) {
      const selectedCount = selectedByGroup.get(groupId) ?? 0;
      const requiredMin = group.isRequired ? Math.max(1, group.minSelect) : group.minSelect;

      if (selectedCount < requiredMin) {
        throw new OrderValidationError('Option selection does not meet minimum requirement', 'OPTION_RULE_VIOLATION', {
          productId: item.productId,
          optionGroupId: groupId,
          requiredMin,
          selected: selectedCount
        });
      }

      if (selectedCount > group.maxSelect) {
        throw new OrderValidationError('Option selection exceeds maximum limit', 'OPTION_RULE_VIOLATION', {
          productId: item.productId,
          optionGroupId: groupId,
          maxSelect: group.maxSelect,
          selected: selectedCount
        });
      }
    }
  }

  const optionTotal = normalizedItems.reduce((sum, item) => {
    return (
      sum +
      item.options.reduce((optionSum, option) => {
        const optionEntity = optionById.get(option.optionId);
        return optionSum + (optionEntity ? Number(optionEntity.priceDiff) * option.quantity * item.quantity : 0);
      }, 0)
    );
  }, 0);

  const total = subtotal + optionTotal;

  return prisma.$transaction(async (tx) => {
    const orderNo = await nextOrderNo(input.storeId);
    return tx.order.create({
      data: {
        storeId: input.storeId,
        tableId: input.tableId,
        mode: input.mode,
        customerNote: input.customerNote,
        orderNo,
        subtotal: new Prisma.Decimal(subtotal),
        total: new Prisma.Decimal(total),
        items: {
          create: normalizedItems.map((item) => {
            const product = productById.get(item.productId)!;
            const optionPrice = item.options.reduce((sum, option) => {
              const optionEntity = optionById.get(option.optionId);
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
  });
}

export async function listOrders(filter: { status?: OrderStatus }) {
  return prisma.order.findMany({
    where: { status: filter.status ?? undefined },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } }, table: true }
  });
}

export async function getOrderById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, table: true }
  });

  if (!order) {
    throw new OrderQueryError('Order not found', 'ORDER_NOT_FOUND', { orderId });
  }

  return order;
}

export async function transitionOrderStatus(orderId: string, target: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new OrderStatusTransitionError('Order not found', 'ORDER_NOT_FOUND', { orderId });
  }

  const currentStatus = order.status as OrderWorkflowStatus;
  const targetStatus = target as OrderWorkflowStatus;
  if (!canTransitionStatus(currentStatus, targetStatus)) {
    throw new OrderStatusTransitionError('Invalid status transition', 'INVALID_STATUS_TRANSITION', {
      orderId,
      from: currentStatus,
      to: targetStatus,
      allowedNext: getAllowedNextStatuses(currentStatus)
    });
  }

  return prisma.order.update({ where: { id: orderId }, data: { status: target } });
}
