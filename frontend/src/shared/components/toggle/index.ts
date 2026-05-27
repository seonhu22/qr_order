/**
 * @fileoverview Toggle 컴포넌트 공개 API
 *
 * @description
 * - 외부에서는 이 파일만 통해 import 한다
 *
 * @example
 * import { ToggleInput } from '@/shared/components/toggle';
 */

/* 컴포넌트 */
export { ToggleInput } from './ToggleInput';

/* 타입 */
export type {
  ToggleSize,
  ToggleLabelPosition,
  ToggleInputProps,
} from './types';