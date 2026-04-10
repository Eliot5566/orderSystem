import { NextRequest, NextResponse } from 'next/server';
import { startOfDay } from '@/lib/time';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guard';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return NextResponse.json({ message: auth.reason }, { status: 401 });

  const today = startOfDay(new Date());

  const [todayOrders, todayRevenue, newOrders] = await Promise.all([
    prisma.order.count({ where: { storeId: auth.session.storeId, createdAt: { gte: today } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { storeId: auth.session.storeId, createdAt: { gte: today }, status: { not: 'CANCELLED' } } }),
    prisma.order.count({ where: { storeId: auth.session.storeId, status: 'NEW' } })
  ]);

  return NextResponse.json({ todayOrders, todayRevenue: Number(todayRevenue._sum.total ?? 0), newOrders });
}
