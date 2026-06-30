import './OrderStatusManagementHeader.css';
import { Button } from '@/shared/components/button';

type OrderStatusManagementHeaderProps = {
  onReset: () => void;
  /** 실시간 연동(WebSocket/SSE) 연결 상태. 아직 실제 연동이 없어 기본값 true(연결됨)로 정적 표시한다. */
  isConnected?: boolean;
};

export function OrderStatusManagementHeader({
  onReset,
  isConnected = true,
}: OrderStatusManagementHeaderProps) {
  const syncClassName = [
    'order-status-header__sync',
    isConnected ? '' : 'order-status-header__sync--error',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className="order-status-header">
      <div className="order-status-header__left">
        <h1 className="order-status-header__title">주문 상태 관리</h1>
        <span className={syncClassName} role="status">
          <span className="order-status-header__sync-dot" aria-hidden="true" />
          {isConnected ? '실시간 동기화' : '실시간 동기화 실패'}
        </span>
      </div>
      <Button variant="outline" size="md" className="order-status-header__reset" onClick={onReset}>
        초기화
      </Button>
    </header>
  );
}
