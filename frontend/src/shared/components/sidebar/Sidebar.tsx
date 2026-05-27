/**
 * @fileoverview 사이드바 공용 컨테이너
 *
 * @description
 * --sb-* CSS 변수 컨텍스트 제공 + flex 셸.
 * SidebarNav, SidebarUser 등 하위 컴포넌트가 변수를 상속해 사용한다.
 *
 * @module shared/components/sidebar/Sidebar
 */

import './Sidebar.css';
import type { ReactNode } from 'react';

type SidebarProps = {
  children: ReactNode;
  /** 루트 div에 추가할 CSS 클래스 */
  className?: string;
};

/**
 * 사이드바 컨테이너 컴포넌트
 *
 * @example
 * <Sidebar>
 *   <SidebarHeader />
 *   <SidebarNav ... />
 *   <SidebarUser ... />
 * </Sidebar>
 */
export function Sidebar({ children, className = '' }: SidebarProps) {
  return (
    <div className={`sidebar${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
