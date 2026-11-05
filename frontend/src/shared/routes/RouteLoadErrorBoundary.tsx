import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ServerErrorPage } from '@/shared/pages/error';

type RouteLoadErrorBoundaryProps = {
  children: ReactNode;
  onReload?: () => void;
};

type RouteLoadErrorBoundaryState = {
  hasError: boolean;
};

/** 배포 교체나 네트워크 오류로 route 청크 로드가 실패했을 때 빈 화면 대신 복구 UI를 제공한다. */
export class RouteLoadErrorBoundary extends Component<
  RouteLoadErrorBoundaryProps,
  RouteLoadErrorBoundaryState
> {
  state: RouteLoadErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteLoadErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route rendering failed', error, errorInfo);
  }

  private readonly reload = () => {
    if (this.props.onReload) {
      this.props.onReload();
      return;
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ServerErrorPage
          homePath="/"
          title="화면을 불러오지 못했습니다."
          description="네트워크 상태를 확인한 후 새로고침해주세요."
          retryLabel="새로고침"
          retryAction={this.reload}
          layout="fullscreen"
        />
      );
    }

    return this.props.children;
  }
}
