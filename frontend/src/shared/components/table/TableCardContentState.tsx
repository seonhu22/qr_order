import type { ReactNode } from 'react';
import { FeedbackState } from '@/shared/components/feedback';

type TableCardContentStateProps = {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  loadingTitle: string;
  errorTitle?: string;
  errorDescription?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyClassName?: string;
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
  isEmpty = false,
  loadingTitle,
  errorTitle,
  errorDescription = '다시 한번 시도해주세요.',
  emptyTitle,
  emptyDescription,
  emptyClassName,
  children,
}: TableCardContentStateProps) {
  if (isLoading) {
    return <FeedbackState variant="loading" title={loadingTitle} />;
  }

  if (isError) {
    return <FeedbackState variant="error" title={errorTitle} description={errorDescription} />;
  }

  if (isEmpty) {
    return (
      <FeedbackState
        variant="empty"
        title={emptyTitle}
        description={emptyDescription}
        className={emptyClassName}
      />
    );
  }

  return <>{children}</>;
}
