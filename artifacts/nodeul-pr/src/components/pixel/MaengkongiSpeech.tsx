import React from "react";

const KR = { fontFamily: "'Noto Sans KR', sans-serif" };

/* ──────────────────────────────────────────────────────────── */
/* MaengkongiSpeech — 🐸 말풍선 */
/* ──────────────────────────────────────────────────────────── */
const MOOD_STYLES = {
  normal:   { bg: "bg-emerald-50",  border: "border-emerald-200/80", text: "text-slate-700",  tail: "#d1fae5" },
  cheer:    { bg: "bg-green-50",    border: "border-green-300/80",   text: "text-slate-700",  tail: "#bbf7d0" },
  alert:    { bg: "bg-amber-50",    border: "border-amber-300/80",   text: "text-amber-900",  tail: "#fef3c7" },
  thinking: { bg: "bg-slate-50",    border: "border-slate-200/80",   text: "text-slate-600",  tail: "#f1f5f9" },
};

export function MaengkongiSpeech({
  children,
  mood = "normal",
  className = "",
}: {
  children: React.ReactNode;
  mood?: "normal" | "alert" | "cheer" | "thinking";
  className?: string;
}) {
  const s = MOOD_STYLES[mood];
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {/* 🐸 emoji avatar */}
      <div className="flex-shrink-0 flex flex-col items-center gap-0.5 pt-0.5">
        <div className="w-9 h-9 rounded-full bg-white border border-emerald-200 shadow-sm flex items-center justify-center text-xl select-none">
          🐸
        </div>
        <span className="text-[9px] font-semibold text-emerald-600 tracking-wide" style={{ fontFamily: "inherit" }}>맹꽁이</span>
      </div>
      {/* 말풍선 */}
      <div className={`relative flex-1 rounded-xl px-4 py-2.5 border shadow-sm ${s.bg} ${s.border} ${s.text}`}>
        <div
          className="absolute left-[-7px] top-3 w-0 h-0"
          style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: `7px solid ${s.tail}` }}
        />
        <div className="text-xs leading-relaxed" style={KR}>{children}</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* StepGuide — 4단계 홍보 신청 가이드 */
/* ──────────────────────────────────────────────────────────── */
const STEPS = [
  { n: 1, label: "행사 등록",   icon: "📝" },
  { n: 2, label: "구역 신청",   icon: "📍" },
  { n: 3, label: "홍보물 제출", icon: "📁" },
  { n: 4, label: "승인 & 게시", icon: "✅" },
];

export function StepGuide({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center w-full overflow-x-auto">
      {STEPS.map((step, i) => {
        const isPast    = step.n < currentStep;
        const isCurrent = step.n === currentStep;
        const isFuture  = step.n > currentStep;
        return (
          <React.Fragment key={step.n}>
            <div className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[70px]">
              {/* 원형 아이콘 */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                isCurrent ? "bg-primary text-white shadow-md shadow-primary/30 ring-2 ring-primary/20 ring-offset-1" :
                isPast    ? "bg-emerald-100 text-emerald-600" :
                            "bg-slate-100 text-slate-400"
              }`}>
                {isPast ? "✓" : step.icon}
              </div>
              {/* 레이블 */}
              <div className={`text-[10px] font-semibold text-center whitespace-nowrap ${
                isCurrent ? "text-primary" :
                isPast    ? "text-emerald-600" :
                            "text-slate-400"
              }`} style={KR}>
                {step.label}
              </div>
            </div>
            {/* 연결선 */}
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mx-1 min-w-[16px] ${
                currentStep > step.n + 1 || currentStep > step.n
                  ? isPast ? "bg-emerald-300" : "bg-slate-200"
                  : "bg-slate-200"
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* FrogBadge — 로그인/회원가입용 🐸 */
/* ──────────────────────────────────────────────────────────── */
export function FrogBadge({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[64px] leading-none select-none">🐸</div>
      {label && (
        <span className="font-pixel text-[9px] text-primary uppercase tracking-widest">{label}</span>
      )}
    </div>
  );
}

/* backwards-compat exports */
export const QuestProgress = StepGuide;
export function MissionBanner(_props: any) { return null; }
export function PixelFrogLarge({ mood: _mood }: { mood?: string }) {
  return <FrogBadge />;
}
