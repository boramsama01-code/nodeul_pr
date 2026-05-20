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
      viewBox="0 0 480 220"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full block"
      style={{ imageRendering: "pixelated" }}
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6AAFD8"/>
          <stop offset="55%" stopColor="#94C8E0"/>
          <stop offset="100%" stopColor="#B4D8C4"/>
        </linearGradient>
        <linearGradient id="riverGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#52A8CC"/>
          <stop offset="100%" stopColor="#347EA8"/>
        </linearGradient>
        <linearGradient id="islandGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5ABE6A"/>
          <stop offset="100%" stopColor="#3A7A44"/>
        </linearGradient>
      </defs>

      {/* ── 하늘 ── */}
      <rect width="480" height="220" fill="url(#skyGrad)"/>

      {/* ── 구름 ── */}
      <rect x="10"  y="22" width="72" height="12" fill="white" opacity="0.94"/>
      <rect x="6"   y="28" width="82" height="16" fill="white" opacity="0.94"/>
      <rect x="20"  y="14" width="42" height="12" fill="white" opacity="0.90"/>
      <rect x="26"  y="10" width="24" height="8"  fill="white" opacity="0.85"/>

      <rect x="178" y="14" width="58" height="12" fill="white" opacity="0.88"/>
      <rect x="172" y="20" width="70" height="14" fill="white" opacity="0.88"/>
      <rect x="186" y="8"  width="34" height="10" fill="white" opacity="0.82"/>

      <rect x="332" y="26" width="48" height="10" fill="white" opacity="0.78"/>
      <rect x="326" y="32" width="62" height="14" fill="white" opacity="0.78"/>
      <rect x="342" y="20" width="30" height="10" fill="white" opacity="0.72"/>

      <rect x="418" y="18" width="30" height="8"  fill="white" opacity="0.52"/>
      <rect x="414" y="24" width="38" height="8"  fill="white" opacity="0.52"/>

      <rect x="272" y="46" width="30" height="7"  fill="white" opacity="0.50"/>
      <rect x="268" y="50" width="38" height="8"  fill="white" opacity="0.50"/>

      {/* ── 태양 ── */}
      <rect x="434" y="10" width="24" height="24" fill="#F8D44A"/>
      <rect x="440" y="4"  width="12" height="6"  fill="#F8D44A"/>
      <rect x="440" y="34" width="12" height="6"  fill="#F8D44A"/>
      <rect x="428" y="16" width="6"  height="12" fill="#F8D44A"/>
      <rect x="458" y="16" width="6"  height="12" fill="#F8D44A"/>
      <rect x="430" y="10" width="4"  height="4"  fill="#F8D44A"/>
      <rect x="456" y="10" width="4"  height="4"  fill="#F8D44A"/>
      <rect x="430" y="28" width="4"  height="4"  fill="#F8D44A"/>
      <rect x="456" y="28" width="4"  height="4"  fill="#F8D44A"/>

      {/* ── 서울 스카이라인 (배경, 안개) ── */}
      <rect x="0"   y="82" width="16" height="54" fill="#88A8A4" opacity="0.38"/>
      <rect x="20"  y="70" width="11" height="66" fill="#7A9E9A" opacity="0.38"/>
      <rect x="2"   y="66" width="5"  height="16" fill="#88A8A4" opacity="0.32"/>
      <rect x="34"  y="78" width="14" height="58" fill="#88A8A4" opacity="0.34"/>
      <rect x="52"  y="72" width="10" height="64" fill="#7A9E9A" opacity="0.34"/>
      <rect x="66"  y="80" width="14" height="56" fill="#88A8A4" opacity="0.30"/>
      <rect x="82"  y="74" width="10" height="62" fill="#7A9E9A" opacity="0.28"/>
      <rect x="94"  y="82" width="12" height="54" fill="#88A8A4" opacity="0.26"/>

      <rect x="374" y="76" width="14" height="60" fill="#88A8A4" opacity="0.38"/>
      <rect x="392" y="66" width="11" height="70" fill="#7A9E9A" opacity="0.38"/>
      <rect x="394" y="60" width="5"  height="16" fill="#88A8A4" opacity="0.32"/>
      <rect x="406" y="76" width="14" height="60" fill="#88A8A4" opacity="0.34"/>
      <rect x="424" y="72" width="10" height="64" fill="#7A9E9A" opacity="0.32"/>
      <rect x="438" y="80" width="14" height="56" fill="#88A8A4" opacity="0.28"/>
      <rect x="456" y="74" width="24" height="62" fill="#7A9E9A" opacity="0.26"/>

      {/* ── 한강대교 연결 다리 ── */}
      <rect x="0"   y="132" width="148" height="7" fill="#9AAAB2" opacity="0.68"/>
      <rect x="332" y="132" width="148" height="7" fill="#9AAAB2" opacity="0.68"/>
      <rect x="0"   y="130" width="148" height="2" fill="#B4C0C4" opacity="0.60"/>
      <rect x="332" y="130" width="148" height="2" fill="#B4C0C4" opacity="0.60"/>
      <rect x="0"   y="139" width="148" height="2" fill="#788490" opacity="0.55"/>
      <rect x="332" y="139" width="148" height="2" fill="#788490" opacity="0.55"/>
      {/* 다리 기둥 */}
      <rect x="0"   y="132" width="10" height="88" fill="#9AAAB2" opacity="0.65"/>
      <rect x="24"  y="135" width="8"  height="85" fill="#9AAAB2" opacity="0.60"/>
      <rect x="460" y="132" width="20" height="88" fill="#9AAAB2" opacity="0.65"/>
      <rect x="448" y="135" width="8"  height="85" fill="#9AAAB2" opacity="0.60"/>

      {/* ── 한강 ── */}
      <rect x="0" y="138" width="480" height="82" fill="url(#riverGrad)"/>

      {/* 강물 반짝임 */}
      <rect x="16"  y="150" width="48" height="3" fill="#7ACCE8" opacity="0.48"/>
      <rect x="90"  y="162" width="36" height="3" fill="#7ACCE8" opacity="0.42"/>
      <rect x="204" y="148" width="48" height="3" fill="#7ACCE8" opacity="0.38"/>
      <rect x="362" y="155" width="50" height="3" fill="#7ACCE8" opacity="0.48"/>
      <rect x="422" y="168" width="36" height="3" fill="#7ACCE8" opacity="0.42"/>
      <rect x="50"  y="176" width="20" height="2" fill="#A8D8EE" opacity="0.36"/>
      <rect x="144" y="185" width="16" height="2" fill="#A8D8EE" opacity="0.36"/>
      <rect x="298" y="172" width="22" height="2" fill="#A8D8EE" opacity="0.36"/>
      <rect x="400" y="182" width="18" height="2" fill="#A8D8EE" opacity="0.36"/>

      {/* 섬 수면 반영 */}
      <ellipse cx="240" cy="162" rx="82" ry="7" fill="#2C6038" opacity="0.18"/>

      {/* ── 노들섬 ── */}
      <ellipse cx="240" cy="148" rx="96" ry="24" fill="#2E6438"/>
      <ellipse cx="240" cy="144" rx="92" ry="20" fill="#3E8848"/>
      <ellipse cx="240" cy="140" rx="88" ry="16" fill="#52A85C"/>

      {/* 섬 앞쪽 잔디마당 */}
      <rect x="185" y="148" width="110" height="6" fill="#5AB864" opacity="0.65"/>

      {/* 섬 가장자리 잔디 */}
      <rect x="148" y="134" width="5" height="12" fill="#266030"/>
      <rect x="156" y="130" width="5" height="15" fill="#266030"/>
      <rect x="164" y="127" width="4" height="17" fill="#266030"/>
      <rect x="312" y="129" width="5" height="15" fill="#266030"/>
      <rect x="320" y="132" width="5" height="13" fill="#266030"/>
      <rect x="328" y="136" width="4" height="10" fill="#266030"/>

      {/* ── 나무 왼쪽 군락 ── */}
      {/* 큰 나무 */}
      <rect x="174" y="118" width="7"  height="24" fill="#7A5430"/>
      <rect x="162" y="100" width="30" height="22" fill="#1C6422"/>
      <rect x="166" y="93"  width="22" height="12" fill="#1C6422"/>
      <rect x="169" y="86"  width="16" height="10" fill="#247830"/>
      <rect x="160" y="106" width="30" height="8"  fill="#247830"/>
      <rect x="170" y="118" width="8"  height="4"  fill="#5A3C20"/>
      {/* 작은 나무 */}
      <rect x="148" y="124" width="5"  height="18" fill="#6B4226"/>
      <rect x="139" y="110" width="22" height="16" fill="#1C6422"/>
      <rect x="143" y="104" width="14" height="10" fill="#247830"/>
      <rect x="146" y="124" width="6"  height="4"  fill="#5A3C20"/>
      {/* 덤불 */}
      <rect x="156" y="130" width="16" height="6"  fill="#2E7A38" opacity="0.7"/>

      {/* ── 라이브하우스 (Live House) - 노들섬 대표 건물 ── */}
      {/* 건물 본체 */}
      <rect x="208" y="114" width="58" height="28" fill="#D4C8B0"/>
      {/* 특유의 다크 그린 경사 지붕 */}
      <rect x="206" y="107" width="62" height="10" fill="#3C5848"/>
      <rect x="210" y="100" width="54" height="9"  fill="#3C5848"/>
      <rect x="215" y="94"  width="44" height="8"  fill="#445E50"/>
      <rect x="208" y="105" width="62" height="4"  fill="#5A7868"/>
      <rect x="212" y="99"  width="54" height="3"  fill="#5A7868"/>
      {/* 옥상 / 루프탑 */}
      <rect x="210" y="92"  width="54" height="4"  fill="#7A9288"/>
      <rect x="214" y="89"  width="4"  height="5"  fill="#6A8278"/>
      <rect x="256" y="89"  width="4"  height="5"  fill="#6A8278"/>
      <rect x="234" y="88"  width="6"  height="4"  fill="#5A7268"/>
      {/* 유리창 (가로로 긴 파노라마 창) */}
      <rect x="212" y="118" width="10" height="8" fill="#7AC0D8" opacity="0.88"/>
      <rect x="226" y="118" width="10" height="8" fill="#7AC0D8" opacity="0.88"/>
      <rect x="240" y="118" width="10" height="8" fill="#7AC0D8" opacity="0.88"/>
      <rect x="254" y="118" width="10" height="8" fill="#7AC0D8" opacity="0.88"/>
      {/* 창틀 */}
      <rect x="211" y="117" width="12" height="10" fill="none" stroke="#9A8C6C" strokeWidth="1"/>
      <rect x="225" y="117" width="12" height="10" fill="none" stroke="#9A8C6C" strokeWidth="1"/>
      <rect x="239" y="117" width="12" height="10" fill="none" stroke="#9A8C6C" strokeWidth="1"/>
      <rect x="253" y="117" width="12" height="10" fill="none" stroke="#9A8C6C" strokeWidth="1"/>
      {/* 출입문 */}
      <rect x="228" y="128" width="12" height="14" fill="#8A5C38"/>
      <rect x="229" y="129" width="5"  height="13" fill="#6A3C1C" opacity="0.6"/>
      {/* 건물 앞 목재 덱 */}
      <rect x="208" y="140" width="58" height="4"  fill="#B89060" opacity="0.80"/>
      <rect x="210" y="142" width="10" height="2"  fill="#A07848" opacity="0.60"/>
      <rect x="226" y="142" width="10" height="2"  fill="#A07848" opacity="0.60"/>
      <rect x="242" y="142" width="10" height="2"  fill="#A07848" opacity="0.60"/>
      <rect x="258" y="142" width="8"  height="2"  fill="#A07848" opacity="0.60"/>

      {/* ── 노들서가 / 라운지 (오른쪽 소형 건물) ── */}
      <rect x="272" y="122" width="28" height="20" fill="#DDD2BC"/>
      <rect x="270" y="115" width="32" height="9"  fill="#445E50"/>
      <rect x="274" y="126" width="9"  height="7"  fill="#7AC0D8" opacity="0.82"/>
      <rect x="286" y="126" width="9"  height="7"  fill="#7AC0D8" opacity="0.82"/>
      <rect x="275" y="132" width="8"  height="10" fill="#8A6040"/>
      {/* 작은 간판 */}
      <rect x="276" y="112" width="18" height="3"  fill="#E8C860" opacity="0.80"/>

      {/* ── 나무 오른쪽 군락 ── */}
      <rect x="307" y="116" width="7"  height="26" fill="#7A5430"/>
      <rect x="295" y="98"  width="30" height="22" fill="#1C6422"/>
      <rect x="299" y="91"  width="22" height="12" fill="#1C6422"/>
      <rect x="302" y="84"  width="16" height="10" fill="#247830"/>
      <rect x="293" y="104" width="30" height="8"  fill="#247830"/>
      <rect x="303" y="116" width="8"  height="4"  fill="#5A3C20"/>
      {/* 오른쪽 작은 나무 */}
      <rect x="328" y="122" width="5"  height="20" fill="#6B4226"/>
      <rect x="319" y="110" width="24" height="15" fill="#1C6422"/>
      <rect x="323" y="104" width="16" height="10" fill="#247830"/>
      <rect x="325" y="122" width="6"  height="4"  fill="#5A3C20"/>

      {/* ── 맹꽁이 픽셀아트 (잔디마당, 건물 오른쪽) ── */}
      {/* 눈 (볼록 튀어나온) */}
      <rect x="342" y="131" width="9" height="8"  fill="#4CB85C"/>
      <rect x="355" y="131" width="9" height="8"  fill="#4CB85C"/>
      <rect x="342" y="131" width="8" height="7"  fill="white"/>
      <rect x="355" y="131" width="8" height="7"  fill="white"/>
      <rect x="343" y="132" width="5" height="5"  fill="#182818"/>
      <rect x="356" y="132" width="5" height="5"  fill="#182818"/>
      <rect x="343" y="132" width="2" height="2"  fill="white"/>
      <rect x="356" y="132" width="2" height="2"  fill="white"/>
      {/* 몸통 */}
      <rect x="340" y="137" width="26" height="13" fill="#4CB85C"/>
      {/* 배 */}
      <rect x="343" y="140" width="20" height="9"  fill="#9CD88A"/>
      {/* 입 (웃는) */}
      <rect x="344" y="147" width="18" height="2"  fill="#2A6632"/>
      <rect x="342" y="145" width="4"  height="2"  fill="#2A6632"/>
      <rect x="360" y="145" width="4"  height="2"  fill="#2A6632"/>
      {/* 앞다리 */}
      <rect x="335" y="140" width="6"  height="5"  fill="#389444"/>
      <rect x="365" y="140" width="6"  height="5"  fill="#389444"/>
      {/* 뒷다리 */}
      <rect x="333" y="145" width="10" height="6"  fill="#389444"/>
      <rect x="363" y="145" width="10" height="6"  fill="#389444"/>
      {/* 발가락 L */}
      <rect x="330" y="150" width="5"  height="3"  fill="#389444"/>
      <rect x="335" y="151" width="4"  height="2"  fill="#2A7234"/>
      <rect x="339" y="150" width="5"  height="3"  fill="#389444"/>
      {/* 발가락 R */}
      <rect x="362" y="150" width="5"  height="3"  fill="#389444"/>
      <rect x="367" y="151" width="4"  height="2"  fill="#2A7234"/>
      <rect x="371" y="150" width="5"  height="3"  fill="#389444"/>
      {/* 등 무늬 */}
      <rect x="346" y="138" width="7"  height="8"  fill="#389444" opacity="0.32"/>
      <rect x="354" y="137" width="6"  height="9"  fill="#389444" opacity="0.28"/>

      {/* ── 백로 1 (오른쪽 하늘 - 날개 펼치고 날아오는) ── */}
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0,0; 0,-4; 0,0; 0,3; 0,0" dur="2.2s" repeatCount="indefinite"/>
        {/* 몸통 */}
        <rect x="356" y="60" width="16" height="7" fill="white"/>
        {/* 왼쪽 날개 */}
        <rect x="338" y="53" width="18" height="6" fill="white"/>
        <rect x="330" y="57" width="10" height="5" fill="white"/>
        <rect x="328" y="61" width="6"  height="3" fill="#303030"/>
        {/* 오른쪽 날개 */}
        <rect x="372" y="53" width="18" height="6" fill="white"/>
        <rect x="388" y="57" width="10" height="5" fill="white"/>
        <rect x="394" y="61" width="6"  height="3" fill="#303030"/>
        {/* 날개 아랫면 음영 */}
        <rect x="339" y="57" width="16" height="3" fill="#E0E8E4" opacity="0.75"/>
        <rect x="373" y="57" width="16" height="3" fill="#E0E8E4" opacity="0.75"/>
        {/* 목 (앞으로 뻗은) */}
        <rect x="356" y="54" width="4"  height="8" fill="white"/>
        <rect x="353" y="50" width="8"  height="6" fill="white"/>
        {/* 머리 */}
        <rect x="351" y="46" width="8"  height="6" fill="white"/>
        {/* 부리 (오른쪽 향함) */}
        <rect x="357" y="44" width="12" height="3" fill="#D4A420"/>
        <rect x="366" y="47" width="4"  height="2" fill="#D4A420"/>
        {/* 눈 */}
        <rect x="352" y="47" width="3"  height="3" fill="#181818"/>
        <rect x="352" y="47" width="1"  height="1" fill="white"/>
        {/* 다리 (뒤로) */}
        <rect x="358" y="67" width="2"  height="10" fill="white"/>
        <rect x="363" y="67" width="2"  height="10" fill="white"/>
        {/* 깃털 장식 */}
        <rect x="356" y="64" width="10" height="3" fill="white" opacity="0.80"/>
        <rect x="354" y="66" width="14" height="2" fill="#E8F0EC" opacity="0.60"/>
      </g>

      {/* ── 백로 2 (왼쪽 하늘 - 방향 반대, 약간 낮게) ── */}
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0,0; 0,3; 0,0; 0,-4; 0,0" dur="2.8s" repeatCount="indefinite"/>
        {/* 몸통 */}
        <rect x="108" y="74" width="16" height="7" fill="white"/>
        {/* 왼쪽 날개 (반대 방향이라 좌우 반전) */}
        <rect x="90"  y="67" width="18" height="6" fill="white"/>
        <rect x="82"  y="71" width="10" height="5" fill="white"/>
        <rect x="78"  y="75" width="6"  height="3" fill="#303030"/>
        {/* 오른쪽 날개 */}
        <rect x="124" y="67" width="18" height="6" fill="white"/>
        <rect x="140" y="71" width="10" height="5" fill="white"/>
        <rect x="146" y="75" width="6"  height="3" fill="#303030"/>
        {/* 날개 아랫면 음영 */}
        <rect x="91"  y="71" width="16" height="3" fill="#E0E8E4" opacity="0.75"/>
        <rect x="125" y="71" width="16" height="3" fill="#E0E8E4" opacity="0.75"/>
        {/* 목 (왼쪽으로 뻗은) */}
        <rect x="120" y="68" width="4"  height="8" fill="white"/>
        <rect x="119" y="64" width="8"  height="6" fill="white"/>
        {/* 머리 */}
        <rect x="120" y="60" width="8"  height="6" fill="white"/>
        {/* 부리 (왼쪽 향함) */}
        <rect x="110" y="58" width="12" height="3" fill="#D4A420"/>
        <rect x="108" y="61" width="4"  height="2" fill="#D4A420"/>
        {/* 눈 */}
        <rect x="124" y="61" width="3"  height="3" fill="#181818"/>
        <rect x="126" y="61" width="1"  height="1" fill="white"/>
        {/* 다리 (뒤로) */}
        <rect x="110" y="81" width="2"  height="10" fill="white"/>
        <rect x="115" y="81" width="2"  height="10" fill="white"/>
        {/* 깃털 장식 */}
        <rect x="108" y="78" width="10" height="3" fill="white" opacity="0.80"/>
        <rect x="106" y="80" width="14" height="2" fill="#E8F0EC" opacity="0.60"/>
      </g>

      {/* ── 물고기 ── */}
      <rect x="44"  y="170" width="14" height="7"  fill="#E8834A"/>
      <rect x="40"  y="172" width="6"  height="4"  fill="#E8834A"/>
      <rect x="57"  y="171" width="3"  height="2"  fill="white"/>

      <rect x="376" y="176" width="13" height="6"  fill="#D06880"/>
      <rect x="372" y="178" width="6"  height="3"  fill="#D06880"/>
      <rect x="389" y="177" width="3"  height="2"  fill="white"/>

      <rect x="138" y="186" width="11" height="5"  fill="#7EC8E3"/>
      <rect x="134" y="188" width="5"  height="3"  fill="#7EC8E3"/>

      <rect x="308" y="192" width="10" height="5"  fill="#98D878"/>
      <rect x="304" y="194" width="4"  height="3"  fill="#98D878"/>

      {/* 잔물결 */}
      <rect x="62"  y="158" width="8"  height="2" fill="#8CCCE8" opacity="0.52"/>
      <rect x="170" y="168" width="6"  height="2" fill="#8CCCE8" opacity="0.46"/>
      <rect x="264" y="160" width="10" height="2" fill="#8CCCE8" opacity="0.46"/>
      <rect x="370" y="164" width="8"  height="2" fill="#8CCCE8" opacity="0.52"/>
    </svg>
  );
}

const STEPS = [
  { n: "01", icon: "📝", title: "행사 등록",   desc: "홍보할 행사 정보를 시스템에 등록합니다.",           href: "/events/new" },
  { n: "02", icon: "📍", title: "구역 신청",   desc: "행사를 선택한 후 원하는 홍보 구역을 신청합니다.",    href: "/dashboard" },
  { n: "03", icon: "📁", title: "홍보물 제출", desc: "이미지·영상을 업로드하고 버전을 관리합니다.",        href: "/my-assets" },
  { n: "04", icon: "✅", title: "승인 & 게시", desc: "관리자 승인 후 노들섬에 홍보가 시작됩니다.",         href: "/calendar" },
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
            <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>노들섬에서 진행되는 행사의 홍보는 다음 절차로 진행됩니다 🏝️</p>
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
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
