/**
 * @fileoverview Radio 컴포넌트 공개 API
 *
 * @description
 * - 외부에서는 이 파일만 통해 import 한다
 *
 * @example
 * import { RadioInput, RadioGroup } from '@/shared/components/radio';
 */

/* 컴포넌트 */
export { RadioInput, RadioGroup } from './RadioInput';

/* 타입 */
export type {
  RadioSize,
  RadioInputProps,
  RadioOption,
  RadioGroupProps,
} from './types';
