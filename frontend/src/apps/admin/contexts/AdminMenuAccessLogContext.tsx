import { createContext, useContext, type PropsWithChildren } from 'react';
import type { MenuOpenAccessLogStatus } from '@/shared/hooks/useMenuOpenAccessLog';

const DEFAULT_MENU_ACCESS_LOG_STATUS: MenuOpenAccessLogStatus = {
  menuCd: undefined,
  loggedMenuCd: undefined,
  isReady: false,
  isPending: false,
  isError: false,
  error: undefined,
};

const AdminMenuAccessLogContext = createContext<MenuOpenAccessLogStatus>(DEFAULT_MENU_ACCESS_LOG_STATUS);

type AdminMenuAccessLogProviderProps = PropsWithChildren<{
  value: MenuOpenAccessLogStatus;
}>;

export function AdminMenuAccessLogProvider({ value, children }: AdminMenuAccessLogProviderProps) {
  return <AdminMenuAccessLogContext.Provider value={value}>{children}</AdminMenuAccessLogContext.Provider>;
}

/**
 * 현재 관리자 메뉴의 접근 로그 완료 상태를 제공한다.
 * 저장 API가 백엔드 세션의 현재 메뉴 정보를 필요로 할 때 이 상태로 실행 여부를 판단한다.
 */
export function useAdminMenuAccessLogStatus() {
  return useContext(AdminMenuAccessLogContext);
}
