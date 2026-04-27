/**
 * @fileoverview ErrorPageTemplate 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/error-page)
 * - contained / fullscreen 레이아웃과 403/404/500 상태를 확인한다.
 */

import { useState } from 'react';
import { Button } from '@/shared/components/button';
import { notifyUnauthorized } from '@/shared/auth/authRedirect';
import { ForbiddenPage, NotFoundPage, ServerErrorPage } from '@/shared/pages/error';
import type { ErrorPageLayout } from '@/shared/components/error';

type ErrorStatus = '403' | '404' | '500';

const STATUS_OPTIONS: Array<{ status: ErrorStatus; label: string }> = [
  { status: '403', label: '403 Forbidden' },
  { status: '404', label: '404 Not Found' },
  { status: '500', label: '500 Server Error' },
];

function PreviewPanel({
  status,
  layout,
}: {
  status: ErrorStatus;
  layout: ErrorPageLayout;
}) {
  const props = {
    homePath: '/dev/error-page',
    homeLabel: '가이드로 이동',
    layout,
  };

  if (status === '403') {
    return <ForbiddenPage {...props} />;
  }

  if (status === '500') {
    return (
      <ServerErrorPage
        {...props}
        retryAction={() => window.alert('재시도 액션이 호출되었습니다.')}
      />
    );
  }

  return <NotFoundPage {...props} />;
}

export default function ErrorPageGuide() {
  const [status, setStatus] = useState<ErrorStatus>('404');

  return (
    <div className="error-page-guide">
      <div className="error-page-guide__header">
        <h2 className="error-page-guide__title">에러 페이지</h2>
        <p className="error-page-guide__description">
          앱 layout 내부에서 콘텐츠 영역만 교체되는 contained 에러 페이지와 전체 화면 fallback을 확인한다.
        </p>
      </div>

      <section className="error-page-guide__section">
        <div className="error-page-guide__toolbar" aria-label="에러 상태 선택">
          {STATUS_OPTIONS.map((option) => (
            <Button
              key={option.status}
              type="button"
              variant="toggle"
              size="md"
              selected={status === option.status}
              onClick={() => setStatus(option.status)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="error-page-guide__auth-test">
          <div>
            <span>401 Auth Redirect</span>
            <p>로그인 만료 안내 모달을 띄우고, 확인 시 로그인 화면으로 이동하는 흐름을 확인한다.</p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => notifyUnauthorized({ message: '401 Unauthorized' })}
          >
            401 만료 모달 테스트
          </Button>
        </div>

        <div className="error-page-guide__caption">
          <span>contained</span>
          <p>DevLayout의 오른쪽 콘텐츠 영역만 에러 페이지로 교체된다.</p>
        </div>
        <div className="error-page-guide__contained-preview">
          <PreviewPanel status={status} layout="contained" />
        </div>
      </section>

      <section className="error-page-guide__section">
        <div className="error-page-guide__caption">
          <span>fullscreen</span>
          <p>전역 ErrorBoundary fallback처럼 viewport 전체를 채우는 형태다.</p>
        </div>
        <div className="error-page-guide__fullscreen-preview">
          <PreviewPanel status={status} layout="fullscreen" />
        </div>
      </section>
    </div>
  );
}
