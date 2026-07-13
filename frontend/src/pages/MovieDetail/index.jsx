import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchMovieDetails, selectMovies } from '../../store/slices/moviesSlice';
import { selectAuth } from '../../store/slices/authSlice';
import { addToHistory } from '../../store/slices/historySlice';
import { selectIsFavorite, addFavorite, removeFavorite } from '../../store/slices/favoritesSlice';
import { selectIsInWatchlist, addToWatchlist, removeFromWatchlist } from '../../store/slices/watchlistSlice';
import { getBackdropUrl, getPosterUrl, getMovieVideos } from '../../services/tmdbService';
import apiService from '../../services/apiService';
import { usePlayerContext } from '../../context/PlayerContext';
import Carousel from '../../components/common/Carousel';
import PersonCard from '../../components/cards/PersonCard';
import MovieCard from '../../components/cards/MovieCard';
import TrailerModal from '../../components/common/TrailerModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Toast from '../../components/common/Toast';
import './MovieDetail.css';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentMovie, detailLoading, error } = useSelector(selectMovies);
  const { isAuthenticated, user } = useSelector(selectAuth);
  const isFav = useSelector((state) => selectIsFavorite(state, Number(id)));
  const isInWL = useSelector((state) => selectIsInWatchlist(state, Number(id)));
  const { openPlayer } = usePlayerContext();

  const [trailerKey, setTrailerKey] = useState(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [ratingInput, setRatingInput] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Review Edit & Delete State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', review: null });
  const [adminReason, setAdminReason] = useState('');
  const [toastData, setToastData] = useState({ isOpen: false, title: '', message: '', type: 'success' });


  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchMovieDetails(id));
    
    // Fetch trailer separately to keep slice simple
    getMovieVideos(id).then((video) => {
      if (video?.key) setTrailerKey(video.key);
    });

    // Fetch backend ratings
    apiService.get(`/user/ratings/${id}`).then((res) => {
      if (res.success) setReviews(res.data.reviews || []);
    }).catch(() => {});
  }, [dispatch, id]);

  useEffect(() => {
    if (isAuthenticated && currentMovie?.id === Number(id)) {
      dispatch(addToHistory({
        tmdbId: currentMovie.id,
        title: currentMovie.title,
        poster: getPosterUrl(currentMovie.poster_path, 'w500'),
        type: 'movie',
      }));
    }
  }, [isAuthenticated, currentMovie, dispatch, id]);

  if (detailLoading) {
    return (
      <div className="detail-page detail-page--skeleton">
        <div className="detail__backdrop skeleton" />
        <div className="detail__content">
          <div className="detail__left"><div className="detail__poster skeleton" /></div>
          <div className="detail__right">
            <div className="skeleton" style={{ height: '3rem', width: '60%', marginBottom: '1rem' }} />
            <div className="skeleton" style={{ height: '1.5rem', width: '40%', marginBottom: '2rem' }} />
            <div className="skeleton" style={{ height: '6rem', width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentMovie) {
    return (
      <div className="detail-page__error">
        <h2>Oops! We couldn't find that movie.</h2>
        <button onClick={() => navigate(-1)} className="hero__btn hero__btn--primary">Go Back</button>
      </div>
    );
  }

  const moviePayload = {
    tmdbId: currentMovie.id,
    title: currentMovie.title,
    poster: getPosterUrl(currentMovie.poster_path, 'w500'),
    type: 'movie',
  };

  const handleWatch = () => {
    openPlayer(moviePayload);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (ratingInput < 1) {
      setToastData({ isOpen: true, title: 'Missing Rating', message: 'Please select a star rating.', type: 'error' });
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await apiService.post('/user/ratings', {
        tmdbId: currentMovie.id,
        mediaType: 'movie',
        rating: ratingInput,
        title: currentMovie.title || currentMovie.name,
        poster: currentMovie.poster_path,
        review: reviewText
      });
      if (res.success) {
        setReviews(prev => {
          const newReviewUserId = res.data.userId?._id || res.data.userId;
          const filtered = prev.filter(r => {
            const rId = r.userId?._id || r.userId;
            return rId !== newReviewUserId;
          });
          
          // Construct populated review using current user data
          const populatedReview = {
            ...res.data,
            userId: {
              _id: user._id,
              name: user.name,
              avatar: user.avatar
            }
          };
          
          return [populatedReview, ...filtered];
        });
        setRatingInput(0);
        setHoverRating(0);
        setReviewText('');
        setToastData({ isOpen: true, title: 'Success', message: 'Review saved successfully!', type: 'success' });
      }
    } catch (err) {
      setToastData({ isOpen: true, title: 'Error', message: 'Failed to save review. Please try again.', type: 'error' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleEditReview = (review) => {
    setRatingInput(review.rating);
    setReviewText(review.review);
    window.scrollTo({ top: document.querySelector('.detail__review-form-card')?.offsetTop - 100, behavior: 'smooth' });
  };

  const confirmDeleteReview = (review, isAdmin = false) => {
    setConfirmModal({ isOpen: true, type: isAdmin ? 'admin' : 'user', review });
    setAdminReason('');
  };

  const executeDeleteReview = async () => {
    const { type, review } = confirmModal;
    if (!review) return;
    
    try {
      if (type === 'user') {
        const res = await apiService.delete(`/user/ratings/${review.tmdbId}`);
        if (res.success) {
          setReviews(prev => prev.filter(r => r._id !== review._id));
        }
      } else if (type === 'admin') {
        if (!adminReason) {
          setToastData({ isOpen: true, title: 'Missing Reason', message: 'Please provide a reason for deletion.', type: 'error' });
          return;
        }
        const res = await apiService.delete(`/admin/reviews/${review._id}`, { data: { reason: adminReason } });
        if (res.success) {
          setReviews(prev => prev.map(r => r._id === review._id ? { ...r, deletedByAdmin: true, deleteReason: adminReason, review: '' } : r));
        }
      }
      setConfirmModal({ isOpen: false, type: '', review: null });
    } catch (err) {
      setToastData({ isOpen: true, title: 'Error', message: 'Failed to delete review. Please try again.', type: 'error' });
    }
  };

  const runtime = currentMovie.runtime 
    ? `${Math.floor(currentMovie.runtime / 60)}h ${currentMovie.runtime % 60}m` 
    : 'N/A';
  const releaseYear = currentMovie.release_date?.split('-')[0];
  const cast = currentMovie.credits?.cast?.slice(0, 10) || [];
  const tmdbReviews = currentMovie.reviews?.results?.slice(0, 5) || [];

  return (
    <div className="detail-page">
      {/* Visual Backdrop */}
      <div 
        className="detail__backdrop"
        style={{ backgroundImage: `url(${getBackdropUrl(currentMovie.backdrop_path)})` }}
      >
        <div className="detail__backdrop-overlay" />
      </div>

      {/* Main Content */}
      <div className="detail__content">
        <div className="detail__layout">
          {/* Left Column */}
          <div className="detail__left">
            <img 
              className="detail__poster" 
              src={getPosterUrl(currentMovie.poster_path, 'original')} 
              alt={currentMovie.title}
            />
          </div>

          {/* Right Column */}
          <div className="detail__right">
            <h1 className="detail__title">{currentMovie.title}</h1>
            {currentMovie.tagline && <p className="detail__tagline">"{currentMovie.tagline}"</p>}
            
            <div className="detail__meta-row">
              <span>{releaseYear}</span>
              <span className="detail__meta-dot">•</span>
              <span>{runtime}</span>
              <span className="detail__meta-dot">•</span>
              <span className="gold-text">★ {currentMovie.vote_average?.toFixed(1)}</span>
              {currentMovie.original_language && (
                <>
                  <span className="detail__meta-dot">•</span>
                  <span className="detail__lang-badge">{currentMovie.original_language.toUpperCase()}</span>
                </>
              )}
            </div>

            <div className="detail__genres">
              {currentMovie.genres?.map(g => (
                <span key={g.id} className="detail__genre-chip">{g.name}</span>
              ))}
            </div>

            <div className="detail__actions">
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="detail__btn detail__btn--primary"
                onClick={handleWatch}
              >
                ▶ Watch Now
              </motion.button>
              
              {trailerKey && (
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="detail__btn detail__btn--outline"
                  onClick={() => setIsTrailerOpen(true)}
                >
                  Trailer
                </motion.button>
              )}

              {isAuthenticated && (
                <div className="detail__icon-actions">
                  <motion.button 
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className={`detail__icon-btn ${isFav ? 'active' : ''}`}
                    onClick={() => isFav ? dispatch(removeFavorite(currentMovie.id)) : dispatch(addFavorite(moviePayload))}
                  >
                    {isFav ? '♥' : '♡'}
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className={`detail__icon-btn ${isInWL ? 'active' : ''}`}
                    onClick={() => isInWL ? dispatch(removeFromWatchlist(currentMovie.id)) : dispatch(addToWatchlist(moviePayload))}
                  >
                    {isInWL ? '◉' : '○'}
                  </motion.button>
                </div>
              )}
            </div>

            <div className="detail__overview">
              <h4 className="detail__section-label">OVERVIEW</h4>
              <p>{currentMovie.overview}</p>
            </div>
          </div>
        </div>

        {/* Cast Section */}
        {cast.length > 0 && (
          <div className="detail__section">
            <h3 className="detail__section-title">Cast</h3>
            <div className="detail__cast-scroll">
              {cast.map(person => (
                <PersonCard key={person.id} person={{...person, known_for_department: person.character}} />
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="detail__section">
          <h3 className="detail__section-title">Reviews & Ratings</h3>
          
          {isAuthenticated && (
            (() => {
              const hasReviewed = reviews.some(r => (r.userId?._id || r.userId) === user?._id);
              if (hasReviewed) {
                return (
                  <div className="detail__review-form-card glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⭐</div>
                    <h4 style={{ margin: 0, color: 'var(--color-gold)' }}>You have already reviewed this movie.</h4>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      You can edit or delete your review below.
                    </p>
                  </div>
                );
              }
              return (
                <div className="detail__review-form-card glass-card">
                  <h4 className="detail__form-title">Rate this movie</h4>
                  <form onSubmit={handleReviewSubmit}>
                    <div className="detail__star-input">
                      {[...Array(10)].map((_, i) => (
                        <span 
                          key={i} 
                          className={`detail__star-select ${i < (hoverRating || ratingInput) ? 'filled' : ''}`}
                          onMouseEnter={() => setHoverRating(i + 1)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRatingInput(i + 1)}
                        >★</span>
                      ))}
                      <span className="detail__rating-num">{ratingInput > 0 ? `${ratingInput}/10` : ''}</span>
                    </div>
                    <textarea 
                      className="detail__review-textarea"
                      placeholder="Write your review..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      maxLength={1000}
                    />
                    <div className="detail__form-footer">
                      <span className="detail__char-count">{reviewText.length}/1000</span>
                      <button type="submit" className="detail__btn detail__btn--primary" disabled={isSubmittingReview}>
                        {isSubmittingReview ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </form>
                </div>
              );
            })()
          )}

          <div className="detail__reviews-list">
            {reviews.map(r => (
              <div key={r._id} className="detail__review-item glass-card">
                <div className="detail__review-header">
                  <div className="detail__reviewer-avatar">{r.userId?.name?.charAt(0) || '?'}</div>
                  <div className="detail__reviewer-info">
                    <span className="detail__reviewer-name">{r.userId?.name || 'Aurelux User'}</span>
                    <span className="detail__reviewer-date">{new Date(r.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {!r.deletedByAdmin && <div className="detail__review-score">★ {r.rating}</div>}
                  
                  <div className="detail__review-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    {isAuthenticated && r.userId?._id === user?._id && (
                      <>
                        {!r.deletedByAdmin && (
                          <button className="detail__icon-btn" onClick={() => handleEditReview(r)} title="Edit Review">✏️</button>
                        )}
                        <button className="detail__icon-btn" onClick={() => confirmDeleteReview(r, false)} title="Delete Review" style={{ color: '#ef4444', borderColor: '#ef4444' }}>🗑️</button>
                      </>
                    )}
                    {isAuthenticated && user?.role === 'admin' && !r.deletedByAdmin && (
                      <button className="detail__icon-btn detail__icon-btn--admin" onClick={() => confirmDeleteReview(r, true)} title="Admin Delete" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                        🗑️ Admin
                      </button>
                    )}
                  </div>
                </div>
                
                {r.deletedByAdmin ? (
                  <div className="detail__review-deleted">
                    <p style={{ color: '#ef4444', fontStyle: 'italic', margin: 0 }}>This review was removed by an administrator.</p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Reason: {r.deleteReason}</p>
                  </div>
                ) : (
                  r.review && <p className="detail__review-text">{r.review}</p>
                )}
              </div>
            ))}
            
            {/* Show TMDB reviews if backend reviews are empty */}
            {reviews.length === 0 && tmdbReviews.map(r => (
              <div key={r.id} className="detail__review-item glass-card">
                <div className="detail__review-header">
                  <div className="detail__reviewer-avatar">{r.author.charAt(0)}</div>
                  <div className="detail__reviewer-info">
                    <span className="detail__reviewer-name">{r.author}</span>
                    <span className="detail__reviewer-date">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="detail__review-text">{r.content.substring(0, 300)}{r.content.length > 300 ? '...' : ''}</p>
              </div>
            ))}
            
            {reviews.length === 0 && tmdbReviews.length === 0 && (
              <p className="detail__empty-text">Be the first to review this movie!</p>
            )}
          </div>
        </div>

        {/* Similar Movies */}
        {currentMovie.similar?.results?.length > 0 && (
          <Carousel 
            title="More Like This" 
            items={currentMovie.similar.results}
            CardComponent={MovieCard}
          />
        )}
      </div>

      <TrailerModal isOpen={isTrailerOpen} onClose={() => setIsTrailerOpen(false)} videoKey={trailerKey} />
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'admin' ? "Admin Delete Review" : "Delete Review"}
        message={confirmModal.type === 'admin' 
          ? "Are you sure you want to delete this user's review? This action cannot be undone." 
          : "Are you sure you want to delete your review? This action cannot be undone."}
        onConfirm={executeDeleteReview}
        onCancel={() => setConfirmModal({ isOpen: false, type: '', review: null })}
        confirmText="Delete"
        isDanger={true}
      >
        {confirmModal.type === 'admin' && (
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-gold)' }}>Reason for deletion *</label>
            <textarea 
              placeholder="e.g. Inappropriate language, Spam..."
              value={adminReason}
              onChange={(e) => setAdminReason(e.target.value)}
              required
            />
          </div>
        )}
      </ConfirmModal>

      <Toast
        isOpen={toastData.isOpen}
        title={toastData.title}
        message={toastData.message}
        type={toastData.type}
        onClose={() => setToastData(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default MovieDetail;
