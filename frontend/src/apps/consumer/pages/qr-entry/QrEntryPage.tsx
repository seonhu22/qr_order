import { useParams } from 'react-router-dom';
import { ConsumerStatusScreen } from '@/apps/consumer/features/status-screen/components/ConsumerStatusScreen';
import { QrLoadingScreen } from '../../features/qr/components/QrLoadingScreen';
import { useQrEntryPage } from '../../features/qr/hooks/useQrEntryPage';
import './QrEntryPage.css';

export function QrEntryPage() {
  const { url } = useParams<{ url: string }>();
  const { status, message, retry, previewTableInfo } = useQrEntryPage(url);

  if (status === 'network-error') {
    return (
      <main className="qr-entry-page" aria-label="QR 코드 통신 오류">
        <ConsumerStatusScreen
          iconId="ci-alert-triangle"
          tone="danger"
          title="일시적인 통신 오류가 발생했습니다."
          description={message}
          action={{ label: '다시 시도', onClick: retry }}
        />
      </main>
    );
  }

  if (status === 'invalid') {
    return (
      <main className="qr-entry-page" aria-label="QR 코드 인증 실패">
        <ConsumerStatusScreen
          iconId="ci-qr-broken"
          title={message || '유효하지 않은 QR코드입니다.'}
          description={'QR코드를 확인하고 다시 시도해 주세요.\n테이블 위 QR코드를 다시 스캔해 주세요.'}
        />
      </main>
    );
  }

  return (
    <main className="qr-entry-page" aria-label="QR 코드 인증 중">
      <QrLoadingScreen tableNum={previewTableInfo?.tableNum} />
    </main>
  );
}
