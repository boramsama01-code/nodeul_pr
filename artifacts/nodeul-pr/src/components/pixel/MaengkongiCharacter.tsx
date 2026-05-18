import React from "react";

type MaengkongiVariant = "normal" | "happy" | "shy" | "thinking" | "waving";

interface MaengkongiProps {
  size?: number;
  variant?: MaengkongiVariant;
  dancing?: boolean;
  floating?: boolean;
  className?: string;
  withMegaphone?: boolean;
  withSign?: boolean;
}

export function MaengkongiCharacter({
  size = 80,
  variant = "normal",
  dancing = false,
  floating = true,
  className = "",
  withMegaphone = false,
  withSign = false,
}: MaengkongiProps) {
  const animClass = dancing
    ? "animate-maengkongi-dance"
    : floating
    ? "animate-maengkongi-float"
    : "";

  return (
    <div
      className={`inline-block select-none ${animClass} ${className}`}
      style={{ width: size, height: withMegaphone || withSign ? size * 1.3 : size * 1.1 }}
    >
      <svg
        viewBox="0 0 110 130"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={withMegaphone || withSign ? size * 1.3 : size * 1.1}
        style={{ imageRendering: "pixelated", overflow: "visible" }}
      >
        {/* ── 옵션: 메가폰 (오른쪽 팔) ─────────── */}
        {withMegaphone && (
          <g transform="translate(78, 58)">
            <polygon points="0,4 20,0 20,14 0,10" fill="#F59E0B" stroke="#1A0A2E" strokeWidth="2"/>
            <polygon points="20,0 30,-4 30,18 20,14" fill="#FBBF24" stroke="#1A0A2E" strokeWidth="2"/>
            <circle cx="0" cy="7" r="5" fill="#F59E0B" stroke="#1A0A2E" strokeWidth="2"/>
          </g>
        )}

        {/* ── 옵션: 홍보 팻말 (왼쪽) ─────────── */}
        {withSign && (
          <g transform="translate(-30, 30)">
            <rect x="0" y="0" width="36" height="28" rx="0" fill="white" stroke="#1A0A2E" strokeWidth="2"/>
            <rect x="0" y="0" width="36" height="8" fill="#6D28D9" stroke="#1A0A2E" strokeWidth="2"/>
            <text x="18" y="6" textAnchor="middle" fill="white" fontSize="5" fontFamily="monospace" fontWeight="bold">NODEUL</text>
            <text x="18" y="20" textAnchor="middle" fill="#1A0A2E" fontSize="4" fontFamily="monospace">홍보중!</text>
            <rect x="16" y="28" width="4" height="14" fill="#92400E" stroke="#1A0A2E" strokeWidth="1.5"/>
          </g>
        )}

        {/* ── 몸통 ─────────────────────────────── */}
        <ellipse cx="55" cy="68" rx="43" ry="39" fill="#F9A8C9" stroke="#1A0A2E" strokeWidth="3"/>

        {/* ── 눈 흰자 ──────────────────────────── */}
        <circle cx="35" cy="50" r="16" fill="white" stroke="#1A0A2E" strokeWidth="2.5"/>
        <circle cx="75" cy="50" r="16" fill="white" stroke="#1A0A2E" strokeWidth="2.5"/>

        {/* ── 홍채 (보라/바이올렛) ─────────────── */}
        <circle cx="35" cy="52" r="11" fill="#6D28D9"/>
        <circle cx="75" cy="52" r="11" fill="#6D28D9"/>

        {/* ── 동공 ─────────────────────────────── */}
        <circle cx="33.5" cy="53" r="6.5" fill="#0D0020"/>
        <circle cx="73.5" cy="53" r="6.5" fill="#0D0020"/>

        {/* ── 눈 반짝이 ────────────────────────── */}
        <circle cx="27" cy="45" r="3.5" fill="white"/>
        <circle cx="67" cy="45" r="3.5" fill="white"/>
        <circle cx="36" cy="56" r="1.5" fill="white"/>
        <circle cx="76" cy="56" r="1.5" fill="white"/>

        {/* ── 눈썹 (살짝 긴장/부끄) ────────────── */}
        <path d="M 21 32 Q 28 27 35 30" stroke="#1A0A2E" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M 75 30 Q 82 27 89 32" stroke="#1A0A2E" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

        {/* ── 볼 홍조 ──────────────────────────── */}
        <ellipse cx="14" cy="74" rx="12" ry="8" fill="#F472B6" opacity="0.48"/>
        <ellipse cx="96" cy="74" rx="12" ry="8" fill="#F472B6" opacity="0.48"/>
        {/* 홍조 점 */}
        <circle cx="10" cy="72" r="2" fill="#EC4899" opacity="0.4"/>
        <circle cx="17" cy="79" r="2" fill="#EC4899" opacity="0.4"/>
        <circle cx="92" cy="72" r="2" fill="#EC4899" opacity="0.4"/>
        <circle cx="99" cy="79" r="2" fill="#EC4899" opacity="0.4"/>

        {/* ── 입 ───────────────────────────────── */}
        {variant === "happy" ? (
          <path d="M 40 84 Q 55 96 70 84" stroke="#1A0A2E" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        ) : variant === "shy" ? (
          <ellipse cx="55" cy="84" rx="7" ry="6" fill="#1A0A2E"/>
        ) : variant === "thinking" ? (
          <path d="M 43 83 Q 52 88 62 85" stroke="#1A0A2E" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        ) : (
          /* normal: slightly open mouth */
          <ellipse cx="55" cy="84" rx="8" ry="6" fill="#1A0A2E"/>
        )}

        {/* ── 팔 ───────────────────────────────── */}
        {variant === "waving" ? (
          <>
            <ellipse cx="8" cy="72" rx="9" ry="7" fill="#F9A8C9" stroke="#1A0A2E" strokeWidth="2.5"/>
            {/* 흔드는 팔 */}
            <ellipse cx="102" cy="55" rx="7" ry="9" fill="#F9A8C9" stroke="#1A0A2E" strokeWidth="2.5" transform="rotate(-30, 102, 55)"/>
          </>
        ) : (
          <>
            <ellipse cx="8" cy="74" rx="9" ry="7" fill="#F9A8C9" stroke="#1A0A2E" strokeWidth="2.5"/>
            <ellipse cx="102" cy="74" rx="9" ry="7" fill="#F9A8C9" stroke="#1A0A2E" strokeWidth="2.5"/>
          </>
        )}

        {/* ── 발 ───────────────────────────────── */}
        <ellipse cx="33" cy="104" rx="16" ry="10" fill="#F9A8C9" stroke="#1A0A2E" strokeWidth="2.5"/>
        <ellipse cx="77" cy="104" rx="16" ry="10" fill="#F9A8C9" stroke="#1A0A2E" strokeWidth="2.5"/>
        {/* 발가락 */}
        <line x1="22" y1="105" x2="20" y2="112" stroke="#1A0A2E" strokeWidth="2" strokeLinecap="round"/>
        <line x1="30" y1="108" x2="29" y2="115" stroke="#1A0A2E" strokeWidth="2" strokeLinecap="round"/>
        <line x1="38" y1="106" x2="38" y2="113" stroke="#1A0A2E" strokeWidth="2" strokeLinecap="round"/>
        <line x1="66" y1="106" x2="66" y2="113" stroke="#1A0A2E" strokeWidth="2" strokeLinecap="round"/>
        <line x1="74" y1="108" x2="75" y2="115" stroke="#1A0A2E" strokeWidth="2" strokeLinecap="round"/>
        <line x1="82" y1="105" x2="84" y2="112" stroke="#1A0A2E" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

/** 채팅창용 작은 맹꽁이 아이콘 */
export function MaengkongiIcon({ size = 32, dancing = false, className = "" }: { size?: number; dancing?: boolean; className?: string }) {
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
