import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectAuth } from '../../store/slices/authSlice';
import { selectIsFavorite, addFavorite, removeFavorite } from '../../store/slices/favoritesSlice';
import { selectIsInWatchlist, addToWatchlist, removeFromWatchlist } from '../../store/slices/watchlistSlice';
import { getPosterUrl } from '../../services/tmdbService';
import { usePlayerContext } from '../../context/PlayerContext';
import './MovieCard.css';

const overlayVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

const MovieCard = ({ movie, showActions = true }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(selectAuth);
  const { openPlayer } = usePlayerContext();
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isFav = useSelector((state) => selectIsFavorite(state, movie?.id));
  const isInWL = useSelector((state) => selectIsInWatchlist(state, movie?.id));

  if (!movie) {
    return (
      <div className="movie-card movie-card--skeleton">
        <div className="movie-card__poster skeleton" style={{ aspectRatio: '2/3' }} />
        <div className="movie-card__skeleton-info">
          <div className="skeleton" style={{ width: '80%', height: '1rem' }} />
          <div className="skeleton" style={{ width: '50%', height: '0.8rem' }} />
        </div>
      </div>
    );
  }

  const year = movie.release_date ? movie.release_date.split('-')[0] : '';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const mediaType = movie.media_type || 'movie';

  const moviePayload = {
    tmdbId: movie.id,
    title: movie.title || movie.name,
    poster: getPosterUrl(movie.poster_path, 'w500'),
    type: mediaType,
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    if (isFav) {
      dispatch(removeFavorite(movie.id));
    } else {
      dispatch(addFavorite(moviePayload));
    }
  };

  const handleWatchlistToggle = (e) => {
    e.stopPropagation();
    if (isInWL) {
      dispatch(removeFromWatchlist(movie.id));
    } else {
      dispatch(addToWatchlist(moviePayload));
    }
  };

  const handleClick = () => {
    if (movie.media_type === 'tv') {
      navigate(`/tv/${movie.id}`);
    } else {
      navigate(`/movie/${movie.id}`);
    }
  };

  return (
    <motion.div
      className="movie-card glass-card"
      whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(201, 168, 76, 0.4)', borderColor: '#C9A84C' }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="movie-card__poster-wrap">
        <img
          className="movie-card__poster"
          src={imgError ? '/placeholder-poster.jpg' : getPosterUrl(movie.poster_path, 'w500')}
          alt={movie.title || movie.name}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
        />

        <motion.div
          className="movie-card__overlay"
          variants={overlayVariants}
          initial="hidden"
          animate={isHovered ? 'visible' : 'hidden'}
        >
          <h3 className="movie-card__title">{movie.title || movie.name}</h3>
          <div className="movie-card__meta">
            {year && <span className="movie-card__year">{year}</span>}
            <span className="movie-card__rating">★ {rating}</span>
          </div>
          <span className={`movie-card__badge movie-card__badge--${mediaType}`}>
            {mediaType.toUpperCase()}
          </span>

          {showActions && (
            <div className="movie-card__actions">
              <button
                className="movie-card__watch-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openPlayer({
                    tmdbId: movie.id,
                    type: movie.media_type === 'tv' ? 'tv' : 'movie',
                    title: movie.title || movie.name,
                    poster: getPosterUrl(movie.poster_path),
                    season: 1,
                    episode: 1
                  });
                }}
              >
                ▶ Watch Now
              </button>
              {isAuthenticated && (
                <div className="movie-card__icon-btns">
                  <button
                    className={`movie-card__icon-btn ${isFav ? 'movie-card__icon-btn--active' : ''}`}
                    onClick={handleFavoriteToggle}
                    aria-label="Toggle favorite"
                    title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    {isFav ? '♥' : '♡'}
                  </button>
                  <button
                    className={`movie-card__icon-btn ${isInWL ? 'movie-card__icon-btn--active' : ''}`}
                    onClick={handleWatchlistToggle}
                    aria-label="Toggle watchlist"
                    title={isInWL ? "Remove from Watchlist" : "Add to Watchlist"}
                  >
                    {isInWL ? '◉' : '○'}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MovieCard;
