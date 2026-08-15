import { useState } from "react";
import { Laptop, QrCode, Smartphone, Tablet, Zap } from "lucide-react";
import { useRoom } from "../context/RoomContext";

function deviceIcon(name = "") {
  if (/phone/i.test(name)) return Smartphone;
  if (/tablet/i.test(name)) return Tablet;
  return Laptop;
}

export default function Header({ onOpenPairing }) {
  const { roomId, connected, deviceCount, devices, deviceName } = useRoom();
  const paired = deviceCount > 1;
  const [showDevices, setShowDevices] = useState(false);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-void/60 border-b border-glass-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-beam-gradient flex items-center justify-center shadow-glow shrink-0">
            <Zap size={16} className="text-void fill-void" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">
            drop<span className="text-transparent bg-clip-text bg-beam-gradient">Space</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pairing status + device list dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDevices((s) => !s)}
              onBlur={() => setTimeout(() => setShowDevices(false), 150)}
              className="hidden sm:flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
              title="Show connected devices"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? (paired ? "bg-cyan animate-dot-pulse" : "bg-amber") : "bg-white/30"
                }`}
              />
              <span className="text-xs text-white/60">
                {connected
                  ? `${deviceCount} device${deviceCount > 1 ? "s" : ""} connected`
                  : "Reconnecting…"}
              </span>
            </button>

            {showDevices && (
              <div className="absolute right-0 mt-2 w-56 glass-panel p-2 animate-toast-in z-40">
                <p className="text-[11px] text-white/40 px-2 pb-1.5 pt-1">
                  Connected devices
                </p>
                <ul className="space-y-1">
                  {devices.map((d) => {
                    const Icon = deviceIcon(d.name);
                    const isThisDevice = d.name === deviceName;
                    return (
                      <li
                        key={d.socketId}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-sm"
                      >
                        <Icon size={14} className="text-cyan-soft shrink-0" />
                        <span className="text-white/80 truncate">{d.name}</span>
                        {isThisDevice && (
                          <span className="ml-auto text-[10px] text-violet-soft">you</span>
                        )}
                      </li>
                    );
                  })}
                  {devices.length === 0 && (
                    <li className="px-2 py-1.5 text-xs text-white/30">No devices yet</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Room ID */}
          <div className="glass-panel px-3 py-1.5 rounded-full">
            <span className="text-xs text-white/40 mr-1.5 hidden sm:inline">Room</span>
            <span className="font-mono text-sm tracking-[0.15em] text-violet-soft">{roomId}</span>
          </div>

          <button
            onClick={onOpenPairing}
            className="flex items-center gap-1.5 bg-beam-gradient text-void font-semibold text-sm px-3.5 py-2 rounded-full hover:opacity-90 active:scale-95 transition-all shadow-glow"
          >
            <QrCode size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Pair device</span>
          </button>
        </div>
      </div>
    </header>
  );
}