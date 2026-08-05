import './OrderStatusManagementHeader.css';
import { Button } from '@/shared/components/button';

type OrderStatusManagementHeaderProps = {
  onRefresh: () => void;
  syncStatus: 'synced' | 'refreshing' | 'error';
};

export function OrderStatusManagementHeader({
  onRefresh,
  syncStatus,
}: OrderStatusManagementHeaderProps) {
  const isError = syncStatus === 'error';
  const isRefreshing = syncStatus === 'refreshing';
  const syncClassName = [
    'order-status-header__sync',
    isError ? 'order-status-header__sync--error' : '',
    isRefreshing ? 'order-status-header__sync--refreshing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className="order-status-header">
      <div className="order-status-header__left">
        <h1 className="order-status-header__title">주문 상태 관리</h1>
        <span className={syncClassName} role="status">
          <span className="order-status-header__sync-dot" aria-hidden="true" />
          {isError ? '동기화 실패 · 기존 주문 표시 중' : isRefreshing ? '동기화 중' : '5초마다 동기화'}
        </span>
      </div>
      <Button variant="outline" size="md" className="order-status-header__reset" loading={isRefreshing} onClick={onRefresh}>
        새로고침
      </Button>
    </header>
  );
}
