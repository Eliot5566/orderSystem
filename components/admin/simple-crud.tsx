'use client';

import { useEffect, useState } from 'react';

export function SimpleCrud({ title, endpoint, fields }: { title: string; endpoint: string; fields: Array<{ key: string; placeholder: string; type?: string }> }) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = async () => {
    const res = await fetch(endpoint);
    if (res.ok) setRows(await res.json());
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({});
    load();
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      <form onSubmit={submit} className="card mb-4 grid gap-2 md:grid-cols-4">
        {fields.map((f) => (
          <input key={f.key} type={f.type || 'text'} className="rounded border p-2" placeholder={f.placeholder}
            value={form[f.key] ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) as any : e.target.value }))} />
        ))}
        <button className="rounded bg-brand-700 px-3 py-2 text-white">新增</button>
      </form>
      <div className="space-y-2">
        {rows.map((row) => <pre key={row.id} className="card overflow-x-auto text-xs">{JSON.stringify(row, null, 2)}</pre>)}
      </div>
    </div>
  );
}
