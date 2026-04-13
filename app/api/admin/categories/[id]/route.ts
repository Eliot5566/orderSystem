import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';
import { AdminDataError, ensureCategoryNameUnique } from '@/lib/services/admin/data-integrity';
import { updateCategorySchema } from '@/lib/validators/admin/category';

function fail(message: string, code: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, [PERMISSIONS.CATEGORY_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid JSON body', 'INVALID_JSON', 400);
  }

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) return fail('Payload validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten());

  const existed = await prisma.category.findFirst({ where: { id: params.id, storeId: auth.session.storeId } });
  if (!existed) return fail('Category not found', 'NOT_FOUND', 404);

  try {
    if (parsed.data.name) {
      await ensureCategoryNameUnique(auth.session.storeId, parsed.data.name, params.id);
    }

    const row = await prisma.category.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    if (error instanceof AdminDataError) {
      return fail(error.message, error.code, error.status, error.details);
    }
    return fail('Failed to update category', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, [PERMISSIONS.CATEGORY_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);

  const existed = await prisma.category.findFirst({ where: { id: params.id, storeId: auth.session.storeId } });
  if (!existed) return fail('Category not found', 'NOT_FOUND', 404);

  const hasProducts = await prisma.product.count({ where: { categoryId: params.id } });
  if (hasProducts > 0) return fail('Category has linked products', 'CONFLICT', 409, { productCount: hasProducts });

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true, data: { id: params.id } });
}
