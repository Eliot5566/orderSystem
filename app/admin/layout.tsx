import Link from 'next/link';
import { ReactNode } from 'react';

const menus = [
  ['Dashboard', '/admin'],
  ['分類', '/admin/categories'],
  ['商品', '/admin/products'],
  ['選項群組', '/admin/option-groups'],
  ['訂單', '/admin/orders'],
  ['桌號', '/admin/tables'],
  ['使用者', '/admin/users'],
  ['報表', '/admin/reports']
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <h2 className="mb-3 font-bold">管理後台</h2>
        <nav className="space-y-2 text-sm">
          {menus.map(([label, href]) => <Link key={href} href={href} className="block rounded px-2 py-1 hover:bg-slate-100">{label}</Link>)}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
