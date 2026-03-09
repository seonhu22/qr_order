import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { logout } from '../../api/auth';

function Header() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate('/');
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <span className="header-logo">QROrder</span>
      </div>
      <div className="header-right">
        {user && (
          <span className="header-user">
            {user.userName}
            {user.deptNm ? ` · ${user.deptNm}` : ''}
          </span>
        )}
        <button className="header-logout-btn" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </header>
  );
}

export default Header;
