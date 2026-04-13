import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';
import { createTableSchema } from '@/lib/validators/admin/table';
import { AdminDataError, ensureTableCodeUnique } from '@/lib/services/admin/data-integrity';

function fail(message: string, code: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.TABLE_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);
  return NextResponse.json(
    await prisma.table.findMany({ where: { storeId: auth.session.storeId }, orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] })
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.TABLE_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid JSON body', 'INVALID_JSON', 400);
  }

  const parsed = createTableSchema.safeParse(body);
  if (!parsed.success) return fail('Payload validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten());

  try {
    await ensureTableCodeUnique(auth.session.storeId, parsed.data.code);
    return NextResponse.json(await prisma.table.create({ data: { ...parsed.data, storeId: auth.session.storeId } }), { status: 201 });
  } catch (error) {
    if (error instanceof AdminDataError) {
      return fail(error.message, error.code, error.status, error.details);
    }
    return fail('Failed to create table', 'INTERNAL_ERROR', 500);
  }
}
