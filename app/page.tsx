import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 p-6">
      <section className="card">
        <h1 className="text-2xl font-bold text-brand-700">餐飲手機點餐系統</h1>
        <p className="mt-2 text-slate-600">支援顧客點餐、店家後台、廚房看板、報表分析與 RBAC 權限控管。</p>
      </section>
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/customer/menu?storeSlug=demo-store" className="card hover:border-brand-600">顧客端點餐</Link>
        <Link href="/login" className="card hover:border-brand-600">管理後台登入</Link>
        <Link href="/kitchen" className="card hover:border-brand-600">現場出餐看板</Link>
        <Link href="/admin/reports" className="card hover:border-brand-600">營運報表</Link>
      </div>
    </main>
  );
}
