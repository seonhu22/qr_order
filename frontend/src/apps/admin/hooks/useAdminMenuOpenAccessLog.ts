import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { getAdminMenuKeyByPath } from '@/apps/admin/features/sidebar/utils/getAdminMenuKeyByPath';
import { useMenuOpenAccessLog } from '@/shared/hooks/useMenuOpenAccessLog';

export function useAdminMenuOpenAccessLog() {
  const location = useLocation();
  // 현재 URL을 사이드바 메뉴 key로 바꿔 백엔드 세션의 현재 메뉴 정보를 갱신한다.
  const menuCd = useMemo(() => getAdminMenuKeyByPath(location.pathname), [location.pathname]);

  return useMenuOpenAccessLog(menuCd);
}
