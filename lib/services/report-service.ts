import { prisma } from '@/lib/prisma';

const VALID_STATUSES = ['NEW', 'PREPARING', 'COMPLETED'] as const;

type DailyPoint = {
  date: string;
  orderCount: number;
  revenue: number;
};

type TopProduct = {
  productId: string;
  name: string;
  qty: number;
  revenue: number;
};

type HourlyPoint = {
  hour: string;
  orderCount: number;
  revenue: number;
};

export type ReportResult = {
  meta: {
    validOrderStatuses: string[];
    revenueDefinition: string;
    orderDefinition: string;
  };
  summary: {
    validOrderCount: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  daily: DailyPoint[];
  topProducts: TopProduct[];
  hourly: HourlyPoint[];
  empty: {
    isEmpty: boolean;
    reason?: string;
  };
};

export async function buildStoreReport(storeId: string): Promise<ReportResult> {
  const orders = await prisma.order.findMany({
    where: { storeId, status: { in: [...VALID_STATUSES] } },
    include: { items: true },
    orderBy: { createdAt: 'asc' }
  });

  const meta = {
    validOrderStatuses: [...VALID_STATUSES],
    revenueDefinition: '營業額 = 有效訂單(total)加總；有效訂單狀態為 NEW/PREPARING/COMPLETED',
    orderDefinition: '每日訂單數 = 有效訂單筆數（排除 CANCELLED）'
  };

  if (!orders.length) {
    return {
      meta,
      summary: { validOrderCount: 0, totalRevenue: 0, averageOrderValue: 0 },
      daily: [],
      topProducts: [],
      hourly: Array.from({ length: 24 }).map((_, h) => ({
        hour: `${String(h).padStart(2, '0')}:00`,
        orderCount: 0,
        revenue: 0
      })),
      empty: { isEmpty: true, reason: '目前沒有有效訂單資料' }
    };
  }

  const dailyMap = new Map<string, { orderCount: number; revenue: number }>();
  const hourlyMap = new Map<number, { orderCount: number; revenue: number }>();
  const productMap = new Map<string, { qty: number; revenue: number }>();

  for (const order of orders) {
    const date = order.createdAt.toISOString().slice(0, 10);
    const hour = order.createdAt.getHours();

    const dayStat = dailyMap.get(date) ?? { orderCount: 0, revenue: 0 };
    dayStat.orderCount += 1;
    dayStat.revenue += Number(order.total);
    dailyMap.set(date, dayStat);

    const hourStat = hourlyMap.get(hour) ?? { orderCount: 0, revenue: 0 };
    hourStat.orderCount += 1;
    hourStat.revenue += Number(order.total);
    hourlyMap.set(hour, hourStat);

    for (const item of order.items) {
      const itemRevenue = (Number(item.unitPrice) + Number(item.optionPrice ?? 0)) * item.quantity;
      const stat = productMap.get(item.productId) ?? { qty: 0, revenue: 0 };
      stat.qty += item.quantity;
      stat.revenue += itemRevenue;
      productMap.set(item.productId, stat);
    }
  }

  const productIds = [...productMap.keys()];
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } });
  const productNameMap = new Map(products.map((p) => [p.id, p.name]));

  const daily = [...dailyMap.entries()]
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topProducts = [...productMap.entries()]
    .map(([productId, data]) => ({
      productId,
      name: productNameMap.get(productId) ?? `已刪除商品(${productId})`,
      qty: data.qty,
      revenue: data.revenue
    }))
    .sort((a, b) => (b.qty === a.qty ? b.revenue - a.revenue : b.qty - a.qty))
    .slice(0, 10);

  const hourly: HourlyPoint[] = Array.from({ length: 24 }).map((_, h) => {
    const stat = hourlyMap.get(h) ?? { orderCount: 0, revenue: 0 };
    return { hour: `${String(h).padStart(2, '0')}:00`, orderCount: stat.orderCount, revenue: stat.revenue };
  });

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const validOrderCount = orders.length;

  return {
    meta,
    summary: {
      validOrderCount,
      totalRevenue,
      averageOrderValue: validOrderCount ? Number((totalRevenue / validOrderCount).toFixed(2)) : 0
    },
    daily,
    topProducts,
    hourly,
    empty: { isEmpty: false }
  };
}
