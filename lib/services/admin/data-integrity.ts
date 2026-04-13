import { prisma } from '@/lib/prisma';

export class AdminDataError extends Error {
  constructor(
    message: string,
    public code:
      | 'CATEGORY_NOT_FOUND'
      | 'CATEGORY_INACTIVE'
      | 'OPTION_GROUP_NOT_FOUND'
      | 'TABLE_CODE_DUPLICATED'
      | 'INVALID_PRODUCT_AVAILABILITY'
      | 'CATEGORY_NAME_DUPLICATED',
    public status = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AdminDataError';
  }
}

export async function ensureCategoryExistsInStore(storeId: string, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, storeId } });
  if (!category) {
    throw new AdminDataError('Category not found in store', 'CATEGORY_NOT_FOUND', 400, { categoryId });
  }
  return category;
}

export async function ensureOptionGroupsExistInStore(storeId: string, optionGroupIds: string[]) {
  if (optionGroupIds.length === 0) return;
  const ids = [...new Set(optionGroupIds)];
  const groups = await prisma.productOptionGroup.findMany({ where: { id: { in: ids }, storeId }, select: { id: true } });
  if (groups.length !== ids.length) {
    const exists = new Set(groups.map((g) => g.id));
    const missing = ids.filter((id) => !exists.has(id));
    throw new AdminDataError('Some option groups are invalid for this store', 'OPTION_GROUP_NOT_FOUND', 400, { optionGroupIds: missing });
  }
}

export function resolveProductAvailability(stock: number, isAvailable?: boolean) {
  if (stock === 0 && isAvailable === true) {
    throw new AdminDataError('Product with zero stock cannot be available', 'INVALID_PRODUCT_AVAILABILITY', 400, {
      stock,
      isAvailable
    });
  }
  if (stock === 0) return false;
  return isAvailable ?? true;
}

export async function ensureTableCodeUnique(storeId: string, code: string, excludeId?: string) {
  const existed = await prisma.table.findFirst({
    where: {
      storeId,
      code: { equals: code, mode: 'insensitive' },
      id: excludeId ? { not: excludeId } : undefined
    },
    select: { id: true }
  });

  if (existed) {
    throw new AdminDataError('Table code already exists', 'TABLE_CODE_DUPLICATED', 409, { code });
  }
}

export async function ensureCategoryNameUnique(storeId: string, name: string, excludeId?: string) {
  const existed = await prisma.category.findFirst({
    where: {
      storeId,
      name: { equals: name, mode: 'insensitive' },
      id: excludeId ? { not: excludeId } : undefined
    },
    select: { id: true }
  });

  if (existed) {
    throw new AdminDataError('Category name already exists', 'CATEGORY_NAME_DUPLICATED', 409, { name });
  }
}
