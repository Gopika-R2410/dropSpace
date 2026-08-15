import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSocketContext } from "./SocketContext";
import { getDeviceName } from "../deviceName";
import { API_BASE_URL } from "../config";

const RoomContext = createContext(null);

const ROOM_STORAGE_KEY = "dropspace:roomId";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function generateRoomId(length = 6) {
  let id = "";
  for (let i = 0; i < length; i++) {
    id += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return id;
}

export function RoomProvider({ children }) {
  const { socket, connected } = useSocketContext();

  const [roomId, setRoomId] = useState(() => {
    const saved = localStorage.getItem(ROOM_STORAGE_KEY);
    if (saved && saved.trim().length >= 4) return saved.trim().toUpperCase();
    const fresh = generateRoomId();
    localStorage.setItem(ROOM_STORAGE_KEY, fresh);
    return fresh;
  });

  const [items, setItems] = useState([]);
  const [devices, setDevices] = useState([]); // [{ socketId, name }]
  const [joined, setJoined] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [deviceName] = useState(() => getDeviceName());

  // Tracks the most recent room we've asked to join, purely so a slow
  // response for an OLD room doesn't overwrite state after the user has
  // already switched to a NEW room. No longer used to block re-entrancy —
  // that was the bug: a stuck flag could silently swallow every future
  // join attempt if one request never resolved (e.g. a Render cold start).
  const latestRequestRef = useRef(null);

  const deviceCount = devices.length || 1;

  const pushToast = useCallback((message, variant = "default") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const joinRoom = useCallback(
    (idToJoin, { announceErrors = false, isRetry = false } = {}) => {
      if (!socket || !connected || !idToJoin) return;

      const clean = idToJoin.trim().toUpperCase();
      if (!clean) return;

      const requestId = `${clean}-${Date.now()}`;
      latestRequestRef.current = requestId;

      console.log(`[dropSpace] joining room "${clean}" as "${deviceName}"…`);

      socket.emit("join-room", { roomId: clean, deviceName }, (res) => {
        // Ignore stale responses if the user has since switched rooms again
        if (latestRequestRef.current !== requestId) return;

        if (res?.ok) {
          console.log(`[dropSpace] joined "${clean}" — devices:`, res.devices);
          setItems(res.items || []);
          setDevices(res.devices || []);
          setJoined(true);
        } else {
          console.error(`[dropSpace] join-room failed for "${clean}":`, res?.error);
          // The server can briefly reject a join right after Render wakes up
          // from a cold start (Redis not fully ready yet). Retry once,
          // silently, before bothering the user with an error toast.
          if (!isRetry) {
            setTimeout(() => {
              joinRoom(clean, { announceErrors, isRetry: true });
            }, 1500);
            return;
          }
          if (announceErrors) {
            pushToast(res?.error || "Could not join room", "error");
          }
        }
      });
    },
    [socket, connected, deviceName, pushToast]
  );

  // (Re)join whenever the socket (re)connects or the active room changes.
  // isManualSwitch=false here (silent) since this fires on every reconnect.
  useEffect(() => {
    if (!connected || !roomId) return;
    joinRoom(roomId, { announceErrors: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, roomId]);

  useEffect(() => {
    if (!socket) return;

    const onReceiveText = (item) => {
      setItems((prev) => [...prev, item]);
      pushToast("New text synced from paired device");
    };
    const onReceiveMedia = (item) => {
      setItems((prev) => [...prev, item]);
      pushToast(item.resourceType === "video" ? "New video synced" : "New photo synced");
    };
    const onItemDeleted = ({ id }) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    };
    const onRoomCleared = () => {
      setItems([]);
      pushToast("Space cleared", "warning");
    };
    const onRoomDevices = ({ devices }) => setDevices(devices || []);
    const onDevicePaired = ({ deviceName: joinerName }) => {
      pushToast(`${joinerName || "A device"} paired ✓`, "success");
    };
    const onDeviceLeft = ({ deviceName: leaverName }) => {
      pushToast(`${leaverName || "A device"} disconnected`, "warning");
    };

    socket.on("receive-text", onReceiveText);
    socket.on("receive-media", onReceiveMedia);
    socket.on("item-deleted", onItemDeleted);
    socket.on("room-cleared", onRoomCleared);
    socket.on("room-devices", onRoomDevices);
    socket.on("device-paired", onDevicePaired);
    socket.on("device-left", onDeviceLeft);

    return () => {
      socket.off("receive-text", onReceiveText);
      socket.off("receive-media", onReceiveMedia);
      socket.off("item-deleted", onItemDeleted);
      socket.off("room-cleared", onRoomCleared);
      socket.off("room-devices", onRoomDevices);
      socket.off("device-paired", onDevicePaired);
      socket.off("device-left", onDeviceLeft);
    };
  }, [socket, pushToast]);

  const sendText = useCallback(
    (text) => {
      if (!socket || !connected) return;
      socket.emit("send-text", { roomId, text }, (res) => {
        if (!res?.ok) pushToast(res?.error || "Failed to sync text", "error");
      });
    },
    [socket, connected, roomId, pushToast]
  );

  const uploadFile = useCallback(
    async (file) => {
      if (!file || !roomId) return;
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("roomId", roomId);

        const res = await fetch(`${API_BASE_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        pushToast("Media uploaded successfully!", "success");
        return data;
      } catch (err) {
        console.error("[dropSpace] upload error:", err);
        pushToast(err.message || "Failed to upload file", "error");
      }
    },
    [roomId, pushToast]
  );

  const deleteItem = useCallback(
    (id) => {
      if (!socket || !connected) return;
      socket.emit("delete-item", { roomId, id });
    },
    [socket, connected, roomId]
  );

  const clearRoom = useCallback(() => {
    if (!socket || !connected) return;
    socket.emit("clear-room", roomId, (res) => {
      if (!res?.ok) pushToast(res?.error || "Failed to clear space", "error");
    });
  }, [socket, connected, roomId, pushToast]);

  const switchRoom = useCallback(
    (newId) => {
      if (typeof newId !== "string") return;
      const clean = newId.trim().toUpperCase();
      if (!clean) return;
      setJoined(false);
      setItems([]);
      setDevices([]);
      setRoomId(clean);
      localStorage.setItem(ROOM_STORAGE_KEY, clean);
      joinRoom(clean, { announceErrors: true });
    },
    [joinRoom]
  );

  const createNewRoom = useCallback(() => {
    switchRoom(generateRoomId());
  }, [switchRoom]);

  return (
    <RoomContext.Provider
      value={{
        roomId,
        items,
        devices,
        deviceCount,
        deviceName,
        joined,
        connected,
        toasts,
        pushToast,
        dismissToast,
        sendText,
        uploadFile,
        deleteItem,
        clearRoom,
        switchRoom,
        createNewRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
}
