import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useRoom } from "../context/RoomContext";

const VARIANT_STYLES = {
  default: { icon: Info, ring: "ring-cyan/40", iconColor: "text-cyan" },
  success: { icon: CheckCircle2, ring: "ring-violet/40", iconColor: "text-violet-soft" },
  warning: { icon: TriangleAlert, ring: "ring-amber/40", iconColor: "text-amber" },
  error: { icon: TriangleAlert, ring: "ring-magenta/40", iconColor: "text-magenta-soft" },
};

export default function ToastStack() {
  const { toasts, dismissToast } = useRoom();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((toast) => {
        const style = VARIANT_STYLES[toast.variant] || VARIANT_STYLES.default;
        const Icon = style.icon;
        return (
          <div
            key={toast.id}
            className={`glass-panel ring-1 ${style.ring} animate-toast-in flex items-center gap-3 px-4 py-3`}
            role="status"
          >
            <Icon size={18} className={style.iconColor} />
            <p className="text-sm text-white/85 flex-1">{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-white/40 hover:text-white/80 transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
