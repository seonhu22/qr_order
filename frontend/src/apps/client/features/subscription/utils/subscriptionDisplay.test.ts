import { describe, expect, it } from 'vitest';
import type { ClientSubscription } from '../types';
import { describeSubscription, formatKst, getSubscriptionBanners } from './subscriptionDisplay';

const base: ClientSubscription = {
  hasSubscription: true,
  status: 'PENDING',
  isOwner: true,
  planSysId: null,
  planName: null,
  amount: null,
  paidThroughAt: null,
  graceUntil: null,
  endAt: null,
  cardExpired: false,
  roleGranted: false,
  lastFailureCode: null,
  canCheckout: true,
  canCancel: true,
  plans: [],
};

describe('subscriptionDisplay', () => {
  it('formats server UTC instants in KST', () => {
    expect(formatKst('2026-11-25T15:30:00Z')).toBe('2026-11-26 00:30');
    expect(formatKst(null)).toBe('');
    expect(formatKst('not-a-date')).toBe('');
  });

  it('shows the before-payment banner only to a 02 owner', () => {
    expect(getSubscriptionBanners(base, '02')).toEqual(['ownerBeforePayment']);
    expect(getSubscriptionBanners(base, '01')).toEqual([]);
    expect(getSubscriptionBanners({ ...base, isOwner: false }, '02')).toEqual([]);
    expect(getSubscriptionBanners({ ...base, hasSubscription: false }, '02')).toEqual([]);
    expect(getSubscriptionBanners(undefined, '02')).toEqual([]);
  });

  it('shows the card-expired banner to everyone while the subscription is open', () => {
    const expiredCard = { ...base, status: 'ACTIVE' as const, cardExpired: true, isOwner: false };
    expect(getSubscriptionBanners(expiredCard, '01')).toEqual(['cardExpired']);
    expect(getSubscriptionBanners({ ...expiredCard, status: 'PAST_DUE' }, '02')).toEqual(['cardExpired']);
    expect(getSubscriptionBanners({ ...expiredCard, status: 'EXPIRED' }, '01')).toEqual([]);
    expect(getSubscriptionBanners({ ...expiredCard, status: 'PENDING' }, '01')).toEqual([]);
  });

  it('describes each status with its deadline', () => {
    expect(describeSubscription({ ...base, status: 'ACTIVE', paidThroughAt: '2026-12-25T03:00:00Z' }))
      .toContain('2026-12-25 12:00까지');
    expect(describeSubscription({ ...base, status: 'PAST_DUE', graceUntil: '2027-01-01T03:00:00Z' }))
      .toContain('2027-01-01 12:00');
    expect(describeSubscription({ ...base, status: 'CANCEL_SCHEDULED', endAt: '2026-12-25T03:00:00Z' }))
      .toContain('2026-12-25 12:00에 구독이 끝납니다');
  });
});
