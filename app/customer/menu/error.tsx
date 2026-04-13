'use client';

import Link from 'next/link';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="card">
        <h1 className="text-lg font-semibold">菜單載入失敗</h1>
        <p className="mt-2 text-sm text-slate-600">請確認網路或稍後再試。</p>
        <div className="mt-4 flex gap-2">
          <button onClick={reset} className="rounded bg-brand-700 px-4 py-2 text-white">重新整理</button>
          <Link href="/" className="rounded border border-slate-300 px-4 py-2 text-slate-700">回首頁</Link>
        </div>
      </div>
    </main>
  );
}
