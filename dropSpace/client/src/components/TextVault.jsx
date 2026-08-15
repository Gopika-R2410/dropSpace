import { useState } from "react";
import { Check, Copy, SendHorizontal, Trash2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useRoom } from "../context/RoomContext";
import { useClipboard } from "../hooks/useClipboard";

const CODE_HINTS = /(function\s|=>|const\s|let\s|import\s|def\s|class\s|;\n|<\/?\w+>|\{\s*\n)/;

function looksLikeCode(text) {
  return CODE_HINTS.test(text) || (text.includes("\n") && /[{};]/.test(text));
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function TextVault() {
  const { items, sendText, deleteItem } = useRoom();
  const { copy, copiedId } = useClipboard();
  const [draft, setDraft] = useState("");

  const textItems = items.filter((i) => i.type === "text");

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    sendText(trimmed);
    setDraft("");
  };

  return (
    <section className="glass-panel flex flex-col h-full min-h-[420px]">
      <div className="px-5 pt-4 pb-3 border-b border-glass-border flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-white/80">Text &amp; clipboard hub</h2>
        <span className="text-[11px] text-white/35 font-mono">{textItems.length} items</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {textItems.length === 0 && (
          <p className="text-sm text-white/30 text-center py-10">
            Nothing here yet — paste text below and it lands on every paired device instantly.
          </p>
        )}

        {textItems.map((item) => {
          const isCode = looksLikeCode(item.content);
          const isCopied = copiedId === item.id;
          return (
            <div
              key={item.id}
              className="animate-slide-in-right group rounded-xl border border-glass-border bg-white/[0.03] overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 pt-2">
                <span className="text-[10px] font-mono text-white/30">{timeAgo(item.createdAt)}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copy(item.content, item.id)}
                    className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-cyan-soft transition-colors"
                    aria-label="Copy to clipboard"
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-magenta-soft transition-colors"
                    aria-label="Delete item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {isCode ? (
                <SyntaxHighlighter
                  language="javascript"
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    padding: "0.75rem",
                    background: "transparent",
                    fontSize: "12.5px",
                  }}
                  wrapLongLines
                >
                  {item.content}
                </SyntaxHighlighter>
              ) : (
                <p className="px-3 pb-3 pt-1 text-sm text-white/80 whitespace-pre-wrap break-words">
                  {item.content}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-glass-border">
        <div className="relative">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend(e);
            }}
            placeholder="Paste or type text, links, or code…  (⌘/Ctrl + Enter to send)"
            rows={3}
            className="w-full resize-none bg-white/5 border border-glass-border rounded-xl px-3.5 py-3 pr-12 text-sm placeholder:text-white/30 focus:border-violet/60 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="absolute bottom-2.5 right-2.5 p-2 rounded-lg bg-beam-gradient text-void disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all"
            aria-label="Send text"
          >
            <SendHorizontal size={15} />
          </button>
        </div>
        <div className="flex justify-end mt-1.5">
          <span className="text-[11px] text-white/25 font-mono">{draft.length} chars</span>
        </div>
      </form>
    </section>
  );
}
