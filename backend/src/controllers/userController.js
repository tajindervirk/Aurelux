const User = require('../models/User');
const Review = require('../models/Review');

// ==================== FAVORITES ====================

const addFavorite = async (req, res, next) => {
  try {
    const { tmdbId, title, poster, type } = req.body;
    const user = req.user;

    const exists = user.favorites.some((item) => item.tmdbId === tmdbId);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Already in favorites'
      });
    }

    user.favorites.push({ tmdbId, title, poster, type });
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Added to favorites',
      data: user.favorites
    });
  } catch (err) {
    next(err);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const user = req.user;

    user.favorites = user.favorites.filter((item) => item.tmdbId !== tmdbId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Removed from favorites',
      data: user.favorites
    });
  } catch (err) {
    next(err);
  }
};

const getFavorites = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user.favorites
  });
};

// ==================== WATCHLIST ====================

const addToWatchlist = async (req, res, next) => {
  try {
    const { tmdbId, title, poster, type } = req.body;
    const user = req.user;

    const exists = user.watchlist.some((item) => item.tmdbId === tmdbId);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Already in watchlist'
      });
    }

    user.watchlist.push({ tmdbId, title, poster, type });
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Added to watchlist',
      data: user.watchlist
    });
  } catch (err) {
    next(err);
  }
};

const removeFromWatchlist = async (req, res, next) => {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const user = req.user;

    user.watchlist = user.watchlist.filter((item) => item.tmdbId !== tmdbId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Removed from watchlist',
      data: user.watchlist
    });
  } catch (err) {
    next(err);
  }
};

const getWatchlist = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user.watchlist
  });
};

// ==================== WATCH HISTORY ====================

const addToHistory = async (req, res, next) => {
  try {
    const { tmdbId, title, poster, type, progress } = req.body;
    const user = req.user;

    const existingIndex = user.watchHistory.findIndex(
      (item) => item.tmdbId === tmdbId
    );

    if (existingIndex !== -1) {
      // Update existing entry
      user.watchHistory[existingIndex].watchedAt = Date.now();
      if (progress) {
        user.watchHistory[existingIndex].progress = progress;
      }
    } else {
      // Push new entry
      user.watchHistory.push({ tmdbId, title, poster, type, progress });
    }

    // Keep max 100 entries — remove oldest if over limit
    if (user.watchHistory.length > 100) {
      user.watchHistory.sort((a, b) => b.watchedAt - a.watchedAt);
      user.watchHistory = user.watchHistory.slice(0, 100);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'History updated',
      data: user.watchHistory
    });
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res) => {
  const sorted = [...req.user.watchHistory].sort(
    (a, b) => new Date(b.watchedAt) - new Date(a.watchedAt)
  );

  res.status(200).json({
    success: true,
    data: sorted
  });
};

const clearHistory = async (req, res, next) => {
  try {
    const user = req.user;
    user.watchHistory = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'History cleared'
    });
  } catch (err) {
    next(err);
  }
};

const removeSingleHistory = async (req, res, next) => {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const user = req.user;

    user.watchHistory = user.watchHistory.filter((item) => item.tmdbId !== tmdbId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Removed from history',
      data: user.watchHistory
    });
  } catch (err) {
    next(err);
  }
};

// ==================== RATINGS ====================

const addOrUpdateRating = async (req, res, next) => {
  try {
    const { tmdbId, mediaType, rating, review, title, poster } = req.body;
    const user = req.user;

    if (!tmdbId || !mediaType) {
      return res.status(400).json({
        success: false,
        message: 'tmdbId and mediaType are required'
      });
    }

    if (!rating || rating < 1 || rating > 10) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 10'
      });
    }

    // Upsert Review document
    const savedReview = await Review.findOneAndUpdate(
      { userId: user._id, tmdbId },
      {
        userId: user._id,
        tmdbId,
        mediaType,
        rating,
        title: title || '',
        poster: poster || '',
        review: review || '',
        updatedAt: Date.now()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update or push to user.ratings array
    const existingIndex = user.ratings.findIndex(
      (r) => r.tmdbId === tmdbId
    );

    if (existingIndex !== -1) {
      user.ratings[existingIndex].rating = rating;
      user.ratings[existingIndex].review = review || '';
    } else {
      user.ratings.push({ tmdbId, rating, review: review || '' });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Rating saved',
      data: savedReview
    });
  } catch (err) {
    next(err);
  }
};

const getUserRatings = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user.ratings
  });
};

const getUserMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
};

const deleteRating = async (req, res, next) => {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const user = req.user;

    // Remove from Review collection
    await Review.findOneAndDelete({ userId: user._id, tmdbId });

    // Remove from user's ratings array
    user.ratings = user.ratings.filter((r) => r.tmdbId !== tmdbId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

const getMediaRatings = async (req, res, next) => {
  try {
    const tmdbId = Number(req.params.tmdbId);

    const reviews = await Review.find({ tmdbId }).populate(
      'userId',
      'name avatar'
    );

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==================== ADBLOCK & TRACKING ====================

const updateAdblockStatus = async (req, res, next) => {
  try {
    const user = req.user;
    user.adblockerInstalled = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Adblock status updated',
      data: {
        adblockerInstalled: user.adblockerInstalled
      }
    });
  } catch (err) {
    next(err);
  }
};

const detectBrowserAndDevice = (ua) => {
  if (!ua) return { browser: 'Unknown', deviceType: 'Desktop' };
  
  let browser = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';

  let deviceType = 'Desktop';
  if (/Mobile|Android|iP(hone|od|ad)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    deviceType = 'Mobile';
  }

  return { browser, deviceType };
};

const updateDeviceInfo = async (req, res, next) => {
  try {
    const user = req.user;
    const ua = req.headers['user-agent'] || '';
    const { browser, deviceType } = detectBrowserAndDevice(ua);
    
    let updated = false;
    if (user.browserUsed !== browser) {
      user.browserUsed = browser;
      updated = true;
    }
    if (user.deviceType !== deviceType) {
      user.deviceType = deviceType;
      updated = true;
    }

    if (updated) {
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Device info synced' });
  } catch (err) {
    next(err);
  }
};

const recordTimeSpent = async (req, res, next) => {
  try {
    const { minutes } = req.body;
    if (!minutes || typeof minutes !== 'number' || minutes <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid minutes' });
    }

    const user = req.user;
    user.totalTimeSpent = (user.totalTimeSpent || 0) + minutes;
    await user.save();

    res.status(200).json({ success: true, message: 'Time recorded' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
