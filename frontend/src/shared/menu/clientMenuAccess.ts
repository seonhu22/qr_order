import { normalizeMenuPath } from './menuCatalog';

const MANAGER_MENU_PATHS = ['/client/menu/info/management', '/client/menu/info/option'];

// UI policy only. Server APIs must independently enforce the same authority.
export function canAccessClientMenuPath(pathname: string, staffRole?: string) {
  const path = normalizeMenuPath(pathname);
  const requiresManager = MANAGER_MENU_PATHS.some((root) => path === root || path.startsWith(`${root}/`));
  return !requiresManager || staffRole === '01';
}
