// services/wordpress.service.js
const fetch = require('node-fetch');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache
const WP_BASE_URL = 'https://dirtmercy.com/est/wp-json/wp/v2';

// Utility: Timeout-enabled fetch
async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'DIRT MERCY Reader/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

// Utility: Extract multiple categories as uppercase strings
function extractCategories(post) {
  if (
    post._embedded &&
    Array.isArray(post._embedded['wp:term'])
  ) {
    return post._embedded['wp:term']
      .flat()
      .filter(term => term.taxonomy === 'category' && typeof term.name === 'string')
      .map(term => term.name.toUpperCase());
  }
  return ['UNCATEGORIZED'];
}

// Utility: Build a consistent post object
async function processPost(post, fetchFull = false) {
  try {
    const full = fetchFull
      ? await fetchWithTimeout(`${WP_BASE_URL}/posts/${post.id}?_embed`)
      : post;

    const excerpt = full.excerpt?.rendered
      ?.replace(/<[^>]*>/g, '')
      ?.substring(0, 200) + '...';

    const categories = extractCategories(full);

    return {
      id: full.id,
      title: full.title?.rendered?.replace(/<[^>]*>/g, '')?.toUpperCase() || 'UNTITLED',
      content: full.content?.rendered || '',
      excerpt,
      image: full._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'default.jpg',
      categories,
      category: categories[0] || 'UNCATEGORIZED',
      date: new Date(full.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).toUpperCase(),
      link: full.link
    };
  } catch (error) {
    console.error(`Error processing post ${post.id}:`, error);
    throw error;
  }
}

// Main export: Fetch and cache all readers’ posts
async function fetchAllPosts() {
  const cachedData = cache.get('posts');
  if (cachedData) {
    return cachedData;
  }

  try {
    const latestPosts = await fetchWithTimeout(
      `${WP_BASE_URL}/posts?_embed&per_page=22&order=desc&orderby=date`
    );

    const oldestPosts = await fetchWithTimeout(
      `${WP_BASE_URL}/posts?_embed&per_page=12&order=asc&orderby=date`
    );

    const reader1 = await Promise.all(
      latestPosts.slice(0, 10).map(post => processPost(post, true))
    );

    const reader2 = await Promise.all(
      latestPosts.slice(0, 10).map(post => processPost(post, true))
    );

    const reader3 = await Promise.all(
      oldestPosts.map(post => processPost(post, true))
    );

    const result = {
      reader1: { posts: reader1 },
      reader2: { posts: reader2 },
      reader3: { posts: reader3 },
      cached_at: new Date().toISOString()
    };

    cache.set('posts', result);

    return result;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

module.exports = {
  fetchAllPosts
};
