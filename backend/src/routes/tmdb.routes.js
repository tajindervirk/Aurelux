const express = require('express');
const router = express.Router();
const axios = require('axios');

// Proxy all requests to TMDB API
router.use(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    // req.originalUrl could be something like /api/tmdb/movie/popular?page=1
    // We want to extract /movie/popular?page=1
    // A robust way is to just use req.url which contains the path + query string relative to this router's mount point
    const tmdbPath = req.url;
    
    // Construct the actual TMDB API URL
    const url = `https://api.themoviedb.org/3${tmdbPath}`;
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`
      }
    });

    res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error('TMDB Proxy Error:', error.message);
      res.status(500).json({ success: false, message: 'Failed to fetch from TMDB' });
    }
  }
});

module.exports = router;
