import { MenuClient } from '@/components/customer/menu-client';
import { headers } from 'next/headers';

async function getBaseUrl() {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

async function getMenu(storeSlug: string) {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/store/public-menu?storeSlug=${encodeURIComponent(storeSlug)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`menu fetch failed (${res.status})`);
  return res.json();
}

export default async function MenuPage({ searchParams }: { searchParams: { storeSlug?: string; tableId?: string; tableCode?: string } }) {
  const menu = await getMenu(searchParams.storeSlug ?? 'demo-store');

  const requestedTableId = searchParams.tableId;
  const requestedTableCode = searchParams.tableCode?.toUpperCase();
  const matchedTable = (menu.tables ?? []).find(
    (table: { id: string; code: string }) =>
      (requestedTableId && table.id === requestedTableId) || (requestedTableCode && table.code.toUpperCase() === requestedTableCode)
  );

  return <MenuClient menu={menu} tableId={matchedTable?.id} tableCode={matchedTable?.code} />;
}
