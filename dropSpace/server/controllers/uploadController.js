import { nanoid } from "nanoid";
import cloudinary from "../config/cloudinary.js";
import { redis, roomItemsKey, ROOM_TTL_SECONDS } from "../config/redis.js";
import { getIO } from "../sockets/roomHandler.js";

// Wraps Cloudinary's upload_stream in a Promise so it can be awaited like
// any other async call, and pipes the Multer buffer straight into it.
function streamUpload(buffer, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: "dropspace",
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
}

export async function handleUpload(req, res) {
  try {
    const { roomId } = req.body;
    const file = req.file;

    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }
    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const resourceType = file.mimetype.startsWith("video") ? "video" : "image";
    const result = await streamUpload(file.buffer, resourceType);

    const item = {
      id: nanoid(10),
      type: "media",
      resourceType, // "image" | "video"
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      originalName: file.originalname,
      createdAt: Date.now(),
    };

    // Persist metadata alongside text items so the room has one ordered feed
    await redis.rpush(roomItemsKey(roomId), JSON.stringify(item));
    await redis.expire(roomItemsKey(roomId), ROOM_TTL_SECONDS);

    // Broadcast to every device in the room, including the uploader, so all
    // clients render from the same event path.
    getIO().to(roomId).emit("receive-media", item);

    res.status(201).json({ success: true, item });
  } catch (err) {
    console.error("[upload] failed:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
}
