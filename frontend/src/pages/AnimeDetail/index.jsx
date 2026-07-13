import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchTVDetails, selectMovies } from '../../store/slices/moviesSlice';
import { selectAuth } from '../../store/slices/authSlice';
import { addToHistory } from '../../store/slices/historySlice';
import { selectIsFavorite, addFavorite, removeFavorite } from '../../store/slices/favoritesSlice';
import { selectIsInWatchlist, addToWatchlist, removeFromWatchlist } from '../../store/slices/watchlistSlice';
import { getBackdropUrl, getPosterUrl } from '../../services/tmdbService';
import malService from '../../services/malService';
import { usePlayerContext } from '../../context/PlayerContext';
import Carousel from '../../components/common/Carousel';
import AnimeCard from '../../components/cards/AnimeCard';
import '../MovieDetail/MovieDetail.css';

const AnimeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTV: currentAnime, detailLoading, error } = useSelector(selectMovies);
  const { isAuthenticated } = useSelector(selectAuth);
  const isFav = useSelector((state) => selectIsFavorite(state, Number(id)));
  const isInWL = useSelector((state) => selectIsInWatchlist(state, Number(id)));
  const { openPlayer } = usePlayerContext();

  const [malAnimeData, setMalAnimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [languagePref, setLanguagePref] = useState('SUB');

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const malData = await malService.getAnimeDetails(id);
        if (malData) {
          setMalAnimeData(malData);
        } else {
          dispatch(fetchTVDetails(id));
        }
      } catch (err) {
        console.error('Failed to fetch MAL details, falling back to TMDB:', err);
        dispatch(fetchTVDetails(id));
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [dispatch, id]);

  const activeAnime = malAnimeData || currentAnime;

  useEffect(() => {
    if (isAuthenticated && activeAnime && (activeAnime.id === Number(id) || activeAnime.mal_id === Number(id))) {
      dispatch(addToHistory({
        tmdbId: activeAnime.mal_id || activeAnime.id,
        title: activeAnime.name || activeAnime.title,
        poster: activeAnime.mal_image || getPosterUrl(activeAnime.poster_path, 'w500'),
        type: 'anime',
      }));
    }
  }, [isAuthenticated, activeAnime, dispatch, id]);

  if (loading || detailLoading) return <div className="detail-page detail-page--skeleton" />;
  if (error || !activeAnime) return <div className="detail-page__error"><button onClick={() => navigate(-1)} className="hero__btn hero__btn--primary">Go Back</button></div>;

  const handleWatch = () => {
    openPlayer({
      tmdbId: activeAnime.id,
      malId: activeAnime.mal_id || null,
      title: activeAnime.name || activeAnime.title,
      poster: activeAnime.mal_image || getPosterUrl(activeAnime.poster_path, 'w500'),
      type: 'anime',
      episode: 1,
    });
  };

  const payload = {
    tmdbId: activeAnime.mal_id || activeAnime.id,
    title: activeAnime.name || activeAnime.title,
    poster: activeAnime.mal_image || getPosterUrl(activeAnime.poster_path, 'w500'),
    type: 'anime',
  };

  const year = (activeAnime.first_air_date || activeAnime.release_date || activeAnime.start_date)?.split('-')[0];
  const posterUrl = activeAnime.mal_image || getPosterUrl(activeAnime.poster_path, 'original');
  const backdropUrl = getBackdropUrl(activeAnime.backdrop_path) || posterUrl;

  return (
    <div className="detail-page">
      <div className="detail__backdrop" style={{ backgroundImage: `url(${backdropUrl})` }}>
        <div className="detail__backdrop-overlay" />
      </div>

      <div className="detail__content">
        <div style={{ background: 'rgba(124, 58, 237, 0.15)', border: '1px solid #7c3aed', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', color: '#e2e8f0', fontSize: '0.9rem' }}>
          <strong>Note:</strong> Anime streaming uses MyAnimeList and AniList IDs. Switch providers inside the player for best results.
        </div>

        <div className="detail__layout">
          <div className="detail__left">
            <img className="detail__poster" src={posterUrl} alt={activeAnime.name || activeAnime.title} style={{ boxShadow: '0 0 30px rgba(124, 58, 237, 0.3)', borderColor: '#7c3aed' }} />
          </div>

          <div className="detail__right">
            <h1 className="detail__title">{activeAnime.name || activeAnime.title}</h1>

            <div className="detail__meta-row">
              <span>{year}</span>
              <span className="detail__meta-dot">•</span>
              {(activeAnime.number_of_episodes || activeAnime.num_episodes) && <span>{activeAnime.number_of_episodes || activeAnime.num_episodes} Episodes</span>}
              <span className="detail__meta-dot">•</span>
              <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>★ {activeAnime.vote_average?.toFixed(1)}</span>
            </div>

            <div className="detail__genres">
              {activeAnime.genres?.map(g => <span key={g.id || g.name} className="detail__genre-chip" style={{ borderColor: '#7c3aed' }}>{g.name}</span>)}
            </div>

            <div className="detail__actions">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="detail__btn" style={{ background: '#7c3aed', color: 'white', border: 'none' }} onClick={handleWatch}>
                ▶ Watch Now
              </motion.button>

              {isAuthenticated && (
                <div className="detail__icon-actions">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className={`detail__icon-btn ${isFav ? 'active' : ''}`} style={isFav ? { borderColor: '#7c3aed', color: '#7c3aed', background: 'rgba(124,58,237,0.1)' } : {}} onClick={() => isFav ? dispatch(removeFavorite(activeAnime.id)) : dispatch(addFavorite(payload))}>
                    {isFav ? '♥' : '♡'}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className={`detail__icon-btn ${isInWL ? 'active' : ''}`} style={isInWL ? { borderColor: '#7c3aed', color: '#7c3aed', background: 'rgba(124,58,237,0.1)' } : {}} onClick={() => isInWL ? dispatch(removeFromWatchlist(activeAnime.id)) : dispatch(addToWatchlist(payload))}>
                    {isInWL ? '◉' : '○'}
                  </motion.button>
                </div>
              )}
            </div>

            <div className="detail__overview">
              <h4 className="detail__section-label" style={{ color: '#7c3aed' }}>SYNOPSIS</h4>
              <p>{activeAnime.overview || activeAnime.synopsis}</p>
            </div>
          </div>
        </div>

        {/* Similar Anime */}
        {activeAnime.similar?.results?.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <Carousel title="More Like This" items={activeAnime.similar.results} CardComponent={AnimeCard} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeDetail;
