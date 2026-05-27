/**
 * 403 Forbidden — 로그인은 했지만 메뉴·기능에 접근 권한이 없는 경우.
 * 401(미로그인/만료)과 구분하며, 401은 이 페이지가 아닌 로그인 redirect로 처리한다.
 */
import { ErrorPageTemplate } from '@/shared/components/error';
import type { ErrorPageLayout } from '@/shared/components/error';

type ForbiddenPageProps = {
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

export function ForbiddenPage({
  homePath,
  title = '접근이 거부되었습니다.',
  description = '이 페이지에 접근할 권한이 없습니다.',
  homeLabel = '메인으로 이동',
  layout = 'contained',
}: ForbiddenPageProps) {
  return (
    <ErrorPageTemplate
      statusCode="403"
      title={title}
      description={description}
      imageVariant="forbidden"
      layout={layout}
      primaryAction={{ label: homeLabel, to: homePath }}
    />
  );
}
