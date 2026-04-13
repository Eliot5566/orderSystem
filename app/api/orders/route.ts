import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema, orderListQuerySchema } from '@/lib/validators/order';
import { createOrder, listOrders, OrderValidationError } from '@/lib/services/order-service';

function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function fail(message: string, code: string, status: number, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid JSON body', 'INVALID_JSON', 400);
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Payload validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  try {
    const order = await createOrder(parsed.data);
    return success(order, 201);
  } catch (error) {
    if (error instanceof OrderValidationError) {
      const statusByCode: Record<OrderValidationError['code'], number> = {
        STORE_NOT_FOUND: 404,
        TABLE_INVALID: 404,
        PRODUCT_NOT_AVAILABLE: 409,
        OPTION_INVALID: 409,
        OPTION_RULE_VIOLATION: 409
      };
      return fail(error.message, error.code, statusByCode[error.code], error.details);
    }
    return fail('Failed to create order', 'INTERNAL_ERROR', 500);
  }
}

export async function GET(req: NextRequest) {
  const parsed = orderListQuerySchema.safeParse({ status: req.nextUrl.searchParams.get('status') });
  if (!parsed.success) {
    return fail('Query validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  try {
    const orders = await listOrders(parsed.data);
    return success(orders);
  } catch {
    return fail('Failed to query orders', 'INTERNAL_ERROR', 500);
  }
}
