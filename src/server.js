// server.js
const http = require('http');
const app = require('./app');
const { redisClient } = require('./config/redisClient');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

(async () => {
  server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
  });
})();


// Graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  console.log('🛑 Gracefully shutting down...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    redisClient.quit().then(() => {
      console.log('🔌 Redis client closed');
      process.exit(0);
    });
  });
}
