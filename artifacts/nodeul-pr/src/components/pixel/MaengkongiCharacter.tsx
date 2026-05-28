import React from "react";

type MaengkongiVariant = "normal" | "happy" | "shy" | "waving";

interface MaengkongiProps {
  size?: number;
  variant?: MaengkongiVariant;
  dancing?: boolean;
  floating?: boolean;
  className?: string;
}

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
        {/* ── 뒷발 ── */}
        <ellipse cx="18" cy="92" rx="16" ry="9" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
        <ellipse cx="82" cy="92" rx="16" ry="9" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
        <line x1="5"  y1="92" x2="2"  y2="99" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="98" x2="10" y2="104" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="21" y1="98" x2="21" y2="104" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="79" y1="98" x2="79" y2="104" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="88" y1="98" x2="90" y2="104" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="95" y1="92" x2="98" y2="99" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>

        {/* ── 앞발 ── */}
        {variant === "waving" ? (
          <>
            <ellipse cx="8"  cy="76" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
            <ellipse cx="93" cy="52" rx="7" ry="11" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2" transform="rotate(-30,93,52)"/>
          </>
        ) : (
          <>
            <ellipse cx="8"  cy="76" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
            <ellipse cx="92" cy="76" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
          </>
        )}

        {/* ── 머리 (이게 전부 — 몸통 없음) ── */}
        <ellipse cx="50" cy="54" rx="34" ry="30" fill="#4DB86B" stroke="#1A5C2A" strokeWidth="2.5"/>

        {/* 배 (머리 하단 밝은 부분) */}
        <ellipse cx="50" cy="64" rx="20" ry="14" fill="#CCE9BB"/>

        {/* ── 눈 흰자 ── */}
        <circle cx="31" cy="38" r="11" fill="white" stroke="#1A5C2A" strokeWidth="2"/>
        <circle cx="69" cy="38" r="11" fill="white" stroke="#1A5C2A" strokeWidth="2"/>

        {/* 홍채 */}
        <circle cx="32" cy="39" r="7" fill="#2A5820"/>
        <circle cx="70" cy="39" r="7" fill="#2A5820"/>

        {/* 동공 */}
        <circle cx="32" cy="40" r="4" fill="#080E08"/>
        <circle cx="70" cy="40" r="4" fill="#080E08"/>

        {/* 반짝이 */}
        <circle cx="27" cy="33" r="2.5" fill="white"/>
        <circle cx="65" cy="33" r="2.5" fill="white"/>
        <circle cx="35" cy="45" r="1.2" fill="white"/>
        <circle cx="73" cy="45" r="1.2" fill="white"/>

        {/* ── 코 ── */}
        <circle cx="44" cy="54" r="2.5" fill="#1A5C2A" opacity="0.45"/>
        <circle cx="56" cy="54" r="2.5" fill="#1A5C2A" opacity="0.45"/>

        {/* ── 입 ── */}
        {variant === "happy" ? (
          <>
            <path d="M 34 63 Q 50 75 66 63" stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M 35 63 Q 50 72 65 63" fill="#1A5C2A" opacity="0.12"/>
          </>
        ) : variant === "shy" ? (
          <path d="M 42 64 Q 50 69 58 64" stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        ) : (
          <>
            <path d="M 36 63 Q 50 73 64 63" stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <ellipse cx="50" cy="65" rx="9" ry="3" fill="#1A5C2A" opacity="0.08"/>
          </>
        )}

        {/* 볼 홍조 */}
        <ellipse cx="27" cy="52" rx="7" ry="5" fill="#FF9090" opacity="0.22"/>
        <ellipse cx="73" cy="52" rx="7" ry="5" fill="#FF9090" opacity="0.22"/>
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
