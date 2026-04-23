import { useEffect, useRef } from 'react';
import { useInsertMenuOpenAccessLog } from '@/generated/log-controller/log-controller';

export function useMenuOpenAccessLog(menuCd: string) {
  const menuOpenLogMutation = useInsertMenuOpenAccessLog();
  const hasOpenedMenuLogRef = useRef(false);

  useEffect(() => {
    if (hasOpenedMenuLogRef.current) {
      return;
    }

    hasOpenedMenuLogRef.current = true;
    menuOpenLogMutation.mutate({ params: { menuCd } });
  }, [menuCd, menuOpenLogMutation]);
}
