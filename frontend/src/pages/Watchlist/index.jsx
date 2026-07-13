import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWatchlist, removeFromWatchlist, selectWatchlist } from '../../store/slices/watchlistSlice';
import { selectAuth } from '../../store/slices/authSlice';
import MovieCard from '../../components/cards/MovieCard';
import TVCard from '../../components/cards/TVCard';
import AnimeCard from '../../components/cards/AnimeCard';
import SkeletonCard from '../../components/skeletons/SkeletonCard';
import '../Favorites/ProfilePages.css';

const Watchlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(selectAuth);
  const { items, loading } = useSelector(selectWatchlist);
  const [toastId, setToastId] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWatchlist());
    }
  }, [dispatch, isAuthenticated]);

  const handleRemove = (tmdbId) => {
    dispatch(removeFromWatchlist(tmdbId));
    setToastId(tmdbId);
    setTimeout(() => setToastId(null), 3000);
  };

  const renderCard = (item) => {
    const movieObj = { ...item, id: item.tmdbId, poster_path: item.poster.replace('https://image.tmdb.org/t/p/w500', '') };
    const props = { movie: movieObj, showActions: true };

    let CardComponent = MovieCard;
    if (item.type === 'tv') CardComponent = TVCard;
    if (item.type === 'anime') CardComponent = AnimeCard;

    return (
      <div key={item.tmdbId} className="profile-grid__item">
        <CardComponent {...props} />
        <button 
          className="profile-grid__remove-btn"
          onClick={(e) => { e.stopPropagation(); handleRemove(item.tmdbId); }}
          aria-label="Remove from watchlist"
        >
          ✕
        </button>
      </div>
    );
  };

  return (
    <main className="profile-page">
      <div className="profile-page__header">
        <h1 className="profile-page__title">My Watchlist</h1>
        <p className="profile-page__count">{items.length} title{items.length !== 1 ? 's' : ''} saved</p>
      </div>

      {loading && items.length === 0 ? (
        <div className="profile-grid">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length > 0 ? (
        <div className="profile-grid">
          {items.map(renderCard)}
        </div>
      ) : (
        <div className="profile-empty">
          <div className="profile-empty__icon">◉</div>
          <h2>Your watchlist is empty</h2>
          <p>Movies and shows you want to watch later will appear here.</p>
          <button className="auth-submit-btn" style={{ width: 'auto', padding: '0.8rem 2rem' }} onClick={() => navigate('/')}>
            Explore Aurelux
          </button>
        </div>
      )}

      <AnimatePresence>
        {toastId && (
          <motion.div 
            className="profile-toast"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            Item removed from watchlist
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Watchlist;
