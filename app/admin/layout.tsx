import Link from 'next/link';
import type { Route } from 'next';
import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth/jwt';
import { PERMISSIONS, type Permission } from '@/lib/auth/rbac';

const menus: Array<{ label: string; href: Route; permission?: Permission }> = [
  { label: 'Dashboard', href: '/admin' },
  { label: '分類', href: '/admin/categories', permission: PERMISSIONS.CATEGORY_MANAGE },
  { label: '商品', href: '/admin/products', permission: PERMISSIONS.PRODUCT_MANAGE },
  { label: '選項群組', href: '/admin/option-groups', permission: PERMISSIONS.PRODUCT_MANAGE },
  { label: '訂單', href: '/admin/orders', permission: PERMISSIONS.ORDER_MANAGE },
  { label: '桌號', href: '/admin/tables', permission: PERMISSIONS.TABLE_MANAGE },
  { label: '使用者', href: '/admin/users', permission: PERMISSIONS.USER_MANAGE },
  { label: '報表', href: '/admin/reports', permission: PERMISSIONS.REPORT_VIEW },
  { label: '門市設定', href: '/admin/store-settings', permission: PERMISSIONS.STORE_MANAGE }
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const token = cookies().get('admin_token')?.value;
  if (!token) redirect('/login');

  const session = await verifyToken(token);
  if (!session) redirect('/login');

  const visibleMenus = menus.filter((menu) => !menu.permission || session.permissions.includes(menu.permission));

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <h2 className="mb-3 font-bold">管理後台</h2>
        <nav className="space-y-2 text-sm">
          {visibleMenus.map(({ label, href }) => (
            <Link key={href} href={href} className="block rounded px-2 py-1 hover:bg-slate-100">
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
