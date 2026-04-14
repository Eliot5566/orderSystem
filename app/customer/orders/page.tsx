'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { readOrderHistory } from '@/lib/customer/order-history';
import type { Route } from 'next';

type CustomerOrder = {
  id: string;
  orderNo: string;
  status: string;
  createdAt: string;
  mode: string;
  total: number | string;
  table?: { code?: string } | null;
  items: Array<{ id: string; quantity: number; product: { name: string } }>;
};

type ApiResult<T> = { success: true; data: T } | { success: false; error: { message?: string } };

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-TW', { hour12: false });
}

export default function CustomerOrdersPage() {
  const [rows, setRows] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [orderIds, setOrderIds] = useState<string[]>([]);
  const orderIdsKey = useMemo(() => orderIds.join(','), [orderIds]);

  useEffect(() => {
    setOrderIds(readOrderHistory().map((item) => item.id));
  }, []);

  useEffect(() => {
    let disposed = false;

    async function load(isBackground = false) {
      if (!isBackground) setLoading(true);
      if (!isBackground) setError(null);

      const latestIds = readOrderHistory().map((item) => item.id);
      if (latestIds.join(',') !== orderIdsKey) {
        setOrderIds(latestIds);
      }

      try {
        if (!latestIds.length) {
          setRows([]);
          return;
        }

        const res = await fetch('/api/orders/mine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: latestIds })
        });

        const data = (await res.json()) as ApiResult<CustomerOrder[]>;
        if (!res.ok || !data.success) {
          throw new Error(!data.success ? data.error?.message || '載入失敗' : '載入失敗');
        }

        setRows(data.data);
      } catch (e) {
        if (!isBackground) {
          setError((e as Error).message || '載入失敗');
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    }

    load();

    const timer = window.setInterval(() => {
      load(true);
    }, 8000);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [orderIdsKey]);

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-xl font-bold">我的訂單</h1>

      {loading ? <div className="card text-sm text-slate-500">載入中...</div> : null}
      {error ? <p className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {!loading && !error && rows.length === 0 ? (
        <div className="card text-center">
          <p className="text-sm text-slate-500">目前沒有可查詢的訂單</p>
          <Link href="/customer/menu?storeSlug=demo-store" className="mt-3 inline-block rounded bg-brand-700 px-4 py-2 text-white">回菜單</Link>
        </div>
      ) : null}

      <div className="space-y-2">
        {rows.map((o) => (
          <article key={o.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">#{o.orderNo}</p>
                <p className="text-xs text-slate-500">{formatTime(o.createdAt)} ・ {o.table?.code ? `桌號 ${o.table.code}` : o.mode}</p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{o.status}</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {o.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span>{item.product.name}</span>
                  <span>x {item.quantity}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t pt-2 text-right text-sm font-semibold">NT$ {Number(o.total)}</p>
            <div className="mt-2 text-right">
              <Link href={`/customer/orders/${o.id}` as Route} className="text-sm text-brand-700 hover:underline">查看詳情</Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
