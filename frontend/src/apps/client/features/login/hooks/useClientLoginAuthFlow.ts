import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/generated/auth-api-controller/auth-api-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import { useAuthLoginMutation } from '@/shared/auth/hooks/useAuthLoginMutation';
import { useInitPwdActiveMutation } from '@/shared/auth/hooks/useInitPwdActiveMutation';
import {
  getAuthResponseData,
  hasInitialPasswordRequirementSignal,
  isInitialPasswordChangeRequired,
} from '@/shared/auth/initPassword';
import type { useResultModalFlow } from '@/shared/hooks/useResultModalFlow';
import { validatePasswordPair } from '@/shared/lib/validators/validatePasswordPair';
import type { Step } from '../types';

const SAVED_ID_KEY = 'client_saved_userId';

type UseClientLoginAuthFlowParams = {
  modal: ReturnType<typeof useResultModalFlow>;
  goToStep: (step: Step) => void;
};

export function useClientLoginAuthFlow({ modal, goToStep }: UseClientLoginAuthFlowParams) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState(() => localStorage.getItem(SAVED_ID_KEY) ?? '');
  const [userPassword, setUserPassword] = useState('');
  const [saveId, setSaveId] = useState(() => !!localStorage.getItem(SAVED_ID_KEY));
  const [loginError, setLoginError] = useState('');

  const [loggedInUserId, setLoggedInUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');

  const refetchCurrentUser = async () => {
    const meData = await getCurrentUser();
    queryClient.setQueryData(queryKeys.auth.me, meData);
    return getAuthResponseData(meData);
  };

  const { mutate: loginMutate, isPending: isLoginPending } = useAuthLoginMutation({
    mutation: {
      onSuccess: async (data) => {
        if (data.success) {
          if (saveId) {
            localStorage.setItem(SAVED_ID_KEY, userId);
          } else {
            localStorage.removeItem(SAVED_ID_KEY);
          }

          let responseData = getAuthResponseData(data);

          if (!hasInitialPasswordRequirementSignal(responseData)) {
            try {
              responseData = await refetchCurrentUser();
            } catch {
              setLoginError('로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.');
              return;
            }
          }

          if (!responseData) {
            setLoginError('로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.');
            return;
          }

          if (isInitialPasswordChangeRequired(responseData)) {
            setLoggedInUserId(
              typeof responseData?.userId === 'string' ? responseData.userId : userId,
            );
            setUserPassword('');
            goToStep('change-password');
          } else {
            navigate('/client/main');
          }
        } else {
          setLoginError(data.message ?? '로그인에 실패했습니다.');
        }
      },
      onError: (error) => {
        setLoginError(
          error instanceof Error
            ? error.message
            : '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        );
      },
    },
  });

  const { mutate: changePasswordMutate, isPending: isChangePending } = useInitPwdActiveMutation();

  const handleLoginSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    loginMutate({ data: { userId, userPassword } });
  };

  const handleChangePasswordSuccess = (data: { success?: boolean; message?: string | null }) => {
    if (data.success) {
      modal.showSuccess({
        title: '알림',
        description: '비밀번호가 성공적으로 변경되었습니다.\n새 비밀번호로 다시 로그인해주세요.',
        onConfirm: () => {
          modal.close();
          goToStep('login');
          resetPasswordForm();
        },
      });
      return;
    }

    modal.showError({
      title: '비밀번호 변경 실패',
      description: data.message ?? '비밀번호 변경에 실패했습니다.',
    });
  };

  const handleChangePasswordError = () => {
    modal.showError({
      title: '비밀번호 변경 실패',
      description: '서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.',
    });
  };

  const handleChangePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChangePasswordError('');

    const passwordValidation = validatePasswordPair(newPassword, newPasswordConfirm);
    if (!passwordValidation.ok) {
      setChangePasswordError(passwordValidation.message);
      return;
    }

    changePasswordMutate(
      {
        data: { password: newPassword, chkPassword: newPasswordConfirm },
        params: { userId: loggedInUserId },
      },
      { onSuccess: handleChangePasswordSuccess, onError: handleChangePasswordError },
    );
  };

  const resetPasswordForm = () => {
    setNewPassword('');
    setNewPasswordConfirm('');
    setChangePasswordError('');
  };

  return {
    login: {
      userId,
      userPassword,
      saveId,
      loginError,
      isPending: isLoginPending,
      onUserIdChange: setUserId,
      onUserPasswordChange: setUserPassword,
      onSaveIdChange: setSaveId,
      onClearError: () => setLoginError(''),
      onSubmit: handleLoginSubmit,
      onGoFindPassword: () => goToStep('find-password'),
      onGoSignup: () => goToStep('signup-consent'),
    },
    changePassword: {
      newPassword,
      newPasswordConfirm,
      changePasswordError,
      isPending: isChangePending,
      onNewPasswordChange: setNewPassword,
      onNewPasswordConfirmChange: setNewPasswordConfirm,
      onClearError: () => setChangePasswordError(''),
      onSubmit: handleChangePasswordSubmit,
    },
    resetPasswordForm,
  };
}
