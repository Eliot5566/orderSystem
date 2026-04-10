'use client';

import { useEffect, useState } from 'react';

const STATUSES = ['NEW', 'PREPARING', 'COMPLETED', 'CANCELLED'];

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [token, setToken] = useState('');

  const load = async () => {
    const res = await fetch('/api/orders');
    setOrders(await res.json());
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    load();
  };

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-2 text-2xl font-bold">現場訂單看板</h1>
      <input placeholder="貼上 admin token" value={token} onChange={(e) => setToken(e.target.value)} className="mb-3 w-full rounded border p-2" />
      <div className="grid gap-3 md:grid-cols-2">
        {orders.map((order) => (
          <article key={order.id} className="card">
            <h2 className="font-bold">#{order.orderNo} - {order.status}</h2>
            <p className="text-sm text-slate-500">{order.table?.code ?? order.mode}</p>
            <ul className="my-2 list-disc pl-5 text-sm">{order.items.map((item: any) => <li key={item.id}>{item.product.name} x {item.quantity}</li>)}</ul>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => <button key={status} onClick={() => updateStatus(order.id, status)} className="rounded border px-2 py-1 text-xs">{status}</button>)}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
