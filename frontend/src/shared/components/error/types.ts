/**
 * 에러 페이지 버튼 액션.
 * `to`와 `onClick` 중 하나를 사용한다.
 * - `to`: react-router-dom Link 이동 (내부 경로)
 * - `onClick`: 재시도 등 커스텀 콜백
 */
export type ErrorPageAction = {
  label: string;
  /** 내부 경로 이동. react-router-dom Link로 렌더된다. */
  to?: string;
  /** 재시도·닫기 등 커스텀 동작. `to`가 없을 때만 사용한다. */
  onClick?: () => void;
};

/**
 * 에러 화면 이미지 분기 키.
 * 추후 실제 에셋 추가 시 CSS `.error-page__image--{variant}`에 background-image를 지정한다.
 */
export type ErrorPageImageVariant = 'forbidden' | 'not-found' | 'server-error';

/**
 * 에러 페이지가 차지할 레이아웃 범위.
 * - `contained`: AdminLayout/ClientLayout 같은 앱 layout의 콘텐츠 영역 안에서 사용
 * - `fullscreen`: App/ErrorBoundary 같은 전역 fallback에서 전체 viewport를 채울 때 사용
 */
export type ErrorPageLayout = 'contained' | 'fullscreen';

/** ErrorPageTemplate에 전달하는 props. */
export type ErrorPageTemplateProps = {
  /** 화면에 표시할 HTTP 상태 코드 문자열 (예: "403", "404", "500") */
  statusCode: string;
  /** 주 제목 */
  title: string;
  /** 보조 설명. 생략 가능 */
  description?: string;
  /** 이미지 영역 분기 키 */
  imageVariant: ErrorPageImageVariant;
  /** 화면 배치 범위. 기본값은 layout 내부에서도 넘치지 않는 `contained`. */
  layout?: ErrorPageLayout;
  /** 주요 버튼 — 메인 이동 또는 재시도 */
  primaryAction: ErrorPageAction;
  /** 보조 버튼 — 재시도가 primaryAction일 때 메인 이동용으로 사용 */
  secondaryAction?: ErrorPageAction;
};
