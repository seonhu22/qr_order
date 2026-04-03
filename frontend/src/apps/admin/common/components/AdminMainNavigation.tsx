import '@/apps/admin/common/components/AdminMainNavigation.css';

type AdminMainNavigationProps = {
  depth1: string;
  depth2: string;
  current: string;
};

export function AdminMainNavigation({ depth1, depth2, current }: AdminMainNavigationProps) {
  return (
    <nav className="admin-main-navigation" aria-label="현재 위치">
      <span className="admin-main-navigation__item">{depth1}</span>
      <span className="admin-main-navigation__separator">/</span>
      <span className="admin-main-navigation__item">{depth2}</span>
      <span className="admin-main-navigation__separator">/</span>
      <strong className="admin-main-navigation__current">{current}</strong>
    </nav>
  );
}
