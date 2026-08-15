import { useCallback, useState } from "react";
import { Download, FileVideo, Trash2 } from "lucide-react";
import Dropzone from "./Dropzone";
import { useRoom } from "../context/RoomContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

function uploadWithProgress(file, roomId, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    form.append("roomId", roomId);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else reject(new Error("Upload failed"));
    });
    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));

    xhr.open("POST", `${SERVER_URL}/api/upload`);
    xhr.send(form);
  });
}

export default function MediaVault() {
  const { items, roomId, deleteItem, pushToast } = useRoom();
  const [uploading, setUploading] = useState([]); // [{ id, name, progress }]

  const mediaItems = items.filter((i) => i.type === "media");

  const handleFiles = useCallback(
    (fileList) => {
      Array.from(fileList).forEach(async (file) => {
        const localId = `${Date.now()}-${file.name}`;
        setUploading((prev) => [...prev, { id: localId, name: file.name, progress: 0 }]);

        try {
          await uploadWithProgress(file, roomId, (progress) => {
            setUploading((prev) =>
              prev.map((u) => (u.id === localId ? { ...u, progress } : u))
            );
          });
        } catch (err) {
          pushToast(`Failed to upload ${file.name}`, "error");
        } finally {
          setUploading((prev) => prev.filter((u) => u.id !== localId));
        }
      });
    },
    [roomId, pushToast]
  );

  return (
    <section className="glass-panel flex flex-col h-full min-h-[420px]">
      <div className="px-5 pt-4 pb-3 border-b border-glass-border flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-white/80">Media vault</h2>
        <span className="text-[11px] text-white/35 font-mono">{mediaItems.length} files</span>
      </div>

      <div className="p-4">
        <Dropzone onFiles={handleFiles} />
      </div>

      {uploading.length > 0 && (
        <div className="px-4 pb-2 space-y-2">
          {uploading.map((u) => (
            <div key={u.id} className="text-xs">
              <div className="flex justify-between mb-1 text-white/50">
                <span className="truncate max-w-[70%]">{u.name}</span>
                <span className="font-mono">{u.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-beam-gradient transition-all duration-150"
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {mediaItems.length === 0 && uploading.length === 0 && (
          <p className="text-sm text-white/30 text-center py-10">
            Drop a photo or video above — it'll show up here on every paired device.
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {mediaItems.map((item) => (
            <div
              key={item.id}
              className="group relative animate-slide-in-left rounded-xl overflow-hidden border border-glass-border bg-white/[0.03] aspect-square"
            >
              {item.resourceType === "video" ? (
                <video src={item.url} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <img
                  src={item.url}
                  alt={item.originalName || "Synced media"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}

              {item.resourceType === "video" && (
                <div className="absolute top-1.5 left-1.5 bg-black/50 rounded-full p-1">
                  <FileVideo size={11} className="text-white/80" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-1.5 gap-1">
                <a
                  href={item.url}
                  download={item.originalName}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/80 hover:text-cyan-soft transition-colors"
                  aria-label="Download file"
                >
                  <Download size={13} />
                </a>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/80 hover:text-magenta-soft transition-colors"
                  aria-label="Delete file"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
