import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCategoryPage,
  selectMovies,
} from '../../store/slices/moviesSlice';
import { discoverAnime } from '../../services/tmdbService';
import Carousel from '../../components/common/Carousel';
import AnimeCard from '../../components/cards/AnimeCard';
import SkeletonCard from '../../components/skeletons/SkeletonCard';
import '../category.css';

const AnimeTab = () => {
  const dispatch = useDispatch();
  const { categories, loading } = useSelector(selectMovies);

  // Infinite scroll state for the 'All Anime' grid at the bottom
  const [allAnime, setAllAnime] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    // Basic TMDB anime
    dispatch(fetchCategoryPage({ category: 'anime', mediaType: 'movie' }));
    
    // TMDB genre-specific anime
    dispatch(fetchCategoryPage({ category: 'topRatedAnime', mediaType: 'movie', sortBy: 'vote_average.desc' }));
    dispatch(fetchCategoryPage({ category: 'actionAnime', mediaType: 'movie', genre: '28' }));
    dispatch(fetchCategoryPage({ category: 'romanceAnime', mediaType: 'movie', genre: '10749' }));

    // MAL-powered anime
    dispatch(fetchCategoryPage({ category: 'malTopRanked', mediaType: 'anime' }));
    dispatch(fetchCategoryPage({ category: 'malSeasonal', mediaType: 'anime' }));
    dispatch(fetchCategoryPage({ category: 'malTopAiring', mediaType: 'anime' }));

    // Load first page for infinite scroll grid
    discoverAnime('', 1).then((data) => {
      setAllAnime(data.results || []);
    });
  }, [dispatch]);

  const handleLoadMore = (category, mediaType) => {
    const state = categories[category];
    if (state.hasMore && !state.loading) {
      dispatch(fetchCategoryPage({ 
        category, 
        mediaType, 
        page: state.page + 1, 
        genre: state.genre,
        sortBy: state.sortBy
      }));
    }
  };

  const loadMoreGrid = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await discoverAnime('', nextPage);
      setAllAnime((prev) => [...prev, ...(data.results || [])]);
      setPage(nextPage);
      if (nextPage >= (data.total_pages || 500)) setHasMore(false);
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
        <h1 style={{ color: 'var(--color-anime)' }}>Explore Anime</h1>
      </div>

      <div className="category-page__carousels">
        <Carousel
          title="Popular Anime"
          items={categories.anime.items}
          CardComponent={AnimeCard}
          loading={loading || categories.anime.loading}
          onLoadMore={() => handleLoadMore('anime', 'movie')}
          hasMore={categories.anime.hasMore}
        />

        {/* MAL-powered carousels */}
        <Carousel
          title="Top Ranked Anime"
          items={categories.malTopRanked.items}
          CardComponent={AnimeCard}
          loading={loading || categories.malTopRanked.loading}
          onLoadMore={() => handleLoadMore('malTopRanked', 'anime')}
          hasMore={categories.malTopRanked.hasMore}
        />

        <Carousel
          title="This Season"
          items={categories.malSeasonal.items}
          CardComponent={AnimeCard}
          loading={loading || categories.malSeasonal.loading}
          onLoadMore={() => handleLoadMore('malSeasonal', 'anime')}
          hasMore={categories.malSeasonal.hasMore}
        />

        <Carousel
          title="Top Airing"
          items={categories.malTopAiring.items}
          CardComponent={AnimeCard}
          loading={loading || categories.malTopAiring.loading}
          onLoadMore={() => handleLoadMore('malTopAiring', 'anime')}
          hasMore={categories.malTopAiring.hasMore}
        />

        {/* TMDB genre carousels */}
        <Carousel
          title="Top Rated Anime"
          items={categories.topRatedAnime.items}
          CardComponent={AnimeCard}
          loading={loading || categories.topRatedAnime.loading}
          onLoadMore={() => handleLoadMore('topRatedAnime', 'movie')}
          hasMore={categories.topRatedAnime.hasMore}
        />

        <Carousel
          title="Action Anime"
          items={categories.actionAnime.items}
          CardComponent={AnimeCard}
          loading={loading || categories.actionAnime.loading}
          onLoadMore={() => handleLoadMore('actionAnime', 'movie')}
          hasMore={categories.actionAnime.hasMore}
        />

        <Carousel
          title="Romance Anime"
          items={categories.romanceAnime.items}
          CardComponent={AnimeCard}
          loading={loading || categories.romanceAnime.loading}
          onLoadMore={() => handleLoadMore('romanceAnime', 'movie')}
          hasMore={categories.romanceAnime.hasMore}
        />
      </div>

      {/* INFINITE SCROLL GRID */}
      <div className="category-page__infinite">
        <h2 className="category-page__section-title">All Anime</h2>
        <div className="category-page__grid">
          {allAnime.map((item) => (
            <AnimeCard key={item.id} movie={item} />
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
          <p className="category-page__end">You've seen all anime ✨</p>
        )}

        <div ref={sentinelRef} style={{ height: '1px' }} />
      </div>
    </main>
  );
};

export default AnimeTab;
