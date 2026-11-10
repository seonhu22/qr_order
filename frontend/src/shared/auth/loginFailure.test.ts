import { describe, expect, it } from 'vitest';
import { getPasswordFailCount, isLockedLoginMessage } from './loginFailure';

describe('login failure response contract', () => {
  it.each([5, '5', { password_fail_cnt: 5 }, { password_fail_cnt: '5' }, { passwordFailCnt: 5 }, { passwordFailCnt: '5' }])('reads the server count without incrementing it: %j', (data) => {
    expect(getPasswordFailCount({ data })).toBe(5);
  });
  it('keeps counts below the threshold unchanged', () => {
    expect(getPasswordFailCount({ data: 4 })).toBe(4);
  });
  it.each([undefined, null, {}, { data: null }, { data: 'invalid' }, { data: { password_fail_cnt: 'invalid' } }])('ignores missing/invalid counts: %j', (payload) => {
    expect(getPasswordFailCount(payload)).toBeUndefined();
  });
  it('recognizes the existing server lock message but not ordinary errors', () => {
    expect(isLockedLoginMessage('해당 계정은 비밀번호 5회 초과 오류로 사용 중지된 상태입니다.')).toBe(true);
    expect(isLockedLoginMessage('비밀번호가 맞지 않습니다.')).toBe(false);
    expect(isLockedLoginMessage(null)).toBe(false);
  });
});
