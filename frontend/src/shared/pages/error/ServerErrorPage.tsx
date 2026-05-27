/**
 * 500 Server Error — 런타임 에러 또는 복구 불가능한 시스템 오류.
 * retryAction이 있으면 "다시 시도" 버튼을 우선 표시하고, 없으면 메인 이동만 제공한다.
 * React ErrorBoundary의 fallback 또는 전역 에러 핸들러에서 렌더링한다.
 */
import { ErrorPageTemplate } from '@/shared/components/error';
import type { ErrorPageLayout } from '@/shared/components/error';

type ServerErrorPageProps = {
  /** 버튼 클릭 시 이동할 앱별 메인 경로 (예: "/admin/main") */
  homePath: string;
  /** 재시도 콜백. ErrorBoundary의 reset 함수 등을 전달한다. */
  retryAction?: () => void;
  /** 앱별 문구가 필요할 때 기본 제목을 덮어쓴다. */
  title?: string;
  /** 앱별 안내가 필요할 때 기본 설명을 덮어쓴다. */
  description?: string;
  /** 앱별 복귀 버튼 라벨. */
  homeLabel?: string;
  /** 앱별 재시도 버튼 라벨. */
  retryLabel?: string;
  /** 에러 페이지가 놓일 레이아웃 범위. */
  layout?: ErrorPageLayout;
};

export function ServerErrorPage({
  homePath,
  retryAction,
  title = '서버 오류가 발생했습니다.',
  description = '잠시 후 다시 시도해주세요.',
  homeLabel = '메인으로 이동',
  retryLabel = '다시 시도',
  layout = 'contained',
}: ServerErrorPageProps) {
  return (
    <ErrorPageTemplate
      statusCode="500"
      title={title}
      description={description}
      imageVariant="server-error"
      layout={layout}
      primaryAction={
        retryAction
          ? { label: retryLabel, onClick: retryAction }
          : { label: homeLabel, to: homePath }
      }
      secondaryAction={
        retryAction
          ? { label: homeLabel, to: homePath }
          : undefined
      }
    />
  );
}
