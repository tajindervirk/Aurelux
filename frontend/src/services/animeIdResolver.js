/**
 * Anime ID Resolver
 * Resolves MAL and AniList IDs for anime titles using AniList's free GraphQL API.
 * Handles caching, race conditions via AbortController, and graceful fallbacks.
 */

const ANILIST_GRAPHQL = 'https://graphql.anilist.co';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// In-memory cache: key = lowercase title → { malId, anilistId, timestamp }
const idCache = new Map();

// Track in-flight requests to deduplicate
const inflightRequests = new Map();

const SEARCH_QUERY = `
  query ($search: String) {
    Media(search: $search, type: ANIME) {
      id
      idMal
      title {
        romaji
        english
        native
      }
    }
  }
`;

const SEARCH_BY_MAL_QUERY = `
  query ($malId: Int) {
    Media(idMal: $malId, type: ANIME) {
      id
      idMal
      title {
        romaji
        english
      }
    }
  }
`;

/**
 * Query AniList GraphQL API
 */
const queryAniList = async (query, variables, signal) => {
  const res = await fetch(ANILIST_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`AniList API returned ${res.status}`);
  }

  const json = await res.json();
  return json.data?.Media || null;
};

/**
 * Get cache key from title
 */
const getCacheKey = (title, malId) => {
  if (malId) return `mal:${malId}`;
  return `title:${(title || '').toLowerCase().trim()}`;
};

/**
 * Check cache for existing result
 */
const getFromCache = (key) => {
  if (!idCache.has(key)) return null;
  const entry = idCache.get(key);
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    idCache.delete(key);
    return null;
  }
  return entry;
};

/**
 * Store result in cache under multiple keys for fast lookup
 */
const storeInCache = (result) => {
  const entry = { ...result, timestamp: Date.now() };
  if (result.malId) idCache.set(`mal:${result.malId}`, entry);
  if (result.anilistId) idCache.set(`anilist:${result.anilistId}`, entry);
  if (result.title) idCache.set(`title:${result.title.toLowerCase().trim()}`, entry);
};

/**
 * Resolve anime IDs. Returns { malId, anilistId } or partial result.
 * 
 * @param {string} title - Anime title for search
 * @param {number|null} malId - Known MAL ID (if any)
 * @param {AbortSignal} signal - AbortController signal for race condition handling
 * @returns {Promise<{ malId: number|null, anilistId: number|null }>}
 */
export const resolveAnimeIds = async (title, malId = null, signal = null) => {
  // 1. Check cache first
  const cacheKey = getCacheKey(title, malId);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return { malId: cached.malId, anilistId: cached.anilistId };
  }

  // Also check the other key type
  if (malId) {
    const titleCached = getFromCache(`title:${(title || '').toLowerCase().trim()}`);
    if (titleCached) return { malId: titleCached.malId, anilistId: titleCached.anilistId };
  }

  // 2. Deduplicate — if there's already an in-flight request for this key, wait for it
  if (inflightRequests.has(cacheKey)) {
    try {
      return await inflightRequests.get(cacheKey);
    } catch {
      // If the previous request failed, try again below
    }
  }

  // 3. Create the resolution promise
  const resolutionPromise = (async () => {
    try {
      let media = null;

      // Strategy A: If we have a MAL ID, query by it directly
      if (malId) {
        try {
          media = await queryAniList(SEARCH_BY_MAL_QUERY, { malId: Number(malId) }, signal);
        } catch (err) {
          if (err.name === 'AbortError') throw err;
          console.warn('AniList MAL lookup failed, trying title search:', err.message);
        }
      }

      // Strategy B: Search by title
      if (!media && title) {
        try {
          media = await queryAniList(SEARCH_QUERY, { search: title }, signal);
        } catch (err) {
          if (err.name === 'AbortError') throw err;
          console.warn('AniList title search failed:', err.message);
        }
      }

      const result = {
        malId: media?.idMal || malId || null,
        anilistId: media?.id || null,
        title: title || media?.title?.english || media?.title?.romaji || '',
      };

      storeInCache(result);
      return { malId: result.malId, anilistId: result.anilistId };
    } finally {
      inflightRequests.delete(cacheKey);
    }
  })();

  inflightRequests.set(cacheKey, resolutionPromise);
  return resolutionPromise;
};

/**
 * Pre-warm the cache for a batch of anime (fire and forget).
 * Useful when the Anime page loads a list of MAL items.
 */
export const prewarmCache = (animeList) => {
  for (const anime of animeList) {
    const key = getCacheKey(anime.title || anime.name, anime.mal_id);
    if (!getFromCache(key)) {
      // Fire and forget — no await, no signal
      resolveAnimeIds(anime.title || anime.name, anime.mal_id).catch(() => {});
    }
  }
};

export default { resolveAnimeIds, prewarmCache };
