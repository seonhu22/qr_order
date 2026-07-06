import { afterEach, describe, expect, it, vi } from 'vitest';
import { triggerBlobDownload } from './downloadBlob';

describe('triggerBlobDownload', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an object URL, clicks a download anchor, and cleans up', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    triggerBlobDownload(new Blob(['zip-data'], { type: 'application/zip' }), 'files.zip');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    expect(document.querySelector('a[download="files.zip"]')).toBeNull();
  });
});
