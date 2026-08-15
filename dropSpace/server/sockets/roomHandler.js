import { nanoid } from "nanoid";
import cloudinary from "../config/cloudinary.js";
import { redis, roomItemsKey, ROOM_TTL_SECONDS } from "../config/redis.js";

let ioInstance = null;

export function getIO() {
  if (!ioInstance) throw new Error("Socket.io not initialized yet");
  return ioInstance;
}

// Tracks who is currently in each room: roomId -> Map(socketId -> deviceName)
const roomPresence = new Map();

function addPresence(roomId, socketId, deviceName) {
  if (!roomPresence.has(roomId)) roomPresence.set(roomId, new Map());
  roomPresence.get(roomId).set(socketId, deviceName || "Unknown device");
  return getDeviceList(roomId);
}

function removePresence(roomId, socketId) {
  const map = roomPresence.get(roomId);
  if (!map) return [];
  map.delete(socketId);
  if (map.size === 0) roomPresence.delete(roomId);
  return getDeviceList(roomId);
}

function getDeviceList(roomId) {
  const map = roomPresence.get(roomId);
  if (!map) return [];
  return Array.from(map.entries()).map(([socketId, name]) => ({
    socketId,
    name,
  }));
}

export function initRoomHandlers(io) {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on("join-room", async (payload, ack) => {
      // Clean room ID extraction & validation
      let rawId = typeof payload === "string" ? payload : payload?.roomId;
      const deviceName =
        typeof payload === "string" ? "Unknown device" : payload?.deviceName;

      if (!rawId || typeof rawId !== "string" || !rawId.trim()) {
        console.warn(`[join-room] Rejected empty/invalid room attempt from ${socket.id}`);
        return ack?.({ ok: false, error: "Invalid room id" });
      }

      const roomId = rawId.trim().toUpperCase();

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.deviceName = deviceName;
      const devices = addPresence(roomId, socket.id, deviceName);

      // Send the joining device current item history + device list
      try {
        const raw = await redis.lrange(roomItemsKey(roomId), 0, -1);
        const items = raw.map((r) => JSON.parse(r));
        ack?.({ ok: true, items, devices });
      } catch (err) {
        console.error("[redis fetch failed]:", err);
        ack?.({ ok: true, items: [], devices });
      }

      // Broadcast updated device list to everyone in room
      io.to(roomId).emit("room-devices", { devices });

      // Notify other devices in the room that a new device paired
      if (devices.length > 1) {
        socket.to(roomId).emit("device-paired", { deviceName, deviceCount: devices.length });
      }
    });

    socket.on("send-text", async ({ roomId, text }, ack) => {
      try {
        if (!roomId || !text?.trim()) {
          return ack?.({ ok: false, error: "roomId and text are required" });
        }

        const cleanRoomId = roomId.trim().toUpperCase();

        const item = {
          id: nanoid(10),
          type: "text",
          content: text,
          createdAt: Date.now(),
        };

        await redis.rpush(roomItemsKey(cleanRoomId), JSON.stringify(item));
        await redis.expire(roomItemsKey(cleanRoomId), ROOM_TTL_SECONDS);

        io.to(cleanRoomId).emit("receive-text", item);
        ack?.({ ok: true, item });
      } catch (err) {
        console.error("[send-text] failed:", err);
        ack?.({ ok: false, error: "Failed to sync text" });
      }
    });

    socket.on("delete-item", async ({ roomId, id }, ack) => {
      try {
        if (!roomId) return ack?.({ ok: false, error: "roomId required" });
        const cleanRoomId = roomId.trim().toUpperCase();

        const raw = await redis.lrange(roomItemsKey(cleanRoomId), 0, -1);
        const target = raw.find((r) => JSON.parse(r).id === id);
        if (target) {
          await redis.lrem(roomItemsKey(cleanRoomId), 1, target);
        }
        io.to(cleanRoomId).emit("item-deleted", { id });
        ack?.({ ok: true });
      } catch (err) {
        console.error("[delete-item] failed:", err);
        ack?.({ ok: false, error: "Failed to delete item" });
      }
    });

    socket.on("clear-room", async (roomId, ack) => {
      try {
        if (!roomId) return ack?.({ ok: false, error: "roomId required" });
        const cleanRoomId = roomId.trim().toUpperCase();

        const raw = await redis.lrange(roomItemsKey(cleanRoomId), 0, -1);
        const items = raw.map((r) => JSON.parse(r));

        const destroys = items
          .filter((i) => i.type === "media" && i.publicId)
          .map((i) =>
            cloudinary.uploader
              .destroy(i.publicId, { resource_type: i.resourceType })
              .catch((e) => console.error("[cloudinary destroy]", e.message))
          );
        await Promise.all(destroys);

        await redis.del(roomItemsKey(cleanRoomId));
        io.to(cleanRoomId).emit("room-cleared");
        ack?.({ ok: true });
      } catch (err) {
        console.error("[clear-room] failed:", err);
        ack?.({ ok: false, error: "Failed to clear room" });
      }
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (roomId) {
        const devices = removePresence(roomId, socket.id);
        io.to(roomId).emit("room-devices", { devices });
        io.to(roomId).emit("device-left", {
          deviceName: socket.data.deviceName,
          deviceCount: devices.length,
        });
      }
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });
}