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

  // 채팅 히스토리 — 첫 메시지는 시스템 인사말
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // npcMessage(인사말)가 바뀔 때 히스토리 초기화
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
    const next: ChatMsg[] = [...history, { role: "user", content: msg }];
    setHistory(next);
    setLoading(true);
    try {
      const reply = await sendToNPC(msg, next.slice(-8));
      setHistory(h => [...h, { role: "assistant", content: reply }]);
    } catch {
      setHistory(h => [...h, { role: "assistant", content: "죄송합니다, 잠시 후 다시 시도해 주세요 🐸" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 열린 상태: 채팅 창 */}
      <AnimatePresence>
        {showNPC && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="fixed bottom-4 right-4 z-50 flex flex-col w-[min(22rem,92vw)] bg-white border-2 border-black shadow-[4px_4px_0_#000]"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-black bg-primary text-white">
              <span className="text-xl">🐸</span>
              <div className="flex-1">
                <p className="font-pixel text-[0.55rem] leading-none">맹꽁이 AI 상담사</p>
                <p className="text-xs opacity-80">Nodeul PR Assistant</p>
              </div>
              <button
                onClick={() => setShowNPC(false)}
                className="w-6 h-6 flex items-center justify-center border-2 border-white/60 hover:bg-white/20 transition-colors text-sm leading-none"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-64 min-h-32 bg-muted/30">
              {history.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {msg.role === "assistant" && (
                    <span className="text-lg shrink-0 mt-0.5">🐸</span>
                  )}
                  <div
                    className={`max-w-[85%] px-3 py-2 text-base border-2 border-black shadow-[2px_2px_0_#000] ${
                      msg.role === "user"
                        ? "bg-secondary text-white ml-auto"
                        : "bg-white text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 items-center">
                  <span className="text-lg">🐸</span>
                  <div className="bg-white border-2 border-black px-3 py-2 shadow-[2px_2px_0_#000]">
                    <span className="inline-flex gap-1">
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
            <div className="flex border-t-2 border-black">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="질문을 입력하세요..."
                disabled={loading}
                className="flex-1 px-3 py-2 text-base bg-white border-none outline-none disabled:opacity-60 placeholder:text-muted-foreground"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-primary text-white font-pixel text-[0.55rem] border-l-2 border-black hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                전송
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 닫힌 상태: 개구리 버튼 */}
      <AnimatePresence>
        {!showNPC && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => setShowNPC(true)}
            title="맹꽁이 AI 상담사 열기"
            className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-white border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center text-3xl hover:shadow-[2px_2px_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            🐸
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
