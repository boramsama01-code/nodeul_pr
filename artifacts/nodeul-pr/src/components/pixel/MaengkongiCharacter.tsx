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
 * 맹꽁이 캐릭터 — 머리/몸통 구분 없이 하나의 둥근 덩어리
 * 레이어: 뒷발 → 몸통(머리 일체) → 배 → 앞발 → 눈/코/입
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
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        style={{ imageRendering: "pixelated", overflow: "visible" }}
      >
        {/* ── 뒷발 (가장 뒤) ── */}
        <ellipse cx="16" cy="90" rx="16" ry="9" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
        <ellipse cx="84" cy="90" rx="16" ry="9" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
        {/* 왼 발가락 */}
        <line x1="4"  y1="91" x2="1"  y2="98" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="11" y1="97" x2="9"  y2="103" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="20" y1="97" x2="20" y2="103" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        {/* 오른 발가락 */}
        <line x1="80" y1="97" x2="80" y2="103" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="89" y1="97" x2="91" y2="103" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="96" y1="91" x2="99" y2="98" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>

        {/* ── 몸통+머리 통합 — 하나의 둥글고 통통한 덩어리 ── */}
        <ellipse cx="50" cy="56" rx="40" ry="38" fill="#4DB86B" stroke="#1A5C2A" strokeWidth="2.5"/>

        {/* ── 배 (아랫쪽 밝은 크림색) ── */}
        <ellipse cx="50" cy="66" rx="26" ry="22" fill="#CCE9BB"/>

        {/* ── 앞발 ── */}
        {variant === "waving" ? (
          <>
            <ellipse cx="7"  cy="72" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
            <ellipse
              cx="94" cy="50"
              rx="7" ry="11"
              fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"
              transform="rotate(-30, 94, 50)"
            />
          </>
        ) : (
          <>
            <ellipse cx="7"  cy="72" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
            <ellipse cx="93" cy="72" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
          </>
        )}

        {/* ── 눈 — 덩어리 상단에 돌출, 얼굴이 덮일 걱정 없음 ── */}
        {/* 눈 흰자 */}
        <circle cx="32" cy="28" r="10" fill="white" stroke="#1A5C2A" strokeWidth="2"/>
        <circle cx="68" cy="28" r="10" fill="white" stroke="#1A5C2A" strokeWidth="2"/>

        {/* 홍채 */}
        <circle cx="33" cy="29" r="6.5" fill="#2A5820"/>
        <circle cx="69" cy="29" r="6.5" fill="#2A5820"/>

        {/* 동공 */}
        <circle cx="33" cy="30" r="4" fill="#080E08"/>
        <circle cx="69" cy="30" r="4" fill="#080E08"/>

        {/* 눈 반짝이 */}
        <circle cx="29" cy="24" r="2.2" fill="white"/>
        <circle cx="65" cy="24" r="2.2" fill="white"/>
        <circle cx="36" cy="34" r="1.2" fill="white"/>
        <circle cx="72" cy="34" r="1.2" fill="white"/>

        {/* ── 코 ── */}
        <circle cx="44" cy="48" r="2.5" fill="#1A5C2A" opacity="0.5"/>
        <circle cx="56" cy="48" r="2.5" fill="#1A5C2A" opacity="0.5"/>

        {/* ── 입 ── */}
        {variant === "happy" ? (
          <>
            <path
              d="M 34 58 Q 50 70 66 58"
              stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"
            />
            <path d="M 35 58 Q 50 67 65 58" fill="#1A5C2A" opacity="0.12"/>
          </>
        ) : variant === "shy" ? (
          <path
            d="M 42 59 Q 50 64 58 59"
            stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"
          />
        ) : (
          <>
            <path
              d="M 36 58 Q 50 68 64 58"
              stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"
            />
            <ellipse cx="50" cy="60" rx="9" ry="3" fill="#1A5C2A" opacity="0.08"/>
          </>
        )}

        {/* ── 볼 홍조 ── */}
        <ellipse cx="28" cy="50" rx="8" ry="5" fill="#FF9090" opacity="0.20"/>
        <ellipse cx="72" cy="50" rx="8" ry="5" fill="#FF9090" opacity="0.20"/>
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
