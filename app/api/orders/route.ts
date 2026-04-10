import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema } from '@/lib/validators/order';
import { createOrder } from '@/lib/services/order-service';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const parsed = createOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const order = await createOrder(parsed.data);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') as any;
  const orders = await prisma.order.findMany({
    where: { status: status || undefined },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } }, table: true }
  });
  return NextResponse.json(orders);
}
