import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, OrderQueryError } from '@/lib/services/order-service';
import { orderIdParamSchema } from '@/lib/validators/order';

function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function fail(message: string, code: string, status: number, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = orderIdParamSchema.safeParse(params);
  if (!parsed.success) {
    return fail('Path validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  try {
    const order = await getOrderById(parsed.data.id);
    return success(order);
  } catch (error) {
    if (error instanceof OrderQueryError) {
      return fail(error.message, error.code, 404, error.details);
    }
    return fail('Failed to get order', 'INTERNAL_ERROR', 500);
  }
}
