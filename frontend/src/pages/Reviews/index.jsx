import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { selectAuth } from '../../store/slices/authSlice';
import apiService from '../../services/apiService';
import { getPosterUrl } from '../../services/tmdbService';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import '../Favorites/ProfilePages.css';
import './Reviews.css';

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

const Reviews = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(selectAuth);
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals / Toasts
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, tmdbId: null });
  const [toastData, setToastData] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyReviews();
    }
  }, [isAuthenticated]);

  const fetchMyReviews = async () => {
    setLoading(true);
    try {
      const res = await apiService.get('/user/my-reviews');
      if (res.success) {
        setReviews(res.data);
      }
    } catch (err) {
      setToastData({ isOpen: true, title: 'Error', message: 'Failed to fetch your reviews.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (item) => {
    const path = item.mediaType === 'tv' ? `/tv/${item.tmdbId}` : item.mediaType === 'anime' ? `/anime/${item.tmdbId}` : `/movie/${item.tmdbId}`;
    navigate(path);
  };

  const triggerDelete = (e, tmdbId) => {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, tmdbId });
  };

  const confirmDelete = async () => {
    try {
      const res = await apiService.delete(`/user/ratings/${confirmModal.tmdbId}`);
      if (res.success) {
        setReviews(prev => prev.filter(r => r.tmdbId !== confirmModal.tmdbId));
        setToastData({ isOpen: true, title: 'Success', message: 'Review deleted successfully.', type: 'success' });
      }
    } catch (err) {
      setToastData({ isOpen: true, title: 'Error', message: 'Failed to delete review.', type: 'error' });
    } finally {
      setConfirmModal({ isOpen: false, tmdbId: null });
    }
  };

  return (
    <main className="profile-page">
      <div className="history-header-row">
        <div>
          <h1 className="profile-page__title">My Reviews</h1>
          <p className="profile-page__count">{reviews.length} reviews submitted</p>
        </div>
      </div>

      {loading ? (
        <div className="my-reviews-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="my-reviews-item">
              <div className="skeleton my-reviews-item__poster" />
              <div className="my-reviews-item__content">
                <div className="skeleton" style={{ width: '200px', height: '1.5rem', marginBottom: '1rem' }} />
                <div className="skeleton" style={{ width: '100%', height: '4rem' }} />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="my-reviews-list">
          {reviews.map((review) => (
            <motion.div 
              key={review._id} 
              className="my-reviews-item"
              onClick={() => handleClick(review)}
              whileHover={{ scale: 1.01 }}
            >
              <img 
                className="my-reviews-item__poster"
                src={review.poster ? getPosterUrl(review.poster.replace('https://image.tmdb.org/t/p/w500', ''), 'w200') : '/placeholder-poster.jpg'}
                alt={review.title || 'Unknown Title'}
                onError={(e) => { e.target.src = '/placeholder-poster.jpg'; }}
              />
              
              <div className="my-reviews-item__content">
                <div className="my-reviews-item__header">
                  <div>
                    <h3 className="my-reviews-item__title">{review.title || `Item #${review.tmdbId}`}</h3>
                    <div className="my-reviews-item__meta">
                      <span className={`movie-card__badge movie-card__badge--${review.mediaType}`}>
                        {(review.mediaType || 'MOVIE').toUpperCase()}
                      </span>
                      <span>{timeAgo(review.createdAt)}</span>
                    </div>
                  </div>
                  <div className="my-reviews-item__score">★ {review.rating}</div>
                </div>

                <div className="my-reviews-item__body">
                  {review.deletedByAdmin ? (
                    <p className="my-reviews-item__text my-reviews-item__text--deleted">
                      This review was removed by an administrator.
                      <br />
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        Reason: {review.deleteReason || 'Violation of community guidelines'}
                      </span>
                    </p>
                  ) : (
                    <p className="my-reviews-item__text">
                      {review.review || <span className="detail__empty-text">No text provided.</span>}
                    </p>
                  )}
                </div>
                
                <div className="my-reviews-item__actions">
                   {/* Note for editing, they need to go to the page */}
                   <span className="my-reviews-item__hint">Click card to view/edit on media page</span>
                   <button 
                    className="detail__icon-btn"
                    style={{ color: '#ef4444', borderColor: '#ef4444', marginLeft: 'auto' }}
                    onClick={(e) => triggerDelete(e, review.tmdbId)}
                    title="Delete Review"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="profile-empty">
          <div className="profile-empty__icon">✏️</div>
          <h2>No reviews yet</h2>
          <p>Share your thoughts on movies and shows!</p>
          <button className="auth-submit-btn" style={{ width: 'auto', padding: '0.8rem 2rem' }} onClick={() => navigate('/')}>
            Explore Aurelux
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Review"
        message="Are you sure you want to permanently delete this review? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, tmdbId: null })}
        isDanger={true}
      />

      <Toast
        isOpen={toastData.isOpen}
        title={toastData.title}
        message={toastData.message}
        type={toastData.type}
        onClose={() => setToastData(prev => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
};

export default Reviews;
