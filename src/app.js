// src/app.js
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

// Extract categories from embedded terms
function extractCategories(post) {
  if (
    post._embedded &&
    Array.isArray(post._embedded['wp:term'])
  ) {
    const categories = post._embedded['wp:term']
      .flat()
      .filter(term => term.taxonomy === 'category')
      .map(term => term.name);
    return categories.length ? categories : ['Uncategorized'];
  }
  return ['Uncategorized'];
}

// Get featured image URL from embedded media
function getFeaturedImage(post) {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
}

// General posts API
app.get('/api/posts', async (req, res) => {
  try {
    const data = await fetchAllPosts();
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reader2-specific route with full content, image, and categories
app.get('/api/posts-reader2', async (req, res) => {
  try {
    const data = await fetchAllPosts();
    const reader2Raw = data.reader2?.posts || [];

    const reader2Enriched = reader2Raw.map(post => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      link: post.link,
      category: extractCategories(post).join(', '),
      image: getFeaturedImage(post),
      date: post.date
    }));

    res.json({ reader2: { posts: reader2Enriched } });
  } catch (error) {
    console.error('Reader2 API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
