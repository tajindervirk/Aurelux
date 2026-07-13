const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mediaItemSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true },
  title: { type: String, required: true },
  poster: { type: String, default: '' },
  type: { type: String, enum: ['movie', 'tv', 'anime'] },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const watchHistorySchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true },
  title: { type: String, required: true },
  poster: { type: String, default: '' },
  type: { type: String, enum: ['movie', 'tv', 'anime'] },
  watchedAt: { type: Date, default: Date.now },
  progress: {
    watched: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }
  }
}, { _id: false });

const ratingSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true },
  rating: { type: Number, min: 1, max: 10 },
  review: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: ''
  },
  favorites: [mediaItemSchema],
  watchlist: [mediaItemSchema],
  watchHistory: [watchHistorySchema],
  ratings: [ratingSchema],
  adblockerInstalled: {
    type: Boolean,
    default: false
  },
  browserUsed: {
    type: String,
    default: 'Unknown'
  },
  deviceType: {
    type: String,
    default: 'Desktop'
  },
  totalTimeSpent: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook: hash password if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: return user object without password
userSchema.methods.toSafeObject = function () {
  const userObj = this.toObject();
  delete userObj.password;
  return userObj;
};

module.exports = mongoose.model('User', userSchema);
