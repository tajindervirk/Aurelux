import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchTVDetails, selectMovies } from '../../store/slices/moviesSlice';
import { selectAuth } from '../../store/slices/authSlice';
import { addToHistory } from '../../store/slices/historySlice';
import { selectIsFavorite, addFavorite, removeFavorite } from '../../store/slices/favoritesSlice';
import { selectIsInWatchlist, addToWatchlist, removeFromWatchlist } from '../../store/slices/watchlistSlice';
import { getBackdropUrl, getPosterUrl, getTVVideos, getTVSeasonDetails } from '../../services/tmdbService';
import apiService from '../../services/apiService';
import { usePlayerContext } from '../../context/PlayerContext';
import Carousel from '../../components/common/Carousel';
import PersonCard from '../../components/cards/PersonCard';
import TrailerModal from '../../components/common/TrailerModal';
import TVCard from '../../components/cards/TVCard';
import '../MovieDetail/MovieDetail.css';

const TVDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTV, detailLoading, error } = useSelector(selectMovies);
  const { isAuthenticated } = useSelector(selectAuth);
  const isFav = useSelector((state) => selectIsFavorite(state, Number(id)));
  const isInWL = useSelector((state) => selectIsInWatchlist(state, Number(id)));
  const { openPlayer } = usePlayerContext();

  const [trailerKey, setTrailerKey] = useState(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [activeSeason, setActiveSeason] = useState(1);
  const [seasonEpisodes, setSeasonEpisodes] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchTVDetails(id));
    
    getTVVideos(id).then((video) => {
      if (video?.key) setTrailerKey(video.key);
    });
  }, [dispatch, id]);

  useEffect(() => {
    if (currentTV?.id === Number(id)) {
      setActiveSeason(1);
      getTVSeasonDetails(id, 1).then(data => setSeasonEpisodes(data));
      
      if (isAuthenticated) {
        dispatch(addToHistory({
          tmdbId: currentTV.id,
          title: currentTV.name,
          poster: getPosterUrl(currentTV.poster_path, 'w500'),
          type: 'tv',
        }));
      }
    }
  }, [isAuthenticated, currentTV, dispatch, id]);

  const handleSeasonChange = (seasonNumber) => {
    setActiveSeason(seasonNumber);
    getTVSeasonDetails(id, seasonNumber).then(data => setSeasonEpisodes(data));
  };

  if (detailLoading) return <div className="detail-page detail-page--skeleton" />;
  if (error || !currentTV) {
    return (
      <div className="detail-page__error">
        <h2>Oops! We couldn't find that show.</h2>
        <button onClick={() => navigate(-1)} className="hero__btn hero__btn--primary">Go Back</button>
      </div>
    );
  }

  const handleWatch = (seasonNum = 1, episodeNum = 1) => {
    openPlayer({
      tmdbId: currentTV.id,
      title: currentTV.name,
      poster: getPosterUrl(currentTV.poster_path, 'w500'),
      type: 'tv',
      season: seasonNum,
      episode: episodeNum,
      totalSeasons: currentTV.number_of_seasons
    });
  };

  const payload = {
    tmdbId: currentTV.id,
    title: currentTV.name,
    poster: getPosterUrl(currentTV.poster_path, 'w500'),
    type: 'tv',
  };

  const year = currentTV.first_air_date?.split('-')[0];
  const cast = currentTV.credits?.cast?.slice(0, 10) || [];

  return (
    <div className="detail-page">
      <div className="detail__backdrop" style={{ backgroundImage: `url(${getBackdropUrl(currentTV.backdrop_path)})` }}>
        <div className="detail__backdrop-overlay" />
      </div>

      <div className="detail__content">
        <div className="detail__layout">
          <div className="detail__left">
            <img className="detail__poster" src={getPosterUrl(currentTV.poster_path, 'original')} alt={currentTV.name} />
          </div>

          <div className="detail__right">
            <h1 className="detail__title">{currentTV.name}</h1>
            {currentTV.tagline && <p className="detail__tagline">"{currentTV.tagline}"</p>}
            
            <div className="detail__meta-row">
              <span>{year}</span>
              <span className="detail__meta-dot">•</span>
              <span>{currentTV.number_of_seasons} Seasons</span>
              <span className="detail__meta-dot">•</span>
              <span>{currentTV.number_of_episodes} Episodes</span>
              <span className="detail__meta-dot">•</span>
              <span className="gold-text">★ {currentTV.vote_average?.toFixed(1)}</span>
              <span className="detail__meta-dot">•</span>
              <span className="detail__lang-badge" style={{ borderColor: currentTV.status === 'Ended' ? '#666' : '#C9A84C', color: currentTV.status === 'Ended' ? '#aaa' : '#C9A84C' }}>
                {currentTV.status.toUpperCase()}
              </span>
            </div>

            <div className="detail__genres">
              {currentTV.genres?.map(g => <span key={g.id} className="detail__genre-chip">{g.name}</span>)}
            </div>

            <div className="detail__actions">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="detail__btn detail__btn--primary" onClick={() => handleWatch(1, 1)}>
                ▶ Watch S1:E1
              </motion.button>
              
              {trailerKey && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="detail__btn detail__btn--outline" onClick={() => setIsTrailerOpen(true)}>
                  Trailer
                </motion.button>
              )}

              {isAuthenticated && (
                <div className="detail__icon-actions">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className={`detail__icon-btn ${isFav ? 'active' : ''}`} onClick={() => isFav ? dispatch(removeFavorite(currentTV.id)) : dispatch(addFavorite(payload))}>
                    {isFav ? '♥' : '♡'}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className={`detail__icon-btn ${isInWL ? 'active' : ''}`} onClick={() => isInWL ? dispatch(removeFromWatchlist(currentTV.id)) : dispatch(addToWatchlist(payload))}>
                    {isInWL ? '◉' : '○'}
                  </motion.button>
                </div>
              )}
            </div>

            <div className="detail__overview">
              <h4 className="detail__section-label">OVERVIEW</h4>
              <p>{currentTV.overview}</p>
            </div>
          </div>
        </div>

        {/* TV Specific: Episodes Grid */}
        <div className="detail__section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            <h3 className="detail__section-title" style={{ paddingBottom: 0 }}>Episodes</h3>
            <select 
              value={activeSeason} 
              onChange={(e) => handleSeasonChange(Number(e.target.value))}
              style={{ background: 'var(--color-bg-secondary)', color: 'white', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)', outline: 'none' }}
            >
              {[...Array(currentTV.number_of_seasons)].map((_, i) => (
                <option key={i+1} value={i+1}>Season {i+1}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {seasonEpisodes.map(ep => (
              <motion.div 
                key={ep.id} 
                className="glass-card" 
                style={{ overflow: 'hidden', cursor: 'pointer' }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleWatch(activeSeason, ep.episode_number)}
              >
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                  <img src={getBackdropUrl(ep.still_path, 'w500')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={ep.name} />
                  <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--color-gold)', color: '#000', fontWeight: 'bold', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                    S{activeSeason} E{ep.episode_number}
                  </div>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s' }} className="ep-hover">
                    <span style={{ color: 'white', fontSize: '2rem' }}>▶</span>
                  </div>
                </div>
                <div style={{ padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.2rem', fontSize: '1rem' }}>{ep.name}</h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>{ep.air_date} • {ep.runtime} min</div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ep.overview}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="detail__section">
            <h3 className="detail__section-title">Cast</h3>
            <div className="detail__cast-scroll">
              {cast.map(person => <PersonCard key={person.id} person={{...person, known_for_department: person.character}} />)}
            </div>
          </div>
        )}

        {/* Similar TV */}
        {currentTV.similar?.results?.length > 0 && (
          <Carousel title="More Like This" items={currentTV.similar.results} CardComponent={TVCard} />
        )}
      </div>

      <TrailerModal isOpen={isTrailerOpen} onClose={() => setIsTrailerOpen(false)} videoKey={trailerKey} />
      <style>{`.glass-card:hover .ep-hover { opacity: 1 !important; }`}</style>
    </div>
  );
};

export default TVDetail;
