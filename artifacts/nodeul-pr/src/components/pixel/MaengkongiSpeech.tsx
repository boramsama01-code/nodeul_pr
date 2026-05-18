import React from "react";

const KR = { fontFamily: "'Noto Sans KR', sans-serif" };

/* ──────────────────────────────────────────────────────────── */
/* 이미지 기반 마스코트 프리미티브 */
/* ──────────────────────────────────────────────────────────── */
const FROG_W = 480, FROG_H = 835;  // maengkongi.png 실제 크기
const EGRET_W = 459, EGRET_H = 982; // baekro.png 실제 크기

/** 맹꽁이 얼굴 — 이미지 상단 40% */
function MaengkongiFace({ width = 48 }: { width?: number }) {
  const imgH = Math.round(width * FROG_H / FROG_W);
  const visH = Math.round(imgH * 0.41);
  return (
    <div style={{ width, height: visH, overflow: "hidden", flexShrink: 0 }}>
      <img src="/mascots/maengkongi.png" alt="맹꽁이"
        style={{ width, height: imgH, imageRendering: "pixelated", display: "block" }} />
    </div>
  );
}

/** 맹꽁이 전신 — 이미지 하단 41% */
export function MaengkongiBody({ width = 88 }: { width?: number }) {
  const imgH = Math.round(width * FROG_H / FROG_W);
  const visH = Math.round(imgH * 0.415);
  return (
    <div style={{ width, height: visH, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <img src="/mascots/maengkongi.png" alt="맹꽁이"
        style={{ width, height: imgH, imageRendering: "pixelated", display: "block", position: "absolute", bottom: 0 }} />
    </div>
  );
}

/** 백로 서 있는 자세 — 이미지 하단 45% */
function BaekroBody({ width = 44 }: { width?: number }) {
  const imgH = Math.round(width * EGRET_H / EGRET_W);
  const visH = Math.round(imgH * 0.45);
  return (
    <div style={{ width, height: visH, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <img src="/mascots/baekro.png" alt="백로"
        style={{ width, height: imgH, imageRendering: "pixelated", display: "block", position: "absolute", bottom: 0 }} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* MaengkongiSpeech — 맹꽁이 말풍선 (관리자 알림) */
/* ──────────────────────────────────────────────────────────── */
const FROG_MOOD = {
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
  const s = FROG_MOOD[mood];
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex-shrink-0 flex flex-col items-center gap-0.5 pt-0.5">
        <MaengkongiFace width={52} />
        <span className="text-[9px] font-semibold text-emerald-700 tracking-wide">맹꽁이</span>
      </div>
      <div className={`relative flex-1 rounded-xl px-4 py-2.5 border shadow-sm ${s.bg} ${s.border} ${s.text}`}>
        <div className="absolute left-[-7px] top-3 w-0 h-0"
          style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: `7px solid ${s.tail}` }} />
        <div className="text-xs leading-relaxed" style={KR}>{children}</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* BaekroSpeech — 백로 말풍선 (설명·안내 도우미) */
/* ──────────────────────────────────────────────────────────── */
const BAEKRO_MOOD = {
  normal:   { bg: "bg-sky-50",    border: "border-sky-200/80",   text: "text-slate-700",  tail: "#e0f2fe" },
  cheer:    { bg: "bg-blue-50",   border: "border-blue-200/80",  text: "text-slate-700",  tail: "#dbeafe" },
  thinking: { bg: "bg-slate-50",  border: "border-slate-200/80", text: "text-slate-600",  tail: "#f1f5f9" },
};

export function BaekroSpeech({
  children,
  mood = "normal",
  className = "",
}: {
  children: React.ReactNode;
  mood?: "normal" | "cheer" | "thinking";
  className?: string;
}) {
  const s = BAEKRO_MOOD[mood];
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex-shrink-0 flex flex-col items-center gap-0.5 pt-0.5">
        <BaekroBody width={46} />
        <span className="text-[9px] font-semibold text-sky-600 tracking-wide">백로</span>
      </div>
      <div className={`relative flex-1 rounded-xl px-4 py-2.5 border shadow-sm ${s.bg} ${s.border} ${s.text}`}>
        <div className="absolute left-[-7px] top-3 w-0 h-0"
          style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: `7px solid ${s.tail}` }} />
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
        return (
          <React.Fragment key={step.n}>
            <div className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[70px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                isCurrent ? "bg-primary text-white shadow-md shadow-primary/30 ring-2 ring-primary/20 ring-offset-1" :
                isPast    ? "bg-emerald-100 text-emerald-600" :
                            "bg-slate-100 text-slate-400"
              }`}>
                {isPast ? "✓" : step.icon}
              </div>
              <div className={`text-[10px] font-semibold text-center whitespace-nowrap ${
                isCurrent ? "text-primary" : isPast ? "text-emerald-600" : "text-slate-400"
              }`} style={KR}>
                {step.label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mx-1 min-w-[16px] ${isPast ? "bg-emerald-300" : "bg-slate-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* FrogBadge — 로그인/회원가입용 맹꽁이 전신 */
/* ──────────────────────────────────────────────────────────── */
export function FrogBadge({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <MaengkongiBody width={92} />
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
