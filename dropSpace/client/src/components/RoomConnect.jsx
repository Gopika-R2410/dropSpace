import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { RefreshCw, X } from "lucide-react";
import { useRoom } from "../context/RoomContext";

export default function RoomConnect({ open, onClose }) {
  const { roomId, switchRoom, createNewRoom, deviceCount } = useRoom();
  const [inputId, setInputId] = useState("");

  if (!open) return null;

  const pairUrl = `${window.location.origin}?room=${roomId}`;

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputId.trim().length < 4) return;
    switchRoom(inputId);
    setInputId("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-sm p-6 relative animate-toast-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Close pairing panel"
        >
          <X size={18} />
        </button>

        <h2 className="font-display text-lg font-semibold mb-1">Pair a device</h2>
        <p className="text-sm text-white/50 mb-5">
          Scan this code on your other device, or type the room code manually.
        </p>

        <div className="bg-white rounded-xl p-4 flex items-center justify-center mx-auto w-fit mb-4">
          <QRCodeSVG value={pairUrl} size={168} fgColor="#0A0A14" />
        </div>

        <div className="text-center mb-5">
          <p className="text-xs text-white/40 mb-1">Room code</p>
          <p className="font-mono text-2xl tracking-[0.3em] text-transparent bg-clip-text bg-beam-gradient">
            {roomId}
          </p>
          <p className="text-xs text-white/40 mt-2">
            {deviceCount > 1 ? `${deviceCount} devices connected` : "Waiting for a second device…"}
          </p>
        </div>

        <form onSubmit={handleJoin} className="flex gap-2 mb-4">
          <input
            value={inputId}
            onChange={(e) => setInputId(e.target.value.toUpperCase())}
            placeholder="Enter room code"
            maxLength={10}
            className="flex-1 bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-sm font-mono tracking-widest placeholder:text-white/30 placeholder:tracking-normal focus:border-violet/60 outline-none transition-colors"
          />
          <button
            type="submit"
            className="bg-white/10 hover:bg-white/15 border border-glass-border text-sm px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Join
          </button>
        </form>

        <button
          onClick={() => {
            createNewRoom();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors py-1"
        >
          <RefreshCw size={12} />
          Start a fresh space instead
        </button>
      </div>
    </div>
  );
}
