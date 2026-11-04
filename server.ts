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
import dotenv from "dotenv"

dotenv.config();

const app = express();
const port = Number(process.env.PORT);
const database_url = process.env.MONGODB_URI as string;
const sessionSecret = process.env.SESSION_SECRET as string;


if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
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
      mongoUrl: database_url,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use('/v1', apiRoutes);
app.use((_req, _res, next) => {
  next(new HTTPException(HTTPStatus.NOT_FOUND, 'Route not found.'));
});

app.use(errorHandler);

mongoose
  .connect(database_url)
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
