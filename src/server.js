// server.js
const http = require('http');
const app = require('./app');
require('dotenv').config()

const PORT = process.env.PORT;

const server = http.createServer(app);

(async () => {
  server.listen(PORT, () => {
    console.log(`🚀 Gateway running on port ${PORT}`);
  });
})();


// Graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  console.log('🛑 Gracefully shutting down...');
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
}
