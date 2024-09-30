import redis from 'redis';

import dotenv from "dotenv";
dotenv.config();

// Redis clients for user config storage and locks
export let redisClient: redis.RedisClientType; // for keeping multiple users data & config's
export let redisLockClient: redis.RedisClientType; // for avoiding conflict for simultaneous/concurrent update to same data at same time
// from both sheet and DB

// Initialize Redis clients with error handling
export async function initializeRedisClients() {
  try {
    const redis = await import('redis');
    redisClient = redis.createClient({
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT as string),
      },
    });

    redisLockClient = redis.createClient({
      password: process.env.REDIS_PASSWORD_LOCK,
      socket: {
        host: process.env.REDIS_HOST_LOCK,
        port: parseInt(process.env.REDIS_PORT_LOCK as string),
        connectTimeout: 10000,
      },
    });

    await redisClient.connect();
    console.log('Redis client connected!');
    await redisLockClient.connect();
    console.log('Redis locking client connected!');

    console.log('Redis client and Redis lock client connected successfully');
  } catch (err) {
    console.error('Failed to create Redis clients:', err);
    throw err;
  }
}

export async function closeRedisClients() {
  try {
    // Disconnect main Redis client if connected
    if (redisClient) {
      await redisClient.quit();
      console.log('Redis client disconnected.');
    }

    // Disconnect Redis lock client if connected
    if (redisLockClient) {
      await redisLockClient.quit();
      console.log('Redis lock client disconnected.');
    }
  } catch (err) {
    console.error('Error closing Redis clients:', err);
  }
}

