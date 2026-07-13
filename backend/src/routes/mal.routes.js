const express = require('express');
const axios = require('axios');
const router = express.Router();

const MAL_BASE = 'https://api.myanimelist.net/v2';
const MAL_HEADERS = {
  'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID,
};

const ANIME_FIELDS = 'id,title,main_picture,synopsis,mean,rank,popularity,num_episodes,status,genres,studios,start_date,end_date,media_type,rating';
const ANIME_DETAIL_FIELDS = 'id,title,main_picture,synopsis,mean,rank,popularity,num_episodes,status,genres,studios,start_date,end_date,media_type,rating,pictures,background,related_anime,recommendations,statistics';

// Search anime
router.get('/anime/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const response = await axios.get(`${MAL_BASE}/anime`, {
      headers: MAL_HEADERS,
      params: { q, limit, fields: ANIME_FIELDS },
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.response?.data || 'Failed to fetch from MAL',
    });
  }
});

// Seasonal anime
router.get('/anime/seasonal', async (req, res) => {
  try {
    const { year, season, limit = 20, offset = 0 } = req.query;
    const response = await axios.get(
      `${MAL_BASE}/anime/season/${year}/${season}`,
      {
        headers: MAL_HEADERS,
        params: { limit, offset, fields: ANIME_FIELDS, sort: 'anime_score' },
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.response?.data || 'Failed to fetch seasonal anime',
    });
  }
});

// Anime ranking
router.get('/anime/ranking', async (req, res) => {
  try {
    const { type = 'all', limit = 20, offset = 0 } = req.query;
    const response = await axios.get(`${MAL_BASE}/anime/ranking`, {
      headers: MAL_HEADERS,
      params: { ranking_type: type, limit, offset, fields: ANIME_FIELDS },
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.response?.data || 'Failed to fetch anime ranking',
    });
  }
});

// Anime details by ID
router.get('/anime/:id', async (req, res) => {
  try {
    const response = await axios.get(
      `${MAL_BASE}/anime/${req.params.id}`,
      {
        headers: MAL_HEADERS,
        params: { fields: ANIME_DETAIL_FIELDS },
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.response?.data || 'Failed to fetch anime details',
    });
  }
});

module.exports = router;
