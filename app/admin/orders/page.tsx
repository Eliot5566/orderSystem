import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function OrdersAdminPage() {
  const rows = await prisma.order.findMany({ include: { table: true, items: true }, orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">訂單管理</h1>
        <Link href="/kitchen" className="rounded bg-brand-700 px-3 py-2 text-white">開啟作業看板</Link>
      </div>
      <div className="space-y-2">
        {rows.map((row) => <div key={row.id} className="card">#{row.orderNo} {row.status} / NT$ {Number(row.total)} / {row.table?.code ?? row.mode}</div>)}
      </div>
    </div>
  );
}
