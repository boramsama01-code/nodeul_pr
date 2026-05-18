import React, { useEffect, useRef, useState } from "react";
import { useUIStore } from "@/store/useUIStore";
import { motion, AnimatePresence } from "framer-motion";
import { MaengkongiCharacter, MaengkongiIcon } from "./MaengkongiCharacter";

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
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="fixed bottom-4 right-4 z-50 flex flex-col w-[min(22rem,92vw)] bg-white border-4 border-black shadow-[6px_6px_0_#000]"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b-4 border-black bg-[hsl(108,55%,28%)] text-white">
              <MaengkongiIcon size={36} dancing={loading} />
              <div className="flex-1">
                <p className="font-pixel text-[0.5rem] leading-none opacity-80 tracking-wider">MAENGKONGI AI</p>
                <p className="font-pixel-body text-lg leading-tight font-bold">맹꽁이 상담사</p>
              </div>
              <button
                onClick={() => setShowNPC(false)}
                className="w-7 h-7 flex items-center justify-center border-2 border-white/50 hover:bg-white/20 transition-colors font-pixel text-xs"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-72 min-h-32 bg-[hsl(196,60%,97%)]">
              {history.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 mt-1">
                      <MaengkongiIcon size={28} />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-3 py-2 font-pixel-body text-base border-2 border-black shadow-[2px_2px_0_#000] leading-snug ${
                      msg.role === "user"
                        ? "bg-[hsl(225,75%,45%)] text-white"
                        : "bg-white text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 items-center">
                  <MaengkongiIcon size={28} dancing />
                  <div className="bg-white border-2 border-black px-3 py-2 shadow-[2px_2px_0_#000]">
                    <span className="inline-flex gap-1 items-center">
                      <span className="w-2 h-2 bg-[hsl(108,55%,28%)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-[hsl(108,55%,28%)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-[hsl(108,55%,28%)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex border-t-4 border-black">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="질문을 입력하세요..."
                disabled={loading}
                className="flex-1 px-3 py-2 font-pixel-body text-base bg-white border-none outline-none disabled:opacity-60 placeholder:text-muted-foreground"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-[hsl(108,55%,28%)] text-white font-pixel text-[0.5rem] border-l-4 border-black hover:bg-[hsl(108,55%,22%)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            title="맹꽁이 상담사 열기"
            className="fixed bottom-4 right-4 z-50 w-[72px] h-[72px] bg-white border-4 border-black shadow-[6px_6px_0_#000] flex items-center justify-center hover:shadow-[3px_3px_0_#000] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            <MaengkongiCharacter size={52} variant="waving" floating />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
