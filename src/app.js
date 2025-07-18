const express = require('express');
const cors = require('cors');
const { fetchAllPosts } = require('./services/wordpress.service');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API is running!');
});

// ✅ General posts API
app.get('/api/posts', async (req, res) => {
    try {
        const data = await fetchAllPosts();
        res.json(data);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Reader2-specific endpoint (not needed anymore, but preserved)
app.get('/api/posts-reader2', async (req, res) => {
    try {
        const data = await fetchAllPosts();
        res.json({ reader2: data.reader2 });
    } catch (error) {
        console.error('Reader2 API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = app;
