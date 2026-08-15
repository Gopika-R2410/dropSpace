import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import "dotenv/config";

import { upload } from "./middleware/multer.js";
import { handleUpload } from "./controllers/uploadController.js";
import { initRoomHandlers } from "./sockets/roomHandler.js";
import { redis } from "./config/redis.js";

const app = express();
const server = http.createServer(app);

// Reflects whatever origin made the request, so any Netlify domain (prod,
// preview, or a custom domain later) always works without redeploying the
// backend just to update an allow-list.
app.use(cors({ origin: true, credentials: true }));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"], credentials: true },
  maxHttpBufferSize: 1e8, // 100MB headroom
});

initRoomHandlers(io);

app.get("/api/health", async (req, res) => {
  let redisOk = false;
  try {
    redisOk = (await redis.ping()) === "PONG";
  } catch {
    redisOk = false;
  }
  res.json({ status: "ok", redis: redisOk, uptime: process.uptime() });
});

app.post("/api/upload", upload.single("file"), handleUpload);

// Central error handler so multer/parsing errors return JSON instead of
// crashing or hanging the request.
app.use((err, req, res, next) => {
  console.error("[error]", err.message);
  res.status(400).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[dropSpace] server listening on port ${PORT}`);
});
