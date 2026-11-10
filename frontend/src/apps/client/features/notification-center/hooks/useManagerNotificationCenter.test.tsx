import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { useManagerNotificationCenter } from './useManagerNotificationCenter';
import { notificationReadId, notificationStorageKey, saveNotificationIds } from '../utils/notificationReadStorage';

describe('관리자 실제 알림과 로컬 읽음', () => {
  beforeEach(() => localStorage.clear());
  function setup(enabled = true) {
    let calls = 0;
    server.use(
      http.get('*/api/client/board/notice/search', () => {
        calls += 1;
        return HttpResponse.json([{ sysId: 'same', noticeTitle: '실제 공지', openDate: '2026-11-10' }]);
      }),
      http.get('*/api/client/board/qna/search', () => HttpResponse.json([
        { sysId: 'same', answerYn: 'Y', qnaTitle: '실제 답변', answerDatetime: '2026-11-10T12:00:00' },
        { sysId: 'pending', answerYn: 'N' },
      ])),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    return { wrapper, calls: () => calls, props: { enabled, userId: 'u1', sysPlantCd: 'p1' } };
  }

  it('실제 조회와 종류별 읽음 분리, 새로 열기 복원을 수행한다', async () => {
    const env = setup();
    const first = renderHook((props) => useManagerNotificationCenter(props), { wrapper: env.wrapper, initialProps: env.props });
    await waitFor(() => expect(first.result.current.unseenCount).toBe(2));
    act(() => first.result.current.markItemSeen(first.result.current.items[0]));
    expect(first.result.current.unseenCount).toBe(1);
    first.unmount();
    const second = renderHook(() => useManagerNotificationCenter(env.props), { wrapper: env.wrapper });
    await waitFor(() => expect(second.result.current.unseenCount).toBe(1));
    act(() => second.result.current.markAllSeen());
    expect(second.result.current.unseenCount).toBe(0);
    second.unmount();
  });

  it('계정이나 매장을 바꿔도 이전 읽음 상태가 노출되지 않는다', async () => {
    const env = setup();
    const hook = renderHook((props) => useManagerNotificationCenter(props), { wrapper: env.wrapper, initialProps: env.props });
    await waitFor(() => expect(hook.result.current.unseenCount).toBe(2));
    act(() => hook.result.current.markAllSeen());
    hook.rerender({ ...env.props, userId: 'u2' });
    await waitFor(() => expect(hook.result.current.unseenCount).toBe(2));
    hook.rerender({ ...env.props, sysPlantCd: 'p2' });
    await waitFor(() => expect(hook.result.current.unseenCount).toBe(2));
    hook.unmount();
  });

  it('인증/관리자 권한이 없으면 조회하지 않는다', async () => {
    const env = setup(false);
    const hook = renderHook(() => useManagerNotificationCenter(env.props), { wrapper: env.wrapper });
    expect(hook.result.current.items).toEqual([]);
    expect(env.calls()).toBe(0);
    hook.unmount();
  });

  it('같은 브라우저의 다른 탭에서 읽음 변경이 오면 갱신한다', async () => {
    const env = setup();
    const hook = renderHook(() => useManagerNotificationCenter(env.props), { wrapper: env.wrapper });
    await waitFor(() => expect(hook.result.current.unseenCount).toBe(2));
    act(() => {
      saveNotificationIds('u1', 'p1', hook.result.current.items.map(notificationReadId));
      window.dispatchEvent(new StorageEvent('storage', { key: notificationStorageKey('u1', 'p1') }));
    });
    expect(hook.result.current.unseenCount).toBe(0);
    hook.unmount();
  });
});
