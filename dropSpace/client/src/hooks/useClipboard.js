import { useCallback, useState } from "react";

export function useClipboard(resetDelay = 1600) {
  const [copiedId, setCopiedId] = useState(null);

  const copy = useCallback(
    async (text, id) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId((current) => (current === id ? null : current)), resetDelay);
        return true;
      } catch (err) {
        console.error("Clipboard write failed:", err);
        return false;
      }
    },
    [resetDelay]
  );

  return { copy, copiedId };
}
