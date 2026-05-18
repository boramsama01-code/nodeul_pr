import React from "react";

const KR = { fontFamily: "'Noto Sans KR', sans-serif" };

function PixelFrog({ size = 40, mood = "normal" }: { size?: number; mood?: "normal" | "alert" | "cheer" | "thinking" }) {
  const eyeColor = mood === "alert" ? "#f59e0b" : mood === "thinking" ? "#818cf8" : "#1e293b";
  const mouthColor = mood === "cheer" ? "#15803d" : "#16a34a";
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ imageRendering: "pixelated", display: "block" }}>
      {/* eye bumps */}
      <rect x="3" y="2" width="8" height="7" fill="#22c55e"/>
      <rect x="21" y="2" width="8" height="7" fill="#22c55e"/>
      {/* head */}
      <rect x="2" y="7" width="28" height="13" fill="#22c55e"/>
      {/* body */}
      <rect x="7" y="18" width="18" height="10" fill="#22c55e"/>
      {/* arms */}
      <rect x="2" y="18" width="6" height="5" fill="#22c55e"/>
      <rect x="24" y="18" width="6" height="5" fill="#22c55e"/>
      {/* feet */}
      <rect x="0" y="23" width="9" height="4" fill="#16a34a"/>
      <rect x="23" y="23" width="9" height="4" fill="#16a34a"/>
      {/* eye whites */}
      <rect x="4" y="3" width="5" height="5" fill="#dcfce7"/>
      <rect x="23" y="3" width="5" height="5" fill="#dcfce7"/>
      {/* pupils */}
      <rect x="6" y="5" width="2" height="2" fill={eyeColor}/>
      <rect x="24" y="5" width="2" height="2" fill={eyeColor}/>
      {/* tummy */}
      <rect x="9" y="13" width="14" height="5" fill="#86efac"/>
      {/* mouth */}
      {mood === "cheer" ? (
        <>
          <rect x="11" y="15" width="2" height="2" fill={mouthColor}/>
          <rect x="19" y="15" width="2" height="2" fill={mouthColor}/>
          <rect x="13" y="16" width="6" height="2" fill={mouthColor}/>
        </>
      ) : mood === "thinking" ? (
        <>
          <rect x="12" y="16" width="8" height="1" fill={mouthColor}/>
          <rect x="20" y="15" width="2" height="1" fill={mouthColor}/>
        </>
      ) : mood === "alert" ? (
        <>
          <rect x="12" y="17" width="8" height="1" fill={mouthColor}/>
          <rect x="11" y="16" width="2" height="1" fill={mouthColor}/>
          <rect x="19" y="16" width="2" height="1" fill={mouthColor}/>
        </>
      ) : (
        <>
          <rect x="11" y="15" width="2" height="2" fill={mouthColor}/>
          <rect x="19" y="15" width="2" height="2" fill={mouthColor}/>
          <rect x="13" y="16" width="6" height="1" fill={mouthColor}/>
        </>
      )}
      {/* nose dots */}
      <rect x="14" y="13" width="1" height="1" fill="#16a34a"/>
      <rect x="17" y="13" width="1" height="1" fill="#16a34a"/>
    </svg>
  );
}

const MOOD_STYLES = {
  normal:   { bg: "bg-emerald-50",  border: "border-emerald-200", text: "text-slate-700",     tag: "bg-emerald-100 text-emerald-700" },
  cheer:    { bg: "bg-green-50",    border: "border-green-300",   text: "text-slate-700",     tag: "bg-green-100 text-green-700" },
  alert:    { bg: "bg-amber-50",    border: "border-amber-300",   text: "text-amber-900",     tag: "bg-amber-100 text-amber-700" },
  thinking: { bg: "bg-indigo-50",   border: "border-indigo-200",  text: "text-indigo-900",    tag: "bg-indigo-100 text-indigo-700" },
};

