import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { ROLE_PRESETS } from '@/lib/auth/rbac';

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.productOptionGroup.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.businessHour.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.store.deleteMany();

  const roles = await Promise.all(
    Object.entries(ROLE_PRESETS).map(([code, permissions]) =>
      prisma.role.create({ data: { code, name: code, permissions } })
    )
  );

  const store = await prisma.store.create({
    data: {
      name: 'Demo Bistro',
      slug: 'demo-store',
      phone: '02-1234-5678',
      address: '台北市信義區示範路 1 號',
      description: '示範營運門市'
    }
  });

  await prisma.businessHour.createMany({
    data: Array.from({ length: 7 }).map((_, i) => ({ storeId: store.id, dayOfWeek: i, openTime: '10:00', closeTime: '21:00', isClosed: false }))
  });

  const tables = await prisma.table.createMany({
    data: ['A1', 'A2', 'A3', 'B1', 'B2', 'T1'].map((code) => ({ storeId: store.id, code, capacity: 4 }))
  });

  const categories = await Promise.all([
    prisma.category.create({ data: { storeId: store.id, name: '經典主餐', sortOrder: 1 } }),
    prisma.category.create({ data: { storeId: store.id, name: '手作飲品', sortOrder: 2 } }),
    prisma.category.create({ data: { storeId: store.id, name: '炸物點心', sortOrder: 3 } }),
    prisma.category.create({ data: { storeId: store.id, name: '甜點', sortOrder: 4 } })
  ]);

  const sugarGroup = await prisma.productOptionGroup.create({
    data: {
      storeId: store.id,
      name: '甜度',
      maxSelect: 1,
      options: { create: ['無糖', '微糖', '半糖', '正常糖'].map((name, i) => ({ name, priceDiff: 0, sortOrder: i })) }
    }
  });

  const toppingGroup = await prisma.productOptionGroup.create({
    data: {
      storeId: store.id,
      name: '加料',
      maxSelect: 2,
      options: { create: [{ name: '珍珠', priceDiff: 10 }, { name: '椰果', priceDiff: 10 }, { name: '布丁', priceDiff: 15 }] }
    }
  });

  const products = Array.from({ length: 20 }).map((_, i) => ({
    storeId: store.id,
    categoryId: categories[i % categories.length].id,
    name: `示範商品 ${i + 1}`,
    description: '熱賣推薦',
    price: 60 + i * 5,
    stock: 100,
    sortOrder: i
  }));

  for (const p of products) {
    await prisma.product.create({ data: { ...p, optionGroups: { connect: [sugarGroup, toppingGroup].map((g) => ({ id: g.id })) } } });
  }

  const adminRole = roles.find((r) => r.code === 'ADMIN')!;
  await prisma.user.create({
    data: {
      storeId: store.id,
      roleId: adminRole.id,
      email: 'admin@demo.com',
      name: 'System Admin',
      passwordHash: await bcrypt.hash('Admin123!', 10)
    }
  });

  const someProducts = await prisma.product.findMany({ take: 3 });
  const table = await prisma.table.findFirst({ where: { storeId: store.id } });
  for (let i = 0; i < 3; i++) {
    await prisma.order.create({
      data: {
        storeId: store.id,
        tableId: table?.id,
        mode: 'DINE_IN',
        status: i === 0 ? 'NEW' : i === 1 ? 'PREPARING' : 'COMPLETED',
        orderNo: `SEED-${i + 1}`,
        subtotal: 300,
        total: 320,
        items: {
          create: someProducts.map((p) => ({ productId: p.id, quantity: 1, unitPrice: p.price, optionPrice: 0 }))
        }
      }
    });
  }

  console.log('Seed completed', { storeId: store.id, tableCount: tables.count });
}

main().finally(() => prisma.$disconnect());
