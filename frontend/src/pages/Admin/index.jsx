import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/slices/authSlice';
import OverviewTab from './OverviewTab';
import MoviesTab from './MoviesTab';
import UsersTab from './UsersTab';
import ProvidersTab from './ProvidersTab';
import './Admin.css';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '⊞' },
    { id: 'movies', label: 'Movies', icon: '🎥' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'providers', label: 'Providers', icon: '📡' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <h2 className="admin-logo gold-text">AURELUX</h2>
          <span className="admin-badge">Admin</span>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`admin-nav__item ${activeTab === item.id ? 'admin-nav__item--active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="admin-nav__icon">{item.icon}</span>
              <span className="admin-nav__label">{item.label}</span>
            </button>
          ))}

          <div className="admin-nav__divider" />

          <button className="admin-nav__item" onClick={() => navigate('/')}>
            <span className="admin-nav__icon">←</span>
            <span className="admin-nav__label">Back to Site</span>
          </button>
          
          <button className="admin-nav__item" onClick={handleLogout}>
            <span className="admin-nav__icon">🚪</span>
            <span className="admin-nav__label">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1 className="admin-title">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          <p className="admin-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </header>

        <div className="admin-content">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'movies' && <MoviesTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'providers' && <ProvidersTab />}
        </div>
      </main>
    </div>
  );
};

export default Admin;
