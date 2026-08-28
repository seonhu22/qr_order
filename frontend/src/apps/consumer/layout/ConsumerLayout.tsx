import { Outlet } from 'react-router-dom';
import { ConsumerHeader } from '@/apps/consumer/features/header/components/ConsumerHeader';
import './ConsumerLayout.css';

/**
 * 사이드바가 없는 Consumer 전용 모바일 셸.
 * html/body가 overflow:hidden으로 고정돼 있어(global.css) 본문 스크롤을 이 레이아웃이 직접 소유한다.
 */
export function ConsumerLayout() {
  return (
    <div className="consumer-layout">
      <header className="consumer-layout__header">
        <ConsumerHeader />
      </header>
      <main className="consumer-layout__body">
        <Outlet />
      </main>
    </div>
  );
}
