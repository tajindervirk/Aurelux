const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { rateLimit } = require('express-rate-limit');

// Load env vars first
dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const malRoutes = require('./routes/mal.routes');
const providerRoutes = require('./routes/provider.routes');
const tmdbRoutes = require('./routes/tmdb.routes');

// Initialize Express app
const app = express();

// Use Helmet for basic security headers & CSP for the video player and external APIs
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-src": [
        "'self'",
        "https://vidlink.pro",
        "https://vidnest.fun",
        "https://www.youtube.com",
        "https://youtube.com",
        "https://www.youtube-nocookie.com"
      ],
      "connect-src": [
        "'self'",
        "https://api.themoviedb.org",
        "https://image.tmdb.org",
        "https://graphql.anilist.co",
        "https://api.myanimelist.net",
        "https://www.youtube.com",
        "https://www.google.com",
        "https://googleads.g.doubleclick.net"
      ],
      "img-src": [
        "'self'",
        "data:",
        "https://image.tmdb.org",
        "https://cdn.myanimelist.net",
        "https://s4.anilist.co",
        "https://i.ytimg.com"
      ],
      "script-src": [
        "'self'",
        "https://www.youtube.com",
        "https://www.youtube-nocookie.com",
        "'unsafe-inline'"
      ],
    },
  },
}));

const cookieParser = require('cookie-parser');

// --------------- Rate Limiting ---------------

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  limit: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many login/registration attempts. Please try again after 24 hours.'
  }
});

// Moderate limit for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

// --------------- Middleware ---------------
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true // Crucial for cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// --------------- Health Check ---------------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date()
  });
});

// --------------- Routes ---------------
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', apiLimiter, userRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/mal', apiLimiter, malRoutes);
app.use('/api/providers', apiLimiter, providerRoutes);
app.use('/api/tmdb', apiLimiter, tmdbRoutes);

// Serve frontend in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile('index.html', { root: frontendDist }, (err) => {
    if (err) next(err);
  });
});

// --------------- Error Handler (must be last) ---------------
app.use(errorHandler);

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;

const seedProviders = async () => {
  const Provider = require('./models/Provider');
  const count = await Provider.countDocuments();
  if (count === 0) {
    await Provider.insertMany([
      {
        providerId: 'vidlink',
        name: 'VidLink',
        description: 'Fast & reliable · Tracks progress',
        animeIdType: 'mal',
        movieUrlTemplate: 'https://vidlink.pro/movie/{id}',
        tvUrlTemplate: 'https://vidlink.pro/tv/{id}/{s}/{e}',
        animeUrlTemplate: 'https://vidlink.pro/anime/{id}/{ep}/{subDub}',
        isActive: true
      },
      {
        providerId: 'vidnest',
        name: 'VidNest',
        description: 'Wide library · Sub & Dub support',
        animeIdType: 'anilist',
        movieUrlTemplate: 'https://vidnest.fun/movie/{id}',
        tvUrlTemplate: 'https://vidnest.fun/tv/{id}/{s}/{e}',
        animeUrlTemplate: 'https://vidnest.fun/anime/{id}/{ep}/{subDub}',
        isActive: true
      }
    ]);
    console.log('🌱 Seeded default streaming providers');
  }
};

const startServer = async () => {
  await connectDB();
  await seedProviders();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Aurelux server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('💤 Server closed.');
      process.exit(0);
    });
  });
};

startServer();

// Export app for testing
module.exports = app;
