import React, { useEffect, useRef, useState } from "react";
import { useUIStore } from "@/store/useUIStore";
import { motion, AnimatePresence } from "framer-motion";

type ChatMsg = { role: "user" | "assistant"; content: string };

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function sendToNPC(message: string, history: ChatMsg[]): Promise<string> {
  const res = await fetch(`${BASE}/api/npc/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error("서버 오류");
  const data = await res.json() as { reply: string };
  return data.reply;
}

export const NPCHelper: React.FC = () => {
  const { npcMessage, showNPC, setShowNPC } = useUIStore();

  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (npcMessage) {
      setHistory([{ role: "assistant", content: npcMessage }]);
    }
  }, [npcMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  useEffect(() => {
    if (showNPC) setTimeout(() => inputRef.current?.focus(), 300);
  }, [showNPC]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");

    const prevHistory = [...history];
    setHistory(h => [...h, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const reply = await sendToNPC(msg, prevHistory.slice(-8));
      setHistory(h => [...h, { role: "assistant", content: reply }]);
    } catch {
      setHistory(h => [...h, { role: "assistant", content: "죄송합니다, 잠시 후 다시 시도해 주세요 🐸" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showNPC && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed bottom-4 right-4 z-50 flex flex-col w-[min(22rem,92vw)] bg-white border border-black/12 shadow-xl rounded-lg overflow-hidden"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-primary text-white">
              <span className="text-2xl leading-none select-none">🐸</span>
              <div className="flex-1 min-w-0">
                <p className="text-[0.6rem] font-semibold opacity-70 uppercase tracking-widest font-pixel">맹꽁이 AI</p>
                <p className="text-sm font-bold leading-tight" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                  노들섬 안내 도우미
                </p>
              </div>
              <button
                onClick={() => setShowNPC(false)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/20 transition-colors text-sm"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-72 min-h-32 bg-slate-50">
              {history.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {msg.role === "assistant" && (
                    <span className="text-lg leading-none mt-1 flex-shrink-0 select-none">🐸</span>
                  )}
                  <div
                    className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary text-white"
                        : "bg-white border border-black/10 text-foreground shadow-sm"
                    }`}
                    style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 items-center">
                  <span className="text-lg select-none">🐸</span>
                  <div className="bg-white border border-black/10 px-3 py-2 rounded-lg shadow-sm">
                    <span className="inline-flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex border-t border-black/10">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="질문을 입력하세요..."
                disabled={loading}
                className="flex-1 px-3 py-2.5 text-sm bg-white border-none outline-none disabled:opacity-60 placeholder:text-muted-foreground"
                style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 bg-primary text-white text-xs font-semibold border-l border-black/10 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
              >
                전송
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 닫힌 상태: 맹꽁이 버튼 */}
      <AnimatePresence>
        {!showNPC && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => setShowNPC(true)}
            title="맹꽁이 안내 도우미 열기"
            className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 hover:scale-105 transition-all text-2xl"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
          >
            🐸
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
