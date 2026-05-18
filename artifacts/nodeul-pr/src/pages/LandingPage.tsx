import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { PixelButton } from "@/components/pixel/PixelButton";
import { motion } from "framer-motion";
import { useGetSystemSettings, getGetSystemSettingsQueryKey } from "@workspace/api-client-react";
import { useUIStore } from "@/store/useUIStore";
import { useAuth } from "@/contexts/AuthContext";

/* ── 픽셀아트 노들섬 씬 ── */
function NodeulScene() {
  return (
    <svg
      viewBox="0 0 480 210"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full block"
      style={{ imageRendering: "pixelated" }}
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A0CFEA"/>
          <stop offset="100%" stopColor="#C4E4D0"/>
        </linearGradient>
        <linearGradient id="riverGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A9EC8"/>
          <stop offset="100%" stopColor="#3580A8"/>
        </linearGradient>
      </defs>

      {/* 하늘 */}
      <rect width="480" height="210" fill="url(#skyGrad)"/>

      {/* 구름들 */}
      <rect x="24"  y="22" width="60" height="14" fill="white" opacity="0.92"/>
      <rect x="16"  y="30" width="76" height="16" fill="white" opacity="0.92"/>
      <rect x="36"  y="14" width="32" height="12" fill="white" opacity="0.92"/>
      <rect x="196" y="18" width="52" height="12" fill="white" opacity="0.88"/>
      <rect x="188" y="26" width="68" height="16" fill="white" opacity="0.88"/>
      <rect x="206" y="10" width="28" height="12" fill="white" opacity="0.88"/>
      <rect x="344" y="28" width="40" height="10" fill="white" opacity="0.75"/>
      <rect x="336" y="36" width="56" height="14" fill="white" opacity="0.75"/>

      {/* 태양 */}
      <rect x="408" y="12" width="32" height="32" fill="#F5C842"/>
      <rect x="418" y="4"  width="12" height="8"  fill="#F5C842"/>
      <rect x="418" y="44" width="12" height="8"  fill="#F5C842"/>
      <rect x="400" y="22" width="8"  height="12" fill="#F5C842"/>
      <rect x="440" y="22" width="8"  height="12" fill="#F5C842"/>

      {/* 서울 스카이라인 */}
      <rect x="0"   y="90"  width="480" height="45" fill="#C0D8C8" opacity="0.45"/>
      <rect x="14"  y="76"  width="12"  height="14" fill="#A0BCB0" opacity="0.55"/>
      <rect x="32"  y="66"  width="9"   height="24" fill="#96B4A8" opacity="0.55"/>
      <rect x="48"  y="78"  width="11"  height="12" fill="#A0BCB0" opacity="0.55"/>
      <rect x="72"  y="72"  width="8"   height="18" fill="#96B4A8" opacity="0.45"/>
      <rect x="394" y="74"  width="12"  height="16" fill="#A0BCB0" opacity="0.55"/>
      <rect x="412" y="64"  width="9"   height="26" fill="#96B4A8" opacity="0.55"/>
      <rect x="428" y="78"  width="13"  height="12" fill="#A0BCB0" opacity="0.55"/>
      <rect x="448" y="68"  width="9"   height="22" fill="#96B4A8" opacity="0.45"/>

      {/* 한강 */}
      <rect x="0" y="134" width="480" height="76" fill="url(#riverGrad)"/>
      <rect x="20"  y="142" width="48" height="4" fill="#6BB8D8" opacity="0.45"/>
      <rect x="108" y="150" width="64" height="4" fill="#6BB8D8" opacity="0.45"/>
      <rect x="204" y="143" width="54" height="4" fill="#6BB8D8" opacity="0.45"/>
      <rect x="312" y="152" width="52" height="4" fill="#6BB8D8" opacity="0.45"/>
      <rect x="388" y="144" width="56" height="4" fill="#6BB8D8" opacity="0.45"/>
      <rect x="66"  y="160" width="8"  height="3" fill="#A8D8EE" opacity="0.4"/>
      <rect x="172" y="168" width="6"  height="3" fill="#A8D8EE" opacity="0.4"/>
      <rect x="278" y="158" width="10" height="3" fill="#A8D8EE" opacity="0.4"/>
      <rect x="360" y="165" width="8"  height="3" fill="#A8D8EE" opacity="0.4"/>

      {/* 노들섬 */}
      <ellipse cx="240" cy="142" rx="92" ry="22" fill="#3A7A44"/>
      <ellipse cx="240" cy="138" rx="88" ry="18" fill="#52A862"/>

      {/* 섬 잔디 */}
      <rect x="152" y="127" width="5" height="14" fill="#2C6433"/>
      <rect x="163" y="123" width="5" height="16" fill="#2C6433"/>
      <rect x="308" y="125" width="5" height="14" fill="#2C6433"/>
      <rect x="320" y="129" width="5" height="12" fill="#2C6433"/>

      {/* 나무 왼쪽 */}
      <rect x="187" y="116" width="6"  height="20" fill="#6B4226"/>
      <rect x="176" y="100" width="27" height="20" fill="#1A5C24"/>
      <rect x="180" y="92"  width="19" height="12" fill="#1A5C24"/>
      <rect x="184" y="86"  width="13" height="10" fill="#22722E"/>
      <rect x="178" y="98"  width="27" height="6"  fill="#22722E"/>

      {/* 나무 오른쪽 */}
      <rect x="287" y="114" width="6"  height="22" fill="#6B4226"/>
      <rect x="276" y="98"  width="27" height="20" fill="#1A5C24"/>
      <rect x="280" y="90"  width="19" height="12" fill="#1A5C24"/>
      <rect x="284" y="84"  width="13" height="10" fill="#22722E"/>
      <rect x="278" y="96"  width="27" height="6"  fill="#22722E"/>

      {/* 건물 */}
      <rect x="218" y="113" width="44" height="28" fill="#E8DCC8"/>
      <rect x="218" y="107" width="44" height="10" fill="#C8A050"/>
      <rect x="224" y="119" width="9"  height="9"  fill="#87CEEB"/>
      <rect x="237" y="119" width="9"  height="9"  fill="#87CEEB"/>
      <rect x="250" y="119" width="9"  height="9"  fill="#87CEEB"/>
      <rect x="230" y="126" width="10" height="15" fill="#7A5030"/>

      {/* ── 픽셀아트 맹꽁이 (섬 오른쪽 변두리, 건물과 오른쪽 나무 사이) ── */}
      {/* 눈 받침 */}
      <rect x="306" y="119" width="8" height="8" fill="#4CB85C"/>
      <rect x="319" y="119" width="8" height="8" fill="#4CB85C"/>
      {/* 눈 흰자 */}
      <rect x="306" y="119" width="7" height="6" fill="white"/>
      <rect x="319" y="119" width="7" height="6" fill="white"/>
      {/* 눈동자 */}
      <rect x="307" y="120" width="4" height="4" fill="#162A16"/>
      <rect x="320" y="120" width="4" height="4" fill="#162A16"/>
      {/* 눈 반짝 */}
      <rect x="307" y="120" width="2" height="2" fill="white"/>
      <rect x="320" y="120" width="2" height="2" fill="white"/>
      {/* 앞다리 */}
      <rect x="303" y="129" width="6" height="4" fill="#389444"/>
      <rect x="324" y="129" width="6" height="4" fill="#389444"/>
      {/* 몸통 */}
      <rect x="306" y="125" width="21" height="13" fill="#4CB85C"/>
      {/* 배 */}
      <rect x="309" y="128" width="15" height="9" fill="#96D88A"/>
      {/* 뒷다리 */}
      <rect x="304" y="133" width="10" height="6" fill="#389444"/>
      <rect x="319" y="133" width="10" height="6" fill="#389444"/>
      {/* 발가락 L */}
      <rect x="301" y="137" width="4" height="3" fill="#389444"/>
      <rect x="305" y="138" width="4" height="3" fill="#2A7234"/>
      <rect x="309" y="137" width="4" height="3" fill="#389444"/>
      {/* 발가락 R */}
      <rect x="318" y="137" width="4" height="3" fill="#389444"/>
      <rect x="322" y="138" width="4" height="3" fill="#2A7234"/>
      <rect x="326" y="137" width="4" height="3" fill="#389444"/>
      {/* 입 */}
      <rect x="310" y="136" width="13" height="2" fill="#2A6632"/>
      <rect x="308" y="134" width="3" height="2" fill="#2A6632"/>
      <rect x="322" y="134" width="3" height="2" fill="#2A6632"/>
      {/* 등 무늬 */}
      <rect x="312" y="126" width="5" height="6" fill="#389444" opacity="0.4"/>
      <rect x="318" y="127" width="4" height="5" fill="#389444" opacity="0.4"/>

      {/* 물고기들 */}
      <rect x="56"  y="163" width="13" height="7"  fill="#E8834A"/>
      <rect x="52"  y="165" width="5"  height="4"  fill="#E8834A"/>
      <rect x="69"  y="164" width="3"  height="2"  fill="white"/>
      <rect x="368" y="169" width="12" height="6"  fill="#E07898"/>
      <rect x="364" y="171" width="5"  height="3"  fill="#E07898"/>
      <rect x="380" y="170" width="3"  height="2"  fill="white"/>
      <rect x="146" y="175" width="10" height="5"  fill="#7EC8E3"/>
      <rect x="142" y="177" width="4"  height="3"  fill="#7EC8E3"/>
    </svg>
  );
}

