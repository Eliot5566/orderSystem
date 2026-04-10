import { prisma } from '@/lib/prisma';

export default async function AdminPage() {
  const [todayOrders, products, newOrders] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: new Date(new Date().toISOString().slice(0, 10)) } } }),
    prisma.product.count(),
    prisma.order.count({ where: { status: 'NEW' } })
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
      <section className="grid gap-3 md:grid-cols-3">
        <div className="card">今日訂單：{todayOrders}</div>
        <div className="card">待處理：{newOrders}</div>
        <div className="card">商品總數：{products}</div>
      </section>
    </div>
  );
}
