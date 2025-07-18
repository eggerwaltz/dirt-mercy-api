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

// Helper to extract categories from raw WP post object
function extractCategories(post) {
  // Adjust this depending on your WP response shape
  // Example assumes categories are in _embedded['wp:term'] and type 'category'
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

// Helper to get featured image URL from WP post object
function getFeaturedImage(post) {
  if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
    return post._embedded['wp:featuredmedia'][0].source_url || '';
  }
  return '';
}

// Your existing general posts API
app.get('/api/posts', async (req, res) => {
  try {
    const data = await fetchAllPosts();
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// New route specifically for Reader2 enriched data
app.get('/api/posts-reader2', async (req, res) => {
  try {
    const data = await fetchAllPosts();

    // Make sure reader2 posts exist
    const reader2PostsRaw = data.reader2?.posts || [];

    // Map over reader2 posts to add full content, categories, featured image
    const reader2Posts = reader2PostsRaw.map(post => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,  // full content, e.g. post.content.rendered
      link: post.link,
      category: extractCategories(post).join(', '), // join categories into a string
      image: getFeaturedImage(post),
      date: post.date
    }));

    res.json({ reader2: { posts: reader2Posts } });
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
