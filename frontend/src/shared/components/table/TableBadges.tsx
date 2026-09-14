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

type AuthorityBadgeProps = {
  /** 백엔드 권한 코드 (현재: '01'=관리자, '02'=스태프). '01'은 brand 톤 */
  code: string;
  /** 화면에 표시할 라벨 — 공통 콤보(USER_ROLE) 응답 또는 도메인 라벨 매핑값 */
  label: string;
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
 * `status-badge--create`(success)/`update`(info)/`delete`(error) 톤으로 구분한다.
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
 * `status-badge--expired`(error)/`empty`(neutral) 톤으로 구분한다.
 */
export function ExpirationStatusBadge({ value }: ExpirationStatusBadgeProps) {
  const className = value === '만료' ? 'status-badge--expired' : 'status-badge--empty';

  return <span className={`status-badge ${className}`}>{value}</span>;
}

/**
 * 라이선스 기간 전용 배지.
 *
 * @description
 * 기간 구분일 뿐 상태 의미가 없어 `status-badge--period-1m`/`period-12m` 둘 다 neutral 톤이다.
 */
export function LicensePeriodBadge({ value }: LicensePeriodBadgeProps) {
  const className = value === '1개월' ? 'status-badge--period-1m' : 'status-badge--period-12m';

  return <span className={`status-badge ${className}`}>{value}</span>;
}

/**
 * 권한 전용 배지.
 *
 * @description
 * `status-badge` 베이스를 공유하고 modifier(`--admin/--staff`)로 색상만 분기한다.
 * 라벨은 표시 텍스트로 받고, 톤은 `code`(`01`)로 결정한다.
 * 권한 코드는 백엔드 공통 콤보(`USER_ROLE`)에서 확장될 수 있으므로 enum 대신 string으로 받는다.
 */
export function AuthorityBadge({ code, label }: AuthorityBadgeProps) {
  const isAdmin = code === '01';
  const className = isAdmin ? 'status-badge--admin' : 'status-badge--staff';

  return <span className={`status-badge ${className}`}>{label}</span>;
}
