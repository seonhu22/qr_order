import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { HttpError } from '@/shared/lib/httpClient';
import { connectQr } from '../api/qrConnectApi';
import { connectQrStub, previewQrTableInfo } from '../api/qrConnectStub';
import type { QrEntryStatus, UseQrEntryPageResult } from '../types';

const INVALID_QR_MESSAGE = '유효하지 않은 QR코드입니다.';
const NETWORK_ERROR_MESSAGE = '네트워크 연결을 확인한 뒤 다시 시도해주세요.';

// 운영 흐름에서는 실제 GET /api/qr/{url}로 QR과 테이블을 검증한다.
// 로컬 UI 확인이 필요할 때만 true로 바꾸며, 이 경우 고정 응답과 미리보기 정보를 사용한다.
const QR_CONNECT_MOCK_ENABLED = false;

/**
 * QR 인증 fetch/abort/redirect를 소유한다. QrEntryPage는 이 훅의 결과만 렌더링한다.
 *
 * 4xx(HttpError)는 QR 자체가 유효하지 않은 것으로, 그 외(네트워크 끊김·5xx·파싱 실패 등)는
 * 재시도 가능한 통신 오류로 구분한다 — 이 구분은 이미 동작 중인 /api/qr/{url}의 실제 HTTP 관례를
 * 따르는 것일 뿐, 아직 없는 Consumer 세션 API의 의미를 새로 정하는 것이 아니다.
 */
export function useQrEntryPage(url: string | undefined): UseQrEntryPageResult {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasInvalidUrl = !url;

  const [status, setStatus] = useState<QrEntryStatus>(() =>
    hasInvalidUrl ? 'invalid' : 'checking',
  );
  const [message, setMessage] = useState(() => (hasInvalidUrl ? INVALID_QR_MESSAGE : ''));
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (hasInvalidUrl) return;

    const qrUrl = url ?? '';
    const abortController = new AbortController();

    async function verifyQr() {
      try {
        const response = QR_CONNECT_MOCK_ENABLED
          ? await connectQrStub(qrUrl)
          : await connectQr(qrUrl, abortController.signal);

        // connectQrStub은 setTimeout 기반이라 AbortController에 연결돼 있지 않다 —
        // 언마운트/재실행 이후에도 뒤늦게 resolve될 수 있어 직접 확인해야 한다.
        if (abortController.signal.aborted) return;

        if (response.success) {
          // 이전 테이블에서 만든 Consumer 캐시를 제거한 뒤, 검증된 테이블 정보를 주문 화면에 전달한다.
          // 이를 통해 같은 브라우저에서 다른 QR을 스캔해도 이전 테이블의 메뉴가 재사용되지 않는다.
          queryClient.removeQueries({ queryKey: ['consumer'] });
          navigate('/consumer/order', { replace: true, state: { qrTableInfo: response.data } });
          return;
        }

        setStatus('invalid');
        setMessage(response.message || INVALID_QR_MESSAGE);
      } catch (error) {
        if (abortController.signal.aborted) return;

        if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
          setStatus('invalid');
          setMessage(error.message || INVALID_QR_MESSAGE);
          return;
        }

        setStatus('network-error');
        setMessage(error instanceof Error && error.message ? error.message : NETWORK_ERROR_MESSAGE);
      }
    }

    void verifyQr();

    return () => {
      abortController.abort();
    };
  }, [hasInvalidUrl, navigate, queryClient, url, retryToken]);

  const retry = useCallback(() => {
    setStatus('checking');
    setMessage('');
    setRetryToken((token) => token + 1);
  }, []);

  const previewTableInfo = QR_CONNECT_MOCK_ENABLED && url ? previewQrTableInfo(url) : undefined;

  return { status, message, retry, previewTableInfo };
}
