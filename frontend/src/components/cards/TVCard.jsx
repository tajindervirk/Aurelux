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

const TVCard = ({ movie, showActions = true }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(selectAuth);
  const { openPlayer } = usePlayerContext();
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isFav = useSelector((state) => selectIsFavorite(state, movie?.id));
  const isInWL = useSelector((state) => selectIsInWatchlist(state, movie?.id));

  if (!movie) return null;
  const year = movie.first_air_date ? movie.first_air_date.split('-')[0] : '';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const seasons = movie.number_of_seasons;

  const payload = {
    tmdbId: movie.id,
    title: movie.name || movie.title,
    poster: getPosterUrl(movie.poster_path, 'w500'),
    type: 'tv',
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    isFav ? dispatch(removeFavorite(movie.id)) : dispatch(addFavorite(payload));
  };

  const handleWatchlistToggle = (e) => {
    e.stopPropagation();
    isInWL ? dispatch(removeFromWatchlist(movie.id)) : dispatch(addToWatchlist(payload));
  };

  return (
    <motion.div
      className="movie-card glass-card"
      whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(201, 168, 76, 0.4)', borderColor: '#C9A84C' }}
      transition={{ duration: 0.3 }}
      onClick={() => navigate(`/tv/${movie.id}`)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="movie-card__poster-wrap">
        <img
          className="movie-card__poster"
          src={imgError ? '/placeholder-poster.jpg' : getPosterUrl(movie.poster_path, 'w500')}
          alt={movie.name || movie.title}
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
          <h3 className="movie-card__title">{movie.name || movie.title}</h3>
          <div className="movie-card__meta">
            {year && <span className="movie-card__year">{year}</span>}
            <span className="movie-card__rating">★ {rating}</span>
            {seasons && <span className="movie-card__year">{seasons} Season{seasons > 1 ? 's' : ''}</span>}
          </div>
          <span className="movie-card__badge movie-card__badge--tv">TV</span>
          {showActions && (
            <div className="movie-card__actions">
              <button
                className="movie-card__watch-btn"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  openPlayer({
                    tmdbId: movie.id,
                    type: 'tv',
                    title: movie.name || movie.title,
                    poster: getPosterUrl(movie.poster_path, 'w500'),
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

export default TVCard;
