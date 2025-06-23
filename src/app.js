const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('express-async-errors');

// const rateLimiter = require('./middlewares/rateLimiter')
// const { logger } = require('./middlewares/logger');
// const errorHandler = require('./middleware/errorHandler');
const { API_VERSION } = require('./config'); // import the version

const v1Routes = require('./routes/v1')


const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(compression());
app.use(express.json());

// app.use(rateLimiter);


// Mount API routes
app.use(`/api/${API_VERSION}`, v1Routes);
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// app.get('/', (req, res) => {
//   res.json({
//     message: 'Node.js Proxy Gateway is running',
//     version: '1.0.0',
//     proxy_routes: ['/api/v1/*'],
//     approach: 'Streaming proxy with caching support'
//   });
// });

module.exports = app;
