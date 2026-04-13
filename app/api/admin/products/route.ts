import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';
import { createProductSchema } from '@/lib/validators/admin/product';
import {
  AdminDataError,
  ensureCategoryExistsInStore,
  ensureOptionGroupsExistInStore,
  resolveProductAvailability
} from '@/lib/services/admin/data-integrity';

function fail(message: string, code: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.PRODUCT_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);

  return NextResponse.json(
    await prisma.product.findMany({
      where: { storeId: auth.session.storeId },
      include: { category: true, optionGroups: { include: { options: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    })
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.PRODUCT_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid JSON body', 'INVALID_JSON', 400);
  }

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) return fail('Payload validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten());

  try {
    const category = await ensureCategoryExistsInStore(auth.session.storeId, parsed.data.categoryId);
    await ensureOptionGroupsExistInStore(auth.session.storeId, parsed.data.optionGroupIds);

    const isAvailable = resolveProductAvailability(parsed.data.stock, parsed.data.isAvailable);
    if (!category.isActive && isAvailable) {
      return fail('Cannot publish product under inactive category', 'CATEGORY_INACTIVE', 400, { categoryId: category.id });
    }

    const row = await prisma.product.create({
      data: {
        categoryId: parsed.data.categoryId,
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        stock: parsed.data.stock,
        sortOrder: parsed.data.sortOrder,
        isAvailable,
        storeId: auth.session.storeId,
        optionGroups: { connect: parsed.data.optionGroupIds.map((id) => ({ id })) }
      }
    });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    if (error instanceof AdminDataError) {
      return fail(error.message, error.code, error.status, error.details);
    }
    return fail('Failed to create product', 'INTERNAL_ERROR', 500);
  }
}
