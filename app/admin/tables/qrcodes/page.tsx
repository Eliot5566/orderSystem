'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type TableRow = {
  id: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
  storeSlug?: string;
};

function buildMenuUrl(table: TableRow) {
  const slug = table.storeSlug || 'demo-store';
  return `/customer/menu?storeSlug=${encodeURIComponent(slug)}&tableCode=${encodeURIComponent(table.code)}`;
}

function buildQrImageUrl(url: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
}

export default function TableQRCodesPage() {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicOrigin, setPublicOrigin] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('table_qr_public_origin');
    setPublicOrigin(saved || window.location.origin);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!publicOrigin) return;
    window.localStorage.setItem('table_qr_public_origin', publicOrigin);
  }, [publicOrigin]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/tables', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || '載入桌號失敗');
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setError((e as Error).message || '載入桌號失敗');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">桌號 QRCode</h1>
        <Link href="/admin/tables" className="rounded border border-slate-300 px-3 py-2 text-sm">返回桌號管理</Link>
      </div>

      <p className="mb-4 text-sm text-slate-600">請列印下方 QRCode 貼在桌面，顧客掃描後會直接進入該桌號點餐頁面。</p>

      <div className="mb-4 rounded border border-slate-200 bg-white p-3">
        <p className="mb-2 text-sm font-medium">QRCode 對外網址前綴</p>
        <input
          value={publicOrigin}
          onChange={(e) => setPublicOrigin(e.target.value.trim())}
          placeholder="例如 http://192.168.1.23:8080"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">建議填入手機可連到的網址（例如反向代理位址）。</p>
      </div>

      {loading ? <div className="card text-sm text-slate-500">載入中...</div> : null}
      {error ? <p className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows
          .filter((row) => row.isActive)
          .map((row) => {
            const menuUrl = buildMenuUrl(row);
            const safeOrigin = (publicOrigin || '').replace(/\/$/, '');
            const absoluteMenuUrl = safeOrigin ? `${safeOrigin}${menuUrl}` : menuUrl;
            return (
              <article key={row.id} className="card">
                <h2 className="mb-2 text-lg font-semibold">桌號 {row.code}</h2>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={buildQrImageUrl(absoluteMenuUrl)} alt={`桌號 ${row.code} QRCode`} className="mx-auto h-48 w-48 rounded border border-slate-200" />
                <p className="mt-2 break-all text-xs text-slate-600">{absoluteMenuUrl}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(absoluteMenuUrl)}
                  className="mt-2 rounded bg-brand-700 px-3 py-2 text-sm text-white"
                >
                  複製連結
                </button>
              </article>
            );
          })}
      </div>
    </main>
  );
}
