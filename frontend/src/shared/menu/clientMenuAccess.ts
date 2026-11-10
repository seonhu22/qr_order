import { normalizeMenuPath } from './menuCatalog';

const MANAGER_MENU_PATHS = ['/client/menu/info/management', '/client/menu/info/option'];

export function canManageClientMenus(staffRole?: string) {
  return staffRole === '01';
}

// UI policy only. Server APIs must independently enforce the same authority.
export function canAccessClientMenuPath(pathname: string, staffRole?: string) {
  let path: string;
  try {
    path = normalizeMenuPath(decodeURIComponent(pathname)).toLowerCase();
  } catch {
    return false;
  }
  const requiresManager = MANAGER_MENU_PATHS.some((root) => path === root || path.startsWith(`${root}/`));
  return !requiresManager || canManageClientMenus(staffRole);
}
