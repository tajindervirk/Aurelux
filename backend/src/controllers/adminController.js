const User = require('../models/User');
const Movie = require('../models/Movie');
const Review = require('../models/Review');

// ==================== USER MANAGEMENT ====================

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const [users, totalUsers] = await Promise.all([
      User.find(filter).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page
      }
    });
  } catch (err) {
    next(err);
  }
};

const banUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBanned ? 'User banned' : 'User unbanned',
      data: user.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete all reviews by this user
    await Review.deleteMany({ userId: user._id });

    // Delete the user
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// ==================== MOVIE MANAGEMENT ====================

const createMovie = async (req, res, next) => {
  try {
    const movieData = {
      ...req.body,
      createdBy: req.user._id
    };

    const movie = await Movie.create(movieData);

    res.status(201).json({
      success: true,
      message: 'Movie created',
      data: movie
    });
  } catch (err) {
    next(err);
  }
};

const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    const updatedMovie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Movie updated',
      data: updatedMovie
    });
  } catch (err) {
    next(err);
  }
};

const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    await Movie.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Movie deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

const getAllAdminMovies = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const filter = search
      ? { title: { $regex: search, $options: 'i' } }
      : {};

    const [movies, totalMovies] = await Promise.all([
      Movie.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Movie.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        movies,
        totalMovies,
        totalPages: Math.ceil(totalMovies / limit),
        currentPage: page
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==================== REVIEWS MANAGEMENT ====================

const deleteAdminReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'A reason must be provided.' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Mark review as deleted by admin and clear text
    review.deletedByAdmin = true;
    review.deleteReason = reason;
    review.review = '';
    await review.save();

    // Find the user and remove this rating from their ratings array
    const user = await User.findById(review.userId);
    if (user) {
      user.ratings = user.ratings.filter((r) => r.tmdbId !== review.tmdbId);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      data: review
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  banUser,
  deleteUser,
  createMovie,
  updateMovie,
  deleteMovie,
  getAllAdminMovies,
  deleteAdminReview
};
