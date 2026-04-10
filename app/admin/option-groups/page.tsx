import { SimpleCrud } from '@/components/admin/simple-crud';

export default function Page() {
  return <SimpleCrud title="選項群組管理" endpoint="/api/admin/option-groups" fields={[{ key: 'name', placeholder: '群組名稱' }, { key: 'minSelect', placeholder: '最少', type: 'number' }, { key: 'maxSelect', placeholder: '最多', type: 'number' }]} />;
}
