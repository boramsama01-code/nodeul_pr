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
 * 맹꽁이 캐릭터 — 좁은 입과 둥글고 통통한 몸이 특징인 맹꽁이
 * 몸통은 아래, 둥근 머리가 몸통 위에 올라온 구조
 * SVG 레이어 순서: 뒷발 → 몸통 → 배 → 앞발 → 머리(얼굴) → 눈/코/입
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
        {/* ── 뒷발 (가장 뒤에) ── */}
        <ellipse cx="19" cy="91" rx="16" ry="9" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
        <ellipse cx="81" cy="91" rx="16" ry="9" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
        {/* 왼 발가락 */}
        <line x1="7"  y1="91" x2="4"  y2="99" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="97" x2="12" y2="103" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="22" y1="97" x2="22" y2="103" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        {/* 오른 발가락 */}
        <line x1="78" y1="97" x2="78" y2="103" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="86" y1="97" x2="88" y2="103" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="93" y1="91" x2="96" y2="99" stroke="#1A5C2A" strokeWidth="2" strokeLinecap="round"/>

        {/* ── 몸통 (둥글고 통통한 맹꽁이 체형) ── */}
        <ellipse cx="50" cy="75" rx="35" ry="26" fill="#4DB86B" stroke="#1A5C2A" strokeWidth="2.5"/>

        {/* ── 배 (연한 크림색) ── */}
        <ellipse cx="50" cy="79" rx="21" ry="16" fill="#CCE9BB"/>

        {/* ── 앞발 ── */}
        {variant === "waving" ? (
          <>
            {/* 왼팔 */}
            <ellipse cx="9" cy="78" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
            {/* 흔드는 오른팔 — 위쪽으로 */}
            <ellipse
              cx="92" cy="57"
              rx="7" ry="10"
              fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"
              transform="rotate(-35, 92, 57)"
            />
          </>
        ) : (
          <>
            <ellipse cx="9"  cy="78" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
            <ellipse cx="91" cy="78" rx="9" ry="6" fill="#3A9450" stroke="#1A5C2A" strokeWidth="2"/>
          </>
        )}

        {/* ── 등 무늬 (몸통 위, 머리 아래 — 머리보다 먼저 그려서 머리에 가려짐) ── */}
        <ellipse cx="50" cy="67" rx="5" ry="7" fill="#3A9450" opacity="0.3"/>
        <ellipse cx="37" cy="72" rx="3.5" ry="4.5" fill="#3A9450" opacity="0.2"/>
        <ellipse cx="63" cy="72" rx="3.5" ry="4.5" fill="#3A9450" opacity="0.2"/>

        {/* ═══════════════════════════════════════════════════════
            머리 — 몸통보다 나중에 그려서 몸통 앞(위)에 보임
        ═══════════════════════════════════════════════════════ */}

        {/* ── 머리 (둥글고 작은 머리, 몸통 위에 얹힘) ── */}
        <ellipse cx="50" cy="47" rx="26" ry="22" fill="#4DB86B" stroke="#1A5C2A" strokeWidth="2.5"/>

        {/* ── 눈 흰자 (머리 위쪽 옆에 붙어있는 눈) ── */}
        <circle cx="30" cy="39" r="11" fill="white" stroke="#1A5C2A" strokeWidth="2"/>
        <circle cx="70" cy="39" r="11" fill="white" stroke="#1A5C2A" strokeWidth="2"/>

        {/* ── 홍채 ── */}
        <circle cx="31" cy="40" r="7.5" fill="#2A5820"/>
        <circle cx="69" cy="40" r="7.5" fill="#2A5820"/>

        {/* ── 동공 ── */}
        <circle cx="31" cy="41" r="4.5" fill="#080E08"/>
        <circle cx="69" cy="41" r="4.5" fill="#080E08"/>

        {/* ── 눈 반짝이 ── */}
        <circle cx="26" cy="35" r="2.5" fill="white"/>
        <circle cx="64" cy="35" r="2.5" fill="white"/>
        <circle cx="34" cy="44" r="1.2" fill="white"/>
        <circle cx="72" cy="44" r="1.2" fill="white"/>

        {/* ── 코 (머리 중앙 아래쪽) ── */}
        <circle cx="45" cy="55" r="2.2" fill="#1A5C2A" opacity="0.5"/>
        <circle cx="55" cy="55" r="2.2" fill="#1A5C2A" opacity="0.5"/>

        {/* ── 입 (맹꽁이 = 좁은 입이 특징) ── */}
        {variant === "happy" ? (
          <>
            <path
              d="M 37 62 Q 50 72 63 62"
              stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"
            />
            <path d="M 38 62 Q 50 69 62 62" fill="#1A5C2A" opacity="0.12"/>
          </>
        ) : variant === "shy" ? (
          <path
            d="M 43 62 Q 50 66 57 62"
            stroke="#1A5C2A" strokeWidth="2.5" fill="none" strokeLinecap="round"
          />
        ) : (
          <>
            <path
              d="M 39 62 Q 50 69 61 62"
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
