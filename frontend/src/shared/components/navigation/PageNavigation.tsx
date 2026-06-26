import './PageNavigation.css';

type PageNavigationProps = {
  depth1: string;
  depth2: string;
  current: string;
};

export function PageNavigation({ depth1, depth2, current }: PageNavigationProps) {
  return (
    <nav className="page-navigation" aria-label="현재 위치">
      <span className="page-navigation__item">{depth1}</span>
      <span className="page-navigation__separator">/</span>
      <span className="page-navigation__item">{depth2}</span>
      <span className="page-navigation__separator">/</span>
      <strong className="page-navigation__current">{current}</strong>
    </nav>
  );
}
