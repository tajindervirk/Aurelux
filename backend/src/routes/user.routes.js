const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  addFavorite,
  removeFavorite,
  getFavorites,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  addToHistory,
  getHistory,
  clearHistory,
  removeSingleHistory,
  addOrUpdateRating,
  getUserRatings,
  getUserMyReviews,
  getMediaRatings,
  updateAdblockStatus,
  updateDeviceInfo,
  recordTimeSpent,
  deleteRating
} = require('../controllers/userController');

// Public Routes
router.get('/ratings/:tmdbId', getMediaRatings);

// All routes below require authentication
router.use(protect);

// Adblock & Tracking
router.patch('/adblock-status', updateAdblockStatus);
router.patch('/device-info', updateDeviceInfo);
router.patch('/time-spent', recordTimeSpent);

// Favorites
router.post('/favorites', addFavorite);
router.delete('/favorites/:tmdbId', removeFavorite);
router.get('/favorites', getFavorites);

// Watchlist
router.post('/watchlist', addToWatchlist);
router.delete('/watchlist/:tmdbId', removeFromWatchlist);
router.get('/watchlist', getWatchlist);

// Watch History
router.post('/history', addToHistory);
router.get('/history', getHistory);
router.delete('/history', clearHistory);
router.delete('/history/:tmdbId', removeSingleHistory);

// Ratings (Private)
router.post('/ratings', addOrUpdateRating);
router.get('/ratings', getUserRatings);
router.get('/my-reviews', getUserMyReviews);
router.delete('/ratings/:tmdbId', deleteRating);

module.exports = router;
