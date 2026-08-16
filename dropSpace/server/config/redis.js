import { Redis } from "ioredis";
import "dotenv/config";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Redis configuration optimized for cloud hosts like Render
const redisOptions = {
  // Fixes potential Pub/Sub & command queuing issues on hosted instances
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // Reconnect automatically if connection drops during heavy uploads
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

export const redis = new Redis(REDIS_URL, redisOptions);
export const redisSub = new Redis(REDIS_URL, redisOptions);

redis.on("connect", () => console.log("[redis] client connected"));
redis.on("error", (err) => console.error("[redis] client error:", err.message));

redisSub.on("connect", () => console.log("[redis] subscriber connected"));
redisSub.on("error", (err) => console.error("[redis] subscriber error:", err.message));

export const ROOM_TTL_SECONDS = Number(process.env.ROOM_TTL_SECONDS || 86400);

// Key helpers keep naming consistent across the app
export const roomItemsKey = (roomId) => `room:${roomId}:items`;
export const roomMetaKey = (roomId) => `room:${roomId}:meta`;