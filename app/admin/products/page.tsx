import { SimpleCrud } from '@/components/admin/simple-crud';

export default function Page() {
  return <SimpleCrud title="商品管理" endpoint="/api/admin/products" fields={[{ key: 'categoryId', placeholder: '分類ID' }, { key: 'name', placeholder: '商品名稱' }, { key: 'price', placeholder: '價格', type: 'number' }, { key: 'stock', placeholder: '庫存', type: 'number' }]} />;
}
