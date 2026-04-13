import { SimpleCrud } from '@/components/admin/simple-crud';

export default function Page() {
  return (
    <SimpleCrud
      title="商品管理"
      endpoint="/api/admin/products"
      fields={[
        { key: 'categoryId', placeholder: '分類ID' },
        { key: 'name', placeholder: '商品名稱' },
        { key: 'price', placeholder: '價格', type: 'number' },
        { key: 'stock', placeholder: '庫存', type: 'number' },
        { key: 'sortOrder', placeholder: '排序', type: 'number' },
        { key: 'isAvailable', placeholder: '是否上架', type: 'boolean' }
      ]}
      searchKeys={['name', 'categoryId']}
    />
  );
}
