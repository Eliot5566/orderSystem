import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';

const schema = z.object({ code: z.string().min(1), capacity: z.number().int().positive().default(4), isActive: z.boolean().default(true) });

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.TABLE_MANAGE]);
  if (!auth.ok) return NextResponse.json({ message: auth.reason }, { status: 401 });
  return NextResponse.json(await prisma.table.findMany({ where: { storeId: auth.session.storeId } }));
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.TABLE_MANAGE]);
  if (!auth.ok) return NextResponse.json({ message: auth.reason }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json(await prisma.table.create({ data: { ...parsed.data, storeId: auth.session.storeId } }), { status: 201 });
}
