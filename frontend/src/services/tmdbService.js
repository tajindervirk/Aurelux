import axios from 'axios';

const tmdbApi = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || '/api') + '/tmdb',
});

// Cache setup
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes in ms

const withCache = async (cacheKey, fetcher) => {
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
    // Expired, delete it
    cache.delete(cacheKey);
  }

  try {
    const data = await fetcher();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error(`Error in ${cacheKey}:`, error.message);
    throw error;
  }
};

const handleRequest = async (fetcher) => {
  try {
    return await fetcher();
  } catch (error) {
    console.error('TMDB API Error:', error.message);
    throw error;
  }
};

// IMAGE HELPERS
export const POSTER_SIZES = ['w200', 'w300', 'w500', 'w780', 'original'];

export const getPosterUrl = (path, size = 'w500') => {
  if (!path) return '/placeholder-poster.jpg';
  return `${import.meta.env.VITE_TMDB_IMAGE_BASE}${size}${path}`;
};

export const getBackdropUrl = (path, size = 'original') => {
  if (!path) return '/placeholder-backdrop.jpg';
  return `${import.meta.env.VITE_TMDB_IMAGE_BASE}${size}${path}`;
};

// MOVIE FUNCTIONS
export const getTrending = async (mediaType = 'all', timeWindow = 'week', page = 1) => {
  const cacheKey = `getTrending_${mediaType}_${timeWindow}_${page}`;
  return withCache(cacheKey, async () => {
    const response = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}?page=${page}`);
    return response.data;
  });
};

export const getPopularMovies = async (page = 1) => {
  const cacheKey = `getPopularMovies_${page}`;
  return withCache(cacheKey, async () => {
    const response = await tmdbApi.get(`/movie/popular?page=${page}`);
    return response.data;
  });
};

export const getTopRatedMovies = async (page = 1) => {
  const cacheKey = `getTopRatedMovies_${page}`;
  return withCache(cacheKey, async () => {
    const response = await tmdbApi.get(`/movie/top_rated?page=${page}`);
    return response.data;
  });
};

export const getNowPlaying = async (page = 1) => {
  const cacheKey = `getNowPlaying_${page}`;
  return withCache(cacheKey, async () => {
    const response = await tmdbApi.get(`/movie/now_playing?page=${page}`);
    return response.data;
  });
};

export const getMovieDetails = async (id) => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/movie/${id}?append_to_response=videos,credits,similar,reviews`);
    return response.data || {};
  });
};

export const getMovieVideos = async (id) => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/movie/${id}/videos`);
    const trailers = response.data.results?.filter(
      (video) => video.type === 'Trailer' && video.site === 'YouTube'
    ) || [];
    return trailers.length > 0 ? trailers[0] : null;
  });
};

// TV FUNCTIONS
export const getPopularTV = async (page = 1) => {
  const cacheKey = `getPopularTV_${page}`;
  return withCache(cacheKey, async () => {
    const response = await tmdbApi.get(`/tv/popular?page=${page}`);
    return response.data;
  });
};

export const getTopRatedTV = async (page = 1) => {
  const cacheKey = `getTopRatedTV_${page}`;
  return withCache(cacheKey, async () => {
    const response = await tmdbApi.get(`/tv/top_rated?page=${page}`);
    return response.data;
  });
};

export const getAiringToday = async () => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/tv/airing_today`);
    return response.data || { results: [] };
  });
};

export const getTVDetails = async (id) => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/tv/${id}?append_to_response=videos,credits,similar,seasons`);
    return response.data || {};
  });
};

export const getTVSeasonDetails = async (tvId, seasonNum) => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/tv/${tvId}/season/${seasonNum}`);
    return response.data.episodes || [];
  });
};

export const getTVVideos = async (id) => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/tv/${id}/videos`);
    const trailers = response.data.results?.filter(
      (video) => video.type === 'Trailer' && video.site === 'YouTube'
    ) || [];
    return trailers.length > 0 ? trailers[0] : null;
  });
};

// PERSON FUNCTIONS
export const getPersonDetails = async (id) => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/person/${id}?append_to_response=combined_credits`);
    return response.data || {};
  });
};

// SEARCH FUNCTIONS
export const searchMulti = async (query, page = 1) => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/search/multi?query=${query}&page=${page}`);
    return response.data || { results: [], total_pages: 0, total_results: 0, page };
  });
};

export const searchMovies = async (query, page = 1) => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/search/movie?query=${query}&page=${page}`);
    return response.data || { results: [], total_pages: 0, total_results: 0, page };
  });
};

export const searchTV = async (query, page = 1) => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/search/tv?query=${query}&page=${page}`);
    return response.data || { results: [], total_pages: 0, total_results: 0, page };
  });
};

export const searchPeople = async (query, page = 1) => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/search/person?query=${query}&page=${page}`);
    return response.data || { results: [], total_pages: 0, total_results: 0, page };
  });
};

// GENRE & DISCOVER
export const getMovieGenres = async () => {
  const cacheKey = 'getMovieGenres';
  return withCache(cacheKey, async () => {
    const response = await tmdbApi.get(`/genre/movie/list`);
    return response.data.genres || [];
  });
};

export const getTVGenres = async () => {
  const cacheKey = 'getTVGenres';
  return withCache(cacheKey, async () => {
    const response = await tmdbApi.get(`/genre/tv/list`);
    return response.data.genres || [];
  });
};

export const discoverByGenre = async (mediaType, genreId, page = 1) => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/discover/${mediaType}?with_genres=${genreId}&page=${page}`);
    return response.data || { results: [] };
  });
};

// ANIME
export const getAnime = async (page = 1) => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/discover/movie?with_genres=16&sort_by=popularity.desc&page=${page}`);
    return response.data || { results: [] };
  });
};

export const discoverAnime = async (extraGenres = '', page = 1, sortBy = 'popularity.desc') => {
  return handleRequest(async () => {
    const genres = extraGenres ? `16,${extraGenres}` : '16';
    const response = await tmdbApi.get(
      `/discover/movie?with_genres=${genres}&with_original_language=ja&sort_by=${sortBy}&page=${page}`
    );
    return response.data || { results: [] };
  });
};

export const getTrendingAnime = async () => {
  return handleRequest(async () => {
    const response = await tmdbApi.get(`/trending/all/week`);
    const anime = response.data.results?.filter(
      (item) => item.original_language === 'ja'
    ) || [];
    return anime;
  });
};


