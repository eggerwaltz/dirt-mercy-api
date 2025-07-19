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

// Reader1, Reader2, Reader3 route
app.get('/api/posts', async (req, res) => {
  try {
    const data = await fetchAllPosts();
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reader2-specific: selects 3rd newest as featured + full post list
app.get('/api/posts-reader2', async (req, res) => {
  try {
    const data = await fetchAllPosts();
    const allPosts = data.reader2?.posts || [];

    const featuredIndex = 2; // 3rd newest post
    const featured = allPosts[featuredIndex] || null;

    // Format categories as uppercase array
    const formatPost = post => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      link: post.link,
      categories: Array.isArray(post.category)
        ? post.category.map(cat => cat.toUpperCase?.() || cat)
        : [post.category?.toUpperCase?.() || 'UNCATEGORIZED'],
      image: post.image,
      date: post.date
    });

    res.json({
      reader2: {
        featured: featured ? formatPost(featured) : null,
        posts: allPosts.map(formatPost)
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
