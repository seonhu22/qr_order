/**
 * 404 Not Found — 존재하지 않는 URL이거나 삭제된 라우트에 접근한 경우.
 * 각 앱 라우트의 `path: '*'` catch-all에 연결해 앱 내부 404를 처리한다.
 */
import { ErrorPageTemplate } from '@/shared/components/error';
import type { ErrorPageLayout } from '@/shared/components/error';

type NotFoundPageProps = {
  /** 버튼 클릭 시 이동할 앱별 메인 경로 (예: "/admin/main") */
  homePath: string;
  /** 앱별 문구가 필요할 때 기본 제목을 덮어쓴다. */
  title?: string;
  /** 앱별 안내가 필요할 때 기본 설명을 덮어쓴다. */
  description?: string;
  /** 앱별 복귀 버튼 라벨. */
  homeLabel?: string;
  /** 에러 페이지가 놓일 레이아웃 범위. */
  layout?: ErrorPageLayout;
};

export function NotFoundPage({
  homePath,
  title = '페이지를 찾을 수 없습니다.',
  description = '주소가 변경되었거나 삭제된 페이지입니다.',
  homeLabel = '메인으로 이동',
  layout = 'contained',
}: NotFoundPageProps) {
  return (
    <ErrorPageTemplate
      statusCode="404"
      title={title}
      description={description}
      imageVariant="not-found"
      layout={layout}
      primaryAction={{ label: homeLabel, to: homePath }}
    />
  );
}
