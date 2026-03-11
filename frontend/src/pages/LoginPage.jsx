import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { AuthContext } from '../context/AuthContext';
import '../styles/login.css';

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(userId, password);
      if (result.success) {
        setUser(result.data);
      } else {
        setError(result.message || '로그인에 실패했습니다.');
      }
    } catch {
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">QR</div>
          <h1 className="login-title">QROrder</h1>
          <p className="login-subtitle">관리자 시스템</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}
          <div className="login-form-group">
            <label className="login-label">아이디</label>
            <input
              type="text"
              className="login-input"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>
          <div className="login-form-group">
            <label className="login-label">비밀번호</label>
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
