import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { getAdminMenuKeyByPath } from '@/apps/admin/features/sidebar/utils/getAdminMenuKeyByPath';
import { useMenuOpenAccessLog } from '@/shared/hooks/useMenuOpenAccessLog';

export function useAdminMenuOpenAccessLog() {
  const location = useLocation();
  const menuCd = useMemo(() => getAdminMenuKeyByPath(location.pathname), [location.pathname]);

  useMenuOpenAccessLog(menuCd);
}
