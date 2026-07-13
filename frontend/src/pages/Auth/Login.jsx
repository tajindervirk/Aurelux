import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginUser, selectAuth } from '../../store/slices/authSlice';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, error } = useSelector(selectAuth);

  const from = location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleLogin = async () => {
    if (!email || !password) return;
    const result = await dispatch(loginUser({ email, password }));
    if (!result.error) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <h1 className="auth-logo gold-text">AURELUX</h1>
        <p className="auth-subtitle">Welcome back</p>

        <div className="auth-form">
          <div className="auth-field">
            <label>Email</label>
            <div className="auth-input-wrapper">
              <span className="auth-icon">✉</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Password</label>
            <div className="auth-input-wrapper">
              <span className="auth-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              />
              <button 
                className="auth-toggle-pwd"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              className="auth-error"
              initial={{ x: -10 }}
              animate={{ x: [-10, 10, -10, 10, 0] }}
              transition={{ duration: 0.4 }}
            >
              {error}
            </motion.div>
          )}

          <button 
            className="auth-submit-btn" 
            onClick={handleLogin}
            disabled={loading || !email || !password}
          >
            {loading ? <div className="spinner-small" /> : 'Sign In'}
          </button>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <p className="auth-footer">
          Don't have an account? <Link to="/register" className="gold-text">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
