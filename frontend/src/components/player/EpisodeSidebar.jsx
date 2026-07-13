import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTVSeasonDetails, getBackdropUrl } from '../../services/tmdbService';
import './EpisodeSidebar.css';

const EpisodeSidebar = ({
  isOpen,
  onClose,
  tvId,
  currentSeason,
  currentEpisode,
  onEpisodeSelect,
  totalSeasons = 1,
}) => {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  useEffect(() => {
    setSelectedSeason(currentSeason);
  }, [currentSeason]);

  useEffect(() => {
    if (!tvId || !isOpen) return;
    let cancelled = false;

    const fetchEpisodes = async () => {
      setLoadingEpisodes(true);
      try {
        const data = await getTVSeasonDetails(tvId, selectedSeason);
        if (!cancelled) setEpisodes(data || []);
      } catch (err) {
        if (!cancelled) setEpisodes([]);
      } finally {
        if (!cancelled) setLoadingEpisodes(false);
      }
    };

    fetchEpisodes();
    return () => { cancelled = true; };
  }, [tvId, selectedSeason, isOpen]);

  const seasonOptions = Array.from({ length: totalSeasons }, (_, i) => i + 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="episode-sidebar"
          initial={{ x: 350 }}
          animate={{ x: 0 }}
          exit={{ x: 350 }}
          transition={{ type: 'tween', duration: 0.35, ease: 'easeInOut' }}
        >
          {/* Header */}
          <div className="episode-sidebar__header">
            <h3 className="episode-sidebar__title">Episodes</h3>
            <button className="episode-sidebar__close" onClick={onClose} aria-label="Close sidebar">
              ✕
            </button>
          </div>

          {/* Season selector */}
          <div className="episode-sidebar__season-select">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              className="episode-sidebar__dropdown"
            >
              {seasonOptions.map((num) => (
                <option key={num} value={num}>
                  Season {num}
                </option>
              ))}
            </select>
          </div>

          {/* Episode list */}
          <div className="episode-sidebar__list">
            {loadingEpisodes ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="episode-sidebar__item episode-sidebar__item--skeleton">
                  <div className="episode-sidebar__thumb skeleton" />
                  <div className="episode-sidebar__info">
                    <div className="skeleton" style={{ width: '70%', height: '0.85rem' }} />
                    <div className="skeleton" style={{ width: '40%', height: '0.7rem' }} />
                  </div>
                </div>
              ))
            ) : (
              episodes.map((ep) => {
                const isActive = ep.episode_number === currentEpisode && selectedSeason === currentSeason;
                return (
                  <div
                    key={ep.episode_number}
                    className={`episode-sidebar__item ${isActive ? 'episode-sidebar__item--active' : ''}`}
                    onClick={() => onEpisodeSelect(selectedSeason, ep.episode_number)}
                  >
                    <img
                      className="episode-sidebar__thumb"
                      src={getBackdropUrl(ep.still_path, 'w300')}
                      alt={ep.name}
                      loading="lazy"
                      onError={(e) => { e.target.src = '/placeholder-backdrop.jpg'; }}
                    />
                    <div className="episode-sidebar__info">
                      <span className="episode-sidebar__ep-title">
                        E{ep.episode_number} · {ep.name}
                      </span>
                      {ep.air_date && (
                        <span className="episode-sidebar__date">{ep.air_date}</span>
                      )}
                      {ep.overview && (
                        <p className="episode-sidebar__overview">{ep.overview}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="episode-sidebar__hint" style={{ 
            fontSize: '0.75rem', 
            textAlign: 'center', 
            padding: '1rem', 
            color: 'rgba(201, 168, 76, 0.6)',
            borderTop: '1px solid var(--color-border)'
          }}>
            Use sidebar to navigate episodes
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EpisodeSidebar;
