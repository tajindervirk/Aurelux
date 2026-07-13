import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { registerUser, selectAuth } from '../../store/slices/authSlice';
import './Auth.css';

const validatePassword = (pwd) => {
  let score = 0;
  if (!pwd) return { score: 0, label: '', color: 'transparent' };
  if (pwd.length >= 6) score += 1;
  if (pwd.length >= 10) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score < 2) return { score, label: 'Weak', color: '#ef4444' };
  if (score < 4) return { score, label: 'Medium', color: '#eab308' };
  return { score, label: 'Strong', color: '#22c55e' };
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error: reduxError } = useSelector(selectAuth);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const pwdStrength = validatePassword(password);

  const handleRegister = async () => {
    const errors = {};
    if (!name || name.length < 2) errors.name = 'Name must be at least 2 characters';
    if (!email || !/\S+@\S+\.\S+/.test(email)) errors.email = 'Invalid email address';
    if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const result = await dispatch(registerUser({ name, email, password }));
    if (!result.error) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <h1 className="auth-logo gold-text">AURELUX</h1>
        <p className="auth-subtitle">Create an account</p>

        <div className="auth-form">
          <div className="auth-field">
            <label>Full Name</label>
            <div className="auth-input-wrapper">
              <span className="auth-icon">⚲</span>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setFieldErrors(p => ({...p, name: null})); }}
                placeholder="Enter your name"
              />
            </div>
            {fieldErrors.name && <span className="auth-field-err">{fieldErrors.name}</span>}
          </div>

          <div className="auth-field">
            <label>Email</label>
            <div className="auth-input-wrapper">
              <span className="auth-icon">✉</span>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: null})); }}
                placeholder="Enter your email"
              />
            </div>
            {fieldErrors.email && <span className="auth-field-err">{fieldErrors.email}</span>}
          </div>

          <div className="auth-field">
            <label>Password</label>
            <div className="auth-input-wrapper">
              <span className="auth-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({...p, password: null})); }}
                placeholder="Create a password"
              />
              <button className="auth-toggle-pwd" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {password.length > 0 && (
              <div className="auth-strength-bar">
                <div 
                  className="auth-strength-fill" 
                  style={{ width: `${Math.min(pwdStrength.score * 20, 100)}%`, background: pwdStrength.color }}
                />
              </div>
            )}
            {fieldErrors.password && <span className="auth-field-err">{fieldErrors.password}</span>}
          </div>

          <div className="auth-field">
            <label>Confirm Password</label>
            <div className="auth-input-wrapper">
              <span className="auth-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(p => ({...p, confirmPassword: null})); }}
                placeholder="Confirm your password"
                onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
              />
            </div>
            {fieldErrors.confirmPassword && <span className="auth-field-err">{fieldErrors.confirmPassword}</span>}
          </div>

          {reduxError && (
            <motion.div className="auth-error" initial={{ x: -10 }} animate={{ x: [-10, 10, -10, 10, 0] }} transition={{ duration: 0.4 }}>
              {reduxError}
            </motion.div>
          )}

          <button className="auth-submit-btn" onClick={handleRegister} disabled={loading}>
            {loading ? <div className="spinner-small" /> : 'Sign Up'}
          </button>
        </div>

        <div className="auth-divider"><span>or</span></div>

        <p className="auth-footer">
          Already have an account? <Link to="/login" className="gold-text">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
