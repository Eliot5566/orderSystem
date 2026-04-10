import { SimpleCrud } from '@/components/admin/simple-crud';

export default function Page() {
  return <SimpleCrud title="使用者管理" endpoint="/api/admin/users" fields={[{ key: 'email', placeholder: 'Email' }, { key: 'name', placeholder: '姓名' }, { key: 'password', placeholder: '密碼' }, { key: 'roleCode', placeholder: 'ADMIN/MANAGER/STAFF' }]} />;
}
