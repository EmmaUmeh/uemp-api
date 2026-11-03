import 'dotenv/config';
import { setServers } from 'node:dns';
import { isIP } from 'node:net';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import apiRoutes from './routes';
import { errorHandler } from './utils/error-handler.util';
import logger from './utils/logger.utils';
import { HTTPStatus } from './utils/http.utils';
import HTTPException from './utils/error.utils';

const app = express();
const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;
const sessionSecret = process.env.SESSION_SECRET;
const mongoDnsServers = process.env.MONGODB_DNS_SERVERS?.split(',')
  .map((server) => server.trim())
  .filter(Boolean);

if (!mongoUri || !sessionSecret) {
  throw new Error('MONGODB_URI and SESSION_SECRET must be set in the environment.');
}

if (mongoDnsServers?.length) {
  const invalidServer = mongoDnsServers.find((server) => isIP(server) === 0);

  if (invalidServer) {
    throw new Error(`Invalid DNS server address in MONGODB_DNS_SERVERS: ${invalidServer}`);
  }

  setServers(mongoDnsServers);
}

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(
  session({
    name: 'university.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoUri,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.get('/v1/health', (_req, res) => {
  const isDatabaseConnected = mongoose.connection.readyState === 1;
  res.status(isDatabaseConnected ? HTTPStatus.OK : HTTPStatus.SERVICE_UNAVAILABLE).json({
    status: isDatabaseConnected ? 'ok' : 'unavailable',
    database: isDatabaseConnected ? 'connected' : 'disconnected',
  });
});
app.use('/v1', apiRoutes);
app.use((_req, _res, next) => {
  next(new HTTPException(HTTPStatus.NOT_FOUND, 'Route not found.'));
});

app.use(errorHandler);

mongoose
  .connect(mongoUri)
  .then(() =>
    app.listen(port, () => logger.info(`University portal API listening on port ${port}`)),
  )
  .catch((error: unknown) => {
    logger.error('Could not connect to MongoDB.', {
      message: error instanceof Error ? error.message : 'Unknown connection error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  });
