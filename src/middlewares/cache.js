const { redisClient } = require('../config/redisClient');

const cacheMiddleware = (prefix = 'cache', ttl = 300) => async (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = `${prefix}:${req.originalUrl}`;

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // Override res.json to cache the result
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      redisClient.setEx(key, ttl, JSON.stringify(body)).catch(console.error);
      return originalJson(body);
    };

    next();
  } catch (err) {
    console.error('Cache middleware error:', err);
    next(); // Fallback: don't block if Redis fails
  }
};

module.exports = cacheMiddleware;
