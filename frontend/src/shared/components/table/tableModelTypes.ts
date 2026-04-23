import type { ReactNode } from 'react';
import type { SelectOption } from '@/shared/components/input';
import type {
  ChangeTypeBadgeValue,
  ExpirationStatusBadgeValue,
  LicensePeriodBadgeValue,
  UseYnBadgeValue,
} from './tableBadgeTypes';

export type TableColumnAlign = 'left' | 'center' | 'right';

export type SharedTableColumn = {
  key: string;
  label?: string;
  required?: boolean;
  align?: TableColumnAlign;
  className?: string;
  tdClassName?: string;
  ariaLabel?: string;
};

export type TextCellModel = {
  type: 'text';
  value: string;
  className?: string;
  title?: string;
};

export type InputCellModel = {
  type: 'input';
  value: string;
  inputId: string;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  controlState?: '' | 'readonly' | 'error' | 'success' | 'disabled';
  readOnly?: boolean;
  onChange: (value: string) => void;
  onClearError?: () => void;
};

export type CheckboxCellModel = {
  type: 'checkbox';
  checked: boolean;
  ariaLabel: string;
  className?: string;
  onChange: (checked: boolean) => void;
};

export type SelectCellModel = {
  type: 'select';
  value: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  isError?: boolean;
  searchable?: boolean;
  onChange: (value: string) => void;
};

export type EditButtonCellModel = {
  type: 'editButton';
  ariaLabel: string;
  onClick: React.ComponentProps<'button'>['onClick'];
};

export type PasswordResetButtonCellModel = {
  type: 'passwordResetButton';
  disabled?: boolean;
  onClick: React.ComponentProps<'button'>['onClick'];
};

export type UseYnBadgeCellModel = {
  type: 'useYnBadge';
  value: UseYnBadgeValue;
};

export type ChangeTypeBadgeCellModel = {
  type: 'changeTypeBadge';
  value: ChangeTypeBadgeValue;
};

export type ExpirationStatusBadgeCellModel = {
  type: 'expirationStatusBadge';
  value: ExpirationStatusBadgeValue;
};

export type LicensePeriodBadgeCellModel = {
  type: 'licensePeriodBadge';
  value: LicensePeriodBadgeValue;
};

export type CustomCellModel = {
  type: 'custom';
  render: () => ReactNode;
};

export type SharedTableCell =
  | TextCellModel
  | InputCellModel
  | CheckboxCellModel
  | SelectCellModel
  | EditButtonCellModel
  | PasswordResetButtonCellModel
  | UseYnBadgeCellModel
  | ChangeTypeBadgeCellModel
  | ExpirationStatusBadgeCellModel
  | LicensePeriodBadgeCellModel
  | CustomCellModel;

export type SharedTableRow = {
  id: string;
  selected?: boolean;
  selectOn?: 'click' | 'mouseDown';
  onSelect?: () => void;
  cells: Record<string, SharedTableCell>;
};
