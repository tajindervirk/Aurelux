import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchHistory, clearHistory, removeSingleHistory, selectHistory } from '../../store/slices/historySlice';
import { selectAuth } from '../../store/slices/authSlice';
import { getPosterUrl } from '../../services/tmdbService';
import '../Favorites/ProfilePages.css';

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return Math.floor(seconds) + ' seconds ago';
};

const History = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(selectAuth);
  const { items, loading } = useSelector(selectHistory);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchHistory());
    }
  }, [dispatch, isAuthenticated]);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your entire watch history?')) {
      dispatch(clearHistory());
    }
  };

  const handleRemoveItem = (e, tmdbId) => {
    e.stopPropagation();
    dispatch(removeSingleHistory(tmdbId));
  };

  const handleClick = (item) => {
    const path = item.type === 'tv' ? `/tv/${item.tmdbId}` : `/movie/${item.tmdbId}`;
    navigate(path);
  };

  return (
    <main className="profile-page">
      <div className="history-header-row">
        <div>
          <h1 className="profile-page__title">Watch History</h1>
          <p className="profile-page__count">{items.length} titles in history</p>
        </div>
        {items.length > 0 && (
          <button className="history-clear-btn" onClick={handleClear}>
            Clear All
          </button>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div className="history-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="history-item">
              <div className="skeleton history-item__poster" />
              <div className="history-item__info">
                <div className="skeleton" style={{ width: '200px', height: '1.2rem' }} />
                <div className="skeleton" style={{ width: '100px', height: '0.8rem' }} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="history-list">
          {items.map((item) => {
            const progressPercent = item.progress 
              ? Math.min(Math.round((item.progress.watched / item.progress.duration) * 100), 100) 
              : 0;

            return (
              <motion.div 
                key={item.tmdbId} 
                className="history-item"
                onClick={() => handleClick(item)}
              >
                <img 
                  className="history-item__poster"
                  src={getPosterUrl(item.poster.replace('https://image.tmdb.org/t/p/w500', ''), 'w200')}
                  alt={item.title}
                  onError={(e) => { e.target.src = '/placeholder-poster.jpg'; }}
                />
                
                <div className="history-item__info">
                  <h3 className="history-item__title">{item.title}</h3>
                  <div className="history-item__meta">
                    <span className={`movie-card__badge movie-card__badge--${item.type}`}>
                      {(item.type || 'MOVIE').toUpperCase()}
                    </span>
                    <span>Watched {timeAgo(item.watchedAt || item.addedAt)}</span>
                  </div>

                  {item.progress && progressPercent > 0 && (
                    <div className="history-item__progress-container">
                      <div className="history-item__progress-bar">
                        <div className="history-item__progress-fill" style={{ width: `${progressPercent}%` }} />
                      </div>
                      <div className="history-item__progress-text">{progressPercent}% watched</div>
                    </div>
                  )}
                </div>

                <div className="history-item__actions">
                  <button 
                    className="history-item__remove"
                    onClick={(e) => handleRemoveItem(e, item.tmdbId)}
                    aria-label="Remove from history"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="profile-empty">
          <div className="profile-empty__icon">🕒</div>
          <h2>No watch history yet</h2>
          <p>Movies and shows you watch will appear here.</p>
          <button className="auth-submit-btn" style={{ width: 'auto', padding: '0.8rem 2rem' }} onClick={() => navigate('/')}>
            Explore Aurelux
          </button>
        </div>
      )}
    </main>
  );
};

export default History;
