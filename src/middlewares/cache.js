const redisClient = require('../config/redisClient')

const cacheMiddleware = (prefix = 'cache', ttl = 300) => async (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = `${prefix}:${req.originalUrl}`;
  console.log('[Cache] Key:', key);

  try {
    const cached = await redisClient.get(key);
    console.log('[Cache] Fetched from Redis:', cached);

    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // Intercept before calling next()
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      try {
        const value = JSON.stringify(body);
        redisClient.setEx(key, ttl, value)
          .then(() => console.log('[Cache] Stored to Redis:', key))
          .catch((err) => console.error('[Cache] Redis setEx error:', err));
      } catch (err) {
        console.error('[Cache] Failed to serialize/cache:', err);
      }

      return originalJson(body);
    };

    next(); // Call this AFTER setting up res.json interception
  } catch (err) {
    console.error('[Cache] Middleware error:', err);
    next();
  }
};


module.exports = cacheMiddleware;
