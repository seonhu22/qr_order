import { useSyncCurrentAdminMenu } from '@/apps/admin/hooks/useSyncCurrentAdminMenu';
import { useMenuOpenAccessLog } from '@/shared/hooks/useMenuOpenAccessLog';

export function useAdminMenuOpenAccessLog() {
  // 현재 URL과 서버 메뉴 카탈로그를 기준으로 실제 menuCd를 계산하고 전역 UI 상태와 동기화한다.
  const { currentMenu } = useSyncCurrentAdminMenu();

  return useMenuOpenAccessLog(currentMenu?.menuCd);
}
