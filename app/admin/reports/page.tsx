'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/admin/reports').then((r) => r.json()).then(setData); }, []);
  if (!data) return <div className="card">Loading...</div>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">報表分析</h1>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="card">總天數：{data.daily.length}</div>
        <div className="card">熱門商品數：{data.topProducts.length}</div>
        <div className="card">時段資料：{data.hourly.length}</div>
      </div>
      <div className="card h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.daily}><XAxis dataKey="date" /><YAxis /><Tooltip /><Bar dataKey="revenue" fill="#1e5aa7" /></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