const STEPS = [
  { n: "01", icon: "📝", title: "행사 등록",   desc: "홍보할 행사 정보를 시스템에 등록합니다.",    href: "/dashboard" },
  { n: "02", icon: "📍", title: "구역 신청",   desc: "전광판·SNS·배너 등 홍보 구역을 선택합니다.", href: "/my-assets" },
  { n: "03", icon: "📁", title: "홍보물 제출", desc: "이미지·영상을 업로드하고 버전을 관리합니다.", href: "/my-assets" },
  { n: "04", icon: "✅", title: "승인 & 게시", desc: "관리자 승인 후 노들섬에 홍보가 시작됩니다.",  href: "/calendar" },
];

export default function LandingPage() {
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const setShowNPC    = useUIStore(s => s.setShowNPC);
  const { data: settings } = useGetSystemSettings({ query: { queryKey: getGetSystemSettingsQueryKey() } });
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const greeting = settings?.find(s => s.key === "npc_greeting")?.value;
    setNPCMessage(greeting || "안녕하세요! 노들섬 홍보 시스템에 오신 것을 환영합니다. 궁금한 점은 언제든지 물어보세요 🐸");
    setShowNPC(true);
  }, [settings, setNPCMessage, setShowNPC]);

  const handleStepClick = (href: string) => {
    if (!isSignedIn) {
      alert("로그인하세요");
      setLocation("/sign-in");
      return;
    }
    setLocation(href);
  };

  return (
    <div className="flex flex-col -mt-4 sm:-mt-6">

      {/* ── 히어로 ── */}
      <div className="relative w-full overflow-hidden" style={{ background: "linear-gradient(180deg, #A0CFEA 0%, #C4E4D0 100%)" }}>
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-10 pt-7 px-4 flex justify-center"
        >
          <div className="bg-white/92 border border-black/12 shadow-lg px-8 py-6 text-center max-w-lg" style={{ backdropFilter: "blur(4px)" }}>
            <p className="font-pixel text-[0.4rem] tracking-[0.25em] text-primary/70 mb-2 uppercase">
              Nodeul Island · PR System
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground leading-snug" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
              노들섬 홍보 관리 시스템
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
              행사 등록부터 홍보물 제출·버전관리·게시 완료까지<br/>한 곳에서 처리하세요.
            </p>
            <div className="mt-5 flex gap-3 justify-center">
              <Link href="/sign-up"><PixelButton variant="primary" size="md">시작하기</PixelButton></Link>
              <Link href="/sign-in"><PixelButton variant="outline" size="md">로그인</PixelButton></Link>
            </div>
          </div>
        </motion.div>

        <div className="mt-2">
          <NodeulScene />
        </div>
      </div>

      {/* ── 절차 안내 ── */}
      <div className="bg-white border-t border-black/10 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center mb-8">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>홍보 신청 절차</h2>
            <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>4단계로 간편하게 노들섬 홍보를 신청하세요.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.48 + i * 0.07 }}
                onClick={() => handleStepClick(step.href)}
                className="relative border border-black/12 p-5 bg-white hover:border-primary hover:shadow-md hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{step.icon}</span>
                  <span className="text-[0.5rem] font-bold text-primary" style={{ fontFamily: "'Press Start 2P', monospace" }}>{step.n}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-xs text-muted-foreground/50 select-none pointer-events-none">▶</span>
                )}
                <h3 className="font-bold text-sm text-foreground mb-1 group-hover:text-primary transition-colors" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{step.desc}</p>
                <p className="mt-3 text-[0.6rem] text-primary/60 font-semibold" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {isSignedIn ? "바로가기 →" : "로그인 후 이용"}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
