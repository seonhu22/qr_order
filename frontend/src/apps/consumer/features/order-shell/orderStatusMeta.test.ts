import { describe, expect, it } from 'vitest';
import { normalizeConsumerOrderStatus } from './orderStatusMeta';

describe('normalizeConsumerOrderStatus', () => {
  it('백엔드 원시 상태 문자열을 canonical 키로 정규화한다', () => {
    expect(normalizeConsumerOrderStatus('RECEIVED')).toBe('RECEIVED');
    expect(normalizeConsumerOrderStatus('PREPARING')).toBe('COOKING');
    expect(normalizeConsumerOrderStatus('SERVED')).toBe('SERVED');
    expect(normalizeConsumerOrderStatus('CANCELED')).toBe('CANCELLED');
    expect(normalizeConsumerOrderStatus('CANCELLED')).toBe('CANCELLED');
  });

  it('알 수 없는 상태 문자열은 null을 반환해 배지 렌더를 생략하게 한다', () => {
    expect(normalizeConsumerOrderStatus('')).toBeNull();
    expect(normalizeConsumerOrderStatus('UNKNOWN')).toBeNull();
  });
});
