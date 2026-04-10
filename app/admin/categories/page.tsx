import { SimpleCrud } from '@/components/admin/simple-crud';

export default function Page() {
  return <SimpleCrud title="分類管理" endpoint="/api/admin/categories" fields={[{ key: 'name', placeholder: '分類名稱' }, { key: 'sortOrder', placeholder: '排序', type: 'number' }]} />;
}
