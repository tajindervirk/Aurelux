const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: [true, 'Please add a provider ID'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: [true, 'Please add a provider name'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  animeIdType: {
    type: String,
    enum: ['tmdb', 'mal', 'anilist'],
    default: 'mal',
  },
  movieUrlTemplate: {
    type: String,
    required: [true, 'Please add a movie URL template'],
  },
  tvUrlTemplate: {
    type: String,
    required: [true, 'Please add a TV URL template'],
  },
  animeUrlTemplate: {
    type: String,
    required: [true, 'Please add an anime URL template'],
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Provider', providerSchema);
