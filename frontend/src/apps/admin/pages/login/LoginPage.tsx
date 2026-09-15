import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import '@/shared/styles/login.css';
import { TextInput } from '@/shared/components/input/TextInput';
import { Button } from '@/shared/components/button';
import { FormAlert } from '@/shared/components/form-alert';
import { NoticeModal, SimpleDefaultModal } from '@/shared/components/modal';
import { AdminBrand } from '@/apps/admin/features/brand/components/AdminBrand';
import type { LoginMutationResult } from '@/generated/login-controller/login-controller';
import { getCurrentUser } from '@/generated/auth-api-controller/auth-api-controller';
import { useAuthLoginMutation } from '@/shared/auth/hooks/useAuthLoginMutation';
import { useAuthLogoutMutation } from '@/shared/auth/hooks/useAuthLogoutMutation';
import { useInitPwdActiveMutation } from '@/shared/auth/hooks/useInitPwdActiveMutation';
import { useAuth } from '@/shared/auth/AuthContext';
import {
  getAuthResponseData,
  hasInitialPasswordRequirementSignal,
  isInitialPasswordChangeRequired,
} from '@/shared/auth/initPassword';
import { queryKeys } from '@/shared/api/queryKeys';
import { HttpError } from '@/shared/lib/httpClient';

type Step = 'login' | 'changePassword' | 'locked';

function getPasswordFailCount(payload: unknown): number | undefined {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    return undefined;
  }

  const data = (payload as { data?: unknown }).data;

  if (typeof data === 'number') {
    return data;
  }

  if (typeof data === 'string') {
    const failCount = Number(data);

    return Number.isFinite(failCount) ? failCount : undefined;
  }

  if (!data || typeof data !== 'object' || !('password_fail_cnt' in data)) {
    if (data && typeof data === 'object' && 'passwordFailCnt' in data) {
      const failCount = (data as { passwordFailCnt?: unknown }).passwordFailCnt;

      if (typeof failCount === 'number') {
        return failCount;
      }

      if (typeof failCount === 'string') {
        const parsedFailCount = Number(failCount);

        return Number.isFinite(parsedFailCount) ? parsedFailCount : undefined;
      }
    }

    return undefined;
  }

  const failCount = (data as { password_fail_cnt?: unknown }).password_fail_cnt;

  if (typeof failCount === 'number') {
    return failCount;
  }

  if (typeof failCount === 'string') {
    const parsedFailCount = Number(failCount);

    return Number.isFinite(parsedFailCount) ? parsedFailCount : undefined;
  }

  return undefined;
}

