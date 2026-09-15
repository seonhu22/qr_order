import QRCode from 'qrcode';

export type QrPrintRow = {
  id: string;
  tableNum: string;
  url: string;
  remark: string;
};

const QR_OPTIONS = { width: 320, margin: 1 } as const;
const QR_ENTRY_PATH_PREFIX = '/qr/';
const PRINT_CLEANUP_FALLBACK_MS = 60_000;

/** 백엔드 qr_code.url은 전체 URL이 아니라 QR 인증용 식별자다. */
export function buildQrTargetUrl(urlField: string) {
  if (!urlField) return '';
  // 실제 소비자 주문 페이지와 맞는지도 QA 전에 확정해야 한다.
  return `${window.location.origin}${QR_ENTRY_PATH_PREFIX}${encodeURIComponent(urlField)}`;
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
    let cleanupTimerId: number | undefined;
    let settled = false;
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    const cleanup = () => {
      if (cleanupTimerId !== undefined) {
        window.clearTimeout(cleanupTimerId);
      }
      iframe.parentNode?.removeChild(iframe);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    iframe.onload = async () => {
      const win = iframe.contentWindow;
      if (!win) {
        fail(new Error('iframe contentWindow unavailable'));
        return;
      }
      win.addEventListener('afterprint', finish, { once: true });
      try {
        await waitForImagesToRender(iframe.contentDocument);
        cleanupTimerId = window.setTimeout(finish, PRINT_CLEANUP_FALLBACK_MS);
        win.focus();
        win.print();
      } catch (error) {
        fail(error);
      }
    };

    iframe.onerror = () => {
      fail(new Error('iframe load failed'));
    };

    document.body.appendChild(iframe);
    iframe.srcdoc = html;
  });
}

async function waitForImagesToRender(doc: Document | null) {
  if (!doc) {
    throw new Error('iframe document unavailable');
  }

  const images = Array.from(doc.images);
  await Promise.all(
    images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error('QR image load failed'));
        });
      }

      if ('decode' in image) {
        await image.decode();
      }
    }),
  );

  await new Promise<void>((resolve) => {
    winRequestAnimationFrame(doc.defaultView, () => resolve());
  });
}

function winRequestAnimationFrame(win: Window | null, callback: FrameRequestCallback) {
  if (win?.requestAnimationFrame) {
    win.requestAnimationFrame(callback);
    return;
  }

  window.requestAnimationFrame(callback);
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
