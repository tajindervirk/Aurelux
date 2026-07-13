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

const AnimeCard = ({ movie: anime, showActions = true }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(selectAuth);
  const { openPlayer } = usePlayerContext();
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isFav = useSelector((state) => selectIsFavorite(state, anime?.id));
  const isInWL = useSelector((state) => selectIsInWatchlist(state, anime?.id));
  
  if (!anime) return null;

  const year = (anime.release_date || anime.first_air_date || anime.start_date || '').split('-')[0];
  const rating = anime.vote_average ? anime.vote_average.toFixed(1) : 'N/A';
  const episodeCount = anime.episode_count || anime.num_episodes;

  // Handle MAL images vs TMDB images
  const imageUrl = anime.mal_image ||
    (anime.poster_path ? getPosterUrl(anime.poster_path, 'w500') :
    '/placeholder-poster.jpg');

  const payload = {
    tmdbId: anime.id,
    malId: anime.mal_id || null,
    title: anime.title || anime.name,
    poster: imageUrl,
    type: 'anime',
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    isFav ? dispatch(removeFavorite(anime.id)) : dispatch(addFavorite(payload));
  };

  const handleWatchlistToggle = (e) => {
    e.stopPropagation();
    isInWL ? dispatch(removeFromWatchlist(anime.id)) : dispatch(addToWatchlist(payload));
  };

  const detailPath = anime.mal_id
    ? `/anime/${anime.mal_id}`
    : (anime.first_air_date ? `/tv/${anime.id}` : `/movie/${anime.id}`);

  return (
    <motion.div
      className="movie-card glass-card"
      whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(124, 58, 237, 0.4)', borderColor: '#7c3aed' }}
      transition={{ duration: 0.3 }}
      onClick={() => navigate(detailPath)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="movie-card__poster-wrap">
        <img
          className="movie-card__poster"
          src={imgError ? '/placeholder-poster.jpg' : imageUrl}
          alt={anime.title || anime.name}
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
          <h3 className="movie-card__title">{anime.title || anime.name}</h3>
          <div className="movie-card__meta">
            {year && <span className="movie-card__year">{year}</span>}
            <span className="movie-card__rating">★ {rating}</span>
            {episodeCount && <span className="movie-card__year">{episodeCount} Eps</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <span className="movie-card__badge movie-card__badge--anime">ANIME</span>
            <span className="movie-card__badge" style={{ background: '#1e293b', color: '#94a3b8' }}>SUB</span>
          </div>
          {showActions && (
            <div className="movie-card__actions">
              <button
                className="movie-card__watch-btn"
                style={{ background: '#7c3aed' }}
                onClick={(e) => {
                  e.stopPropagation();
                  openPlayer({
                    tmdbId: anime.id,
                    malId: anime.mal_id || null,
                    type: 'anime',
                    title: anime.title || anime.name,
                    poster: imageUrl,
                    episode: 1,
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

export default AnimeCard;
