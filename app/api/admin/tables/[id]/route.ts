import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';
import { AdminDataError, ensureTableCodeUnique } from '@/lib/services/admin/data-integrity';
import { updateTableSchema } from '@/lib/validators/admin/table';

function fail(message: string, code: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, [PERMISSIONS.TABLE_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid JSON body', 'INVALID_JSON', 400);
  }

  const parsed = updateTableSchema.safeParse(body);
  if (!parsed.success) return fail('Payload validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten());

  const existed = await prisma.table.findFirst({ where: { id: params.id, storeId: auth.session.storeId } });
  if (!existed) return fail('Table not found', 'NOT_FOUND', 404);

  try {
    if (parsed.data.code) {
      await ensureTableCodeUnique(auth.session.storeId, parsed.data.code, params.id);
    }
    const row = await prisma.table.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    if (error instanceof AdminDataError) {
      return fail(error.message, error.code, error.status, error.details);
    }
    return fail('Failed to update table', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, [PERMISSIONS.TABLE_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);

  const existed = await prisma.table.findFirst({ where: { id: params.id, storeId: auth.session.storeId } });
  if (!existed) return fail('Table not found', 'NOT_FOUND', 404);

  const orderCount = await prisma.order.count({ where: { tableId: params.id } });
  if (orderCount > 0) return fail('Table has order history and cannot be deleted', 'CONFLICT', 409, { orderCount });

  await prisma.table.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true, data: { id: params.id } });
}
