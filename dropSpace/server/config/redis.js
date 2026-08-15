import Redis from "ioredis";
import "dotenv/config";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Two clients are needed: one for normal commands, one dedicated to pub/sub
// subscriptions, since ioredis puts a client into subscriber mode exclusively.
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
});

export const redisSub = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
});

redis.on("connect", () => console.log("[redis] client connected"));
redis.on("error", (err) => console.error("[redis] client error:", err.message));

redisSub.on("connect", () => console.log("[redis] subscriber connected"));
redisSub.on("error", (err) => console.error("[redis] subscriber error:", err.message));

export const ROOM_TTL_SECONDS = Number(process.env.ROOM_TTL_SECONDS || 86400);

// Key helpers keep naming consistent across the app
export const roomItemsKey = (roomId) => `room:${roomId}:items`;
export const roomMetaKey = (roomId) => `room:${roomId}:meta`;
