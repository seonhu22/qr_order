import './OrderStatusManagementHeader.css';
import { Button } from '@/shared/components/button';

type OrderStatusManagementHeaderProps = {
  onReset: () => void;
};

export function OrderStatusManagementHeader({ onReset }: OrderStatusManagementHeaderProps) {
  return (
    <header className="order-status-header">
      <div className="order-status-header__left">
        <h1 className="order-status-header__title">주문 상태 관리</h1>
        {/* 실제 WebSocket/SSE 연동 전까지는 정적 표시만 한다. 연동되면 연결 성공/실패 상태에 따라 토글한다. */}
        <span className="order-status-header__sync" role="status">
          <span className="order-status-header__sync-dot" aria-hidden="true" />
          실시간 동기화
        </span>
      </div>
      <Button variant="outline" size="md" className="order-status-header__reset" onClick={onReset}>
        초기화
      </Button>
    </header>
  );
}
