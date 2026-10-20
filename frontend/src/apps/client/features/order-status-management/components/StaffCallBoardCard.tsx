import { memo } from 'react';
import './StaffCallBoardCard.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { Badge } from '@/shared/components/badge';
import { Button } from '@/shared/components/button';
import { formatOrderBoardTime } from '../utils';
import { useFadeOutExit } from '../hooks/useFadeOutExit';
import type { StaffCallBoardRow } from '../types';

type StaffCallBoardCardProps = {
  row: StaffCallBoardRow;
  onComplete: (id: string) => void;
  isLeaving?: boolean;
  onExited?: () => void;
};

/**
 * 직원호출 카드 — 주문 카드(`OrderStatusCard`)와 상단 시간 영역·전체 여백은 같은 클래스를 재사용하고,
 * 주문번호 자리에 테이블 번호, 시간 자리에 호출시간이 들어간다는 점만 다르다.
 */
function StaffCallBoardCardImpl({ row, onComplete, isLeaving, onExited }: StaffCallBoardCardProps) {
  const fadeRef = useFadeOutExit(isLeaving, onExited);

  return (
    <article
      ref={fadeRef}
      className={`order-status-card${isLeaving ? ' order-status-card--leaving' : ''}`}
      aria-hidden={isLeaving || undefined}
    >
      <div className="order-status-card__top-row">
        <span className="order-status-card__order-no">
          {row.tableNum}번 테이블 <span className="order-status-card__field-label">(테이블 번호)</span>
        </span>
        <span className="order-status-card__time">
          <Icon id="i-clock" size={13} />
          호출시간 {formatOrderBoardTime(row.calledAt)}
        </span>
      </div>

      <div className="staff-call-board-card__body">
        <span className="staff-call-board-card__label">
          <Icon id="i-bell" size={13} />
          직원호출
        </span>
        <div className="staff-call-board-card__items">
          {row.items.map((item) => (
            <Badge key={item.name} tone="neutral">
              {item.qty ? `${item.name} X ${item.qty}` : item.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="staff-call-board-card__footer">
        <Button variant="primary" size="sm" onClick={() => onComplete(row.id)}>
          완료
        </Button>
      </div>
    </article>
  );
}

/** onExited는 부모가 매 렌더 새로 만드는 참조라 기본 shallow 비교로는 memo 효과가 없다 — row/isLeaving만 비교한다. */
export const StaffCallBoardCard = memo(StaffCallBoardCardImpl, (prev, next) =>
  prev.row === next.row &&
  prev.onComplete === next.onComplete &&
  prev.isLeaving === next.isLeaving,
);
