import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

export default function Dropzone({ onFiles }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
    },
    [onFiles]
  );

  // Allow Ctrl+V / Cmd+V screenshot pasting
  useEffect(() => {
    const handlePaste = (e) => {
      const clipboardItems = e.clipboardData?.files;
      if (clipboardItems && clipboardItems.length > 0) {
        onFiles(clipboardItems);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onFiles]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      className={`rounded-xl border-2 border-dashed cursor-pointer transition-colors px-4 py-6 flex flex-col items-center justify-center gap-2 text-center ${
        dragging
          ? "border-cyan bg-cyan/5"
          : "border-glass-border hover:border-violet/50 bg-white/[0.02]"
      }`}
    >
      <UploadCloud size={22} className={dragging ? "text-cyan" : "text-white/40"} />
      <p className="text-sm text-white/60">
        <span className="text-violet-soft font-medium">Drop files, paste screenshots</span> or click to browse
      </p>
      <p className="text-[11px] text-white/30">Images &amp; videos, up to 50MB</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}