function isLockedLoginMessage(message: unknown): boolean {
  return (
    typeof message === 'string' && message.includes('비밀번호 5회') && message.includes('사용 중지')
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const authenticatedUserId = typeof user?.userId === 'string' ? user.userId : '';
  const isInitialPasswordUser = isAuthenticated && isInitialPasswordChangeRequired(user);

  const [step, setStep] = useState<Step>('login');
  const [showInitAlert, setShowInitAlert] = useState(false);
  const [resultModal, setResultModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });
  const [userId, setUserId] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [password, setPassword] = useState('');
  const [chkPassword, setChkPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const currentStep: Step = isInitialPasswordUser ? 'changePassword' : step;

  const showLockedStep = () => {
    setUserPassword('');
    setErrorMessage('');
    setStep('locked');
  };

  const refetchCurrentUser = async () => {
    const meData = await getCurrentUser();
    queryClient.setQueryData(queryKeys.auth.me, meData);
    return getAuthResponseData(meData);
  };

  const { mutate: loginMutate, isPending: isLoginPending } = useAuthLoginMutation({
    mutation: {
      onSuccess: async (data: LoginMutationResult) => {
        if (data.success) {
          let userData = getAuthResponseData(data);

          if (!hasInitialPasswordRequirementSignal(userData)) {
            try {
              userData = await refetchCurrentUser();
            } catch {
              setErrorMessage('로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.');
              return;
            }
          }

          if (isInitialPasswordChangeRequired(userData)) {
            setUserPassword('');
            setErrorMessage('');
            setUserId(typeof userData?.userId === 'string' ? userData.userId : userId);
            setShowInitAlert(true);
          } else {
            navigate('/admin/main');
          }
        } else {
          const failCount = getPasswordFailCount(data);

          if (
            (typeof failCount === 'number' && failCount >= 5) ||
            isLockedLoginMessage(data.message)
          ) {
            showLockedStep();
          } else {
            setErrorMessage(data.message ?? '로그인에 실패했습니다.');
          }
        }
      },
      onError: (error) => {
        if (error instanceof HttpError) {
          const failCount = getPasswordFailCount(error.payload);

          if (
            (typeof failCount === 'number' && failCount >= 5) ||
            isLockedLoginMessage(error.message)
          ) {
            showLockedStep();
            return;
          }

          setErrorMessage(error.message);
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        );
      },
    },
  });

  const { mutate: initPwdActiveMutate, isPending: isChangePending } = useInitPwdActiveMutation();
  const { mutate: logoutMutate } = useAuthLogoutMutation({
    mutation: {
      onSuccess: () => navigate('/admin/login'),
      onError: () => navigate('/admin/login'),
    },
  });

  // 로그인 폼으로 돌아가는 로컬 헬퍼
  // 초기 비밀번호로 로그인한 후 비밀번호 변경 성공 시 로그인 폼으로 돌아가서 초기화하는 역할입니다.
  const closeResultModal = () => {
    setResultModal((prev) => ({ ...prev, open: false }));
  };

  const resetLoginFormAfterPasswordChange = () => {
    closeResultModal();
    setStep('login');
    setUserPassword('');
    setPassword('');
    setChkPassword('');
    setErrorMessage('');
    logoutMutate();
  };

  const handleInitPwdActiveSuccess = (data: { success?: boolean; message?: string | null }) => {
    if (data.success) {
      setResultModal({
        open: true,
        title: '알림',
        description: '비밀번호가 성공적으로 변경되었습니다.\n새 비밀번호로 다시 로그인해주세요.',
        onConfirm: resetLoginFormAfterPasswordChange,
      });
    } else {
      setResultModal({
        open: true,
        title: '알림',
        description: data.message ?? '비밀번호 변경에 실패했습니다.',
        onConfirm: closeResultModal,
      });
    }
  };

  const handleInitPwdActiveError = (error: unknown) => {
    setResultModal({
      open: true,
      title: '비밀번호 변경 실패',
      description:
        error instanceof Error
          ? error.message
          : '서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.',
      onConfirm: closeResultModal,
    });
  };

  const handleLoginSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setErrorMessage('');
    loginMutate({ data: { userId, userPassword } });
  };

  const handleChangePasswordSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setErrorMessage('');
    if (!password || !chkPassword) {
      setErrorMessage('비밀번호를 입력해주세요.');
      return;
    }
    if (password !== chkPassword) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    initPwdActiveMutate(
      { data: { password, chkPassword }, params: { userId: userId || authenticatedUserId } },
      {
        onSuccess: handleInitPwdActiveSuccess,
        onError: handleInitPwdActiveError,
      },
    );
  };

  return (
    <main className="login-page">
      <span className="login-page__deco login-page__deco--top-right" aria-hidden="true" />
      <span className="login-page__deco login-page__deco--bottom-left" aria-hidden="true" />

      <div
        className="login-card"
        role="region"
        aria-label={
          currentStep === 'login'
            ? '로그인'
            : currentStep === 'changePassword'
              ? '비밀번호 변경'
              : '계정 잠금'
        }
      >
        <header className="login-card__header">
          <AdminBrand />
        </header>

        {currentStep === 'locked' ? (
          <div className="login-card__body login-card__locked">
            <div className="login-card__title">
              <h1 className="login-card__heading">로그인 제한</h1>
            </div>
            <div className="login-card__locked-messages">
              <p className="login-card__subheading">비밀번호를 5회 이상 잘못 입력하셨습니다.</p>
              <p className="login-card__locked-desc">
                비밀번호는 반드시 초기화해야 합니다.{'\n'}관리자에게 문의해 주세요.
              </p>
            </div>
            <a href="mailto:admin@qrorder.co.kr" className="login-card__locked-email">
              admin@qrorder.co.kr
            </a>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="login-card__submit"
              onClick={() => setStep('login')}
            >
              로그인으로 돌아가기
            </Button>
          </div>
        ) : currentStep === 'login' ? (
          <form className="login-card__body" onSubmit={handleLoginSubmit}>
            <div className="login-card__title">
              <h1 className="login-card__heading">로그인</h1>
              <p className="login-card__subheading">계정 정보를 입력하여 로그인하세요.</p>
            </div>

            {errorMessage && (
              <FormAlert
                type="error"
                description={errorMessage}
                dismissible
                onDismiss={() => setErrorMessage('')}
              />
            )}

            <div className="login-card__fields">
              <TextInput
                label="아이디"
                placeholder="아이디를 입력하세요"
                size="lg"
                id="login-id"
                autoComplete="username"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                isError={!!errorMessage}
              />
              <TextInput
                label="비밀번호"
                placeholder="비밀번호를 입력하세요"
                type="password"
                showPasswordToggle
                size="lg"
                id="login-pw"
                autoComplete="current-password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                isError={!!errorMessage}
              />
              <Button
                type="submit"
                size="lg"
                className="login-card__submit"
                disabled={isLoginPending}
              >
                {isLoginPending ? '로그인 중...' : '로그인'}
              </Button>
            </div>
          </form>
        ) : (
          <form className="login-card__body" onSubmit={handleChangePasswordSubmit}>
            <div className="login-card__title">
              <h1 className="login-card__heading">비밀번호 변경</h1>
              <p className="login-card__subheading">초기 비밀번호를 변경해주세요.</p>
            </div>

            {errorMessage && (
              <FormAlert
                type="error"
                description={errorMessage}
                dismissible
                onDismiss={() => setErrorMessage('')}
              />
            )}

            <div className="login-card__fields">
              <TextInput
                label="새 비밀번호"
                placeholder="새 비밀번호를 입력하세요"
                type="password"
                showPasswordToggle
                size="lg"
                id="change-pw"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isError={!!errorMessage}
              />
              <TextInput
                label="비밀번호 확인"
                placeholder="비밀번호를 다시 입력하세요"
                type="password"
                showPasswordToggle
                size="lg"
                id="change-pw-confirm"
                autoComplete="new-password"
                value={chkPassword}
                onChange={(e) => setChkPassword(e.target.value)}
                isError={!!errorMessage}
              />
              <Button
                type="submit"
                size="lg"
                className="login-card__submit"
                loading={isChangePending}
              >
                {isChangePending ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </div>
          </form>
        )}
      </div>

      <p className="login-copyright">© 2026 QRorder. All rights reserved.</p>

      <SimpleDefaultModal
        open={resultModal.open}
        title={resultModal.title}
        description={resultModal.description}
        primaryAction={{ label: '확인', onClick: resultModal.onConfirm }}
        onClose={resultModal.onConfirm}
      />

      <NoticeModal
        open={showInitAlert}
        tone="info"
        title="비밀번호 초기화"
        description="비밀번호가 초기화되었습니다. 변경해주세요."
        primaryAction={{
          label: '확인',
          onClick: () => {
            setShowInitAlert(false);
            setStep('changePassword');
          },
        }}
        onClose={() => setShowInitAlert(false)}
      />
    </main>
  );
}
