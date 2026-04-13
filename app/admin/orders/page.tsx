'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const STATUSES = ['ALL', 'NEW', 'PREPARING', 'COMPLETED', 'CANCELLED'] as const;

type OrderRow = {
  id: string;
  orderNo: string;
  status: string;
  total: number | string;
  mode: string;
  createdAt: string;
  table?: { code?: string } | null;
  items: Array<{ id: string; quantity: number }>;
};

export default function OrdersAdminPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const pageSize = 12;

  const load = async () => {
    setLoading(true);
    const query = status === 'ALL' ? '' : `?status=${status}`;
    const res = await fetch(`/api/orders${query}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message || '訂單載入失敗');
      setLoading(false);
      return;
    }

    const list = Array.isArray(data) ? data : data?.data ?? [];
    setRows(list);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
    load();
  }, [status]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(() => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize), [rows, currentPage]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">訂單管理</h1>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="rounded border p-2 text-sm">
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={load} className="rounded border border-slate-300 px-3 py-2 text-sm">重新整理</button>
          <Link href="/kitchen" className="rounded bg-brand-700 px-3 py-2 text-white">開啟作業看板</Link>
        </div>
      </div>

      {error ? <p className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <div className="card text-sm text-slate-500">載入中...</div> : null}
      {!loading && rows.length === 0 ? <div className="card text-sm text-slate-500">目前沒有訂單</div> : null}

      <div className="space-y-2">
        {pagedRows.map((row) => (
          <div key={row.id} className="card">
            <div className="flex items-center justify-between">
              <p className="font-semibold">#{row.orderNo} ・ {row.status}</p>
              <p className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleString('zh-TW')}</p>
            </div>
            <p className="mt-1 text-sm text-slate-600">{row.table?.code ?? row.mode} / 品項 {row.items.length} / NT$ {Number(row.total)}</p>
          </div>
        ))}
      </div>

      {!loading && rows.length > 0 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <p>第 {currentPage} / {pageCount} 頁（共 {rows.length} 筆）</p>
          <div className="flex gap-2">
            <button disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40">上一頁</button>
            <button disabled={currentPage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40">下一頁</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
