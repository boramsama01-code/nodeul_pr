import React, { useEffect, useRef, useState } from "react";
import { useUIStore } from "@/store/useUIStore";
import { motion, AnimatePresence } from "framer-motion";

type ChatMsg = { role: "user" | "assistant"; content: string };

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const STORAGE_KEY = "maengkongi_chat_history";

/* 맹꽁이 얼굴 인라인 컴포넌트 (NPCHelper 전용) */
const FROG_W = 480, FROG_H = 835;
function FrogFace({ width }: { width: number }) {
  const imgH = Math.round(width * FROG_H / FROG_W);
  const visH = Math.round(imgH * 0.41);
  return (
    <div style={{ width, height: visH, overflow: "hidden", flexShrink: 0 }}>
      <img src="/mascots/maengkongi.png" alt="맹꽁이"
        style={{ width, height: imgH, imageRendering: "pixelated", display: "block", backgroundColor: "white" }} />
    </div>
  );
}

/* 맹꽁이 전신 (플로팅 버튼용) */
function FrogBodyBtn({ width }: { width: number }) {
  const imgH = Math.round(width * FROG_H / FROG_W);
  const visH = Math.round(imgH * 0.415);
  return (
    <div style={{ width, height: visH, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <img src="/mascots/maengkongi.png" alt="맹꽁이"
        style={{ width, height: imgH, imageRendering: "pixelated", display: "block", position: "absolute", bottom: 0, backgroundColor: "white" }} />
    </div>
  );
}

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

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {line}
          {idx < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
}

const LANDING_BUBBLE_TEXT = "도움이 필요하시면 저를 찾아주세요!";

function TypingBubble({ visible }: { visible: boolean }) {
  const [displayed, setDisplayed] = React.useState("");
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (!visible) { setDisplayed(""); setDone(false); return; }
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(LANDING_BUBBLE_TEXT.slice(0, i));
      if (i >= LANDING_BUBBLE_TEXT.length) { setDone(true); clearInterval(interval); }
    }, 55);
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible && !displayed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 right-4 z-50 max-w-[13rem] bg-white border border-primary/30 rounded-xl px-3 py-2 shadow-lg text-xs text-foreground"
          style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          {displayed}
          {!done && <span className="ml-0.5 animate-pulse text-primary">|</span>}
          {/* 말풍선 꼬리 */}
          <div className="absolute bottom-[-7px] right-5 w-0 h-0"
            style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "7px solid white", filter: "drop-shadow(0 1px 0 rgba(0,128,80,0.2))" }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const NPCHelper: React.FC = () => {
  const { npcMessage, showNPC, showLandingBubble, npcBadgeCount, setShowNPC } = useUIStore();

  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          setInitialized(true);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    if (npcMessage && !initialized) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setHistory([{ role: "assistant", content: npcMessage }]);
        setInitialized(true);
      }
    }
  }, [npcMessage, initialized]);

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
      setHistory(h => [...h, { role: "assistant", content: "죄송합니다, 잠시 후 다시 시도해 주세요." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
    setInitialized(false);
    if (npcMessage) {
      setHistory([{ role: "assistant", content: npcMessage }]);
      setInitialized(true);
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
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-primary text-white">
              <div className="flex-shrink-0">
                <FrogFace width={36} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.6rem] font-semibold opacity-70 uppercase tracking-widest font-pixel">맹꽁이 AI</p>
                <p className="text-sm font-bold leading-tight" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                  노들섬 안내 도우미
                </p>
              </div>
              <button
                onClick={handleClear}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/20 transition-colors text-xs opacity-70"
                aria-label="대화 초기화"
                title="대화 초기화"
              >
                🗑️
              </button>
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
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 mt-1">
                      <FrogFace width={26} />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary text-white"
                        : "bg-white border border-black/10 text-foreground shadow-sm"
                    }`}
                    style={{ fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: "pre-wrap" }}
                  >
                    <MessageContent content={msg.content} />
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 items-center">
                  <div className="flex-shrink-0">
                    <FrogFace width={26} />
                  </div>
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

      {/* 닫힌 상태: 말풍선 + 맹꽁이 플로팅 버튼 */}
      <TypingBubble visible={!showNPC && showLandingBubble} />
      <AnimatePresence>
        {!showNPC && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => setShowNPC(true)}
            title="맹꽁이 안내 도우미 열기"
            className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-primary rounded-full shadow-lg flex items-end justify-center overflow-hidden hover:bg-primary/90 hover:scale-105 transition-all pb-0.5 relative"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
          >
            <FrogBodyBtn width={44} />
            {npcBadgeCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none border-2 border-white z-10"
                style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                {npcBadgeCount > 99 ? "99+" : npcBadgeCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
