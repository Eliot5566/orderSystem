import { redirect } from 'next/navigation';

export default async function OrdersPage() {
  redirect('/customer/orders');
}
