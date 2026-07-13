import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { selectAuth } from '../../store/slices/authSlice';
import {
  fetchCategoryPage,
  fetchAllGenres,
  resetCategoryGenre,
  selectMovies,
} from '../../store/slices/moviesSlice';
import { fetchFavorites } from '../../store/slices/favoritesSlice';
import { fetchWatchlist } from '../../store/slices/watchlistSlice';

import Hero from '../../components/layout/Hero';
import Carousel from '../../components/common/Carousel';
import MovieCard from '../../components/cards/MovieCard';
import TVCard from '../../components/cards/TVCard';
import AnimeCard from '../../components/cards/AnimeCard';
import './Home.css';

const Home = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(selectAuth);
  const { categories, genres, loading } = useSelector(selectMovies);

  useEffect(() => {
    // Fire all initial media fetches concurrently
    Promise.all([
      dispatch(fetchCategoryPage({ category: 'trending', mediaType: 'movie' })),
      dispatch(fetchCategoryPage({ category: 'popular', mediaType: 'movie' })),
      dispatch(fetchCategoryPage({ category: 'topRated', mediaType: 'movie' })),
      dispatch(fetchCategoryPage({ category: 'nowPlaying', mediaType: 'movie' })),
      dispatch(fetchCategoryPage({ category: 'popularTV', mediaType: 'tv' })),
      dispatch(fetchCategoryPage({ category: 'topRatedTV', mediaType: 'tv' })),
      dispatch(fetchCategoryPage({ category: 'anime', mediaType: 'movie' })),
      dispatch(fetchAllGenres()),
    ]);

    // Fetch user lists if auth'd
    if (isAuthenticated) {
      dispatch(fetchFavorites());
      dispatch(fetchWatchlist());
    }
  }, [dispatch, isAuthenticated]);

  const carouselVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

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

  return (
    <main className="home">
      <Hero movies={categories.trending.items} />

      <div className="home__content-sections">
        <motion.div variants={carouselVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
          <Carousel
            title="Trending This Week"
            items={categories.trending.items}
            CardComponent={MovieCard}
            loading={loading || categories.trending.loading}
            // Trending API doesn't natively support TMDB discover genre filtering on trending endpoints.
            // Leaving without genre filter or just local filter if we remove controlled props.
          />
        </motion.div>

        <motion.div variants={carouselVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
          <Carousel
            title="Now Playing in Theaters"
            items={categories.nowPlaying.items}
            CardComponent={MovieCard}
            loading={loading || categories.nowPlaying.loading}
            onLoadMore={() => handleLoadMore('nowPlaying', 'movie')}
            hasMore={categories.nowPlaying.hasMore}
          />
        </motion.div>

        <motion.div variants={carouselVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
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
        </motion.div>

        <motion.div variants={carouselVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
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
        </motion.div>

        <motion.div variants={carouselVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
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
        </motion.div>

        <motion.div variants={carouselVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
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
        </motion.div>

        <motion.div variants={carouselVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
          <Carousel
            title="Anime"
            items={categories.anime.items}
            CardComponent={AnimeCard}
            loading={loading || categories.anime.loading}
            showGenreFilter={true}
            genres={genres.tv}
            activeGenre={categories.anime.genre}
            onGenreChange={(id) => handleGenreChange('anime', 'movie', id)}
            onLoadMore={() => handleLoadMore('anime', 'movie')}
            hasMore={categories.anime.hasMore}
          />
        </motion.div>
      </div>
    </main>
  );
};

export default Home;
