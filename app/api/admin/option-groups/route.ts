import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';

const schema = z.object({
  name: z.string().min(1),
  minSelect: z.number().int().nonnegative().default(0),
  maxSelect: z.number().int().positive().default(1),
  isRequired: z.boolean().default(false),
  options: z.array(z.object({ name: z.string().min(1), priceDiff: z.number(), sortOrder: z.number().int().default(0) })).default([])
});

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.PRODUCT_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);
  return NextResponse.json(await prisma.productOptionGroup.findMany({ where: { storeId: auth.session.storeId }, include: { options: true } }));
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.PRODUCT_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  const row = await prisma.productOptionGroup.create({
    data: {
      storeId: auth.session.storeId,
      name: parsed.data.name,
      minSelect: parsed.data.minSelect,
      maxSelect: parsed.data.maxSelect,
      isRequired: parsed.data.isRequired,
      options: { create: parsed.data.options }
    },
    include: { options: true }
  });
  return NextResponse.json(row, { status: 201 });
}
