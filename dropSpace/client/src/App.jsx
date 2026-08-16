import { useEffect, useState } from "react";
import { Trash } from "lucide-react";
import Header from "./components/Header";
import RoomConnect from "./components/RoomConnect";
import TextVault from "./components/TextVault";
import MediaVault from "./components/MediaVault";
import ToastStack from "./components/Toast";
import { useRoom } from "./context/RoomContext";

export default function App() {
  const { switchRoom, clearRoom, deviceCount, connected } = useRoom();
  const [pairingOpen, setPairingOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedRoom = params.get("room");
    if (sharedRoom) {
      switchRoom(sharedRoom);
      window.history.replaceState({}, "", window.location.pathname);
    }}, []);

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    clearRoom();
    setConfirmClear(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenPairing={() => setPairingOpen(true)} />
      <ToastStack />
      <RoomConnect open={pairingOpen} onClose={() => setPairingOpen(false)} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* Signature element: a live sync beam that pulses harder once paired */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mb-1.5">
            One space, every device.
          </h1>
          <p className="text-sm text-white/45 max-w-md">
            Pair this window with your phone. Anything dropped on one side lands on the other, instantly.
          </p>
          <div
            className={`mt-4 h-[3px] rounded-full bg-beam-gradient origin-center ${
              connected ? "animate-beam-pulse" : "opacity-20"
            } ${deviceCount > 1 ? "" : "opacity-40"}`}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
          <TextVault />
          <MediaVault />
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleClear}
            className={`flex items-center gap-2 text-xs px-4 py-2 rounded-full border transition-all ${
              confirmClear
                ? "border-magenta/60 bg-magenta/10 text-magenta-soft"
                : "border-glass-border text-white/35 hover:text-white/60 hover:border-white/20"
            }`}
          >
            <Trash size={12} />
            {confirmClear ? "Tap again to destruct space" : "Clear all / destruct space"}
          </button>
        </div>
      </main>

      <footer className="text-center text-[11px] text-white/20 py-6">
        Items auto-expire after 24 hours · dropSpace
      </footer>
    </div>
  );
}
