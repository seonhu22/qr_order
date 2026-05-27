/**
 * @fileoverview Checkbox 컴포넌트 공개 API
 *
 * @description
 * - 외부에서는 이 파일만 통해 import 한다
 *
 * @example
 * import { CheckboxInput, CheckboxGroup } from '@/shared/components/checkbox';
 */

/* 컴포넌트 */
export { CheckboxInput } from './CheckboxInput';
export { CheckboxGroup } from './CheckboxInput';

/* 타입 */
export type {
  CheckboxSize,
  CheckboxInputProps,
  CheckboxGroupProps,
} from './types';
