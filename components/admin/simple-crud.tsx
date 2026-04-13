'use client';

import { useEffect, useMemo, useState } from 'react';

type Field = { key: string; placeholder: string; type?: 'text' | 'number' | 'boolean' };

type ApiError = {
  success?: false;
  message?: string;
  error?: { message?: string; details?: unknown };
};

function normalizeRows(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && 'success' in payload && (payload as any).success === true) {
    return Array.isArray((payload as any).data) ? (payload as any).data : [];
  }
  return [];
}

function extractErrorMessage(payload: unknown, fallback: string) {
  const data = payload as ApiError;
  return data?.error?.message || data?.message || fallback;
}

function validateForm(form: Record<string, any>, fields: Field[]) {
  const requiredErrors: string[] = [];
  for (const f of fields) {
    const value = form[f.key];
    if (value === '' || value === undefined || value === null) {
      requiredErrors.push(`${f.placeholder} 為必填`);
      continue;
    }
    if (f.type === 'number' && Number.isNaN(Number(value))) {
      requiredErrors.push(`${f.placeholder} 必須為數字`);
    }
  }
  return requiredErrors;
}

function normalizePayload(form: Record<string, any>, fields: Field[]) {
  const next: Record<string, any> = {};
  for (const f of fields) {
    const raw = form[f.key];
    if (raw === '' || raw === undefined || raw === null) continue;

    if (f.type === 'number') {
      next[f.key] = Number(raw);
      continue;
    }

    if (f.type === 'boolean') {
      if (raw === true || raw === 'true') next[f.key] = true;
      else if (raw === false || raw === 'false') next[f.key] = false;
      continue;
    }

    next[f.key] = raw;
  }
  return next;
}

export function SimpleCrud({
  title,
  endpoint,
  fields,
  searchKeys
}: {
  title: string;
  endpoint: string;
  fields: Field[];
  searchKeys?: string[];
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const pageSize = 10;
  const activeSearchKeys = searchKeys ?? fields.map((f) => f.key).filter((k) => k !== 'password');

  const load = async () => {
    setLoading(true);
    const res = await fetch(endpoint);
    const data = await res.json();
    if (!res.ok) {
      setError(extractErrorMessage(data, '資料載入失敗'));
      setLoading(false);
      return;
    }
    setRows(normalizeRows(data));
    setError(null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredRows = useMemo(() => {
    if (!keyword.trim()) return rows;
    const lower = keyword.toLowerCase();
    return rows.filter((row) =>
      activeSearchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(lower))
    );
  }, [rows, keyword, activeSearchKeys]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const errors = validateForm(form, fields);
    if (errors.length) {
      setError(errors[0]);
      return;
    }

    setSubmitting(true);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizePayload(form, fields))
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(extractErrorMessage(data, '建立失敗'));
      return;
    }

    setForm({});
    setMessage('建立成功');
    await load();
  };

  const startEdit = (row: any) => {
    setEditingId(row.id);
    const next: Record<string, any> = {};
    for (const field of fields) {
      next[field.key] = row[field.key] ?? '';
    }
    setEditingForm(next);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError(null);
    setMessage(null);

    const errors = validateForm(editingForm, fields);
    if (errors.length) {
      setError(errors[0]);
      return;
    }

    setSubmitting(true);
    const res = await fetch(`${endpoint}/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizePayload(editingForm, fields))
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(extractErrorMessage(data, '更新失敗'));
      return;
    }

    setEditingId(null);
    setEditingForm({});
    setMessage('更新成功');
    await load();
  };

  const removeRow = async (row: any) => {
    const ok = window.confirm(`確認刪除「${row.name ?? row.code ?? row.id}」？`);
    if (!ok) return;

    setError(null);
    setMessage(null);

    setSubmitting(true);
    const res = await fetch(`${endpoint}/${row.id}`, { method: 'DELETE' });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(extractErrorMessage(data, '刪除失敗'));
      return;
    }

    setMessage('刪除成功');
    await load();
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      {message ? <p className="mb-3 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <form onSubmit={submit} className="card mb-4 grid gap-2 md:grid-cols-4">
        {fields.map((f) => (
          f.type === 'boolean' ? (
            <select
              key={f.key}
              className="rounded border p-2"
              value={form[f.key] ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
            >
              <option value="">{f.placeholder}</option>
              <option value="true">是</option>
              <option value="false">否</option>
            </select>
          ) : (
            <input
              key={f.key}
              type={f.type || 'text'}
              className="rounded border p-2"
              placeholder={f.placeholder}
              value={form[f.key] ?? ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [f.key]: f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                }))
              }
            />
          )
        ))}
        <button disabled={submitting} className="rounded bg-brand-700 px-3 py-2 text-white disabled:bg-slate-400">{submitting ? '處理中...' : '新增'}</button>
      </form>

      <div className="mb-3 flex items-center justify-between gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜尋"
          className="w-full max-w-sm rounded border p-2 text-sm"
        />
        <button onClick={load} className="rounded border border-slate-300 px-3 py-2 text-sm">重新整理</button>
      </div>

      {loading ? <div className="card text-sm text-slate-500">載入中...</div> : null}
      {!loading && filteredRows.length === 0 ? <div className="card text-sm text-slate-500">目前沒有資料</div> : null}

      <div className="space-y-2">
        {pagedRows.map((row) => (
          <div key={row.id} className="card">
            {editingId === row.id ? (
              <div className="grid gap-2 md:grid-cols-4">
                {fields.map((f) => (
                  f.type === 'boolean' ? (
                    <select
                      key={f.key}
                      className="rounded border p-2"
                      value={String(editingForm[f.key] ?? '')}
                      onChange={(e) => setEditingForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    >
                      <option value="">{f.placeholder}</option>
                      <option value="true">是</option>
                      <option value="false">否</option>
                    </select>
                  ) : (
                    <input
                      key={f.key}
                      type={f.type || 'text'}
                      className="rounded border p-2"
                      placeholder={f.placeholder}
                      value={editingForm[f.key] ?? ''}
                      onChange={(e) =>
                        setEditingForm((prev) => ({
                          ...prev,
                          [f.key]: f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                        }))
                      }
                    />
                  )
                ))}
                <div className="flex gap-2 md:col-span-4">
                  <button onClick={saveEdit} disabled={submitting} className="rounded bg-brand-700 px-3 py-2 text-white disabled:bg-slate-400">儲存</button>
                  <button onClick={() => setEditingId(null)} className="rounded border border-slate-300 px-3 py-2">取消</button>
                </div>
              </div>
            ) : (
              <>
                <pre className="overflow-x-auto text-xs">{JSON.stringify(row, null, 2)}</pre>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => startEdit(row)} className="rounded border border-slate-300 px-3 py-1 text-sm">編輯</button>
                  <button onClick={() => removeRow(row)} className="rounded border border-red-200 px-3 py-1 text-sm text-red-600">刪除</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {!loading && filteredRows.length > 0 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <p>
            第 {currentPage} / {pageCount} 頁（共 {filteredRows.length} 筆）
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
            >
              上一頁
            </button>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
            >
              下一頁
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
