// src/shared/components/modal/base/modalType.ts

/**
 * @fileoverview WrapperModal 타입 정의
 *
 * @description
 * - 공용 모달 래퍼와 완성형 모달이 함께 사용하는 타입을 관리한다.
 * - shared/types가 아닌 modal 폴더 내부에 두는 이유는 모달 전용 타입이기 때문이다.
 *
 * @example
 * import type { WrapperModalProps } from '@/shared/components/modal';
 *
 * @example
 * const size: ModalSize = 'md';
 */

import type { ReactNode } from 'react';
import type { ButtonVariant } from '@/shared/components/button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export type WrapperModalLayout = 'default' | 'notice';

export type ConfirmModalTone = 'info' | 'success' | 'danger' | 'edit';

export interface ModalCommonProps {
  open: boolean;
  /** 폼에 입력값이 있으면 true — overlay 클릭·ESC 닫기를 막는다 */
  isDirty?: boolean;
  size?: ModalSize;
  layout?: WrapperModalLayout;
  title?: string;
  subtitle?: string;
  closeOnOverlayClick?: boolean;
  onClose: () => void;
}

export interface ModalActionConfig {
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export interface ModalPrimaryAction extends ModalActionConfig {
  variant?: Extract<ButtonVariant, 'primary' | 'danger'>;
}

export interface ModalSecondaryAction extends ModalActionConfig {
  variant?: Extract<ButtonVariant, 'secondary'>;
}

export type ConfirmPrimaryAction = Omit<ModalPrimaryAction, 'variant'>;

export type ConfirmSecondaryAction = Omit<ModalSecondaryAction, 'label' | 'variant'>;

export interface WrapperModalProps extends ModalCommonProps {
  icon?: ReactNode;
  noticeMeta?: ReactNode;
  children?: ReactNode;
  buttonSize?: 'sm' | 'md' | 'lg';
  primaryAction?: ModalPrimaryAction;
  secondaryAction?: ModalSecondaryAction;
}

export interface ConfirmModalProps extends Pick<
  ModalCommonProps,
  'open' | 'size' | 'title' | 'onClose'
> {
  description?: string;
  tone?: ConfirmModalTone;
  primaryAction?: ConfirmPrimaryAction;
  secondaryAction?: ConfirmSecondaryAction;
}

export interface NoticeModalProps extends Pick<
  ModalCommonProps,
  'open' | 'size' | 'title' | 'onClose'
> {
  description?: string;
  tone?: ConfirmModalTone;
  primaryAction?: ModalPrimaryAction;
  secondaryAction?: ConfirmSecondaryAction;
}

export interface SimpleDefaultModalProps extends Pick<
  ModalCommonProps,
  'open' | 'size' | 'title' | 'onClose'
> {
  description?: string;
  helperText?: string;
  primaryAction?: ModalPrimaryAction;
  secondaryAction?: ConfirmSecondaryAction;
}
