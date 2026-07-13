import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCategoryPage,
  fetchAllGenres,
  resetCategoryGenre,
  selectMovies,
} from '../../store/slices/moviesSlice';
import { getPopularMovies } from '../../services/tmdbService';
import Carousel from '../../components/common/Carousel';
import MovieCard from '../../components/cards/MovieCard';
import SkeletonCard from '../../components/skeletons/SkeletonCard';
import '../category.css';

const MoviesTab = () => {
  const dispatch = useDispatch();
  const { categories, genres, loading } = useSelector(selectMovies);

  // Infinite scroll state for the 'All Movies' grid at the bottom
  const [allMovies, setAllMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAllGenres());
    dispatch(fetchCategoryPage({ category: 'nowPlaying', mediaType: 'movie' }));
    dispatch(fetchCategoryPage({ category: 'popular', mediaType: 'movie' }));
    dispatch(fetchCategoryPage({ category: 'topRated', mediaType: 'movie' }));
    dispatch(fetchCategoryPage({ category: 'actionMovies', mediaType: 'movie', genre: '28' }));
    dispatch(fetchCategoryPage({ category: 'comedyMovies', mediaType: 'movie', genre: '35' }));
    dispatch(fetchCategoryPage({ category: 'thrillerMovies', mediaType: 'movie', genre: '53' }));
    dispatch(fetchCategoryPage({ category: 'scifiMovies', mediaType: 'movie', genre: '878' }));

    // Load first page for infinite scroll grid
    getPopularMovies(1).then((data) => {
      setAllMovies((prev) => {
        const arr = data.results || [];
        return arr.filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
        );
      });
    });
  }, [dispatch]);

  const handleGenreChange = (category, mediaType, genreId) => {
    dispatch(resetCategoryGenre({ category, genre: genreId }));
    dispatch(fetchCategoryPage({ category, mediaType, page: 1, genre: genreId }));
  };

  const handleLoadMore = (category, mediaType) => {
    const state = categories[category];
    if (state.hasMore && !state.loading) {
      dispatch(fetchCategoryPage({ 
        category, 
        mediaType, 
        page: state.page + 1, 
        genre: state.genre 
      }));
    }
  };

  const loadMoreGrid = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getPopularMovies(nextPage);
      setAllMovies((prev) => {
        const arr = [...prev, ...(data.results || [])];
        return arr.filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
        );
      });
      setPage(nextPage);
      if (nextPage >= data.total_pages) setHasMore(false);
    } catch (e) {
      /* ignore */
    }
    setLoadingMore(false);
  }, [page, hasMore, loadingMore]);

  // IntersectionObserver for infinite scroll grid
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreGrid();
      },
      { 
        threshold: 0.1,
        rootMargin: "0px 0px 2100px 0px"
      }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMoreGrid]);

  return (
    <main className="category-page">
      <div className="category-page__header">
        <h1 className="gold-text">Explore Movies</h1>
      </div>

      <div className="category-page__carousels">
        <Carousel
          title="Now Playing"
          items={categories.nowPlaying.items}
          CardComponent={MovieCard}
          loading={loading || categories.nowPlaying.loading}
          showGenreFilter={true}
          genres={genres.movie}
          activeGenre={categories.nowPlaying.genre}
          onGenreChange={(id) => handleGenreChange('nowPlaying', 'movie', id)}
          onLoadMore={() => handleLoadMore('nowPlaying', 'movie')}
          hasMore={categories.nowPlaying.hasMore}
        />

        <Carousel
          title="Popular Movies"
          items={categories.popular.items}
          CardComponent={MovieCard}
          loading={loading || categories.popular.loading}
          showGenreFilter={true}
          genres={genres.movie}
          activeGenre={categories.popular.genre}
          onGenreChange={(id) => handleGenreChange('popular', 'movie', id)}
          onLoadMore={() => handleLoadMore('popular', 'movie')}
          hasMore={categories.popular.hasMore}
        />

        <Carousel
          title="Top Rated Movies"
          items={categories.topRated.items}
          CardComponent={MovieCard}
          loading={loading || categories.topRated.loading}
          showGenreFilter={true}
          genres={genres.movie}
          activeGenre={categories.topRated.genre}
          onGenreChange={(id) => handleGenreChange('topRated', 'movie', id)}
          onLoadMore={() => handleLoadMore('topRated', 'movie')}
          hasMore={categories.topRated.hasMore}
        />

        {/* These specific categories have static genres in the slice, so we just use onLoadMore */}
        <Carousel
          title="Action Movies"
          items={categories.actionMovies.items}
          CardComponent={MovieCard}
          loading={loading || categories.actionMovies.loading}
          onLoadMore={() => handleLoadMore('actionMovies', 'movie')}
          hasMore={categories.actionMovies.hasMore}
        />

        <Carousel
          title="Comedy Movies"
          items={categories.comedyMovies.items}
          CardComponent={MovieCard}
          loading={loading || categories.comedyMovies.loading}
          onLoadMore={() => handleLoadMore('comedyMovies', 'movie')}
          hasMore={categories.comedyMovies.hasMore}
        />

        <Carousel
          title="Thriller Movies"
          items={categories.thrillerMovies.items}
          CardComponent={MovieCard}
          loading={loading || categories.thrillerMovies.loading}
          onLoadMore={() => handleLoadMore('thrillerMovies', 'movie')}
          hasMore={categories.thrillerMovies.hasMore}
        />

        <Carousel
          title="Sci-Fi Movies"
          items={categories.scifiMovies.items}
          CardComponent={MovieCard}
          loading={loading || categories.scifiMovies.loading}
          onLoadMore={() => handleLoadMore('scifiMovies', 'movie')}
          hasMore={categories.scifiMovies.hasMore}
        />
      </div>

      {/* INFINITE SCROLL GRID */}
      <div className="category-page__infinite">
        <h2 className="category-page__section-title">All Movies</h2>
        <div className="category-page__grid">
          {allMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>

        {loadingMore && (
          <div className="category-page__grid">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <SkeletonCard key={i} />
              ))}
          </div>
        )}

        <div ref={sentinelRef} style={{ height: '20px', width: '100%' }} />
      </div>
    </main>
  );
};

export default MoviesTab;
