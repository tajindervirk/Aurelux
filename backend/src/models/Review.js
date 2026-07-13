const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  tmdbId: {
    type: Number,
    required: [true, 'TMDB ID is required']
  },
  mediaType: {
    type: String,
    enum: ['movie', 'tv', 'anime'],
    required: [true, 'Media type is required']
  },
  title: {
    type: String,
    default: ''
  },
  poster: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [10, 'Rating cannot exceed 10'],
    required: [true, 'Rating is required']
  },
  review: {
    type: String,
    maxlength: [1000, 'Review cannot exceed 1000 characters'],
    default: ''
  },
  deletedByAdmin: {
    type: Boolean,
    default: false
  },
  deleteReason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index: one review per user per movie
reviewSchema.index({ userId: 1, tmdbId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
