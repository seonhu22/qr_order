import { CheckboxInput } from '@/shared/components/checkbox';
import { InputBase, InputWrapper, SelectInput } from '@/shared/components/input';
import type { SelectOption } from '@/shared/components/input';
import { EditTableButton, PasswordResetButton } from '@/shared/components/button';
import {
  AuthorityBadge,
  ChangeTypeBadge,
  ExpirationStatusBadge,
  LicensePeriodBadge,
  UseYnBadge,
} from '@/shared/components/table/TableBadges';
import type {
  ChangeTypeBadgeValue,
  ExpirationStatusBadgeValue,
  LicensePeriodBadgeValue,
  UseYnBadgeValue,
} from '@/shared/components/table/tableBadgeTypes';

type TableCellInputProps = {
  inputId: string;
  value: string;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  controlState?: '' | 'readonly' | 'error' | 'success' | 'disabled';
  readOnly?: boolean;
  onChange: (value: string) => void;
  onClearError?: () => void;
};

type TableCellCheckboxProps = {
  checked: boolean;
  ariaLabel: string;
  className?: string;
  onChange: (checked: boolean) => void;
};

type TableCellSelectProps = {
  value: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  isError?: boolean;
  searchable?: boolean;
  onChange: (value: string) => void;
};

type TableCellEditButtonProps = {
  ariaLabel: string;
  onClick: React.ComponentProps<typeof EditTableButton>['onClick'];
};

type TableCellPasswordResetButtonProps = {
  disabled?: boolean;
  onClick: React.ComponentProps<typeof PasswordResetButton>['onClick'];
};

type TableCellUseYnBadgeProps = {
  value: UseYnBadgeValue;
};

type TableCellChangeTypeBadgeProps = {
  value: ChangeTypeBadgeValue;
};

type TableCellExpirationStatusBadgeProps = {
  value: ExpirationStatusBadgeValue;
};

type TableCellLicensePeriodBadgeProps = {
  value: LicensePeriodBadgeValue;
};

type TableCellAuthorityBadgeProps = {
  code: string;
  label: string;
};

/**
 * 테이블 인라인 input 셀.
 *
 * @description
 * 기존 `InputWrapper + InputBase + common-table__input` 조합을 공통화한다.
 */
export function TableCellInput({
  inputId,
  value,
  ariaLabel,
  placeholder,
  className = 'common-table__input',
  controlState = '',
  readOnly = false,
  onChange,
  onClearError,
}: TableCellInputProps) {
  return (
    <InputWrapper inputId={inputId}>
      <InputBase
        id={inputId}
        size="sm"
        className={className}
        controlState={controlState}
        readOnly={readOnly}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => {
          onClearError?.();
          onChange(event.target.value);
        }}
      />
    </InputWrapper>
  );
}

/**
 * 테이블 체크박스 셀.
 */
export function TableCellCheckbox({
  checked,
  ariaLabel,
  className = 'common-table__checkbox',
  onChange,
}: TableCellCheckboxProps) {
  return (
    <CheckboxInput
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      size="sm"
      className={className}
    />
  );
}

/**
 * 테이블 셀렉트 셀.
 *
 * @description
 * 기존 `SelectInput + common-table__select` 조합을 공통화한다.
 */
export function TableCellSelect({
  value,
  options,
  placeholder,
  className = 'common-table__select',
  isError = false,
  searchable = false,
  onChange,
}: TableCellSelectProps) {
  return (
    <SelectInput
      size="sm"
      searchable={searchable}
      options={options}
      value={value}
      placeholder={placeholder}
      className={className}
      isError={isError}
      onChange={onChange}
    />
  );
}

/**
 * 테이블 수정 아이콘 셀.
 */
export function TableCellEditButton({ ariaLabel, onClick }: TableCellEditButtonProps) {
  return <EditTableButton ariaLabel={ariaLabel} onClick={onClick} />;
}

/**
 * 테이블 비밀번호 초기화 버튼 셀.
 */
export function TableCellPasswordResetButton({
  disabled,
  onClick,
}: TableCellPasswordResetButtonProps) {
  return <PasswordResetButton disabled={disabled} onClick={onClick} />;
}

/**
 * 사용여부 배지 셀.
 */
export function TableCellUseYnBadge({ value }: TableCellUseYnBadgeProps) {
  return <UseYnBadge value={value} />;
}

/**
 * 변경구분 배지 셀.
 */
export function TableCellChangeTypeBadge({ value }: TableCellChangeTypeBadgeProps) {
  return <ChangeTypeBadge value={value} />;
}

/**
 * 만료 상태 배지 셀.
 */
export function TableCellExpirationStatusBadge({
  value,
}: TableCellExpirationStatusBadgeProps) {
  return <ExpirationStatusBadge value={value} />;
}

/**
 * 라이선스 기간 배지 셀.
 */
export function TableCellLicensePeriodBadge({
  value,
}: TableCellLicensePeriodBadgeProps) {
  return <LicensePeriodBadge value={value} />;
}

/**
 * 권한 배지 셀.
 */
export function TableCellAuthorityBadge({ code, label }: TableCellAuthorityBadgeProps) {
  return <AuthorityBadge code={code} label={label} />;
}
