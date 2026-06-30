import QRCode from 'qrcode';

export type QrPrintRow = {
  id: string;
  tableNum: string;
  url: string;
  remark: string;
};

const QR_OPTIONS = { width: 320, margin: 1 } as const;
const ORDER_PATH_PREFIX = '/order/';

export function buildQrTargetUrl(urlField: string) {
  if (!urlField) return '';
  return `${window.location.origin}${ORDER_PATH_PREFIX}${urlField}`;
}

export async function generateQrDataUrl(targetUrl: string) {
  return QRCode.toDataURL(targetUrl, QR_OPTIONS);
}

export async function printQrCodes(rows: QrPrintRow[]): Promise<void> {
  const targets = rows.filter((row) => row.url);
  if (targets.length === 0) return;

  const items = await Promise.all(
    targets.map(async (row) => ({
      tableNum: row.tableNum,
      remark: row.remark,
      dataUrl: await generateQrDataUrl(buildQrTargetUrl(row.url)),
    })),
  );

  await renderIframeAndPrint(buildPrintHtml(items));
}

function renderIframeAndPrint(html: string) {
  return new Promise<void>((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    const cleanup = () => {
      iframe.parentNode?.removeChild(iframe);
    };

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        reject(new Error('iframe contentWindow unavailable'));
        return;
      }
      win.addEventListener(
        'afterprint',
        () => {
          cleanup();
          resolve();
        },
        { once: true },
      );
      try {
        win.focus();
        win.print();
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    iframe.onerror = () => {
      cleanup();
      reject(new Error('iframe load failed'));
    };

    document.body.appendChild(iframe);
    iframe.srcdoc = html;
  });
}

function buildPrintHtml(items: Array<{ tableNum: string; remark: string; dataUrl: string }>) {
  const labels = items
    .map(
      (item) => `
    <section class="qr-label">
      <div class="qr-label__num">${escapeHtml(item.tableNum)}번</div>
      <img class="qr-label__img" src="${item.dataUrl}" alt="QR 코드" />
      ${item.remark ? `<div class="qr-label__remark">${escapeHtml(item.remark)}</div>` : ''}
    </section>`,
    )
    .join('');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>QR 코드 출력</title>
<style>
  @page { size: A4; margin: 16mm; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif; color: #111; }
  .qr-label { page-break-inside: avoid; display: flex; flex-direction: column; align-items: center; gap: 6mm; padding: 12mm 0; }
  .qr-label + .qr-label { border-top: 1px dashed #ccc; }
  .qr-label__num { font-size: 32pt; font-weight: 700; }
  .qr-label__img { width: 60mm; height: 60mm; }
  .qr-label__remark { font-size: 12pt; color: #444; }
</style>
</head>
<body>${labels}</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
