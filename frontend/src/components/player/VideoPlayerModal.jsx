import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectProviders } from '../../store/slices/providerSlice';
import { parseProviderUrl } from '../../utils/constants';
import { resolveAnimeIds } from '../../services/animeIdResolver';
import { getTVDetails } from '../../services/tmdbService';
import EpisodeSidebar from './EpisodeSidebar';
import './VideoPlayerModal.css';

const VideoPlayerModal = ({
  isOpen,
  onClose,
  mediaData,
  selectedSource,
  onChangeSource,
  subDubPref,
  onChangeSubDub,
}) => {
  const providers = useSelector(selectProviders);
  const PLAYER_SOURCES = providers || [];
  
  const getSourceById = useCallback((id) => {
    return PLAYER_SOURCES.find((s) => s.providerId === id) || PLAYER_SOURCES[0] || null;
  }, [PLAYER_SOURCES]);

  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [fetchedSeasons, setFetchedSeasons] = useState(null);

  // Anime ID resolution state
  const [resolvedIds, setResolvedIds] = useState(null);
  const [isResolvingIds, setIsResolvingIds] = useState(false);
  const [resolutionFailed, setResolutionFailed] = useState(false);
  const abortRef = useRef(null);

  // Source dropdown state
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);

  // Reset state when media changes
  useEffect(() => {
    if (mediaData) {
      setCurrentSeason(mediaData.season || 1);
      setCurrentEpisode(mediaData.episode || 1);
      setFetchedSeasons(null);
      setResolvedIds(null);
      setResolutionFailed(false);
      setIframeLoaded(false);
    }
  }, [mediaData?.tmdbId, mediaData?.type]);

  // Anime ID resolution — runs when media opens or source changes
  useEffect(() => {
    if (!isOpen || !mediaData || mediaData.type !== 'anime') {
      setResolvedIds(null);
      setIsResolvingIds(false);
      return;
    }

    // Abort any previous in-flight resolution
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsResolvingIds(true);
    setResolutionFailed(false);
    setIframeLoaded(false);

    resolveAnimeIds(
      mediaData.title,
      mediaData.malId || null,
      controller.signal
    )
      .then((ids) => {
        if (!controller.signal.aborted) {
          setResolvedIds(ids);
          setIsResolvingIds(false);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.warn('Anime ID resolution failed:', err);
          setResolvedIds({ malId: mediaData.malId || null, anilistId: null });
          setResolutionFailed(true);
          setIsResolvingIds(false);
        }
      });

    return () => controller.abort();
  }, [isOpen, mediaData?.tmdbId, mediaData?.type, mediaData?.malId, mediaData?.title]);

  // Fetch true TV season count if not provided by caller (e.g. from Hero/Cards)
  useEffect(() => {
    if (!isOpen || !mediaData || mediaData.type !== 'tv') return;
    
    // Only fetch if caller didn't provide it
    if (!mediaData.totalSeasons) {
      // prevent re-fetching if we already got it for this show
      getTVDetails(mediaData.tmdbId)
        .then((details) => {
          if (details?.number_of_seasons) {
            setFetchedSeasons(details.number_of_seasons);
          }
        })
        .catch((err) => console.warn('Failed to fetch TV seasons:', err));
    }
  }, [isOpen, mediaData?.tmdbId, mediaData?.type, mediaData?.totalSeasons]);

  // ESC listener
  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset iframe loaded state when URL-affecting state changes
  useEffect(() => {
    setIframeLoaded(false);
  }, [selectedSource, currentSeason, currentEpisode, subDubPref, resolvedIds]);

  // Close source menu on outside click
  useEffect(() => {
    if (!sourceMenuOpen) return;
    const close = () => setSourceMenuOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [sourceMenuOpen]);

  // Build the player URL
  const getUrl = useCallback(() => {
    if (!mediaData || PLAYER_SOURCES.length === 0) return '';

    const src = getSourceById(selectedSource);
    if (!src) return '';

    // Movies
    if (mediaData.type === 'movie') {
      return parseProviderUrl(src.movieUrlTemplate, { id: mediaData.tmdbId });
    }

    // TV Shows
    if (mediaData.type === 'tv') {
      return parseProviderUrl(src.tvUrlTemplate, { id: mediaData.tmdbId, s: currentSeason, e: currentEpisode });
    }

    // Anime
    if (mediaData.type === 'anime') {
      if (!resolvedIds) return ''; // Still resolving

      const neededIdType = src.animeIdType; // 'mal' or 'anilist'
      const animeId = neededIdType === 'mal' ? resolvedIds.malId : resolvedIds.anilistId;

      if (animeId) {
        return parseProviderUrl(src.animeUrlTemplate, { id: animeId, ep: currentEpisode, subDub: subDubPref });
      }

      // Fallback: try the other ID type
      const fallbackId = neededIdType === 'mal' ? resolvedIds.anilistId : resolvedIds.malId;
      if (fallbackId) {
        return parseProviderUrl(src.animeUrlTemplate, { id: fallbackId, ep: currentEpisode, subDub: subDubPref });
      }

      // Last resort: use TMDB ID as TV show
      return parseProviderUrl(src.tvUrlTemplate, { id: mediaData.tmdbId, s: 1, e: currentEpisode });
    }

    return parseProviderUrl(src.movieUrlTemplate, { id: mediaData.tmdbId });
  }, [mediaData, selectedSource, currentSeason, currentEpisode, subDubPref, resolvedIds, getSourceById, PLAYER_SOURCES.length]);

  const handleEpisodeSelect = (season, episode) => {
    setCurrentSeason(season);
    setCurrentEpisode(episode);
    setSidebarOpen(false);
  };

  // Anime episode quick-nav
  const handleAnimeEpisodeChange = (ep) => {
    const epNum = Math.max(1, Number(ep) || 1);
    setCurrentEpisode(epNum);
  };

  const url = getUrl();
  const isAnime = mediaData?.type === 'anime';
  const showAnimeLoading = isAnime && isResolvingIds;
  const currentSourceConfig = getSourceById(selectedSource);

  if (!currentSourceConfig) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="video-player"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* ═══ Top Bar ═══ */}
          <div className="video-player__topbar">
            {/* Left: Title */}
            <span className="video-player__media-title gold-text">
              {mediaData?.title}
              {mediaData?.type === 'tv' && ` — S${currentSeason}E${currentEpisode}`}
              {isAnime && currentEpisode > 0 && ` — EP ${currentEpisode}`}
            </span>

            {/* Right: Controls */}
            <div className="video-player__topbar-actions">
              {/* Source Selector Dropdown */}
              <div className="video-player__source-wrap" onClick={(e) => e.stopPropagation()}>
                <button
                  className="video-player__source-btn"
                  onClick={() => setSourceMenuOpen((p) => !p)}
                  title="Change source"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  <span className="video-player__source-name">{currentSourceConfig.name}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                <AnimatePresence>
                  {sourceMenuOpen && (
                    <motion.div
                      className="video-player__source-menu"
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      {PLAYER_SOURCES.map((source) => (
                        <button
                          key={source.providerId}
                          className={`video-player__source-option ${selectedSource === source.providerId ? 'video-player__source-option--active' : ''}`}
                          onClick={() => {
                            onChangeSource(source.providerId);
                            setSourceMenuOpen(false);
                          }}
                        >
                          <span className="video-player__source-option-icon">{source.name.charAt(0)}</span>
                          <div className="video-player__source-option-info">
                            <span className="video-player__source-option-name">{source.name}</span>
                            <span className="video-player__source-option-desc">{source.description}</span>
                          </div>
                          {selectedSource === source.providerId && (
                            <span className="video-player__source-check">✓</span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sub/Dub Toggle — anime only */}
              {isAnime && (
                <div className="video-player__subdub-toggle">
                  <button
                    className={`video-player__subdub-btn ${subDubPref === 'sub' ? 'video-player__subdub-btn--active' : ''}`}
                    onClick={() => onChangeSubDub('sub')}
                  >
                    SUB
                  </button>
                  <button
                    className={`video-player__subdub-btn ${subDubPref === 'dub' ? 'video-player__subdub-btn--active' : ''}`}
                    onClick={() => onChangeSubDub('dub')}
                  >
                    DUB
                  </button>
                </div>
              )}

              {/* Anime Episode Nav */}
              {isAnime && (
                <div className="video-player__anime-ep-nav">
                  <button
                    className="video-player__topbar-btn"
                    onClick={() => handleAnimeEpisodeChange(currentEpisode - 1)}
                    disabled={currentEpisode <= 1}
                    aria-label="Previous episode"
                    title="Previous episode"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  <span className="video-player__anime-ep-label">EP {currentEpisode}</span>
                  <button
                    className="video-player__topbar-btn"
                    onClick={() => handleAnimeEpisodeChange(currentEpisode + 1)}
                    aria-label="Next episode"
                    title="Next episode"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* Episode Sidebar Toggle — TV only */}
              {mediaData?.type === 'tv' && (
                <button
                  className="video-player__topbar-btn"
                  onClick={() => setSidebarOpen((p) => !p)}
                  aria-label="Episodes"
                  title="Browse episodes"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                </button>
              )}

              {/* Close */}
              <button
                className="video-player__topbar-btn"
                onClick={onClose}
                aria-label="Close player"
                title="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ═══ Cinematic Anime Loading State ═══ */}
          <AnimatePresence>
            {showAnimeLoading && (
              <motion.div
                className="video-player__anime-loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {mediaData?.poster && (
                  <div
                    className="video-player__anime-loader-bg"
                    style={{ backgroundImage: `url(${mediaData.poster})` }}
                  />
                )}
                <div className="video-player__anime-loader-content">
                  <div className="video-player__anime-loader-ring" />
                  <motion.h2
                    className="video-player__anime-loader-title"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    {mediaData?.title}
                  </motion.h2>
                  <motion.p
                    className="video-player__anime-loader-sub"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Connecting to stream...
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ Fallback Notice ═══ */}
          {resolutionFailed && !showAnimeLoading && (
            <motion.div
              className="video-player__fallback-notice"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Using fallback stream — anime-specific source not available
            </motion.div>
          )}

          {/* ═══ Standard Loading Spinner ═══ */}
          {!iframeLoaded && !showAnimeLoading && url && (
            <div className="video-player__loader">
              <div className="video-player__spinner" />
            </div>
          )}

          {/* ═══ Player Iframe ═══ */}
          {url && !showAnimeLoading && (
            <iframe
              key={url} // Force remount when URL changes
              className="video-player__iframe"
              src={url}
              frameBorder="0"
              allow="autoplay; encrypted-media; fullscreen"
              onLoad={() => setIframeLoaded(true)}
              title={mediaData?.title || 'Video Player'}
            />
          )}

          {/* ═══ Episode Sidebar — TV Shows Only ═══ */}
          {mediaData?.type === 'tv' && (
            <EpisodeSidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              tvId={mediaData.tmdbId}
              currentSeason={currentSeason}
              currentEpisode={currentEpisode}
              totalSeasons={fetchedSeasons || mediaData.totalSeasons || 1}
              onEpisodeSelect={handleEpisodeSelect}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayerModal;
