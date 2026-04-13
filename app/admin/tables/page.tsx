import { SimpleCrud } from '@/components/admin/simple-crud';

export default function Page() {
  return (
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
  );
}
