/**
 * @fileoverview 401 인증 만료 이벤트를 로그인 redirect UX로 연결한다.
 *
 * 세션 만료 안내 모달을 보여준 뒤, 확인 시 인증 상태를 비우고 로그인 화면으로 이동한다.
 */
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { NoticeModal } from '@/shared/components/modal';
import { useAuth } from './AuthContext';
import { isLoginPath, resolveLoginPath, subscribeUnauthorized } from './authRedirect';

const SESSION_EXPIRED_TITLE = '로그인 인증이 만료되었습니다.';
const SESSION_EXPIRED_DESCRIPTION = '확인을 누르면 로그인 화면으로 이동합니다.';

export function AuthRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);

  const redirectToLogin = useCallback(() => {
    const loginPath = resolveLoginPath(location.pathname);


    setIsExpiredModalOpen(false);
    navigate(loginPath, { replace: true });
  }, [location.pathname, navigate]);

  useEffect(() => {
    return subscribeUnauthorized(() => {
      signOut();
      queryClient.setQueryData(queryKeys.auth.me, {
        success: false,
        data: null,
      });

      if (isLoginPath(location.pathname)) {
        return;
      }

      setIsExpiredModalOpen(true);
    });
  }, [location.pathname, queryClient, signOut]);

  return (
    <NoticeModal
      open={isExpiredModalOpen}
      title={SESSION_EXPIRED_TITLE}
      description={SESSION_EXPIRED_DESCRIPTION}
      tone="info"
      primaryAction={{ label: '확인', onClick: redirectToLogin }}
      onClose={redirectToLogin}
    />
  );
}
