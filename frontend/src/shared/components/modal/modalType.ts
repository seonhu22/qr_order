// src/shared/components/modal/modalType.ts

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

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export type WrapperModalLayout = 'default' | 'notice';

export type WrapperModalActions = 'single' | 'double';

export interface ModalCommonProps {
  open: boolean;
  size?: ModalSize;
  layout?: WrapperModalLayout;
  title?: string;
  subtitle?: string;
  noticeTopPadding?: boolean;
  closeOnOverlayClick?: boolean;
  onClose: () => void;
}

export interface ModalActionProps {
  actions?: WrapperModalActions;
  primaryLabel?: string;
  secondaryLabel?: string;
  onConfirm?: () => void;
  onSecondaryAction?: () => void;
}

export interface WrapperModalProps extends ModalCommonProps, ModalActionProps {
  icon?: ReactNode;
  children?: ReactNode;
}

export interface StatusModalProps
  extends Pick<ModalCommonProps, 'open' | 'size' | 'title' | 'onClose'>,
    Pick<ModalActionProps, 'primaryLabel' | 'onConfirm'> {
  description?: string;
}
