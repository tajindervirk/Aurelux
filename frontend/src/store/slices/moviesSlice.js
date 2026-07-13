import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlaying,
  getPopularTV,
  getTopRatedTV,
  discoverAnime,
  discoverByGenre,
  getMovieGenres,
  getTVGenres,
  getMovieDetails,
  getTVDetails,
  searchMulti,
} from '../../services/tmdbService';
import malService from '../../services/malService';

const defaultCategoryState = {
  items: [],
  page: 1,
  genre: 'All',
  hasMore: true,
  loading: false,
};

// Generic fetcher for categories
export const fetchCategoryPage = createAsyncThunk(
  'movies/fetchCategoryPage',
  async ({ category, mediaType, page = 1, genre = 'All', sortBy = 'popularity.desc' }, { getState }) => {
    let data;
    
    // Anime special handling
    if (category === 'anime' || category === 'actionAnime' || category === 'romanceAnime' || category === 'topRatedAnime') {
      const extraGenre = genre === 'All' ? '' : genre;
      data = await discoverAnime(extraGenre, page, sortBy);
    } 
    // MAL-powered endpoints
    else if (category === 'malTopRanked') {
      const { results, total_pages } = await malService.getAnimeRanking('all', 20, page);
      return { category, genre, page, results, totalPages: total_pages };
    }
    else if (category === 'malSeasonal') {
      const { results, total_pages } = await malService.getSeasonalAnime(undefined, undefined, 20, page);
      return { category, genre, page, results, totalPages: total_pages };
    }
    else if (category === 'malTopAiring') {
      const { results, total_pages } = await malService.getAnimeRanking('airing', 20, page);
      return { category, genre, page, results, totalPages: total_pages };
    }
    // Genre Filtered (except Anime)
    else if (genre !== 'All') {
      data = await discoverByGenre(mediaType, genre, page);
    } 
    // Trending
    else if (category === 'trending') {
      data = await getTrending('all', 'week', page);
    }
    // Standard Endpoints
    else {
      switch (category) {
        case 'popular': data = await getPopularMovies(page); break;
        case 'topRated': data = await getTopRatedMovies(page); break;
        case 'nowPlaying': data = await getNowPlaying(page); break;
        case 'popularTV': data = await getPopularTV(page); break;
        case 'topRatedTV': data = await getTopRatedTV(page); break;
        default: data = { results: [], total_pages: 0 };
      }
    }

    return {
      category,
      genre,
      page,
      results: data.results || [],
      totalPages: data.total_pages || 1,
    };
  }
);

export const fetchAllGenres = createAsyncThunk('movies/fetchAllGenres', async () => {
  const [movieGenres, tvGenres] = await Promise.all([getMovieGenres(), getTVGenres()]);
  return { movie: movieGenres, tv: tvGenres };
});

export const fetchMovieDetails = createAsyncThunk('movies/fetchMovieDetails', async (id) => {
  const data = await getMovieDetails(id);
  return data;
});

export const fetchTVDetails = createAsyncThunk('movies/fetchTVDetails', async (id) => {
  const data = await getTVDetails(id);
  return data;
});

// Search
export const searchContent = createAsyncThunk(
  'movies/searchContent',
  async ({ query, page = 1 }) => {
    const data = await searchMulti(query, page);
    return {
      query,
      results: data.results || [],
      page: data.page,
      totalPages: data.total_pages,
    };
  }
);

export const loadMoreSearch = createAsyncThunk(
  'movies/loadMoreSearch',
  async (_, { getState }) => {
    const { movies } = getState();
    const nextPage = movies.searchPage + 1;
    const query = movies.searchQuery;
    const data = await searchMulti(query, nextPage);
    return {
      results: data.results || [],
      page: data.page,
      totalPages: data.total_pages,
    };
  }
);

