import type {
  ChangeTypeBadgeValue,
  ExpirationStatusBadgeValue,
  LicensePeriodBadgeValue,
  UseYnBadgeValue,
} from '@/shared/components/table/tableBadgeTypes';

type UseYnBadgeProps = {
  value: UseYnBadgeValue;
};

type ChangeTypeBadgeProps = {
  value: ChangeTypeBadgeValue;
};

type ExpirationStatusBadgeProps = {
  value: ExpirationStatusBadgeValue;
};

type LicensePeriodBadgeProps = {
  value: LicensePeriodBadgeValue;
};

/**
 * 사용여부(Y/N) 전용 배지.
 *
 * @description
 * 기존 `status-badge`, `status-badge--yes/no` 클래스를 그대로 사용해
 * 스타일은 유지하고 값 분기만 컴포넌트로 숨긴다.
 */
export function UseYnBadge({ value }: UseYnBadgeProps) {
  return (
    <span className={`status-badge ${value === 'Y' ? 'status-badge--yes' : 'status-badge--no'}`}>
      {value}
    </span>
  );
}

/**
 * 변경구분(등록/수정/삭제) 전용 배지.
 *
 * @description
 * TODO:
 * - 현재는 임시 클래스명을 사용한다.
 * - 디자인 확정 후 TableCard.css 또는 전용 CSS에서
 *   `status-badge--create/update/delete` 스타일을 추가해야 한다.
 */
export function ChangeTypeBadge({ value }: ChangeTypeBadgeProps) {
  const className =
    value === '등록'
      ? 'status-badge--create'
      : value === '수정'
        ? 'status-badge--update'
        : 'status-badge--delete';

  return <span className={`status-badge ${className}`}>{value}</span>;
}

/**
 * 만료 상태 전용 배지.
 *
 * @description
 * TODO:
 * - 현재는 임시 클래스명을 사용한다.
 * - 디자인 확정 후 `status-badge--expired`, `status-badge--empty` 스타일을 추가해야 한다.
 */
export function ExpirationStatusBadge({ value }: ExpirationStatusBadgeProps) {
  const className = value === '만료' ? 'status-badge--expired' : 'status-badge--empty';

  return <span className={`status-badge ${className}`}>{value}</span>;
}

/**
 * 라이선스 기간 전용 배지.
 *
 * @description
 * TODO:
 * - 현재는 임시 클래스명을 사용한다.
 * - 디자인 확정 후 `status-badge--period-1m`, `status-badge--period-12m` 스타일을 추가해야 한다.
 */
export function LicensePeriodBadge({ value }: LicensePeriodBadgeProps) {
  const className = value === '1개월' ? 'status-badge--period-1m' : 'status-badge--period-12m';

  return <span className={`status-badge ${className}`}>{value}</span>;
}
