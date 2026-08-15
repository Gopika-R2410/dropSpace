# dropSpace

Real-time, bidirectional clipboard and temporary media vault. Pair two devices
with a 6-character room code or a QR scan, and anything pasted or dropped on
one side appears instantly on the other — no page reloads.

## Stack

- **Client:** React (Vite), Tailwind CSS, Socket.io-client, Lucide icons
- **Server:** Node.js, Express, Socket.io, Redis (ioredis), Cloudinary, Multer

## Project layout

```
dropSpace/
├── client/     React frontend (Vite dev server on :5173)
└── server/     Express + Socket.io backend (on :5000)
```

## Setup

### 1. Server

```bash
cd server
cp .env.example .env      # fill in REDIS_URL + Cloudinary credentials
npm install
npm run dev                # nodemon, or `npm start` for plain node
```

You need a Redis instance — a free [Upstash](https://upstash.com) database
works well, or run Redis locally (`redis-server`). You need a free
[Cloudinary](https://cloudinary.com) account for the API key/secret/cloud name.

### 2. Client

```bash
cd client
cp .env.example .env      # point VITE_SERVER_URL at your server
npm install
npm run dev
```

Open the printed local URL, then open it again on a second device (or scan
the in-app QR code) — the room code from device A pairs device B automatically.

## How sync works

- Text: `send-text` (client) → Redis `RPUSH` on `room:{id}:items` with a
  24h `EXPIRE` → `receive-text` broadcast to the room.
- Media: browser uploads to `POST /api/upload` → server streams the buffer to
  Cloudinary via Multer → metadata saved in Redis → `receive-media` broadcast.
- Every socket connection tracks room presence in memory so both devices see
  a "Device paired" toast the moment the second one joins.
- "Clear all / destruct space" wipes the Redis list and best-effort deletes
  any Cloudinary assets tied to that room.

## Notes for going further

- Swap the in-memory presence Map in `sockets/roomHandler.js` for Redis if you
  ever run more than one server instance (needed for Socket.io horizontal
  scaling — pair with the `socket.io-redis` adapter).
- The production client bundle is a bit over the default 500kB chunk warning;
  fine for a personal project, but consider code-splitting the syntax
  highlighter if you want a leaner build.
