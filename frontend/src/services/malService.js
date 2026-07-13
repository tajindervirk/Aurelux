const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const MAL_PROXY = `${API_BASE_URL}/mal`;

const getCurrentSeason = () => {
  const month = new Date().getMonth();
  if (month < 3) return 'winter';
  if (month < 6) return 'spring';
  if (month < 9) return 'summer';
  return 'fall';
};

const normalizeMalAnime = (mal) => ({
  id: mal.id,
  mal_id: mal.id,
  title: mal.title,
  name: mal.title,
  poster_path: null,
  mal_image: mal.main_picture?.large || mal.main_picture?.medium,
  overview: mal.synopsis || 'No description available',
  vote_average: mal.mean || 0,
  vote_count: mal.statistics?.num_list_users || 0,
  genres: mal.genres || [],
  num_episodes: mal.num_episodes,
  status: mal.status,
  media_type: 'anime',
  start_date: mal.start_date,
  studios: mal.studios || [],
  rating: mal.rating,
});

export const searchAnime = async (query, limit = 20) => {
  const res = await fetch(
    `${MAL_PROXY}/anime/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  const data = await res.json();
  return (data.data || []).map((item) => normalizeMalAnime(item.node));
};

export const getAnimeDetails = async (malId) => {
  const res = await fetch(`${MAL_PROXY}/anime/${malId}`);
  const data = await res.json();
  return normalizeMalAnime(data);
};

export const getSeasonalAnime = async (
  year = new Date().getFullYear(),
  season = getCurrentSeason(),
  limit = 20,
  page = 1
) => {
  const offset = (page - 1) * limit;
  const res = await fetch(
    `${MAL_PROXY}/anime/seasonal?year=${year}&season=${season}&limit=${limit}&offset=${offset}`
  );
  const data = await res.json();
  const normalized = (data.data || []).map((item) => normalizeMalAnime(item.node));
  return { results: normalized, total_pages: 500 };
};

export const getAnimeRanking = async (type = 'all', limit = 20, page = 1) => {
  const offset = (page - 1) * limit;
  const res = await fetch(
    `${MAL_PROXY}/anime/ranking?type=${type}&limit=${limit}&offset=${offset}`
  );
  const data = await res.json();
  const normalized = (data.data || []).map((item) => normalizeMalAnime(item.node));
  return { results: normalized, total_pages: 500 };
};

export default {
  searchAnime,
  getAnimeDetails,
  getSeasonalAnime,
  getAnimeRanking,
  normalizeMalAnime,
};
