const express = require('express');
const cors = require('cors');
const { fetchAllPosts } = require('./services/wordpress.service');

const app = express();

app.use(cors());
app.use(express.json());

// Root route for Render health check or testing
app.get('/', (req, res) => {
  res.send('API is running!');
});

// Your API routes
app.get('/api/posts', async (req, res) => {
  try {
    const data = await fetchAllPosts();
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
