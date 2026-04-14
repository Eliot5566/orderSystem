import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const bodySchema = z.object({
  ids: z.array(z.string().cuid()).max(50)
});

function fail(message: string, code: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid JSON body', 'INVALID_JSON', 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return fail('Payload validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  if (!parsed.data.ids.length) {
    return NextResponse.json({ success: true, data: [] });
  }

  const rows = await prisma.order.findMany({
    where: { id: { in: parsed.data.ids } },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } }, table: true }
  });

  return NextResponse.json({ success: true, data: rows });
}
