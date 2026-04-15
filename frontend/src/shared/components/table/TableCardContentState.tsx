import type { ReactNode } from 'react';
import { FeedbackState } from '@/shared/components/feedback';

type TableCardContentStateProps = {
  isLoading: boolean;
  isError: boolean;
  loadingTitle: string;
  errorTitle?: string;
  errorDescription?: string;
  children: ReactNode;
};

/**
 * 테이블 카드 본문 상태 조립기.
 *
 * @description
 * 로딩/에러/정상 테이블 분기는 대부분 같은 형태를 반복하므로,
 * 기존 FeedbackState 마크업은 유지한 채 분기만 공통화한다.
 */
export function TableCardContentState({
  isLoading,
  isError,
  loadingTitle,
  errorTitle,
  errorDescription = '다시 한번 시도해주세요.',
  children,
}: TableCardContentStateProps) {
  if (isLoading) {
    return <FeedbackState variant="loading" title={loadingTitle} />;
  }

  if (isError) {
    return <FeedbackState variant="error" title={errorTitle} description={errorDescription} />;
  }

  return <>{children}</>;
}
