import { NextRequest, NextResponse } from 'next/server';
import { startOfDay } from '@/lib/time';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, requireAuth } from '@/lib/auth/guard';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return authErrorResponse(auth);

  const today = startOfDay(new Date());

  const [todayOrders, todayRevenue, newOrders] = await Promise.all([
    prisma.order.count({ where: { storeId: auth.session.storeId, createdAt: { gte: today }, status: { not: 'CANCELLED' } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { storeId: auth.session.storeId, createdAt: { gte: today }, status: { not: 'CANCELLED' } } }),
    prisma.order.count({ where: { storeId: auth.session.storeId, status: 'NEW' } })
  ]);

  return NextResponse.json({ todayOrders, todayRevenue: Number(todayRevenue._sum.total ?? 0), newOrders });
}
