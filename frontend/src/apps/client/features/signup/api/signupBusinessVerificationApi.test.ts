import { describe, expect, it } from 'vitest';
import {
  buildSignupBusinessVerificationPayload,
  getSignupBusinessVerificationErrorMessage,
  isSignupBusinessVerificationError,
} from './signupBusinessVerificationApi';
import { HttpError } from '@/shared/lib/httpClient';

describe('signupBusinessVerificationApi', () => {
  it('builds chkBRN payload with digits-only business number', () => {
    const payload = buildSignupBusinessVerificationPayload({
      businessNo: '123-45-67890',
      businessRepName: ' 홍길동 ',
      openDate: '2026-06-15',
    });

    expect(payload).toEqual({
      businessRegiNum: '1234567890',
      userNm: '홍길동',
      businessRegiDate: '20260615',
    });
  });

  it('returns validation error before API call when business number is invalid', () => {
    const result = buildSignupBusinessVerificationPayload({
      businessNo: '123',
      businessRepName: '홍길동',
      openDate: '2026-06-15',
    });

    expect(isSignupBusinessVerificationError(result)).toBe(true);
    expect(result).toEqual({
      field: 'businessNo',
      message: '사업자등록번호 10자리를 입력해주세요.',
    });
  });

  it('returns validation error before API call when representative name is empty', () => {
    const result = buildSignupBusinessVerificationPayload({
      businessNo: '1234567890',
      businessRepName: ' ',
      openDate: '2026-06-15',
    });

    expect(result).toEqual({
      field: 'businessRepName',
      message: '대표자명을 입력해주세요.',
    });
  });

  it('returns validation error before API call when open date is empty', () => {
    const result = buildSignupBusinessVerificationPayload({
      businessNo: '1234567890',
      businessRepName: '홍길동',
      openDate: '',
    });

    expect(result).toEqual({
      field: 'openDate',
      message: '개업일을 선택해주세요.',
    });
  });

  it('returns validation error before API call when open date format is invalid', () => {
    const result = buildSignupBusinessVerificationPayload({
      businessNo: '1234567890',
      businessRepName: '홍길동',
      openDate: '2026-6-1',
    });

    expect(result).toEqual({
      field: 'openDate',
      message: '개업일자를 확인해주세요.',
    });
  });

  it('extracts backend message from HttpError', () => {
    const error = new HttpError(
      '사업자등록 정보가 일치하지 않습니다.',
      new Response(null, { status: 400, statusText: 'Bad Request' }),
      '/api/auth/signup/new/chkBRN',
      { success: false, message: '사업자등록 정보가 일치하지 않습니다.' },
    );

    expect(getSignupBusinessVerificationErrorMessage(error)).toBe(
      '사업자등록 정보가 일치하지 않습니다.',
    );
  });
});
