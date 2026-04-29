import { useEffect, useMemo, useRef, useState } from 'react';
import { useInsertMenuOpenAccessLog } from '@/generated/log-controller/log-controller';

export type MenuOpenAccessLogStatus = {
  /** 현재 라우트에서 매칭된 메뉴 코드 */
  menuCd: string | undefined;
  /** 메뉴 접근 로그 API가 성공한 마지막 메뉴 코드 */
  loggedMenuCd: string | undefined;
  /** 현재 메뉴 코드 기준으로 접근 로그가 성공했는지 여부 */
  isReady: boolean;
  isPending: boolean;
  isError: boolean;
  error: unknown;
};

export function useMenuOpenAccessLog(menuCd: string | undefined) {
  const { mutate } = useInsertMenuOpenAccessLog();
  // 리렌더링으로 같은 메뉴 로그가 반복 호출되지 않도록 마지막 성공 메뉴를 보관한다.
  const loggedMenuCdRef = useRef('');
  // 같은 메뉴에 대한 요청이 진행 중이면 추가 요청을 막는다.
  const pendingMenuCdRef = useRef('');
  const [status, setStatus] = useState<Omit<MenuOpenAccessLogStatus, 'isReady'>>({
    menuCd,
    loggedMenuCd: undefined,
    isPending: false,
    isError: false,
    error: undefined,
  });

  useEffect(() => {
    // 사이드바 설정에 없는 경로는 menuCd를 만들 수 없으므로 준비 상태를 해제한다.
    if (!menuCd) {
      setStatus({
        menuCd: undefined,
        loggedMenuCd: undefined,
        isPending: false,
        isError: false,
        error: undefined,
      });
      return;
    }

    // 이미 성공한 메뉴라면 저장 가능 상태를 유지한다.
    if (loggedMenuCdRef.current === menuCd) {
      setStatus({
        menuCd,
        loggedMenuCd: menuCd,
        isPending: false,
        isError: false,
        error: undefined,
      });
      return;
    }

    // 같은 메뉴 로그 요청이 아직 끝나지 않았으면 중복 호출하지 않는다.
    if (pendingMenuCdRef.current === menuCd) {
      return;
    }

    pendingMenuCdRef.current = menuCd;
    setStatus({
      menuCd,
      loggedMenuCd: loggedMenuCdRef.current || undefined,
      isPending: true,
      isError: false,
      error: undefined,
    });

    mutate(
      { params: { menuCd } },
      {
        onSuccess: () => {
          loggedMenuCdRef.current = menuCd;
          pendingMenuCdRef.current = '';
          setStatus({
            menuCd,
            loggedMenuCd: menuCd,
            isPending: false,
            isError: false,
            error: undefined,
          });
        },
        onError: (error) => {
          pendingMenuCdRef.current = '';
          setStatus({
            menuCd,
            loggedMenuCd: loggedMenuCdRef.current || undefined,
            isPending: false,
            isError: true,
            error,
          });
        },
      },
    );
  }, [menuCd, mutate]);

  return useMemo<MenuOpenAccessLogStatus>(
    () => ({
      ...status,
      // 첨부파일 저장처럼 세션의 현재 메뉴 정보가 필요한 기능은 이 값으로 실행 여부를 판단한다.
      isReady: Boolean(status.menuCd && status.loggedMenuCd === status.menuCd && !status.isPending && !status.isError),
    }),
    [status],
  );
}
