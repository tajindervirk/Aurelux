import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { addToHistory } from '../store/slices/historySlice';
import { selectAuth } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const usePlayer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector(selectAuth);

  const [selectedSource, setSelectedSource] = useState(() => {
    return localStorage.getItem('aurelux_player_source') || 'vidlink';
  });

  const [subDubPref, setSubDubPrefState] = useState(() => {
    return localStorage.getItem('aurelux_subdub') || 'sub';
  });

  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  
  // New state for Adblock warning
  const [showAdblockWarning, setShowAdblockWarning] = useState(false);
  const [pendingMediaData, setPendingMediaData] = useState(null);

  const openPlayer = useCallback((mediaData) => {
    if (!isAuthenticated) {
      toast('Please login to watch full content', { icon: '🔒' });
      navigate('/login', { state: { from: location } });
      return;
    }

    const lastSeenStr = localStorage.getItem('aurelux_adblock_warning_last_seen');
    const now = Date.now();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    
    // Show warning if never seen or if 14 days have passed
    if (!lastSeenStr || now - Number(lastSeenStr) > fourteenDays) {
      setPendingMediaData(mediaData);
      setShowAdblockWarning(true);
    } else {
      // Skip warning and go directly to player
      proceedToPlayerDirectly(mediaData);
    }
  }, [isAuthenticated, navigate, location]);

  // Helper to open player directly without using pending state
  const proceedToPlayerDirectly = useCallback((mediaData) => {
    const fullMediaData = {
      season: 1,
      episode: 1,
      ...mediaData,
    };

    setCurrentMedia(fullMediaData);
    setIsPlayerOpen(true);

    dispatch(addToHistory({
      tmdbId: fullMediaData.tmdbId,
      title: fullMediaData.title,
      poster: fullMediaData.poster,
      type: fullMediaData.type,
      progress: { watched: 0, duration: 0 },
    }));
  }, [dispatch]);

  const proceedToPlayer = useCallback(() => {
    if (!pendingMediaData) return;

    // Set last seen timestamp to suppress modal for 14 days
    localStorage.setItem('aurelux_adblock_warning_last_seen', Date.now().toString());

    // mediaData shape: { tmdbId, type, title, poster, season?, episode?, malId? }
    const fullMediaData = {
      season: 1,
      episode: 1,
      ...pendingMediaData,
    };

    setCurrentMedia(fullMediaData);
    setIsPlayerOpen(true);
    setShowAdblockWarning(false);
    setPendingMediaData(null);

    // Save to watch history
    dispatch(addToHistory({
      tmdbId: fullMediaData.tmdbId,
      title: fullMediaData.title,
      poster: fullMediaData.poster,
      type: fullMediaData.type,
      progress: { watched: 0, duration: 0 },
    }));
  }, [dispatch, pendingMediaData]);

  const closeAdblockWarning = useCallback(() => {
    localStorage.setItem('aurelux_adblock_warning_last_seen', Date.now().toString());
    setShowAdblockWarning(false);
    setPendingMediaData(null);
  }, []);

  const closePlayer = useCallback(() => {
    setIsPlayerOpen(false);
    setCurrentMedia(null);
  }, []);

  const changeSource = useCallback((sourceId) => {
    setSelectedSource(sourceId);
    localStorage.setItem('aurelux_player_source', sourceId);
  }, []);

  const setSubDubPref = useCallback((pref) => {
    setSubDubPrefState(pref);
    localStorage.setItem('aurelux_subdub', pref);
  }, []);

  return {
    selectedSource,
    subDubPref,
    isPlayerOpen,
    currentMedia,
    showAdblockWarning,
    openPlayer,
    proceedToPlayer,
    closeAdblockWarning,
    closePlayer,
    changeSource,
    setSubDubPref,
  };
};

export default usePlayer;
