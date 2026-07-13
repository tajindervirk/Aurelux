import { useRef, useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import SkeletonCard from '../skeletons/SkeletonCard';
import './Carousel.css';

const Carousel = ({
  title,
  items = [],
  CardComponent,
  loading = false,
  showGenreFilter = false,
  genres = [],
  activeGenre: controlledGenre,
  onGenreChange,
  onLoadMore,
  hasMore = false,
}) => {
  const trackRef = useRef(null);
  const observerTarget = useRef(null);
  const [localGenre, setLocalGenre] = useState('All');

  // Use controlled genre if provided, otherwise local
  const isControlled = controlledGenre !== undefined;
  const currentGenre = isControlled ? controlledGenre : localGenre;

  const handleGenreChange = (genreId) => {
    if (isControlled && onGenreChange) {
      onGenreChange(genreId);
    } else {
      setLocalGenre(genreId);
    }
  };

  const handleScroll = (direction) => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Only filter locally if NOT controlled. If controlled, parent gives us the exact items to render.
  const displayItems = useMemo(() => {
    if (isControlled) return items; // Parent handles filtering
    if (currentGenre === 'All') return items;
    return items.filter(
      (item) => item.genre_ids && item.genre_ids.includes(currentGenre)
    );
  }, [items, currentGenre, isControlled]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!onLoadMore || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { root: trackRef.current, rootMargin: '0px 200px 0px 0px', threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loading]);

  return (
    <section className="carousel-section">
      <div className="carousel__header">
        <h2 className="carousel__title">{title}</h2>
        <div className="carousel__controls">
          <button
            className="carousel__btn"
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            className="carousel__btn"
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
          >
            →
          </button>
        </div>
      </div>

      {showGenreFilter && genres.length > 0 && (
        <div className="carousel__filters">
          <motion.button
            className={`carousel__filter-chip ${
              currentGenre === 'All' ? 'carousel__filter-chip--active' : ''
            }`}
            onClick={() => handleGenreChange('All')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            All
          </motion.button>
          {genres.slice(0, 10).map((genre) => (
            <motion.button
              key={genre.id}
              className={`carousel__filter-chip ${
                currentGenre === genre.id ? 'carousel__filter-chip--active' : ''
              }`}
              onClick={() => handleGenreChange(genre.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {genre.name}
            </motion.button>
          ))}
        </div>
      )}

      <div className="carousel__track" ref={trackRef}>
        {loading && displayItems.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="carousel__item">
              <SkeletonCard />
            </div>
          ))
        ) : displayItems.length > 0 ? (
          <>
            {displayItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="carousel__item">
                <CardComponent movie={item} showActions={true} />
              </div>
            ))}
            
            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <div ref={observerTarget} className="carousel__item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loading && <div className="spinner-large" style={{ width: 40, height: 40, borderWidth: 3 }} />}
              </div>
            )}
          </>
        ) : (
          <div className="carousel__empty">
            <p>Nothing to show here yet.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Carousel;
