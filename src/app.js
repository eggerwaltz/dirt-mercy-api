// src/app.js
const express = require('express');
const cors = require('cors');
const { fetchAllPosts } = require('./services/wordpress.service');

const app = express();

app.use(cors());
app.use(express.json());

// Root
app.get('/', (req, res) => {
  res.send('API is running!');
});

// All readers (1, 2, 3)
app.get('/api/posts', async (req, res) => {
  try {
    const data = await fetchAllPosts();
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reader2-only route — mimics PHP logic
app.get('/api/posts-reader2', async (req, res) => {
  try {
    const data = await fetchAllPosts();
    const allPosts = data.reader2?.posts || [];

    // Select 3rd newest post as featured
    const featured = allPosts.length >= 3 ? allPosts[2] : null;

    // Gather unique categories from all posts
    const categories = {};
    allPosts.forEach(post => {
      const cats = Array.isArray(post.categories) ? post.categories : [post.category];
      cats.forEach((cat, index) => {
        const clean = cat?.toUpperCase?.() || 'UNCATEGORIZED';
        if (!Object.values(categories).includes(clean)) {
          const syntheticId = `${clean}-${index}`;
          categories[syntheticId] = clean;
        }
      });
    });

    // Normalize post format
    const formatPost = post => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      link: post.link,
      categories: Array.isArray(post.categories) ? post.categories : [post.category],
      image: post.image,
      date: post.date
    });

    res.json({
      reader2: {
        posts: allPosts.map(formatPost),
        featured: featured ? formatPost(featured) : null,
        categories
      }
    });
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
