import React, { useEffect } from "react";
import { Link } from "wouter";
import { PixelButton } from "@/components/pixel/PixelButton";
import { motion } from "framer-motion";
import { useGetSystemSettings, getGetSystemSettingsQueryKey } from "@workspace/api-client-react";
import { useUIStore } from "@/store/useUIStore";
import { MaengkongiCharacter } from "@/components/pixel/MaengkongiCharacter";

/* ── 픽셀아트 노들섬 씬 ─────────────────────────────────── */
function NodeulScene() {
  return (
    <svg
      viewBox="0 0 480 220"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-2xl"
      style={{ imageRendering: "pixelated" }}
      shapeRendering="crispEdges"
    >
      {/* ── 하늘 ── */}
      <rect width="480" height="150" fill="#87D7F0"/>

      {/* ── 태양 ── */}
      <rect x="400" y="18" width="32" height="32" fill="#FFD700"/>
      <rect x="408" y="10" width="16" height="8" fill="#FFD700"/>
      <rect x="408" y="50" width="16" height="8" fill="#FFD700"/>
      <rect x="392" y="26" width="8" height="16" fill="#FFD700"/>
      <rect x="432" y="26" width="8" height="16" fill="#FFD700"/>
      <rect x="394" y="12" width="8" height="8" fill="#FFD700"/>
      <rect x="430" y="12" width="8" height="8" fill="#FFD700"/>
      <rect x="394" y="42" width="8" height="8" fill="#FFD700"/>
      <rect x="430" y="42" width="8" height="8" fill="#FFD700"/>

      {/* ── 구름 1 ── */}
      <rect x="30" y="28" width="64" height="16" fill="white"/>
      <rect x="22" y="36" width="80" height="16" fill="white"/>
      <rect x="38" y="20" width="40" height="16" fill="white"/>

      {/* ── 구름 2 ── */}
      <rect x="200" y="22" width="56" height="14" fill="white"/>
      <rect x="192" y="30" width="72" height="16" fill="white"/>
      <rect x="208" y="14" width="32" height="14" fill="white"/>

      {/* ── 구름 3 (작은) ── */}
      <rect x="340" y="40" width="40" height="10" fill="white" opacity="0.8"/>
      <rect x="334" y="46" width="52" height="12" fill="white" opacity="0.8"/>

      {/* ── 멀리 서울 스카이라인 (픽셀) ── */}
      <rect x="0" y="100" width="480" height="50" fill="#B8D9C8"/>
      {/* 건물들 */}
      <rect x="20" y="80" width="16" height="20" fill="#8FBF9F"/>
      <rect x="44" y="72" width="12" height="28" fill="#7BAF8F"/>
      <rect x="60" y="84" width="14" height="16" fill="#8FBF9F"/>
      <rect x="380" y="82" width="16" height="18" fill="#8FBF9F"/>
      <rect x="400" y="76" width="12" height="24" fill="#7BAF8F"/>
      <rect x="416" y="86" width="10" height="14" fill="#8FBF9F"/>
      <rect x="440" y="70" width="14" height="30" fill="#7BAF8F"/>
      <rect x="458" y="82" width="10" height="18" fill="#8FBF9F"/>

      {/* ── 한강 (물) ── */}
      <rect x="0" y="148" width="480" height="72" fill="#4A90D9"/>
      {/* 강물 파도 */}
      <rect x="20" y="158" width="40" height="4" fill="#5BA0E0" opacity="0.6"/>
      <rect x="100" y="164" width="60" height="4" fill="#5BA0E0" opacity="0.6"/>
      <rect x="200" y="156" width="50" height="4" fill="#5BA0E0" opacity="0.6"/>
      <rect x="310" y="165" width="45" height="4" fill="#5BA0E0" opacity="0.6"/>
      <rect x="400" y="158" width="55" height="4" fill="#5BA0E0" opacity="0.6"/>
      {/* 물 반짝임 */}
      <rect x="60" y="172" width="8" height="4" fill="#87CEEB" opacity="0.5"/>
      <rect x="160" y="180" width="6" height="4" fill="#87CEEB" opacity="0.5"/>
      <rect x="280" y="170" width="10" height="4" fill="#87CEEB" opacity="0.5"/>
      <rect x="360" y="178" width="8" height="4" fill="#87CEEB" opacity="0.5"/>

      {/* ── 노들섬 (섬) ── */}
      <ellipse cx="240" cy="152" rx="90" ry="22" fill="#5CB85C"/>
      <ellipse cx="240" cy="148" rx="86" ry="18" fill="#6CC86C"/>

      {/* ── 섬 잔디 ── */}
      <rect x="155" y="138" width="8" height="12" fill="#4AA84A"/>
      <rect x="168" y="134" width="8" height="14" fill="#4AA84A"/>
      <rect x="300" y="136" width="8" height="13" fill="#4AA84A"/>
      <rect x="316" y="140" width="8" height="10" fill="#4AA84A"/>

      {/* ── 나무 왼쪽 ── */}
      {/* 줄기 */}
      <rect x="182" y="124" width="6" height="20" fill="#8B5E3C"/>
      {/* 잎 */}
      <rect x="172" y="108" width="26" height="20" fill="#2D8A2D"/>
      <rect x="176" y="100" width="18" height="14" fill="#2D8A2D"/>
      <rect x="179" y="94" width="12" height="10" fill="#3DAA3D"/>
      <rect x="174" y="106" width="26" height="6" fill="#3DAA3D"/>

      {/* ── 나무 오른쪽 ── */}
      <rect x="292" y="122" width="6" height="22" fill="#8B5E3C"/>
      <rect x="282" y="106" width="26" height="20" fill="#2D8A2D"/>
      <rect x="286" y="98" width="18" height="14" fill="#2D8A2D"/>
      <rect x="289" y="92" width="12" height="10" fill="#3DAA3D"/>
      <rect x="284" y="104" width="26" height="6" fill="#3DAA3D"/>

      {/* ── 공연장 건물 (노들섬 라이브하우스) ── */}
      <rect x="214" y="122" width="52" height="28" fill="#E8D5B0"/>
      <rect x="214" y="116" width="52" height="10" fill="#D4A85C"/>
      {/* 창문 */}
      <rect x="220" y="127" width="10" height="10" fill="#87CEEB"/>
      <rect x="236" y="127" width="10" height="10" fill="#87CEEB"/>
      <rect x="252" y="127" width="10" height="10" fill="#87CEEB"/>
      {/* 문 */}
      <rect x="231" y="135" width="12" height="15" fill="#8B5E3C"/>

      {/* ── 물고기들 ── */}
      {/* 물고기 1 */}
      <rect x="60" y="174" width="14" height="8" fill="#FF8C42"/>
      <rect x="56" y="176" width="6" height="4" fill="#FF8C42"/>
      <rect x="74" y="175" width="4" height="3" fill="white"/>
      {/* 물고기 2 */}
      <rect x="370" y="180" width="12" height="7" fill="#FF6B9D"/>
      <rect x="366" y="182" width="5" height="3" fill="#FF6B9D"/>
      <rect x="382" y="181" width="3" height="2" fill="white"/>
      {/* 물고기 3 작은 */}
      <rect x="150" y="185" width="10" height="6" fill="#7EC8E3"/>
      <rect x="146" y="187" width="5" height="3" fill="#7EC8E3"/>

      {/* ── 갈대 (섬 주변) ── */}
      <rect x="146" y="140" width="4" height="20" fill="#8B7355"/>
      <rect x="142" y="135" width="12" height="6" fill="#6B8C3D" opacity="0.8" transform="rotate(-10, 148, 138)"/>
      <rect x="326" y="138" width="4" height="22" fill="#8B7355"/>
      <rect x="322" y="133" width="12" height="6" fill="#6B8C3D" opacity="0.8" transform="rotate(10, 328, 136)"/>
    </svg>
  );
}

