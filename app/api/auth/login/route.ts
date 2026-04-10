import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth/jwt';

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;

  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  const token = await signToken({
    userId: user.id,
    storeId: user.storeId,
    roleCode: user.role.code,
    permissions: user.role.permissions
  });

  const response = NextResponse.json({ token, user: { id: user.id, name: user.name, role: user.role.code } });
  response.cookies.set('admin_token', token, { httpOnly: true, sameSite: 'lax', path: '/' });
  return response;
}
