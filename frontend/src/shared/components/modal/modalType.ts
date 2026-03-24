// src/shared/components/modal/modalType.ts

/**
 * @fileoverview WrapperModal 타입 정의
 *
 * @description
 * - 공용 모달 래퍼에서 사용하는 크기, 레이아웃, 액션 타입을 관리한다.
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

export interface WrapperModalProps {
  open: boolean;
  layout?: WrapperModalLayout;
  actions?: WrapperModalActions;
  size?: ModalSize;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
  closeOnOverlayClick?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
  onClose: () => void;
  onConfirm?: () => void;
  onSecondaryAction?: () => void;
}
