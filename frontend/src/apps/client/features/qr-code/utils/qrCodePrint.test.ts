import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const toDataURL = vi.fn(async (data: string) => `data:image/png;base64,${btoa(data)}`);

vi.mock('qrcode', () => ({
  default: { toDataURL: (...args: unknown[]) => toDataURL(...(args as [string])) },
}));

import { buildQrTargetUrl, generateQrDataUrl, printQrCodes } from './qrCodePrint';

describe('buildQrTargetUrl', () => {
  it('returns origin + /order/{ulid}', () => {
    expect(buildQrTargetUrl('01HX')).toBe(`${window.location.origin}/order/01HX`);
  });

  it('returns empty string for empty input', () => {
    expect(buildQrTargetUrl('')).toBe('');
  });
});

describe('generateQrDataUrl', () => {
  beforeEach(() => {
    toDataURL.mockClear();
  });

  it('calls QRCode.toDataURL with width 320 and margin 1', async () => {
    await generateQrDataUrl('https://example.com/order/X');
    expect(toDataURL).toHaveBeenCalledWith('https://example.com/order/X', { width: 320, margin: 1 });
  });
});

describe('printQrCodes', () => {
  beforeEach(() => {
    toDataURL.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('skips when all rows have empty url', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    await printQrCodes([{ id: 'a', tableNum: '1', url: '', remark: '' }]);
    expect(toDataURL).not.toHaveBeenCalled();
    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('renders iframe with QR images and triggers print, then cleans up', async () => {
    const focusSpy = vi.fn();
    const printSpy = vi.fn();
    let afterPrintListener: EventListener | null = null;

    vi.spyOn(document.body, 'appendChild').mockImplementation(((node: Node) => {
      if (node instanceof HTMLIFrameElement) {
        Object.defineProperty(node, 'contentWindow', {
          configurable: true,
          value: {
            focus: focusSpy,
            print: () => {
              printSpy();
              afterPrintListener?.(new Event('afterprint'));
            },
            addEventListener: (type: string, listener: EventListener) => {
              if (type === 'afterprint') afterPrintListener = listener;
            },
          },
        });
        queueMicrotask(() => node.onload?.(new Event('load')));
        return node;
      }
      return node;
    }) as typeof document.body.appendChild);

    await printQrCodes([
      { id: 'a', tableNum: '1', url: 'ULID-1', remark: '창가 1번' },
      { id: 'b', tableNum: '2', url: 'ULID-2', remark: '' },
      { id: 'c', tableNum: '', url: '', remark: 'skip' },
    ]);

    expect(toDataURL).toHaveBeenCalledTimes(2);
    expect(toDataURL).toHaveBeenNthCalledWith(
      1,
      `${window.location.origin}/order/ULID-1`,
      expect.any(Object),
    );
    expect(toDataURL).toHaveBeenNthCalledWith(
      2,
      `${window.location.origin}/order/ULID-2`,
      expect.any(Object),
    );
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('escapes table number and remark in print html', async () => {
    let capturedSrcdoc = '';
    vi.spyOn(document.body, 'appendChild').mockImplementation(((node: Node) => {
      if (node instanceof HTMLIFrameElement) {
        Object.defineProperty(node, 'contentWindow', {
          configurable: true,
          value: {
            focus: vi.fn(),
            print: () => {
              capturedSrcdoc = node.srcdoc;
              node.dispatchEvent(new Event('afterprint'));
            },
            addEventListener: (type: string, listener: EventListener) => {
              if (type === 'afterprint') {
                queueMicrotask(() => listener(new Event('afterprint')));
              }
            },
          },
        });
        queueMicrotask(() => node.onload?.(new Event('load')));
        return node;
      }
      return node;
    }) as typeof document.body.appendChild);

    await printQrCodes([
      { id: 'a', tableNum: '<1>', url: 'ULID-1', remark: '"홀" & 1' },
    ]);

    expect(capturedSrcdoc).toContain('&lt;1&gt;');
    expect(capturedSrcdoc).toContain('&quot;홀&quot; &amp; 1');
  });
});
