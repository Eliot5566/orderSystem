import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeSlug = searchParams.get('storeSlug') ?? 'demo-store';

  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          products: {
            where: { isAvailable: true },
            orderBy: { sortOrder: 'asc' },
            include: { optionGroups: { include: { options: true } } }
          }
        }
      },
      businessHours: true,
      tables: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
        select: { id: true, code: true }
      }
    }
  });

  if (!store) return NextResponse.json({ message: 'Store not found' }, { status: 404 });
  return NextResponse.json(store);
}
