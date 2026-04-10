import { prisma } from '@/lib/prisma';

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-xl font-bold">訂單查詢</h1>
      <div className="space-y-2">
        {orders.map((o) => (
          <div className="card flex justify-between" key={o.id}>
            <span>#{o.orderNo}</span>
            <span>{o.status}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
