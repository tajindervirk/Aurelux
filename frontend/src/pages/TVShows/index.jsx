import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCategoryPage,
  fetchAllGenres,
  resetCategoryGenre,
  selectMovies,
} from '../../store/slices/moviesSlice';
import { getPopularTV } from '../../services/tmdbService';
import Carousel from '../../components/common/Carousel';
import TVCard from '../../components/cards/TVCard';
import SkeletonCard from '../../components/skeletons/SkeletonCard';
import '../category.css';

const TVShowsTab = () => {
  const dispatch = useDispatch();
  const { categories, genres, loading } = useSelector(selectMovies);

  // Infinite scroll state for the 'All Shows' grid at the bottom
  const [allShows, setAllShows] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAllGenres());
    dispatch(fetchCategoryPage({ category: 'popularTV', mediaType: 'tv' }));
    dispatch(fetchCategoryPage({ category: 'topRatedTV', mediaType: 'tv' }));
    dispatch(fetchCategoryPage({ category: 'dramaShows', mediaType: 'tv', genre: '18' }));
    dispatch(fetchCategoryPage({ category: 'crimeShows', mediaType: 'tv', genre: '80' }));
    dispatch(fetchCategoryPage({ category: 'scifiShows', mediaType: 'tv', genre: '10765' }));

    // Load first page for infinite scroll grid
    getPopularTV(1).then((data) => {
      setAllShows((prev) => {
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
      const data = await getPopularTV(nextPage);
      setAllShows((prev) => {
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
        <h1 className="gold-text">Explore Shows</h1>
      </div>

      <div className="category-page__carousels">
        <Carousel
          title="Popular Shows"
          items={categories.popularTV.items}
          CardComponent={TVCard}
          loading={loading || categories.popularTV.loading}
          showGenreFilter={true}
          genres={genres.tv}
          activeGenre={categories.popularTV.genre}
          onGenreChange={(id) => handleGenreChange('popularTV', 'tv', id)}
          onLoadMore={() => handleLoadMore('popularTV', 'tv')}
          hasMore={categories.popularTV.hasMore}
        />

        <Carousel
          title="Top Rated Shows"
          items={categories.topRatedTV.items}
          CardComponent={TVCard}
          loading={loading || categories.topRatedTV.loading}
          showGenreFilter={true}
          genres={genres.tv}
          activeGenre={categories.topRatedTV.genre}
          onGenreChange={(id) => handleGenreChange('topRatedTV', 'tv', id)}
          onLoadMore={() => handleLoadMore('topRatedTV', 'tv')}
          hasMore={categories.topRatedTV.hasMore}
        />

        {/* These specific categories have static genres in the slice */}
        <Carousel
          title="Drama"
          items={categories.dramaShows.items}
          CardComponent={TVCard}
          loading={loading || categories.dramaShows.loading}
          onLoadMore={() => handleLoadMore('dramaShows', 'tv')}
          hasMore={categories.dramaShows.hasMore}
        />

        <Carousel
          title="Crime"
          items={categories.crimeShows.items}
          CardComponent={TVCard}
          loading={loading || categories.crimeShows.loading}
          onLoadMore={() => handleLoadMore('crimeShows', 'tv')}
          hasMore={categories.crimeShows.hasMore}
        />

        <Carousel
          title="Sci-Fi & Fantasy"
          items={categories.scifiShows.items}
          CardComponent={TVCard}
          loading={loading || categories.scifiShows.loading}
          onLoadMore={() => handleLoadMore('scifiShows', 'tv')}
          hasMore={categories.scifiShows.hasMore}
        />
      </div>

      {/* INFINITE SCROLL GRID */}
      <div className="category-page__infinite">
        <h2 className="category-page__section-title">All Shows</h2>
        <div className="category-page__grid">
          {allShows.map((show) => (
            <TVCard key={show.id} movie={show} />
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

        {!hasMore && (
          <p className="category-page__end">You've seen all shows ✨</p>
        )}

        <div ref={sentinelRef} style={{ height: '1px' }} />
      </div>
    </main>
  );
};

export default TVShowsTab;
