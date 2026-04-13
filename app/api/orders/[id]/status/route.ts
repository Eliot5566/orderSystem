import { NextRequest, NextResponse } from 'next/server';
import { orderIdParamSchema, orderStatusUpdateSchema } from '@/lib/validators/order';
import { transitionOrderStatus, OrderStatusTransitionError } from '@/lib/services/order-service';
import { authErrorResponse, requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';

function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function fail(message: string, code: string, status: number, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, [PERMISSIONS.ORDER_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);

  const pathParsed = orderIdParamSchema.safeParse(params);
  if (!pathParsed.success) {
    return fail('Path validation failed', 'VALIDATION_ERROR', 400, pathParsed.error.flatten());
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid JSON body', 'INVALID_JSON', 400);
  }

  const parsed = orderStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Payload validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  try {
    const order = await transitionOrderStatus(pathParsed.data.id, parsed.data.status);
    return success(order);
  } catch (error) {
    if (error instanceof OrderStatusTransitionError) {
      const status = error.code === 'ORDER_NOT_FOUND' ? 404 : 409;
      return fail(error.message, error.code, status, error.details);
    }
    return fail('Failed to update order status', 'INTERNAL_ERROR', 500);
  }
}
