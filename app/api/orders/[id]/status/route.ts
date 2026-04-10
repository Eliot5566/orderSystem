import { NextRequest, NextResponse } from 'next/server';
import { orderStatusUpdateSchema } from '@/lib/validators/order';
import { transitionOrderStatus } from '@/lib/services/order-service';
import { requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, [PERMISSIONS.ORDER_MANAGE]);
  if (!auth.ok) return NextResponse.json({ message: auth.reason }, { status: 401 });

  const parsed = orderStatusUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const order = await transitionOrderStatus(params.id, parsed.data.status);
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 400 });
  }
}
