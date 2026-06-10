import { describe, expect, it } from 'vitest';
import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  it('keeps list prefix keys aligned with concrete list keys', () => {
    expect(queryKeys.notice.list('공지')).toEqual([...queryKeys.notice.lists, { searchKeyword: '공지' }]);
    expect(queryKeys.qna.list('문의')).toEqual([...queryKeys.qna.lists, { searchKeyword: '문의' }]);
    expect(queryKeys.coupon.list('쿠폰')).toEqual([...queryKeys.coupon.lists, { searchKeyword: '쿠폰' }]);
  });

  it('provides namespace keys for master/detail pages', () => {
    expect(queryKeys.commonCode.masters('공통')).toEqual([
      ...queryKeys.commonCode.masterLists,
      { searchKeyword: '공통' },
    ]);
    expect(queryKeys.commonCode.details('master-1', '상세')).toEqual([
      ...queryKeys.commonCode.detailLists,
      'master-1',
      { searchKeyword: '상세' },
    ]);
    expect(queryKeys.rule.details('rule-1')).toEqual([...queryKeys.rule.detailLists, 'rule-1']);
  });
});