export function MaengkongiSpeech({
  children,
  mood = "normal",
  frogSize = 44,
  label,
  className = "",
}: {
  children: React.ReactNode;
  mood?: "normal" | "alert" | "cheer" | "thinking";
  frogSize?: number;
  label?: string;
  className?: string;
}) {
  const s = MOOD_STYLES[mood];
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <PixelFrog size={frogSize} mood={mood} />
        {label && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-pixel ${s.tag}`} style={{ letterSpacing: "0.05em" }}>
            {label}
          </span>
        )}
      </div>
      <div className={`relative flex-1 rounded-lg px-4 py-3 border ${s.bg} ${s.border} ${s.text}`}>
        {/* speech bubble tail — border triangle */}
        <div className="absolute left-[-9px] top-4 w-0 h-0"
          style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: `9px solid ${mood === "alert" ? "#fcd34d" : mood === "thinking" ? "#a5b4fc" : mood === "cheer" ? "#86efac" : "#6ee7b7"}` }}
        />
        <div className="text-xs leading-relaxed" style={KR}>{children}</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* QuestProgress — 4단계 퀘스트 진행 표시 */
/* ──────────────────────────────────────────────────────────── */
const QUEST_STEPS = [
  { n: "01", label: "행사 등록",   icon: "📝" },
  { n: "02", label: "구역 신청",   icon: "📍" },
  { n: "03", label: "홍보물 제출", icon: "📁" },
  { n: "04", label: "승인 & 게시", icon: "✅" },
];

export function QuestProgress({ currentStep, completedSteps = [] }: { currentStep: number; completedSteps?: number[] }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {QUEST_STEPS.map((step, i) => {
        const stepNum = i + 1;
        const isCurrent = stepNum === currentStep;
        const isDone = completedSteps.includes(stepNum);
        const isFuture = stepNum > currentStep && !isDone;
        return (
          <React.Fragment key={step.n}>
            <div className={`flex-shrink-0 flex flex-col items-center gap-1 px-2 py-1.5 rounded transition-all ${
              isCurrent  ? "bg-primary/10 border border-primary/30" :
              isDone     ? "bg-emerald-50 border border-emerald-200" :
                           "opacity-40"
            }`}>
              <div className={`font-pixel text-[9px] tracking-widest ${isCurrent ? "text-primary" : isDone ? "text-emerald-600" : "text-slate-400"}`}>
                {isDone ? "✓ DONE" : isCurrent ? "▶ NOW" : `STEP ${step.n}`}
              </div>
              <div className="text-base leading-none">{isDone ? "⭐" : step.icon}</div>
              <div className={`text-[10px] font-semibold whitespace-nowrap ${isCurrent ? "text-primary" : isDone ? "text-emerald-600" : "text-slate-400"}`} style={KR}>
                {step.label}
              </div>
            </div>
            {i < QUEST_STEPS.length - 1 && (
              <div className={`flex-shrink-0 h-[2px] w-5 mx-0.5 ${isDone ? "bg-emerald-400" : isCurrent || (i + 2 <= currentStep) ? "bg-primary/30" : "bg-slate-200"}`}
                style={{ backgroundImage: isDone ? "none" : "repeating-linear-gradient(to right, currentColor 0, currentColor 3px, transparent 3px, transparent 6px)" }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* MissionBanner — 페이지 상단 미션 배너 */
/* ──────────────────────────────────────────────────────────── */
export function MissionBanner({ step, title, subtitle, accent = "primary" }: {
  step: string;
  title: string;
  subtitle?: string;
  accent?: "primary" | "amber" | "indigo";
}) {
  const colors = {
    primary: "from-emerald-50 to-teal-50 border-primary/20 text-primary",
    amber:   "from-amber-50 to-yellow-50 border-amber-300 text-amber-700",
    indigo:  "from-indigo-50 to-violet-50 border-indigo-200 text-indigo-700",
  };
  return (
    <div className={`rounded-lg border bg-gradient-to-r px-4 py-3 flex items-center gap-4 ${colors[accent]}`}>
      <div className="flex-shrink-0 text-center">
        <div className="font-pixel text-[9px] tracking-widest opacity-60 uppercase">MISSION</div>
        <div className="font-pixel text-2xl leading-none">{step}</div>
      </div>
      <div className="w-px h-8 bg-current opacity-20 flex-shrink-0"/>
      <div>
        <div className="font-pixel text-xs tracking-wide uppercase">{title}</div>
        {subtitle && <div className="text-[11px] text-slate-500 mt-0.5" style={KR}>{subtitle}</div>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* PixelFrogLarge — 큰 픽셀 개구리 (로그인/회원가입용) */
/* ──────────────────────────────────────────────────────────── */
export function PixelFrogLarge({ mood = "normal" }: { mood?: "normal" | "cheer" }) {
  return <PixelFrog size={72} mood={mood} />;
}
