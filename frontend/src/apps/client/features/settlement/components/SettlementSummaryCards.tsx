import { Icon } from '@/shared/assets/icons/Icon';
import type { SettlementSummary } from '../types';

type SettlementSummaryCardsProps = {
  summary: SettlementSummary | null;
};

function formatAmount(value: number): string {
  return value.toLocaleString('ko-KR');
}

export function SettlementSummaryCards({ summary }: SettlementSummaryCardsProps) {
  const totalPrice = summary?.totalPrice ?? 0;
  const cancelPrice = summary?.cancelPrice ?? 0;
  const discountPrice = summary?.discountPrice ?? 0;
  const orderCount = summary?.orderCount ?? 0;
  const netPrice = summary?.netPrice ?? 0;
  const cancelCount = summary?.cancelCount ?? 0;

  return (
    <div className="settlement-summary-cards">
      <article className="settlement-summary-card" aria-label="총 결제 금액">
        <span className="settlement-summary-card__icon settlement-summary-card__icon--total">
          <Icon id="i-card" size={20} />
        </span>
        <div className="settlement-summary-card__body">
          <p className="settlement-summary-card__label">총 결제 금액</p>
          <p className="settlement-summary-card__value">
            {formatAmount(totalPrice)}
            <span>원</span>
          </p>
        </div>
        <p className="settlement-summary-card__caption">결제 완료 기준</p>
      </article>

      <article className="settlement-summary-card" aria-label="취소 금액">
        <span className="settlement-summary-card__icon settlement-summary-card__icon--cancel">
          <Icon id="i-return" size={17} />
        </span>
        <div className="settlement-summary-card__body">
          <p className="settlement-summary-card__label">취소 금액</p>
          <p className="settlement-summary-card__value">
            -{formatAmount(cancelPrice)}
            <span>원</span>
          </p>
        </div>
        <p className="settlement-summary-card__caption settlement-summary-card__caption--cancel">
          취소 {cancelCount}건
        </p>
      </article>

      <article className="settlement-summary-card" aria-label="할인 금액">
        <span className="settlement-summary-card__icon settlement-summary-card__icon--discount">
          <Icon id="i-sale" size={20} />
        </span>
        <div className="settlement-summary-card__body">
          <p className="settlement-summary-card__label">할인 금액</p>
          <p className="settlement-summary-card__value">
            -{formatAmount(discountPrice)}
            <span>원</span>
          </p>
        </div>
        <p className="settlement-summary-card__caption">할인 · 프로모션</p>
      </article>

      <article className="settlement-summary-card" aria-label="주문 건수">
        <span className="settlement-summary-card__icon settlement-summary-card__icon--order">
          <Icon id="i-shop" size={20} />
        </span>
        <div className="settlement-summary-card__body">
          <p className="settlement-summary-card__label">주문 건수</p>
          <p className="settlement-summary-card__value">
            {orderCount}
            <span>건</span>
          </p>
        </div>
        <p className="settlement-summary-card__caption">전체 주문 건수</p>
      </article>

      <article className="settlement-summary-card settlement-summary-card--highlight" aria-label="순 매출">
        <span className="settlement-summary-card__icon settlement-summary-card__icon--net">
          <Icon id="i-trend-up" size={20} />
        </span>
        <div className="settlement-summary-card__body">
          <p className="settlement-summary-card__label">순 매출</p>
          <p className="settlement-summary-card__value">
            {formatAmount(netPrice)}
            <span>원</span>
          </p>
        </div>
        <p className="settlement-summary-card__caption">전체 순 매출</p>
      </article>
    </div>
  );
}
