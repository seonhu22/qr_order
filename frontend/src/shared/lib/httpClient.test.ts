import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { httpClient } from './httpClient';

describe('httpClient', () => {
  it('sends FormData without JSON stringifying it', async () => {
    let receivedMenuName: FormDataEntryValue | null = null;
    let receivedContentType: string | null = null;

    server.use(
      http.post('/api/form-data-test', async ({ request }) => {
        receivedContentType = request.headers.get('content-type');
        const formData = await request.formData();
        receivedMenuName = formData.get('newItems[0].menuName');
        return HttpResponse.json({ success: true });
      }),
    );

    const formData = new FormData();
    formData.append('newItems[0].menuName', '치즈버거');

    await httpClient({
      url: '/api/form-data-test',
      method: 'POST',
      data: formData,
    });

    expect(receivedContentType).toContain('multipart/form-data');
    expect(receivedMenuName).toBe('치즈버거');
  });

  it('returns Blob without parsing it as JSON when responseType is blob', async () => {
    server.use(
      http.get('/api/blob-test', () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('zip-data').buffer, {
          headers: {
            'content-type': 'application/zip',
          },
        }),
      ),
    );

    const blob = await httpClient<Blob>({
      url: '/api/blob-test',
      method: 'GET',
      responseType: 'blob',
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(await blob.text()).toBe('zip-data');
  });
});
