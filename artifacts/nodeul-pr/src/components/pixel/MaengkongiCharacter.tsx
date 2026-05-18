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
 * 오리지널 맹꽁이 캐릭터 — 초록 두꺼비과 개구리
 * 눈이 머리 위에 솟아있는 전형적인 개구리 형태
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
      style={{ width: size, height: size * 1.05 }}
    >
      <svg
        viewBox="0 0 100 105"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size * 1.05}
        style={{ imageRendering: "pixelated", overflow: "visible" }}
      >
        {/* ── 몸통 (납작하고 둥근 개구리 체형) ── */}
        <ellipse cx="50" cy="68" rx="42" ry="32" fill="#4CAF6A" stroke="#1A5C2A" strokeWidth="2.5"/>

        {/* ── 배 (밝은 크림색) ── */}
        <ellipse cx="50" cy="72" rx="28" ry="20" fill="#C8E6C0"/>

        {/* ── 뒷다리 암시 ── */}
        <ellipse cx="20" cy="92" rx="14" ry="8" fill="#3D9954" stroke="#1A5C2A" strokeWidth="2"/>
        <ellipse cx="80" cy="92" rx="14" ry="8" fill="#3D9954" stroke="#1A5C2A" strokeWidth="2"/>
        {/* 발가락 */}
        <line x1="10" y1="93" x2="8" y2="100" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="18" y1="96" x2="17" y2="103" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="26" y1="95" x2="26" y2="102" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="74" y1="95" x2="74" y2="102" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="82" y1="96" x2="83" y2="103" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="90" y1="93" x2="92" y2="100" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>

        {/* ── 앞발 ── */}
        {variant === "waving" ? (
          <>
            <ellipse cx="6" cy="72" rx="8" ry="6" fill="#3D9954" stroke="#1A5C2A" strokeWidth="2"/>
            {/* 흔드는 오른쪽 팔 */}
            <ellipse cx="94" cy="56" rx="7" ry="9" fill="#3D9954" stroke="#1A5C2A" strokeWidth="2" transform="rotate(-25, 94, 56)"/>
          </>
        ) : (
          <>
            <ellipse cx="6" cy="74" rx="8" ry="6" fill="#3D9954" stroke="#1A5C2A" strokeWidth="2"/>
            <ellipse cx="94" cy="74" rx="8" ry="6" fill="#3D9954" stroke="#1A5C2A" strokeWidth="2"/>
          </>
        )}

        {/* ── 눈 받침 (개구리 눈은 머리 위로 솟음) ── */}
        <ellipse cx="31" cy="40" rx="15" ry="13" fill="#4CAF6A" stroke="#1A5C2A" strokeWidth="2.5"/>
        <ellipse cx="69" cy="40" rx="15" ry="13" fill="#4CAF6A" stroke="#1A5C2A" strokeWidth="2.5"/>

        {/* ── 눈 흰자 ── */}
        <ellipse cx="31" cy="38" rx="11" ry="11" fill="white"/>
        <ellipse cx="69" cy="38" rx="11" ry="11" fill="white"/>

        {/* ── 홍채 (어두운 갈색-녹색) ── */}
        <ellipse cx="31" cy="39" rx="7.5" ry="8" fill="#2A5A20"/>
        <ellipse cx="69" cy="39" rx="7.5" ry="8" fill="#2A5A20"/>

        {/* ── 동공 ── */}
        <ellipse cx="30" cy="40" rx="4.5" ry="5" fill="#0A120A"/>
        <ellipse cx="68" cy="40" rx="4.5" ry="5" fill="#0A120A"/>

        {/* ── 눈 반짝이 ── */}
        <circle cx="25" cy="34" r="2.5" fill="white"/>
        <circle cx="63" cy="34" r="2.5" fill="white"/>
        <circle cx="32" cy="42" r="1.2" fill="white"/>
        <circle cx="70" cy="42" r="1.2" fill="white"/>

        {/* ── 콧구멍 (개구리 특징) ── */}
        <circle cx="45" cy="57" r="2.5" fill="#2A5C2A" opacity="0.55"/>
        <circle cx="55" cy="57" r="2.5" fill="#2A5C2A" opacity="0.55"/>

        {/* ── 입 (넓은 개구리 입) ── */}
        {variant === "happy" ? (
          <>
            <path d="M 32 74 Q 50 85 68 74" stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M 33 74 Q 50 82 67 74" fill="#1A5C2A" opacity="0.15"/>
          </>
        ) : variant === "shy" ? (
          <path d="M 38 73 Q 50 78 62 73" stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        ) : (
          /* 기본: 살짝 벌린 넓은 개구리 입 */
          <>
            <path d="M 32 72 Q 50 80 68 72" stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <ellipse cx="50" cy="74" rx="14" ry="5" fill="#1A5C2A" opacity="0.12"/>
          </>
        )}

        {/* ── 등 무늬 (맹꽁이 특유) ── */}
        <ellipse cx="50" cy="60" rx="6" ry="8" fill="#3D9954" opacity="0.35"/>
        <ellipse cx="36" cy="65" rx="4" ry="5" fill="#3D9954" opacity="0.25"/>
        <ellipse cx="64" cy="65" rx="4" ry="5" fill="#3D9954" opacity="0.25"/>
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
