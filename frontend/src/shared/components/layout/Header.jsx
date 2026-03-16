import { useNavigate } from 'react-router-dom';
import { logout } from '@/shared/api/auth';
import { useAuth } from '@/shared/auth/AuthContext';

function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      signOut();
      navigate('/', { replace: true });
    }
  };

  const userLabel = user?.userNm ?? user?.userId ?? '로그인 사용자';
  const departmentLabel = user?.deptNm ? ` · ${user.deptNm}` : '';

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <span className="header-logo">QROrder</span>
      </div>
      <div className="header-right">
        {isAuthenticated && <span className="header-user">{`${userLabel}${departmentLabel}`}</span>}
        <button className="header-logout-btn" type="button" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </header>
  );
}

export default Header;
