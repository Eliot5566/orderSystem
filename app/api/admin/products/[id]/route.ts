import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';
import {
  AdminDataError,
  ensureCategoryExistsInStore,
  ensureOptionGroupsExistInStore,
  resolveProductAvailability
} from '@/lib/services/admin/data-integrity';
import { updateProductSchema } from '@/lib/validators/admin/product';

function fail(message: string, code: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, [PERMISSIONS.PRODUCT_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid JSON body', 'INVALID_JSON', 400);
  }

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) return fail('Payload validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten());

  const existed = await prisma.product.findFirst({ where: { id: params.id, storeId: auth.session.storeId } });
  if (!existed) return fail('Product not found', 'NOT_FOUND', 404);

  try {
    const categoryId = parsed.data.categoryId ?? existed.categoryId;
    const category = await ensureCategoryExistsInStore(auth.session.storeId, categoryId);

    if (parsed.data.optionGroupIds) {
      await ensureOptionGroupsExistInStore(auth.session.storeId, parsed.data.optionGroupIds);
    }

    const nextStock = parsed.data.stock ?? existed.stock;
    const nextIsAvailable = resolveProductAvailability(nextStock, parsed.data.isAvailable ?? existed.isAvailable);
    if (!category.isActive && nextIsAvailable) {
      return fail('Cannot publish product under inactive category', 'CATEGORY_INACTIVE', 400, { categoryId: category.id });
    }

    const row = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.price !== undefined ? { price: parsed.data.price } : {}),
        ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
        ...(parsed.data.stock !== undefined ? { stock: parsed.data.stock } : {}),
        ...(parsed.data.categoryId !== undefined ? { categoryId: parsed.data.categoryId } : {}),
        isAvailable: nextIsAvailable,
        ...(parsed.data.optionGroupIds
          ? { optionGroups: { set: parsed.data.optionGroupIds.map((id) => ({ id })) } }
          : {})
      },
      include: { category: true, optionGroups: { include: { options: true } } }
    });

    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    if (error instanceof AdminDataError) {
      return fail(error.message, error.code, error.status, error.details);
    }
    return fail('Failed to update product', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, [PERMISSIONS.PRODUCT_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);

  const existed = await prisma.product.findFirst({ where: { id: params.id, storeId: auth.session.storeId } });
  if (!existed) return fail('Product not found', 'NOT_FOUND', 404);

  const usedCount = await prisma.orderItem.count({ where: { productId: params.id } });
  if (usedCount > 0) return fail('Product has order history and cannot be deleted', 'CONFLICT', 409, { orderItemCount: usedCount });

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true, data: { id: params.id } });
}
