import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { connectQr } from '../../features/qr/api/qrConnectApi';

const INVALID_QR_MESSAGE = '유효하지 않은 QR코드입니다.';

export function QrEntryPage() {
  const { url } = useParams<{ url: string }>();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const hasInvalidUrl = !url;

  useEffect(() => {
    if (hasInvalidUrl) return;

    const qrUrl = url ?? '';
    const abortController = new AbortController();

    async function verifyQr() {
      try {
        const response = await connectQr(qrUrl, abortController.signal);

        if (response.success) {
          navigate('/consumer/order', { replace: true });
          return;
        }

        setErrorMessage(response.message || INVALID_QR_MESSAGE);
      } catch (error) {
        if (abortController.signal.aborted) return;

        setErrorMessage(error instanceof Error && error.message ? error.message : INVALID_QR_MESSAGE);
      }
    }

    void verifyQr();

    return () => {
      abortController.abort();
    };
  }, [hasInvalidUrl, navigate, url]);

  if (hasInvalidUrl || errorMessage) {
    return (
      <main aria-label="QR 코드 인증 실패" style={{ padding: 24 }}>
        <h1>{INVALID_QR_MESSAGE}</h1>
        <p>{errorMessage || INVALID_QR_MESSAGE}</p>
      </main>
    );
  }

  return (
    <main aria-label="QR 코드 인증 중" style={{ padding: 24 }}>
      <p>QR 정보를 확인하고 있습니다.</p>
    </main>
  );
}
