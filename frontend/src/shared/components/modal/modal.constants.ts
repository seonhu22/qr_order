// src/shared/components/modal/modal.constants.ts

/**
 * @fileoverview modal 계열 상수 정의
 *
 * @description
 * - WrapperModal과 StatusModal이 공유하는 크기/상태 매핑 상수를 관리한다.
 * - UI 정책성 값은 구현 파일에서 분리해 두어야 추후 디자인 변경 시 추적이 쉽다.
 *
 * @example
 * const buttonSize = MODAL_BUTTON_SIZE_MAP.md;
 */

import type { ButtonSize } from '@/shared/components/button';
import type { ModalSize, StatusModalTone } from './modalType';

export const MODAL_SIZE_CLASS_MAP: Record<ModalSize, string> = {
  sm: 'base-modal--sm',
  md: 'base-modal--md',
  lg: 'base-modal--lg',
  xl: 'base-modal--xl',
};

export const MODAL_BUTTON_SIZE_MAP: Record<ModalSize, ButtonSize> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'lg',
};

export const STATUS_MODAL_ICON_MAP: Record<StatusModalTone, string> = {
  info: 'i-info',
  success: 'i-success',
  danger: 'i-trash',
  error: 'i-error',
};
