import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import { AdminSubscriptionList } from '@/apps/admin/features/subscription/components/AdminSubscriptionList';

export function AdminSubscriptionsPage() {
  return (
    <AdminMainLayout adminMainTitle="구독 관리" depth1="시스템" depth2="결제 관리">
      <AdminSubscriptionList />
    </AdminMainLayout>
  );
}