const initialState = {
  categories: {
    trending: { ...defaultCategoryState },
    popular: { ...defaultCategoryState },
    topRated: { ...defaultCategoryState },
    nowPlaying: { ...defaultCategoryState },
    popularTV: { ...defaultCategoryState },
    topRatedTV: { ...defaultCategoryState },
    anime: { ...defaultCategoryState },
    
    // Movie genres
    actionMovies: { ...defaultCategoryState, genre: '28' },
    comedyMovies: { ...defaultCategoryState, genre: '35' },
    thrillerMovies: { ...defaultCategoryState, genre: '53' },
    scifiMovies: { ...defaultCategoryState, genre: '878' },

    // TV Shows genres
    dramaShows: { ...defaultCategoryState, genre: '18' },
    crimeShows: { ...defaultCategoryState, genre: '80' },
    scifiShows: { ...defaultCategoryState, genre: '10765' },

    // Anime sections
    malTopRanked: { ...defaultCategoryState },
    malSeasonal: { ...defaultCategoryState },
    malTopAiring: { ...defaultCategoryState },
    topRatedAnime: { ...defaultCategoryState, genre: '', sortBy: 'vote_average.desc' },
    actionAnime: { ...defaultCategoryState, genre: '28' },
    romanceAnime: { ...defaultCategoryState, genre: '10749' },
  },
  currentMovie: null,
  currentTV: null,
  searchResults: [],
  searchQuery: '',
  searchPage: 1,
  searchTotalPages: 0,
  hasMore: false,
  genres: { movie: [], tv: [] },
  loading: false, // global loading
  searchLoading: false,
  detailLoading: false,
  error: null,
};

const moviesSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    resetCategoryGenre: (state, action) => {
      const { category, genre } = action.payload;
      if (state.categories[category]) {
        state.categories[category].genre = genre;
        state.categories[category].items = [];
        state.categories[category].page = 1;
        state.categories[category].hasMore = true;
      }
    }
  },
  extraReducers: (builder) => {
    // Genres
    builder.addCase(fetchAllGenres.fulfilled, (state, action) => {
      state.genres = action.payload;
    });

    // Categories
    builder.addCase(fetchCategoryPage.pending, (state, action) => {
      const { category, page } = action.meta.arg;
      if (state.categories[category]) {
        state.categories[category].loading = true;
        // if fetching first page, we might want to keep old items or clear them. 
        // We already clear in resetCategoryGenre so it's fine.
      } else {
        state.loading = true;
      }
    });
    builder.addCase(fetchCategoryPage.fulfilled, (state, action) => {
      const { category, genre, page, results, totalPages } = action.payload;
      
      if (state.categories[category]) {
        const catState = state.categories[category];
        
        if (page === 1) {
          catState.items = results;
        } else {
          catState.items = [...catState.items, ...results];
        }
        
        catState.page = page;
        catState.genre = genre;
        catState.hasMore = page < totalPages;
        catState.loading = false;
      }
      state.loading = false;
    });
    builder.addCase(fetchCategoryPage.rejected, (state, action) => {
      const { category } = action.meta.arg;
      if (state.categories[category]) {
        state.categories[category].loading = false;
      }
      state.loading = false;
      state.error = action.error.message;
    });

    // Search
    builder.addCase(searchContent.pending, (state) => {
      state.searchLoading = true;
      state.searchResults = [];
      state.hasMore = false;
    });
    builder.addCase(searchContent.fulfilled, (state, action) => {
      state.searchLoading = false;
      state.searchQuery = action.payload.query;
      state.searchResults = action.payload.results;
      state.searchPage = action.payload.page;
      state.searchTotalPages = action.payload.totalPages;
      state.hasMore = action.payload.page < action.payload.totalPages;
    });
    builder.addCase(searchContent.rejected, (state, action) => {
      state.searchLoading = false;
      state.error = action.error.message;
    });

    // Load More Search
    builder.addCase(loadMoreSearch.fulfilled, (state, action) => {
      state.searchResults = [...state.searchResults, ...action.payload.results];
      state.searchPage = action.payload.page;
      state.hasMore = action.payload.page < action.payload.totalPages;
    });

    // Detail pages
    builder.addCase(fetchMovieDetails.pending, (state) => {
      state.detailLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMovieDetails.fulfilled, (state, action) => {
      state.detailLoading = false;
      state.currentMovie = action.payload;
    });
    builder.addCase(fetchMovieDetails.rejected, (state, action) => {
      state.detailLoading = false;
      state.error = action.error.message;
    });

    builder.addCase(fetchTVDetails.pending, (state) => {
      state.detailLoading = true;
      state.error = null;
    });
    builder.addCase(fetchTVDetails.fulfilled, (state, action) => {
      state.detailLoading = false;
      state.currentTV = action.payload;
    });
    builder.addCase(fetchTVDetails.rejected, (state, action) => {
      state.detailLoading = false;
      state.error = action.error.message;
    });
  },
});

export const { resetCategoryGenre } = moviesSlice.actions;

export const selectMovies = (state) => state.movies;

export default moviesSlice.reducer;
