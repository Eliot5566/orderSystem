import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, requireAuth } from '@/lib/auth/guard';
import { PERMISSIONS } from '@/lib/auth/rbac';

const schema = z.object({ email: z.string().email(), name: z.string().min(1), password: z.string().min(8), roleCode: z.enum(['ADMIN', 'MANAGER', 'STAFF']) });

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.USER_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);
  return NextResponse.json(await prisma.user.findMany({ where: { storeId: auth.session.storeId }, include: { role: true } }));
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [PERMISSIONS.USER_MANAGE]);
  if (!auth.ok) return authErrorResponse(auth);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const role = await prisma.role.findUnique({ where: { code: parsed.data.roleCode } });
  if (!role) return NextResponse.json({ message: 'Role not found' }, { status: 400 });

  return NextResponse.json(
    await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        roleId: role.id,
        storeId: auth.session.storeId
      }
    }),
    { status: 201 }
  );
}
