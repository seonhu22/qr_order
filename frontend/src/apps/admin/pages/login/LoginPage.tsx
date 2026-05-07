import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import '@/shared/styles/login.css';
import { TextInput } from '@/shared/components/input/TextInput';
import { Button } from '@/shared/components/button';
import { FormAlert } from '@/shared/components/form-alert';
import { NoticeModal, SimpleDefaultModal } from '@/shared/components/modal';
import { AdminBrand } from '@/apps/admin/features/brand/components/AdminBrand';
import type { LoginMutationResult } from '@/generated/login-controller/login-controller';
import { useInitPwd } from '@/generated/login-controller/login-controller';
import { useAuthLoginMutation } from '@/shared/auth/hooks/useAuthLoginMutation';
import { useAuth } from '@/shared/auth/AuthContext';
import { queryKeys } from '@/shared/api/queryKeys';

type Step = 'login' | 'changePassword';

function needsPasswordChange(initYn: unknown): boolean {
  return typeof initYn === 'string' && initYn.toLowerCase() === 'y';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

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

  // 이미 인증됐고 init_yn === 'Y'인 상태로 이 페이지에 오면 변경 폼 표시
  useEffect(() => {
    if (isAuthenticated && needsPasswordChange(user?.init_yn)) {
      const uid = typeof user?.userId === 'string' ? user.userId : '';
      setUserId(uid);
      setStep('changePassword');
    }
  }, [isAuthenticated, user]);

  const { mutate: loginMutate, isPending: isLoginPending } = useAuthLoginMutation({
    mutation: {
      onSuccess: (data: LoginMutationResult) => {
        if (data.success) {
          const userData = data?.data as Record<string, unknown> | undefined;
          if (needsPasswordChange(userData?.init_yn)) {
            setUserPassword('');
            setErrorMessage('');
            setUserId(typeof userData?.userId === 'string' ? userData.userId : userId);
            setShowInitAlert(true);
          } else {
            navigate('/admin/main');
          }
        } else {
          setErrorMessage(data.message ?? '로그인에 실패했습니다.');
        }
      },
      onError: (error) => {
        setErrorMessage(
          error instanceof Error ? error.message : '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        );
      },
    },
  });

  const { mutate: initPwdMutate, isPending: isChangePending } = useInitPwd({
    mutation: {
      onSuccess: (data) => {
        if (data.success) {
          setResultModal({
            open: true,
            title: '알림',
            description: '비밀번호가 성공적으로 변경되었습니다.',
            onConfirm: () => {
              const meData = queryClient.getQueryData<Record<string, unknown>>(queryKeys.auth.me);
              if (meData) {
                queryClient.setQueryData(queryKeys.auth.me, {
                  ...meData,
                  data: { ...(meData.data as object ?? {}), init_yn: 'N' },
                });
              }
              navigate('/admin/main');
            },
          });
        } else {
          setResultModal({
            open: true,
            title: '알림',
            description: data.message ?? '비밀번호 변경에 실패했습니다.',
            onConfirm: () => setResultModal((prev) => ({ ...prev, open: false })),
          });
        }
      },
      onError: (error) => {
        setResultModal({
          open: true,
          title: '비밀번호 변경 실패',
          description: error instanceof Error ? error.message : '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          onConfirm: () => setResultModal((prev) => ({ ...prev, open: false })),
        });
      },
    },
  });

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
    initPwdMutate({ data: { password, chkPassword }, params: { userId } });
  };

  return (
    <main className="login-page">
      <span className="login-page__deco login-page__deco--top-right" aria-hidden="true" />
      <span className="login-page__deco login-page__deco--bottom-left" aria-hidden="true" />

      <div className="login-card" role="region" aria-label={step === 'login' ? '로그인' : '비밀번호 변경'}>
        <header className="login-card__header">
          <AdminBrand />
        </header>

        {step === 'login' ? (
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
              <Button type="submit" size="lg" className="login-card__submit" disabled={isLoginPending}>
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
              <Button type="submit" size="lg" className="login-card__submit" loading={isChangePending}>
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
