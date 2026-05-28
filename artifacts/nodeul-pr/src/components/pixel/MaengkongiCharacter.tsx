import React from "react";

type MaengkongiVariant = "normal" | "happy" | "shy" | "waving";

interface MaengkongiProps {
  size?: number;
  variant?: MaengkongiVariant;
  dancing?: boolean;
  floating?: boolean;
  className?: string;
}

/**
 * 맹꽁이 캐릭터
 * 레이어 순서: 뒷발 → 몸통 → 배 → 앞발 → 머리(얼굴+눈+코+입)
 * 머리(cy=32)를 몸통(cy=76)보다 훨씬 위에 배치해 얼굴이 가려지지 않게 함
 */
export function MaengkongiCharacter({
  size = 80,
  variant = "normal",
  dancing = false,
  floating = true,
  className = "",
}: MaengkongiProps) {
  const animClass = dancing
    ? "animate-maengkongi-dance"
    : floating
    ? "animate-maengkongi-float"
    : "";

  return (
    <div
      className={`inline-block select-none ${animClass} ${className}`}
      style={{ width: size, height: size * 1.1 }}
    >
      <svg
        viewBox="0 0 100 110"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size * 1.1}
        style={{ imageRendering: "pixelated", overflow: "visible" }}
      >
        {/* ── 뒷발 ── */}
        <ellipse cx="18" cy="95" rx="15" ry="8" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
        <ellipse cx="82" cy="95" rx="15" ry="8" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
        {/* 왼 발가락 */}
        <line x1="6"  y1="95" x2="3"  y2="102" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="13" y1="101" x2="11" y2="107" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="21" y1="101" x2="21" y2="107" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        {/* 오른 발가락 */}
        <line x1="79" y1="101" x2="79" y2="107" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="87" y1="101" x2="89" y2="107" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="94" y1="95" x2="97" y2="102" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>

        {/* ── 몸통 — cy=76으로 낮게 ── */}
        <ellipse cx="50" cy="76" rx="36" ry="26" fill="#4DB86B" stroke="#1A5C2A" strokeWidth="2.5"/>

        {/* ── 배 ── */}
        <ellipse cx="50" cy="81" rx="22" ry="17" fill="#CCE9BB"/>

        {/* ── 앞발 ── */}
        {variant === "waving" ? (
          <>
            <ellipse cx="9"  cy="80" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
            <ellipse
              cx="92" cy="58"
              rx="7" ry="10"
              fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"
              transform="rotate(-35, 92, 58)"
            />
          </>
        ) : (
          <>
            <ellipse cx="9"  cy="80" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
            <ellipse cx="91" cy="80" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
          </>
        )}

        {/* ── 머리 — cy=32, 몸통(top≈y50)보다 훨씬 위에 위치 ── */}
        {/* 머리 바닥쪽 목 연결부 (몸통과 자연스럽게 이어짐) */}
        <ellipse cx="50" cy="58" rx="18" ry="10" fill="#4DB86B"/>

        {/* 머리 본체 */}
        <ellipse cx="50" cy="36" rx="28" ry="24" fill="#4DB86B" stroke="#1A5C2A" strokeWidth="2.5"/>

        {/* ── 볼 하이라이트 ── */}
        <ellipse cx="33" cy="48" rx="7" ry="4" fill="#5DC87A" opacity="0.35"/>
        <ellipse cx="67" cy="48" rx="7" ry="4" fill="#5DC87A" opacity="0.35"/>

        {/* ── 눈 — 머리 상단, cx=34/66 r=9으로 머리 안에 딱 맞게 ── */}
        {/* 눈 흰자 */}
        <circle cx="34" cy="25" r="9" fill="white" stroke="#1A5C2A" strokeWidth="2"/>
        <circle cx="66" cy="25" r="9" fill="white" stroke="#1A5C2A" strokeWidth="2"/>

        {/* 홍채 */}
        <circle cx="34" cy="26" r="6" fill="#2A5820"/>
        <circle cx="66" cy="26" r="6" fill="#2A5820"/>

        {/* 동공 */}
        <circle cx="34" cy="27" r="3.5" fill="#080E08"/>
        <circle cx="66" cy="27" r="3.5" fill="#080E08"/>

        {/* 눈 반짝이 */}
        <circle cx="30" cy="21" r="2" fill="white"/>
        <circle cx="62" cy="21" r="2" fill="white"/>
        <circle cx="37" cy="31" r="1" fill="white"/>
        <circle cx="69" cy="31" r="1" fill="white"/>

        {/* ── 코 ── */}
        <circle cx="45" cy="44" r="2.2" fill="#1A5C2A" opacity="0.45"/>
        <circle cx="55" cy="44" r="2.2" fill="#1A5C2A" opacity="0.45"/>

        {/* ── 입 ── */}
        {variant === "happy" ? (
          <>
            <path
              d="M 36 52 Q 50 63 64 52"
              stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"
            />
            <path d="M 37 52 Q 50 60 63 52" fill="#1A5C2A" opacity="0.12"/>
          </>
        ) : variant === "shy" ? (
          <path
            d="M 43 52 Q 50 57 57 52"
            stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"
          />
        ) : (
          <>
            <path
              d="M 38 52 Q 50 60 62 52"
              stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"
            />
            <ellipse cx="50" cy="54" rx="8" ry="2.5" fill="#1A5C2A" opacity="0.1"/>
          </>
        )}
      </svg>
    </div>
  );
}

export function MaengkongiIcon({
  size = 32,
  dancing = false,
  className = "",
}: {
  size?: number;
  dancing?: boolean;
  className?: string;
}) {
  return (
    <MaengkongiCharacter
      size={size}
      variant="normal"
      dancing={dancing}
      floating={!dancing}
      className={className}
    />
  );
}
