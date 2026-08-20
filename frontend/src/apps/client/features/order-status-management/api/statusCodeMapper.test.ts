import { describe, expect, it } from 'vitest';
import { toApiOrderStatus, toOrderBoardStatus } from './statusCodeMapper';

describe('statusCodeMapper', () => {
  it.each([
    ['01', 'RECEIVED'],
    ['02', 'COOKING'],
    ['03', 'SERVED'],
    ['99!', 'CANCELLED'],
  ] as const)('%s 상태 코드를 %s 화면 상태로 변환한다', (apiStatus, boardStatus) => {
    expect(toOrderBoardStatus(apiStatus)).toBe(boardStatus);
    expect(toApiOrderStatus(boardStatus)).toBe(apiStatus);
  });

  it('알 수 없는 상태 코드는 화면 상태로 만들지 않는다', () => {
    expect(toOrderBoardStatus('UNKNOWN')).toBeUndefined();
    expect(toOrderBoardStatus()).toBeUndefined();
  });
});
