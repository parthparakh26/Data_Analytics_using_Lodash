const express = require('express');
const axios = require('axios');
const _ = require('lodash');
const PORT = 8000;

const app = express();


const fetchBlogData = async () => {
  try {
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    });

    return response.data.blogs;
  } catch (error) {
    throw error;
  }
};

const calculateBlogStats = async (query) => {
  const blogs = await fetchBlogData();

  const totalBlogs = blogs.length;
  const longestBlog = _.maxBy(blogs, (blog) => blog.title.length);
  const blogsWithPrivacy = _.filter(blogs, (blog) =>
    _.includes(_.toLower(blog.title), 'privacy')
  );
  const uniqueBlogTitles = _.uniqBy(blogs, 'title').map((blog) => blog.title);

  const responseData = {
    totalBlogs,
    longestBlog: longestBlog ? longestBlog.title : '',
    blogsWithPrivacy: blogsWithPrivacy.length,
    uniqueBlogTitles,
  };

  return responseData;
};

const memoizedBlogStats = _.memoize(calculateBlogStats, (query) => query);

const searchBlogs = async (query) => {
  const blogs = await fetchBlogData();

  const filteredBlogs = _.filter(blogs, (blog) =>
    _.includes(_.toLower(blog.title), _.toLower(query))
  );

  return filteredBlogs;
};

const memoizedSearchBlogs = _.memoize(searchBlogs, (query) => query);

app.get('/api/blog-stats', async (req, res) => {
  try {
    const stats = await memoizedBlogStats(req.query.query);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching or analyzing blog data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/favicon.ico', (req, res) => res.status(204));

app.get('/api/blog-search', async (req, res) => {
  try {
    const query = req.query.query || '';

    const searchResults = await memoizedSearchBlogs(query);

    res.json(searchResults);
  } catch (error) {
    console.error('Error searching for blogs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
