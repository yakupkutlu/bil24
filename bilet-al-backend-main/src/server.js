import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initSockets } from './sockets/index.js';

const server = http.createServer(app);
initSockets(server);

async function bootstrap() {
  await connectDB();
  await connectRedis();
  server.listen(env.PORT, () => logger.info(`Tiatru API running on port ${env.PORT}`));
}

bootstrap().catch((error) => {
  logger.error('Failed to start server', { message: error.message, stack: error.stack });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});
