import type { ComponentProps } from 'react';
import { Icon } from '@/shared/assets/icons/Icon';
import { Button } from '@/shared/components/button/Button';

type ClickHandler = ComponentProps<typeof Button>['onClick'];

type DisabledButtonProps = {
  onClick?: ClickHandler;
  disabled?: boolean;
};

type LoadingButtonProps = {
  onClick?: ClickHandler;
  loading?: boolean;
  disabled?: boolean;
};

type IconButtonProps = {
  ariaLabel: string;
  onClick?: ClickHandler;
  disabled?: boolean;
};

/**
 * 필터 영역의 초기화 버튼.
 */
export function ResetFilterButton({ onClick, disabled }: DisabledButtonProps) {
  return (
    <Button type="button" variant="outline" size="md" disabled={disabled} onClick={onClick}>
      초기화
    </Button>
  );
}

/**
 * 필터 영역의 조회 버튼.
 */
export function SearchFilterButton({ onClick, disabled }: DisabledButtonProps) {
  return (
    <Button
      type="button"
      variant="primary"
      size="md"
      leftIcon={<Icon id="i-search" size={15} />}
      disabled={disabled}
      onClick={onClick}
    >
      조회
    </Button>
  );
}

/**
 * 마스터 테이블의 신규 버튼.
 */
export function CreateTableButton({ onClick, disabled }: DisabledButtonProps) {
  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      leftIcon={<Icon id="i-plus" size={13} />}
      disabled={disabled}
      onClick={onClick}
    >
      신규
    </Button>
  );
}

/**
 * 테이블 상단 삭제 버튼.
 */
export function DeleteTableButton({ onClick, disabled }: DisabledButtonProps) {
  return (
    <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onClick}>
      삭제
    </Button>
  );
}

/**
 * 상세/편집 테이블의 행추가 버튼.
 */
export function AddRowTableButton({ onClick, disabled }: DisabledButtonProps) {
  return (
    <Button
      type="button"
      variant="text"
      size="sm"
      className="common-code-card__text-action"
      disabled={disabled}
      onClick={onClick}
    >
      + 행추가
    </Button>
  );
}

/**
 * 상세/편집 테이블의 행삭제 버튼.
 */
export function DeleteRowTableButton({ onClick, disabled }: DisabledButtonProps) {
  return (
    <Button
      type="button"
      variant="text"
      size="sm"
      className="common-code-card__text-action"
      disabled={disabled}
      onClick={onClick}
    >
      - 행삭제
    </Button>
  );
}

/**
 * 트리형 테이블의 하위추가 버튼.
 */
export function AddChildRowTableButton({ onClick, disabled }: DisabledButtonProps) {
  return (
    <Button
      type="button"
      variant="text"
      size="sm"
      className="common-code-card__text-action"
      disabled={disabled}
      onClick={onClick}
    >
      + 하위추가
    </Button>
  );
}

/**
 * 상세/편집 테이블의 저장 버튼.
 */
export function SaveTableButton({ onClick, loading, disabled }: LoadingButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={loading}
      disabled={disabled}
      onClick={onClick}
    >
      저장
    </Button>
  );
}

/**
 * 테이블 상단 초기화 버튼.
 */
export function ResetTableButton({ onClick, disabled }: DisabledButtonProps) {
  return (
    <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onClick}>
      초기화
    </Button>
  );
}

/**
 * 위로 이동 아이콘 버튼.
 */
export function MoveUpTableButton({ ariaLabel, onClick, disabled }: IconButtonProps) {
  return (
    <Button
      variant="icon"
      size="sm"
      iconOnly={<Icon id="i-chevron-up" size={12} />}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    />
  );
}

/**
 * 아래로 이동 아이콘 버튼.
 */
export function MoveDownTableButton({ ariaLabel, onClick, disabled }: IconButtonProps) {
  return (
    <Button
      variant="icon"
      size="sm"
      iconOnly={<Icon id="i-chevron-down" size={12} />}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    />
  );
}

/**
 * 마스터 수정 아이콘 버튼.
 */
export function EditTableButton({ ariaLabel, onClick, disabled }: IconButtonProps) {
  return (
    <Button
      type="button"
      variant="icon"
      size="sm"
      iconOnly={<Icon id="i-modal-pencil" size={12} />}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    />
  );
}

/**
 * 비밀번호 초기화 전용 버튼.
 */
export function PasswordResetButton({ onClick, disabled }: DisabledButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="admin-user-page__password-button"
      disabled={disabled}
      onClick={onClick}
    >
      초기화
    </Button>
  );
}
