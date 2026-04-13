'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type ReportData = {
  meta: {
    validOrderStatuses: string[];
    revenueDefinition: string;
    orderDefinition: string;
  };
  summary: {
    validOrderCount: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  daily: Array<{ date: string; orderCount: number; revenue: number }>;
  topProducts: Array<{ productId: string; name: string; qty: number; revenue: number }>;
  hourly: Array<{ hour: string; orderCount: number; revenue: number }>;
  empty: { isEmpty: boolean; reason?: string };
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/reports', { cache: 'no-store' });
    const payload = await res.json();
    if (!res.ok || !payload?.success) {
      setError(payload?.error?.message || '報表載入失敗');
      setLoading(false);
      return;
    }
    setData(payload.data);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="card">Loading...</div>;
  if (error) return <div className="card text-sm text-red-600">{error}</div>;
  if (!data) return <div className="card text-sm text-slate-500">無可用報表資料</div>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">報表分析</h1>

      <div className="mb-4 card text-sm text-slate-600">
        <p>有效訂單狀態：{data.meta.validOrderStatuses.join(', ')}</p>
        <p>{data.meta.orderDefinition}</p>
        <p>{data.meta.revenueDefinition}</p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="card">有效訂單數：{data.summary.validOrderCount}</div>
        <div className="card">營業額：NT$ {data.summary.totalRevenue}</div>
        <div className="card">客單價：NT$ {data.summary.averageOrderValue}</div>
      </div>

      {data.empty.isEmpty ? (
        <div className="card text-sm text-slate-500">{data.empty.reason || '資料不足，暫無法產生統計。'}</div>
      ) : (
        <>
          <div className="mb-4 card h-72">
            <h2 className="mb-2 text-sm font-semibold">每日營業額</h2>
            {data.daily.length === 0 ? (
              <p className="text-sm text-slate-500">尚無每日統計資料</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#1e5aa7" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mb-4 card">
            <h2 className="mb-2 text-sm font-semibold">熱門商品（前 10）</h2>
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-slate-500">尚無熱門商品資料</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {data.topProducts.map((item, idx) => (
                  <li key={item.productId} className="flex items-center justify-between">
                    <span>{idx + 1}. {item.name}</span>
                    <span className="text-slate-600">{item.qty} 份 / NT$ {item.revenue}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card h-72">
            <h2 className="mb-2 text-sm font-semibold">時段訂單數</h2>
            {data.hourly.every((h) => h.orderCount === 0) ? (
              <p className="text-sm text-slate-500">尚無時段統計資料</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourly}>
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orderCount" fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
