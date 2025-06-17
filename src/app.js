const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('express-async-errors');

const rateLimiter = require('./middlewares/rateLimiter')
// const { logger } = require('./middlewares/logger');
// const errorHandler = require('./middleware/errorHandler');
const { API_VERSION } = require('./config'); // import the version

const v1Routes = require('./routes/v1')
// const userRoutes = require('./routes/userRoutes');
// const servicesRoutes = require('./routes/servicesRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(compression());
app.use(express.json());

app.use(rateLimiter);

// ⚡ Option 1: Apply cache to all GET routes under /api/v1
app.use(`/api/${API_VERSION}`, v1Routes);

module.exports = app;
