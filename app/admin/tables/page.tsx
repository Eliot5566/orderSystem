import { SimpleCrud } from '@/components/admin/simple-crud';
import Link from 'next/link';

export default function Page() {
  return (
    <>
      <div className="mb-3 flex justify-end">
        <Link href="/admin/tables/qrcodes" className="rounded bg-brand-700 px-3 py-2 text-sm text-white">查看桌號 QRCode</Link>
      </div>
      <SimpleCrud
        title="桌號管理"
        endpoint="/api/admin/tables"
        fields={[
          { key: 'code', placeholder: '桌號' },
          { key: 'capacity', placeholder: '人數', type: 'number' },
          { key: 'sortOrder', placeholder: '排序', type: 'number' },
          { key: 'isActive', placeholder: '是否啟用', type: 'boolean' }
        ]}
        searchKeys={['code']}
      />
    </>
  );
}
