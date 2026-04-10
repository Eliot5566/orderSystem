import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.REPORT_VIEW]);
  if (!auth.ok) return NextResponse.json({ message: auth.reason }, { status: 401 });

  const orders = await prisma.order.findMany({ where: { storeId: auth.session.storeId, status: { not: 'CANCELLED' } }, include: { items: true } });
  const dailyMap = new Map<string, { orders: number; revenue: number }>();
  const productMap = new Map<string, number>();
  const hourMap = new Map<number, number>();

  for (const order of orders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    const hour = order.createdAt.getUTCHours();
    const dayStat = dailyMap.get(day) ?? { orders: 0, revenue: 0 };
    dayStat.orders += 1;
    dayStat.revenue += Number(order.total);
    dailyMap.set(day, dayStat);
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + Number(order.total));

    for (const item of order.items) {
      productMap.set(item.productId, (productMap.get(item.productId) ?? 0) + item.quantity);
    }
  }

  const products = await prisma.product.findMany({ where: { id: { in: [...productMap.keys()] } } });

  return NextResponse.json({
    daily: [...dailyMap.entries()].map(([date, data]) => ({ date, ...data })),
    topProducts: [...productMap.entries()]
      .map(([productId, qty]) => ({ name: products.find((p) => p.id === productId)?.name ?? productId, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10),
    hourly: [...hourMap.entries()].map(([hour, revenue]) => ({ hour: `${String(hour).padStart(2, '0')}:00`, revenue }))
  });
}
