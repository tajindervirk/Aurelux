import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getPosterUrl } from '../../services/tmdbService';
import { selectMovies } from '../../store/slices/moviesSlice';
import { usePlayerContext } from '../../context/PlayerContext';
import './Hero.css';

const Hero = ({ movies = [] }) => {
  const navigate = useNavigate();
  const { genres } = useSelector(selectMovies);
  const { openPlayer } = usePlayerContext();

  // 1. All State Hooks
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 3. Derived Consts (Base)
  const featured = movies.length > 0 ? movies.slice(0, 6) : [];
  const currentMovie = featured[currentIndex] || null;

  // 4. Derived Consts (Computed)
  const starRating = currentMovie
    ? Math.round((currentMovie.vote_average / 2) * 10) / 10
    : 0;

  // 5. Callbacks
  const getGenreNames = useCallback(
    (genreIds = []) => {
      const allGenres = [...(genres.movie || []), ...(genres.tv || [])];
      return genreIds
        .slice(0, 3)
        .map((id) => allGenres.find((g) => g.id === id)?.name)
        .filter(Boolean);
    },
    [genres]
  );

  // 6. Effects
  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-rotate every 10s
  useEffect(() => {
    if (featured.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [featured.length]);

  if (featured.length === 0) return null;

  return (
    <section
      className="hero"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        {currentMovie && (
          <motion.div
            key={`backdrop-${currentMovie.id}`}
            className="hero__backdrop"
            style={{
              backgroundImage: currentMovie.backdrop_path
                ? `url(https://image.tmdb.org/t/p/original${currentMovie.backdrop_path})`
                : (currentMovie.poster_path ? `url(https://image.tmdb.org/t/p/w780${currentMovie.poster_path})` : 'none'),
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        )}
      </AnimatePresence>

      {/* GRADIENT OVERLAYS */}
      <div className="hero__overlay-bottom" />
      <div className="hero__overlay-left" />

      {/* CONTENT */}
      <div className="hero__content">
        <AnimatePresence mode="wait">
          {currentMovie && (
            <motion.div
              key={currentMovie.id}
              className="hero__info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            >
              <motion.span
                className="hero__trending-label gold-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                NOW TRENDING
              </motion.span>

              <motion.h1
                className="hero__title"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                {currentMovie.title || currentMovie.name}
              </motion.h1>

              <motion.div
                className="hero__genres"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
              >
                {getGenreNames(currentMovie.genre_ids).map((genre) => (
                  <span key={genre} className="hero__genre-chip">
                    {genre}
                  </span>
                ))}
              </motion.div>

              <motion.div
                className="hero__rating"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.6 }}
              >
                <div className="hero__stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`hero__star ${
                        star <= Math.round(starRating) ? 'hero__star--filled' : ''
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="hero__rating-value">{starRating.toFixed(1)}</span>
              </motion.div>

              <motion.p
                className="hero__overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.6 }}
              >
                {currentMovie.overview}
              </motion.p>

              <motion.div
                className="hero__actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <button
                  className="hero__btn hero__btn--primary"
                  onClick={() => {
                    const type = currentMovie.media_type || (currentMovie.title ? 'movie' : 'tv');
                    openPlayer({
                      tmdbId: currentMovie.id,
                      type,
                      title: currentMovie.title || currentMovie.name,
                      poster: getPosterUrl(currentMovie.poster_path),
                      season: 1,
                      episode: 1,
                    });
                  }}
                >
                  ▶ Watch Now
                </button>
                <button
                  className="hero__btn hero__btn--outline"
                  onClick={() => {
                    const type = currentMovie.media_type || (currentMovie.title ? 'movie' : 'tv');
                    navigate(type === 'tv' ? `/tv/${currentMovie.id}` : `/movie/${currentMovie.id}`);
                  }}
                >
                  More Info
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress dots */}
        <div className="hero__dots">
          {featured.map((_, i) => (
            <motion.button
              key={i}
              className={`hero__dot ${i === currentIndex ? 'hero__dot--active' : ''}`}
              onClick={() => setCurrentIndex(i)}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
