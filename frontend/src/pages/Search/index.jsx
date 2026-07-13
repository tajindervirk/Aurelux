import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  searchContent,
  loadMoreSearch,
  fetchAllGenres,
  selectMovies,
} from '../../store/slices/moviesSlice';
import useDebounce from '../../hooks/useDebounce';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import MovieCard from '../../components/cards/MovieCard';
import TVCard from '../../components/cards/TVCard';
import AnimeCard from '../../components/cards/AnimeCard';
import PersonCard from '../../components/cards/PersonCard';
import SkeletonCard from '../../components/skeletons/SkeletonCard';
import Carousel from '../../components/common/Carousel';
import './Search.css';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'Shows' },
  { id: 'anime', label: 'Anime' },
  { id: 'person', label: 'People' },
];

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const initialQuery = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(initialQuery);
  const debouncedQuery = useDebounce(inputValue, 500);

  const [activeTab, setActiveTab] = useState('all');
  const [activeGenre, setActiveGenre] = useState(null);

  const {
    searchResults,
    searchLoading,
    hasMoreSearch,
    searchQuery,
    genres,
    categories,
  } = useSelector(selectMovies);

  const popular = categories?.popular?.items || [];
  const trending = categories?.trending?.items || [];

  // Fetch genres if missing
  useEffect(() => {
    if (!genres.movie?.length || !genres.tv?.length) {
      dispatch(fetchAllGenres());
    }
  }, [dispatch, genres]);

  // Handle URL updates and initial search dispatch
  useEffect(() => {
    if (debouncedQuery.trim().length > 2 && debouncedQuery !== searchQuery) {
      setSearchParams({ q: debouncedQuery });
      dispatch(searchContent({ query: debouncedQuery, page: 1 }));
    } else if (debouncedQuery.trim().length === 0) {
      setSearchParams({});
    }
  }, [debouncedQuery, dispatch, setSearchParams, searchQuery]);

  // Handle infinite scroll
  const handleLoadMore = useCallback(() => {
    if (!searchLoading && hasMoreSearch && searchQuery) {
      dispatch(loadMoreSearch());
    }
  }, [dispatch, searchLoading, hasMoreSearch, searchQuery]);

  const bottomBoundaryRef = useInfiniteScroll(handleLoadMore, hasMoreSearch);

  // Filtering logic
  const filteredResults = searchResults.filter((item) => {
    // 1. Filter by Tab
    if (activeTab === 'movie' && item.media_type !== 'movie') return false;
    if (activeTab === 'tv' && item.media_type !== 'tv') return false;
    if (activeTab === 'person' && item.media_type !== 'person') return false;
    if (activeTab === 'anime') {
      if (item.media_type !== 'tv' && item.media_type !== 'movie') return false;
      if (item.original_language !== 'ja') return false;
    }
    // "all" passes through

    // Filter out anime from normal TV/Movie tabs based on org lang (optional UX choice)
    if (activeTab === 'tv' && item.original_language === 'ja') return false;

    // 2. Filter by Genre
    if (activeGenre) {
      if (!item.genre_ids?.includes(activeGenre)) return false;
    }

    return true;
  });

  const currentGenres = activeTab === 'movie' ? genres.movie : activeTab === 'tv' ? genres.tv : [];
  const showGenres = (activeTab === 'movie' || activeTab === 'tv') && currentGenres?.length > 0;

  return (
    <main className="search-page">
      <div className="search-page__header">
        <div className="search-page__input-wrapper">
          <svg className="search-page__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="search-page__input"
            placeholder="Search for movies, shows, anime, or people..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
          {inputValue && (
            <button className="search-page__clear-btn" onClick={() => setInputValue('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {!debouncedQuery ? (
        // Empty Search View
        <div className="search-page__empty">
          <div className="search-page__empty-msg">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <h2>Discover Your Next Favorite</h2>
            <p>Start typing to search across movies, shows, and anime.</p>
          </div>
          {trending?.length > 0 && (
            <Carousel title="Trending Searches" items={trending} CardComponent={MovieCard} />
          )}
        </div>
      ) : (
        // Results View
        <div className="search-page__results-container">
          <div className="search-page__tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`search-page__tab ${activeTab === tab.id ? 'search-page__tab--active' : ''}`}
                onClick={() => { setActiveTab(tab.id); setActiveGenre(null); }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {showGenres && (
              <motion.div 
                className="search-page__genres"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <button
                  className={`search-page__genre-chip ${!activeGenre ? 'search-page__genre-chip--active' : ''}`}
                  onClick={() => setActiveGenre(null)}
                >
                  All
                </button>
                {currentGenres.map((g) => (
                  <button
                    key={g.id}
                    className={`search-page__genre-chip ${activeGenre === g.id ? 'search-page__genre-chip--active' : ''}`}
                    onClick={() => setActiveGenre(g.id)}
                  >
                    {g.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="search-page__count">
            Showing {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for "{debouncedQuery}"
          </p>

          {filteredResults.length > 0 ? (
            <div className="search-page__grid">
              {filteredResults.map((item) => {
                const key = `${item.media_type}-${item.id}`;
                if (item.media_type === 'person') return <PersonCard key={key} person={item} />;
                if (item.media_type === 'tv') {
                  return item.original_language === 'ja' 
                    ? <AnimeCard key={key} movie={item} />
                    : <TVCard key={key} movie={item} />;
                }
                if (item.media_type === 'movie') {
                  return item.original_language === 'ja'
                    ? <AnimeCard key={key} movie={item} />
                    : <MovieCard key={key} movie={item} />;
                }
                return null;
              })}
              
              {/* Infinite Scroll Loader */}
              {searchLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={`skel-${i}`} />)}
            </div>
          ) : (
             !searchLoading && (
               <div className="search-page__no-results">
                 <h3>No results found for "{debouncedQuery}"</h3>
                 <p>Try different keywords or check out popular movies.</p>
                 {popular?.length > 0 && (
                   <div style={{ marginTop: '3rem', width: '100%', textAlign: 'left' }}>
                     <Carousel title="Popular Right Now" items={popular} CardComponent={MovieCard} />
                   </div>
                 )}
               </div>
             )
          )}

          {/* Sentinel for Infinite Scroll */}
          <div ref={bottomBoundaryRef} style={{ height: '40px', marginTop: '2rem' }}>
            {searchLoading && filteredResults.length > 0 && (
               <div style={{ display: 'flex', justifyContent: 'center' }}>
                 <div className="video-player__spinner" style={{ width: '30px', height: '30px', borderWidth: '2px' }} />
               </div>
            )}
            {!hasMoreSearch && filteredResults.length > 0 && (
              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No more results.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Search;
