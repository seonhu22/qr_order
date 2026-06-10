import '@/apps/client/features/navigation/styles/ClientPageNavigation.css';
import type { ClientMenuBreadcrumb } from '@/shared/menu/clientNavigation';

type ClientPageNavigationProps = {
  breadcrumb: ClientMenuBreadcrumb | null;
};

export function ClientPageNavigation({ breadcrumb }: ClientPageNavigationProps) {
  if (!breadcrumb) {
    return null;
  }

  return (
    <nav className="client-page-navigation" aria-label="현재 페이지 위치">
      <ol className="client-page-navigation__list">
        <li className="client-page-navigation__item">{breadcrumb.depth1}</li>
        <li className="client-page-navigation__separator" aria-hidden="true">
          /
        </li>
        <li className="client-page-navigation__item">{breadcrumb.depth2}</li>
        <li className="client-page-navigation__separator" aria-hidden="true">
          /
        </li>
        <li className="client-page-navigation__item client-page-navigation__item--current">
          {breadcrumb.depth3}
        </li>
      </ol>
    </nav>
  );
}
