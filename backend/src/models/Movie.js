const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  posterUrl: {
    type: String,
    required: [true, 'Poster URL is required']
  },
  description: {
    type: String,
    default: 'Description not available'
  },
  tmdbId: {
    type: Number,
    required: [true, 'TMDB ID is required'],
    unique: true
  },
  releaseDate: {
    type: String,
    default: ''
  },
  trailerYoutubeLink: {
    type: String,
    default: ''
  },
  genre: {
    type: [String]
  },
  category: {
    type: String,
    enum: ['movie', 'tv', 'anime'],
    required: [true, 'Category is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Movie', movieSchema);
