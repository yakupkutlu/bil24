import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redisClient = null;

export function getRedisClient() {
  if (!env.REDIS_URL) return null;
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 2
    });
    redisClient.on('error', (error) => logger.warn('Redis error', { message: error.message }));
  }
  return redisClient;
}

export async function connectRedis() {
  const client = getRedisClient();
  if (!client) {
    logger.info('Redis disabled; MongoDB TTL seat locks are active.');
    return null;
  }
  await client.connect();
  logger.info('Redis connected.');
  return client;
}
