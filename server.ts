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

const PORT = Number(process.env.PORT);
const DATABASE_URL = process.env.MONGODB_URI as string;
const SESSION_SECRET = process.env.SESSION_SECRET as string;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';


app.set('trust proxy', IS_PRODUCTION ? 1 : false);

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
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: DATABASE_URL,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: IS_PRODUCTION ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use('/v1', apiRoutes);

app.use((_req, _res, next) => {
  next(new HTTPException(HTTPStatus.NOT_FOUND, 'Route not found.'));
});

app.use(errorHandler);

async function startServer() {
  try {
    await mongoose.connect(DATABASE_URL);

    app.listen(PORT, () => {
      logger.info(`University portal API listening on port ${PORT}`);
    });
  } catch (error: unknown) {
    logger.error('Could not connect to MongoDB.', {
      message: error instanceof Error ? error.message : 'Unknown connection error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    process.exit(1);
  }
}

startServer();

