import { corsOrigins, env } from './env.js';

export const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-session-id', 'X-Tiatru-Client', 'X-Tiatru-Env', 'X-Request-Id'],
  exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
  maxAge: env.NODE_ENV === 'production' ? 86400 : 0
};
