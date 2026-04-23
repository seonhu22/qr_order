import { useEffect, useRef } from 'react';
import { useInsertMenuOpenAccessLog } from '@/generated/log-controller/log-controller';

export function useMenuOpenAccessLog(menuCd: string | undefined) {
  const menuOpenLogMutation = useInsertMenuOpenAccessLog();
  const lastLoggedMenuCdRef = useRef('');

  useEffect(() => {
    if (!menuCd || lastLoggedMenuCdRef.current === menuCd) {
      return;
    }

    lastLoggedMenuCdRef.current = menuCd;
    menuOpenLogMutation.mutate({ params: { menuCd } });
  }, [menuCd, menuOpenLogMutation]);
}
