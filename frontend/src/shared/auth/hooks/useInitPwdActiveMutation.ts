import { useMutation } from '@tanstack/react-query';
import type { CommonResponse, InitPwdParams, InitPwdRequest } from '@/generated/types';
import { httpClient } from '@/shared/lib/httpClient';

function initPwdActive(initPwdRequest: InitPwdRequest, params: InitPwdParams) {
  return httpClient<CommonResponse>({
    url: '/api/auth/init-pwd-active',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: initPwdRequest,
    params,
  });
}

export function useInitPwdActiveMutation() {
  return useMutation({
    mutationFn: ({ data, params }: { data: InitPwdRequest; params: InitPwdParams }) =>
      initPwdActive(data, params),
  });
}
