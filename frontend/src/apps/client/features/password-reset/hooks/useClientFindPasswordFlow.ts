import { useState, type FormEvent } from 'react';
import type { Step } from '@/apps/client/features/login/types';
import {
  buildChangePwdRequest,
  isChangePwdValidationError,
  useChangePwdMutation,
} from '../api/changePwdApi';
import {
  buildSendPwdChangeCodeRequest,
  isSendPwdChangeCodeValidationError,
  useReSendPwdChangeCodeMutation,
  useSendPwdChangeCodeMutation,
} from '../api/sendPwdChangeCodeApi';
import {
  buildVerifyPwdChangeRequest,
  isVerifyPwdChangeValidationError,
  useVerifyPwdChangeMutation,
} from '../api/verifyPwdChangeApi';
import { getSignupApiErrorMessage } from '../../signup/api/signupApiUtils';
import type { PasswordResetState } from '../types';
import {
  clearPasswordResetState,
  writePasswordResetState,
} from '../utils/passwordResetStorage';

type UseClientFindPasswordFlowParams = {
  initialState: PasswordResetState | null;
  goToStep: (step: Step) => void;
};

export function useClientFindPasswordFlow({
  initialState,
  goToStep,
}: UseClientFindPasswordFlowParams) {
  const [findId, setFindId] = useState(initialState?.userId ?? '');
  const [findEmail, setFindEmail] = useState(initialState?.email ?? '');
  const [verifyCode, setVerifyCode] = useState('');
  const [findError, setFindError] = useState('');
  const [resetPw, setResetPw] = useState('');
  const [resetPwConfirm, setResetPwConfirm] = useState('');

  const { mutate: sendPwdChangeCodeMutate, isPending: isFindSendPending } =
    useSendPwdChangeCodeMutation();
  const { mutate: reSendPwdChangeCodeMutate, isPending: isFindResendPending } =
    useReSendPwdChangeCodeMutation();
  const { mutate: verifyPwdChangeMutate, isPending: isFindVerifyPending } =
    useVerifyPwdChangeMutation();
  const { mutate: changePwdMutate, isPending: isResetPending } = useChangePwdMutation();

  const isFindSendingCode = isFindSendPending || isFindResendPending;

  const handleFindPasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFindError('');
    const payload = buildSendPwdChangeCodeRequest({ userId: findId, email: findEmail });
    if (isSendPwdChangeCodeValidationError(payload)) {
      setFindError(payload.message);
      return;
    }
    sendPwdChangeCodeMutate(
      { data: payload },
      {
        onSuccess: () => {
          setVerifyCode('');
          writePasswordResetState({
            step: 'find-password-verify',
            userId: payload.userId ?? '',
            email: payload.email ?? '',
          });
          goToStep('find-password-verify');
        },
        onError: (error) => {
          setFindError(getSignupApiErrorMessage(error, '인증 코드 발송에 실패했습니다.'));
        },
      },
    );
  };

  const handleResendVerifyCode = () => {
    setFindError('');
    const payload = buildSendPwdChangeCodeRequest({ userId: findId, email: findEmail });
    if (isSendPwdChangeCodeValidationError(payload)) {
      setFindError(payload.message);
      return;
    }
    reSendPwdChangeCodeMutate(
      { data: payload },
      {
        onSuccess: () => {
          writePasswordResetState({
            step: 'find-password-verify',
            userId: payload.userId ?? '',
            email: payload.email ?? '',
          });
        },
        onError: (error) => {
          setFindError(getSignupApiErrorMessage(error, '인증 코드 재발송에 실패했습니다.'));
        },
      },
    );
  };

  const handleVerifyCodeSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFindError('');
    const payload = buildVerifyPwdChangeRequest({ email: findEmail, validCode: verifyCode });
    if (isVerifyPwdChangeValidationError(payload)) {
      setFindError(payload.message);
      return;
    }
    verifyPwdChangeMutate(
      { data: payload },
      {
        onSuccess: () => {
          setResetPw('');
          setResetPwConfirm('');
          writePasswordResetState({
            step: 'find-password-reset',
            userId: findId.trim(),
            email: findEmail.trim(),
          });
          goToStep('find-password-reset');
        },
        onError: (error) => {
          setFindError(getSignupApiErrorMessage(error, '인증 코드가 일치하지 않습니다.'));
        },
      },
    );
  };

  const handleVerifyCodeBack = () => {
    setFindError('');
    writePasswordResetState({
      step: 'find-password',
      userId: findId.trim(),
      email: findEmail.trim(),
    });
    goToStep('find-password');
  };

  const handleResetPasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFindError('');
    const payload = buildChangePwdRequest({
      userId: findId,
      pwd: resetPw,
      pwdConfirm: resetPwConfirm,
    });
    if (isChangePwdValidationError(payload)) {
      setFindError(payload.message);
      return;
    }
    changePwdMutate(
      { data: payload },
      {
        onSuccess: (data) => {
          if (data.success) {
            clearPasswordResetState();
            goToStep('find-password-complete');
            return;
          }
          setFindError(data.message ?? '비밀번호 변경에 실패했습니다.');
        },
        onError: (error) => {
          setFindError(getSignupApiErrorMessage(error, '비밀번호 변경에 실패했습니다.'));
        },
      },
    );
  };

  const reset = () => {
    clearPasswordResetState();
    setFindId('');
    setFindEmail('');
    setVerifyCode('');
    setFindError('');
    setResetPw('');
    setResetPwConfirm('');
  };

  return {
    findPassword: {
      findId,
      findEmail,
      findError,
      isPending: isFindSendPending,
      onFindIdChange: setFindId,
      onFindEmailChange: setFindEmail,
      onClearError: () => setFindError(''),
      onCancel: () => {
        reset();
        goToStep('login');
      },
      onSubmit: handleFindPasswordSubmit,
    },
    findPasswordVerify: {
      verifyCode,
      findError,
      isVerifyPending: isFindVerifyPending,
      isResendPending: isFindResendPending,
      isSendingCode: isFindSendingCode,
      onVerifyCodeChange: setVerifyCode,
      onClearError: () => setFindError(''),
      onResend: handleResendVerifyCode,
      onBack: handleVerifyCodeBack,
      onSubmit: handleVerifyCodeSubmit,
    },
    findPasswordReset: {
      resetPw,
      resetPwConfirm,
      findError,
      isPending: isResetPending,
      onResetPwChange: setResetPw,
      onResetPwConfirmChange: setResetPwConfirm,
      onClearError: () => setFindError(''),
      onCancel: () => {
        reset();
        goToStep('login');
      },
      onSubmit: handleResetPasswordSubmit,
    },
    findPasswordComplete: {
      onGoLogin: () => {
        reset();
        goToStep('login');
      },
    },
    reset,
  };
}
