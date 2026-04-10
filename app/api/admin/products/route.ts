import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';

const schema = z.object({
  categoryId: z.string().cuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  sortOrder: z.number().int().default(0),
  isAvailable: z.boolean().default(true),
  optionGroupIds: z.array(z.string().cuid()).default([])
});

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.PRODUCT_MANAGE]);
  if (!auth.ok) return NextResponse.json({ message: auth.reason }, { status: 401 });
  return NextResponse.json(
    await prisma.product.findMany({
      where: { storeId: auth.session.storeId },
      include: { category: true, optionGroups: { include: { options: true } } },
      orderBy: { createdAt: 'desc' }
    })
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.PRODUCT_MANAGE]);
  if (!auth.ok) return NextResponse.json({ message: auth.reason }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  const row = await prisma.product.create({
    data: {
      ...parsed.data,
      price: parsed.data.price,
      storeId: auth.session.storeId,
      optionGroups: { connect: parsed.data.optionGroupIds.map((id) => ({ id })) }
    }
  });
  return NextResponse.json(row, { status: 201 });
}
