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
      style={{ width: size, height: size * 1.05 }}
    >
      <svg
        viewBox="0 0 100 105"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size * 1.05}
        style={{ imageRendering: "pixelated", overflow: "visible" }}
      >
        {/* ── 뒷발 ── */}
        <ellipse cx="18" cy="93" rx="15" ry="8" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
        <ellipse cx="82" cy="93" rx="15" ry="8" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
        {/* 왼 발가락 */}
        <line x1="6"  y1="93" x2="3"  y2="100" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="13" y1="99" x2="11" y2="104" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="21" y1="99" x2="21" y2="104" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        {/* 오른 발가락 */}
        <line x1="79" y1="99" x2="79" y2="104" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="87" y1="99" x2="89" y2="104" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="94" y1="93" x2="97" y2="100" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>

        {/* ── 몸통 — 크고 둥글게 ── */}
        <ellipse cx="50" cy="73" rx="37" ry="28" fill="#4DB86B" stroke="#1A5C2A" strokeWidth="2.5"/>

        {/* ── 배 ── */}
        <ellipse cx="50" cy="78" rx="23" ry="18" fill="#CCE9BB"/>

        {/* ── 앞발 ── */}
        {variant === "waving" ? (
          <>
            <ellipse cx="9"  cy="80" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
            <ellipse
              cx="92" cy="59"
              rx="7" ry="10"
              fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"
              transform="rotate(-35, 92, 59)"
            />
          </>
        ) : (
          <>
            <ellipse cx="9"  cy="80" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
            <ellipse cx="91" cy="80" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
          </>
        )}

        {/* ── 등 무늬 (머리보다 먼저 그려서 머리에 가려짐) ── */}
        <ellipse cx="50" cy="66" rx="5" ry="7" fill="#3A9450" opacity="0.3"/>
        <ellipse cx="37" cy="71" rx="3.5" ry="4.5" fill="#3A9450" opacity="0.2"/>
        <ellipse cx="63" cy="71" rx="3.5" ry="4.5" fill="#3A9450" opacity="0.2"/>

        {/* ── 머리 — rx/ry를 키워서 눈이 안에 들어오게 ── */}
        <ellipse cx="50" cy="47" rx="32" ry="27" fill="#4DB86B" stroke="#1A5C2A" strokeWidth="2.5"/>

        {/* ── 볼 하이라이트 ── */}
        <ellipse cx="34" cy="56" rx="7" ry="4" fill="#5DC87A" opacity="0.35"/>
        <ellipse cx="66" cy="56" rx="7" ry="4" fill="#5DC87A" opacity="0.35"/>

        {/* ── 눈 흰자 — 머리 상단에 위치, 크기 줄임 ── */}
        <circle cx="32" cy="35" r="9" fill="white" stroke="#1A5C2A" strokeWidth="2"/>
        <circle cx="68" cy="35" r="9" fill="white" stroke="#1A5C2A" strokeWidth="2"/>

        {/* ── 홍채 ── */}
        <circle cx="32" cy="36" r="6" fill="#2A5820"/>
        <circle cx="68" cy="36" r="6" fill="#2A5820"/>

        {/* ── 동공 ── */}
        <circle cx="32" cy="37" r="3.5" fill="#080E08"/>
        <circle cx="68" cy="37" r="3.5" fill="#080E08"/>

        {/* ── 눈 반짝이 ── */}
        <circle cx="28" cy="31" r="2" fill="white"/>
        <circle cx="64" cy="31" r="2" fill="white"/>
        <circle cx="35" cy="41" r="1" fill="white"/>
        <circle cx="71" cy="41" r="1" fill="white"/>

        {/* ── 코 ── */}
        <circle cx="45" cy="54" r="2.2" fill="#1A5C2A" opacity="0.45"/>
        <circle cx="55" cy="54" r="2.2" fill="#1A5C2A" opacity="0.45"/>

        {/* ── 입 (맹꽁이 = 좁은 입) ── */}
        {variant === "happy" ? (
          <>
            <path
              d="M 36 62 Q 50 73 64 62"
              stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"
            />
            <path d="M 37 62 Q 50 70 63 62" fill="#1A5C2A" opacity="0.12"/>
          </>
        ) : variant === "shy" ? (
          <path
            d="M 43 63 Q 50 67 57 63"
            stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"
          />
        ) : (
          <>
            <path
              d="M 39 62 Q 50 70 61 62"
              stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"
            />
            <ellipse cx="50" cy="64" rx="8" ry="2.5" fill="#1A5C2A" opacity="0.1"/>
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
