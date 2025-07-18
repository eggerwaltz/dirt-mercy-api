// src/app.js
const express = require('express');
const cors = require('cors');
const { fetchAllPosts } = require('./services/wordpress.service');

const app = express();

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('API is running!');
});

// All posts route (Reader1, Reader2, Reader3)
app.get('/api/posts', async (req, res) => {
  try {
    const data = await fetchAllPosts();
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reader2-specific endpoint — no need to reprocess categories/images
app.get('/api/posts-reader2', async (req, res) => {
  try {
    const data = await fetchAllPosts();
    const reader2 = data.reader2?.posts || [];

    res.json({ reader2: { posts: reader2 } });
  } catch (error) {
    console.error('Reader2 API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
