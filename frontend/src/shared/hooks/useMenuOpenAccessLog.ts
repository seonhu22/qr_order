import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useInsertMenuCloseAccessLog,
  useInsertMenuOpenAccessLog,
} from '@/generated/log-controller/log-controller';

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
  const { mutate: openAccessLog } = useInsertMenuOpenAccessLog();
  const { mutate: closeAccessLog } = useInsertMenuCloseAccessLog();
  // 리렌더링으로 같은 메뉴 로그가 반복 호출되지 않도록 마지막 성공 메뉴를 보관한다.
  const loggedMenuCdRef = useRef('');
  // 같은 메뉴에 대한 요청이 진행 중이면 추가 요청을 막는다.
  const pendingMenuCdRef = useRef('');
  const requestedMenuCdRef = useRef(menuCd);
  const closingMenuCdRef = useRef('');
  const pendingCloseCallbacksRef = useRef<(() => void)[]>([]);
  const isUnmountedRef = useRef(false);
  const openMenuRef = useRef<(nextMenuCd: string) => void>(() => {});
  const [status, setStatus] = useState<Omit<MenuOpenAccessLogStatus, 'isReady'>>({
    menuCd,
    loggedMenuCd: undefined,
    isPending: false,
    isError: false,
    error: undefined,
  });

  const closeCurrentMenu = useCallback((afterClose?: () => void) => {
    const currentLoggedMenuCd = loggedMenuCdRef.current;

    if (!currentLoggedMenuCd) {
      afterClose?.();
      return;
    }

    if (closingMenuCdRef.current === currentLoggedMenuCd) {
      if (afterClose) {
        pendingCloseCallbacksRef.current.push(afterClose);
      }
      return;
    }

    closingMenuCdRef.current = currentLoggedMenuCd;
    closeAccessLog(undefined, {
      onSettled: () => {
        const pendingCallbacks = pendingCloseCallbacksRef.current;
        pendingCloseCallbacksRef.current = [];

        if (closingMenuCdRef.current === currentLoggedMenuCd) {
          closingMenuCdRef.current = '';
        }

        if (loggedMenuCdRef.current === currentLoggedMenuCd) {
          loggedMenuCdRef.current = '';
        }

        afterClose?.();
        pendingCallbacks.forEach((callback) => callback());
      },
    });
  }, [closeAccessLog]);

  const openMenu = useCallback((nextMenuCd: string) => {
    // 이미 성공한 메뉴라면 저장 가능 상태를 유지한다.
    if (loggedMenuCdRef.current === nextMenuCd) {
      setStatus({
        menuCd: nextMenuCd,
        loggedMenuCd: nextMenuCd,
        isPending: false,
        isError: false,
        error: undefined,
      });
      return;
    }

    // 같은 메뉴 로그 요청이 아직 끝나지 않았으면 중복 호출하지 않는다.
    if (pendingMenuCdRef.current === nextMenuCd) {
      return;
    }

    pendingMenuCdRef.current = nextMenuCd;
    setStatus({
      menuCd: nextMenuCd,
      loggedMenuCd: loggedMenuCdRef.current || undefined,
      isPending: true,
      isError: false,
      error: undefined,
    });

    openAccessLog(
      { params: { menuCd: nextMenuCd } },
      {
        onSuccess: () => {
          pendingMenuCdRef.current = '';

          if (isUnmountedRef.current) {
            return;
          }

          loggedMenuCdRef.current = nextMenuCd;

          if (requestedMenuCdRef.current && requestedMenuCdRef.current !== nextMenuCd) {
            const requestedMenuCd = requestedMenuCdRef.current;
            closeCurrentMenu(() => {
              if (isUnmountedRef.current || requestedMenuCdRef.current !== requestedMenuCd) {
                return;
              }

              queueMicrotask(() => {
                if (isUnmountedRef.current || requestedMenuCdRef.current !== requestedMenuCd) {
                  return;
                }

                openMenuRef.current(requestedMenuCd);
              });
            });
            return;
          }

          setStatus({
            menuCd: nextMenuCd,
            loggedMenuCd: nextMenuCd,
            isPending: false,
            isError: false,
            error: undefined,
          });
        },
        onError: (error) => {
          pendingMenuCdRef.current = '';

          if (isUnmountedRef.current) {
            return;
          }

          if (requestedMenuCdRef.current && requestedMenuCdRef.current !== nextMenuCd) {
            openMenuRef.current(requestedMenuCdRef.current);
            return;
          }

          setStatus({
            menuCd: nextMenuCd,
            loggedMenuCd: loggedMenuCdRef.current || undefined,
            isPending: false,
            isError: true,
            error,
          });
        },
      },
    );
  }, [openAccessLog, closeCurrentMenu]);

  useEffect(() => {
    openMenuRef.current = openMenu;
  }, [openMenu]);

  useEffect(() => {
    requestedMenuCdRef.current = menuCd;

    // 사이드바 설정에 없는 경로는 menuCd를 만들 수 없으므로 준비 상태를 해제한다.
    if (!menuCd) {
      closeCurrentMenu(() => {
        if (isUnmountedRef.current || requestedMenuCdRef.current) {
          return;
        }

        setStatus({
          menuCd: undefined,
          loggedMenuCd: undefined,
          isPending: false,
          isError: false,
          error: undefined,
        });
      });
      return;
    }

    if (loggedMenuCdRef.current && loggedMenuCdRef.current !== menuCd) {
      const nextMenuCd = menuCd;
      closeCurrentMenu(() => {
        if (isUnmountedRef.current || requestedMenuCdRef.current !== nextMenuCd) {
          return;
        }

        queueMicrotask(() => {
          if (isUnmountedRef.current || requestedMenuCdRef.current !== nextMenuCd) {
            return;
          }

          openMenu(nextMenuCd);
        });
      });
      return;
    }

    if (pendingMenuCdRef.current && pendingMenuCdRef.current !== menuCd) {
      return;
    }

    queueMicrotask(() => {
      if (isUnmountedRef.current || requestedMenuCdRef.current !== menuCd) {
        return;
      }

      openMenu(menuCd);
    });
  }, [menuCd, openMenu, closeCurrentMenu]);

  useEffect(() => {
    isUnmountedRef.current = false;

    return () => {
      isUnmountedRef.current = true;
      closeCurrentMenu();
    };
  }, [closeCurrentMenu]);

  return useMemo<MenuOpenAccessLogStatus>(
    () => ({
      ...status,
      // 첨부파일 저장처럼 세션의 현재 메뉴 정보가 필요한 기능은 이 값으로 실행 여부를 판단한다.
      isReady: Boolean(status.menuCd && status.loggedMenuCd === status.menuCd && !status.isPending && !status.isError),
    }),
    [status],
  );
}
