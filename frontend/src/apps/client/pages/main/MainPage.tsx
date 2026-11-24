import { Link } from 'react-router-dom';
import { Icon } from '@/shared/assets/icons/Icon';
import { useAuth } from '@/shared/auth/AuthContext';
import { getAuthUserStaffRole } from '@/shared/auth/authUserDisplay';
import { canAccessClientMenuPath } from '@/shared/menu/clientMenuAccess';
import './MainPage.css';

const SHORTCUTS = [
  { label: '주문 상태 관리', path: '/client/order/status/management' },
  { label: '결제 목록 조회', path: '/client/payment/status/list' },
  { label: '직원호출 관리', path: '/client/menu/info/staff-call' },
  { label: '메뉴 관리', path: '/client/menu/info/management' },
];

export function MainPage() {
  const { user } = useAuth();
  const staffRole = getAuthUserStaffRole(user);
  const shortcuts = SHORTCUTS.filter(({ path }) => canAccessClientMenuPath(path, staffRole));

  return (
    <section className="client-main-page" aria-labelledby="client-main-page-title">
      <h1 id="client-main-page-title" className="client-main-page__title">
        매장 운영 화면에 오신 것을 환영합니다
      </h1>

      <nav className="client-main-page__shortcuts" aria-label="매장 운영 바로가기">
        {shortcuts.map(({ label, path }) => (
          <Link key={path} to={path} className="client-main-page__shortcut">
            {label}
            <Icon id="i-chevron-right" size={16} />
          </Link>
        ))}
      </nav>
    </section>
  );
}
