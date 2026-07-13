import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { fetchCurrentUser, selectAuth } from './store/slices/authSlice';
import { fetchProviders } from './store/slices/providerSlice';
import { useSelector } from 'react-redux';
import apiService from './services/apiService';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
// ... rest of imports
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import TVDetail from './pages/TVDetail';
import AnimeDetail from './pages/AnimeDetail';
import Search from './pages/Search';
import MoviesTab from './pages/Movies';
import TVShowsTab from './pages/TVShows';
import AnimeTab from './pages/Anime';
import NotFound from './pages/NotFound';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Favorites from './pages/Favorites';
import Watchlist from './pages/Watchlist';
import History from './pages/History';
import Reviews from './pages/Reviews';
import PersonDetail from './pages/PersonDetail';
import Admin from './pages/Admin';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import VideoPlayerModal from './components/player/VideoPlayerModal';
import AdblockWarningModal from './components/player/AdblockWarningModal';
import usePlayer from './hooks/usePlayer';
import { PlayerContext } from './context/PlayerContext';
import SplashScreen from './components/common/SplashScreen';
import PageTransition from './components/common/PageTransition';
import TransitionOverlay from './components/common/TransitionOverlay';
import './App.css';

function App() {
  const [splashComplete, setSplashComplete] = useState(() => {
    return localStorage.getItem('aurelux_splash_shown') === 'true';
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated } = useSelector(selectAuth);

  const {
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
  } = usePlayer();

  useEffect(() => {
    // One-time cleanup for old token storage
    localStorage.removeItem('aurelux_token');

    if (localStorage.getItem('aurelux_logged_in') === 'true') {
      dispatch(fetchCurrentUser());
    }
    
    // Fetch dynamic streaming providers on startup
    dispatch(fetchProviders());
  }, [dispatch]);

  // Sync Device Info when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      apiService.patch('/user/device-info').catch(console.error);
    }
  }, [isAuthenticated]);

  // Batched Time Tracking via visibilitychange
  useEffect(() => {
    if (!isAuthenticated) return;

    let sessionStartTime = Date.now();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const sessionEndTime = Date.now();
        const minutesSpent = Math.floor((sessionEndTime - sessionStartTime) / (1000 * 60));
        
        if (minutesSpent > 0) {
          apiService.patch('/user/time-spent', { minutes: minutesSpent })
            .catch(console.error);

          // Reset start time so if they come back, it starts counting fresh from 0
          sessionStartTime = Date.now();
        }
      } else if (document.visibilityState === 'visible') {
        sessionStartTime = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <PlayerContext.Provider
      value={{
        openPlayer,
        closePlayer,
        changeSource,
        setSubDubPref,
        selectedSource,
        subDubPref,
        isPlayerOpen,
        currentMedia,
      }}
    >
      {!splashComplete ? (
        <SplashScreen onComplete={() => setSplashComplete(true)} />
      ) : (
        <div className="app-layout">
          {!isAdminRoute && <Navbar />}
          <TransitionOverlay />
          <main className={`app-main ${isAdminRoute ? 'admin-mode' : ''}`}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                <Route path="/search" element={<PageTransition><Search /></PageTransition>} />

                {/* Category Listings */}
                <Route path="/movies" element={<PageTransition><MoviesTab /></PageTransition>} />
                <Route path="/tv" element={<PageTransition><TVShowsTab /></PageTransition>} />
                <Route path="/anime" element={<PageTransition><AnimeTab /></PageTransition>} />

                {/* Auth */}
                <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

                {/* Person Route */}
                <Route path="/person/:id" element={<PageTransition><PersonDetail /></PageTransition>} />

                {/* Media Detail */}
                <Route path="/movie/:id" element={<PageTransition><MovieDetail /></PageTransition>} />
                <Route path="/tv/:id" element={<PageTransition><TVDetail /></PageTransition>} />
                <Route path="/anime/:id" element={<PageTransition><AnimeDetail /></PageTransition>} />

                {/* Protected Routes */}
                <Route path="/favorites" element={<ProtectedRoute><PageTransition><Favorites /></PageTransition></ProtectedRoute>} />
                <Route path="/watchlist" element={<ProtectedRoute><PageTransition><Watchlist /></PageTransition></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><PageTransition><History /></PageTransition></ProtectedRoute>} />
                <Route path="/reviews" element={<ProtectedRoute><PageTransition><Reviews /></PageTransition></ProtectedRoute>} />

                {/* Admin Route */}
                <Route path="/admin" element={<AdminRoute><PageTransition><Admin /></PageTransition></AdminRoute>} />

                {/* 404 Catch All */}
                <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
              </Routes>
            </AnimatePresence>
          </main>
          {!isAdminRoute && <Footer />}

        {/* Global Video Player */}
        <VideoPlayerModal
          isOpen={isPlayerOpen}
          onClose={closePlayer}
          mediaData={currentMedia}
          selectedSource={selectedSource}
          onChangeSource={changeSource}
          subDubPref={subDubPref}
          onChangeSubDub={setSubDubPref}
        />

        {/* Adblock Warning Modal */}
        <AdblockWarningModal
          isOpen={showAdblockWarning}
          onContinue={proceedToPlayer}
          onClose={closeAdblockWarning}
        />
      </div>
      )}
    </PlayerContext.Provider>
  );
}

export default App;
