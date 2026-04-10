import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';

const schema = z.object({ name: z.string().min(1), sortOrder: z.number().int().default(0), isActive: z.boolean().default(true) });

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.CATEGORY_MANAGE]);
  if (!auth.ok) return NextResponse.json({ message: auth.reason }, { status: 401 });
  const rows = await prisma.category.findMany({ where: { storeId: auth.session.storeId }, orderBy: { sortOrder: 'asc' } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.CATEGORY_MANAGE]);
  if (!auth.ok) return NextResponse.json({ message: auth.reason }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  const row = await prisma.category.create({ data: { ...parsed.data, storeId: auth.session.storeId } });
  return NextResponse.json(row, { status: 201 });
}
