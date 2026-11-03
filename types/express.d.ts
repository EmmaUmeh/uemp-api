import type { UserDocument } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

export {};