/* ── 여정 스텝 카드 ──────────────────────────────────────── */
const JOURNEY_STEPS = [
  {
    step: 1,
    emoji: "📋",
    title: "행사 등록",
    desc: "노들섬에서 열릴 행사를 시스템에 먼저 등록해요.",
    color: "bg-amber-100 border-amber-400",
    badge: "bg-amber-400",
  },
  {
    step: 2,
    emoji: "🗺️",
    title: "홍보 구역 신청",
    desc: "전광판, 인스타그램, 배너 등 홍보 구역을 선택해요.",
    color: "bg-sky-100 border-sky-400",
    badge: "bg-sky-400",
  },
  {
    step: 3,
    emoji: "📸",
    title: "홍보물 제출",
    desc: "이미지·영상 홍보물을 올리고 버전을 관리해요.",
    color: "bg-violet-100 border-violet-400",
    badge: "bg-violet-400",
  },
  {
    step: 4,
    emoji: "🎉",
    title: "게시 완료!",
    desc: "관리자 검토 후 승인되면 노들섬에서 홍보가 시작돼요!",
    color: "bg-green-100 border-green-400",
    badge: "bg-green-500",
  },
];

/* ── 랜딩 페이지 ─────────────────────────────────────────── */
export default function LandingPage() {
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const setShowNPC = useUIStore(s => s.setShowNPC);
  const { data: settings } = useGetSystemSettings({ query: { queryKey: getGetSystemSettingsQueryKey() } });

  useEffect(() => {
    const greeting = settings?.find(s => s.key === "npc_greeting")?.value;
    setNPCMessage(
      greeting ||
        "안녕하세요! 저는 맹꽁이예요 🐸 노들섬 홍보 대작전, 함께 시작해봐요! 궁금한 점은 저한테 물어보세요~"
    );
    setShowNPC(true);
  }, [settings, setNPCMessage, setShowNPC]);

  return (
    <div className="flex flex-col items-center gap-0 -mt-4 sm:-mt-6">

      {/* ── 히어로 씬 ──────────────────────────── */}
      <div className="w-full bg-gradient-to-b from-[#87D7F0] via-[#B8E8F8] to-[#D4EFC8] pt-8 pb-0 flex flex-col items-center gap-6 border-b-4 border-black overflow-hidden relative">

        {/* 타이틀 */}
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4, delay: 0.1 }}
          className="text-center px-4 relative z-10"
        >
          <div className="inline-block bg-white border-4 border-black shadow-[6px_6px_0_#000] px-6 py-3">
            <p className="font-pixel text-[0.5rem] text-muted-foreground tracking-widest mb-1 uppercase">Nodeul Island PR Adventure</p>
            <h1 className="font-pixel-body text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              맹꽁이의 노들섬<br/>
              <span className="text-[hsl(108,60%,28%)]">홍보 대작전</span>
            </h1>
          </div>
        </motion.div>

        {/* 맹꽁이 + 씬 */}
        <div className="relative w-full flex flex-col items-center">
          {/* 맹꽁이 캐릭터 — 섬 위에 떠있는 효과 */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
            className="absolute z-10 bottom-[82px]"
            style={{ left: "calc(50% - 44px)" }}
          >
            <MaengkongiCharacter
              size={88}
              variant="waving"
              withMegaphone
              floating
            />
          </motion.div>

          {/* 픽셀아트 노들섬 씬 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="w-full flex justify-center"
          >
            <NodeulScene />
          </motion.div>
        </div>
      </div>

      {/* ── 스토리 소개 ────────────────────────── */}
      <div className="w-full bg-[hsl(42,40%,96%)] border-b-4 border-black px-4 py-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto space-y-3"
        >
          <p className="font-pixel-body text-2xl sm:text-3xl text-foreground leading-relaxed">
            한강의 작은 섬, <span className="font-bold text-[hsl(108,60%,28%)]">노들섬</span>.
            <br/>
            맹꽁이는 이곳에서 멋진 행사를 세상에 알리고 싶어요!
          </p>
          <p className="font-pixel-body text-xl text-muted-foreground">
            홍보 신청부터 게시까지, 함께 떠나봐요 🐸
          </p>
        </motion.div>
      </div>

      {/* ── CTA 버튼 ────────────────────────────── */}
      <div className="w-full bg-white border-b-4 border-black px-4 py-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link href="/sign-up">
          <PixelButton size="lg" variant="primary" className="min-w-[200px]">
            <span className="font-pixel-body text-2xl">🐸 대작전 시작!</span>
          </PixelButton>
        </Link>
        <Link href="/sign-in">
          <PixelButton size="lg" variant="secondary" className="min-w-[200px]">
            <span className="font-pixel-body text-2xl">🔑 이미 계정이 있어요</span>
          </PixelButton>
        </Link>
      </div>

      {/* ── 여정 스텝 ──────────────────────────── */}
      <div className="w-full bg-[hsl(42,40%,96%)] px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-8"
          >
            <div className="inline-block bg-white border-4 border-black shadow-[4px_4px_0_#000] px-6 py-3">
              <p className="font-pixel text-[0.55rem] text-muted-foreground tracking-widest mb-1">QUEST GUIDE</p>
              <h2 className="font-pixel-body text-3xl font-bold">홍보 대작전 진행 방법</h2>
            </div>
          </motion.div>

          {/* 스텝 카드들 + 연결선 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {JOURNEY_STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className={`border-4 border-black shadow-[4px_4px_0_#000] p-5 ${step.color} relative`}
              >
                {/* 스텝 번호 배지 */}
                <div className={`absolute -top-4 -left-4 w-9 h-9 ${step.badge} border-4 border-black flex items-center justify-center font-pixel text-white text-xs`}>
                  {step.step}
                </div>
                {/* 화살표 (마지막 제외, 모바일 숨김) */}
                {i < JOURNEY_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 z-20 font-pixel text-2xl text-foreground">
                    ▶
                  </div>
                )}
                <div className="text-4xl mb-3 text-center">{step.emoji}</div>
                <h3 className="font-pixel-body text-2xl font-bold mb-2 text-center">{step.title}</h3>
                <p className="font-pixel-body text-lg text-muted-foreground text-center leading-snug">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 하단 다시 한번 CTA ─────────────────── */}
      <div className="w-full border-t-4 border-black bg-[hsl(108,55%,18%)] px-4 py-10 flex flex-col items-center gap-4 text-center">
        <MaengkongiCharacter size={64} variant="happy" floating />
        <p className="font-pixel-body text-2xl sm:text-3xl text-white">
          맹꽁이와 함께 노들섬 홍보를<br/>시작해봐요!
        </p>
        <Link href="/sign-up">
          <PixelButton size="lg" variant="accent" className="min-w-[220px]">
            <span className="font-pixel-body text-2xl">지금 바로 시작 →</span>
          </PixelButton>
        </Link>
      </div>
    </div>
  );
}
