'use client';

import { useMemo, useState } from 'react';
import { getAllowedNextStatuses, type OrderWorkflowStatus } from '@/lib/constants/order-status';
import { type KitchenOrder, useOrderPolling } from '@/lib/hooks/use-order-polling';

type ApiResult<T> = { success: true; data: T } | { success: false; error: { message: string } };

const STATUS_GROUPS: Array<{ key: OrderWorkflowStatus; label: string }> = [
  { key: 'NEW', label: '新訂單' },
  { key: 'PREPARING', label: '製作中' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' }
];

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

function groupOrders(orders: KitchenOrder[]) {
  const grouped = new Map<OrderWorkflowStatus, KitchenOrder[]>();
  for (const status of STATUS_GROUPS.map((s) => s.key)) {
    grouped.set(status, []);
  }

  for (const order of orders) {
    grouped.get(order.status)?.push(order);
  }

  for (const [status, rows] of grouped.entries()) {
    const sorted = [...rows].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return status === 'COMPLETED' || status === 'CANCELLED' ? -diff : diff;
    });
    grouped.set(status, sorted);
  }

  return grouped;
}

export default function KitchenPage() {
  const { orders, loading, error, refresh, applyLocalStatus } = useOrderPolling(5000);
  const [token, setToken] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('kitchen_admin_token') ?? '' : ''));
  const [message, setMessage] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const groupedOrders = useMemo(() => groupOrders(orders), [orders]);

  const updateStatus = async (orderId: string, currentStatus: OrderWorkflowStatus, nextStatus: OrderWorkflowStatus) => {
    const allowed = getAllowedNextStatuses(currentStatus);
    if (!allowed.includes(nextStatus)) {
      setMessage(`訂單狀態不可由 ${currentStatus} 變更為 ${nextStatus}`);
      return;
    }

    setUpdatingOrderId(orderId);
    applyLocalStatus(orderId, nextStatus);

    const authToken = token.trim();

    if (authToken && typeof window !== 'undefined') {
      localStorage.setItem('kitchen_admin_token', authToken);
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    let res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: nextStatus })
    });

    if (res.status === 401 && authToken) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kitchen_admin_token');
      }
      setToken('');
      res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
    }

    const data = (await res.json()) as ApiResult<any>;
    if (!res.ok || !data.success) {
      const errorMessage = data && 'error' in data ? data.error.message : '狀態更新失敗';
      const withHint = res.status === 401 ? `${errorMessage}（請確認目前瀏覽器仍有後臺登入狀態，或貼上 token）` : errorMessage;
      setMessage(withHint);
      await refresh();
      setUpdatingOrderId(null);
      return;
    }

    setMessage('狀態更新成功');
    setUpdatingOrderId(null);
    await refresh();
  };

  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="mb-2 text-2xl font-bold">現場訂單看板</h1>
      <input placeholder="貼上 admin token" value={token} onChange={(e) => setToken(e.target.value)} className="mb-3 w-full rounded border p-2" />

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-600">{loading ? '載入中...' : `共 ${orders.length} 筆訂單`}</p>
        <button onClick={refresh} className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700">重新整理</button>
      </div>

      {error ? <p className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mb-3 rounded bg-slate-100 p-3 text-sm text-slate-700">{message}</p> : null}

      <div className="space-y-4">
        {STATUS_GROUPS.map((group) => {
          const rows = groupedOrders.get(group.key) ?? [];
          return (
            <section key={group.key}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold">{group.label}</h2>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">{rows.length}</span>
              </div>

              {!rows.length ? (
                <div className="card text-sm text-slate-500">目前沒有{group.label}。</div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {rows.map((order) => {
                    const allowedNext = getAllowedNextStatuses(order.status);
                    const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
                    return (
                      <article key={order.id} className="card">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold">#{order.orderNo}</h3>
                            <p className="text-xs text-slate-500">{formatTime(order.createdAt)} ・ {order.table?.code ?? order.mode}</p>
                          </div>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{order.status}</span>
                        </div>

                        <ul className="my-2 space-y-1 text-sm">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex items-center justify-between">
                              <span className="truncate pr-2">{item.product.name}</span>
                              <span className="text-slate-600">x {item.quantity}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mb-2 border-t pt-2 text-xs text-slate-600">
                          <p>品項數：{order.items.length} / 份數：{totalQty}</p>
                          <p>金額：NT$ {Number(order.total)}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {allowedNext.map((status) => (
                            <button
                              key={status}
                              disabled={updatingOrderId === order.id}
                              onClick={() => updateStatus(order.id, order.status, status)}
                              className="rounded bg-brand-700 px-3 py-1 text-xs text-white disabled:opacity-50"
                            >
                              {updatingOrderId === order.id ? '更新中...' : `切換為 ${status}`}
                            </button>
                          ))}
                          {!allowedNext.length ? <span className="text-xs text-slate-400">此狀態無後續操作</span> : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
