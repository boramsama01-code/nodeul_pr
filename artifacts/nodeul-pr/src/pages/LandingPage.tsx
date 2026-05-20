import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetSystemSettings, getGetSystemSettingsQueryKey } from "@workspace/api-client-react";
import { useUIStore } from "@/store/useUIStore";
import { useAuth } from "@/contexts/AuthContext";

type Season = "spring" | "summer" | "autumn" | "winter";

function getSeason(): Season {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

const SEASON_THEME: Record<Season, {
  sky: [string, string, string];
  tree1: string; tree2: string; trunk: string;
  island: [string, string, string]; grass: string;
  sun: string; river: [string, string];
}> = {
  spring: {
    sky: ["#B8D8F0", "#D8DFF5", "#DDF0E0"],
    tree1: "#E87090", tree2: "#D04870", trunk: "#7A5430",
    island: ["#2E6438", "#3E8848", "#52A85C"], grass: "#68C070",
    sun: "#F8D44A", river: ["#5ABCD8", "#3C8CB8"],
  },
  summer: {
    sky: ["#58A8D8", "#88C0DC", "#AACFC0"],
    tree1: "#1C6422", tree2: "#247830", trunk: "#7A5430",
    island: ["#2E6438", "#3E8848", "#52A85C"], grass: "#5AB864",
    sun: "#F8D44A", river: ["#48A0CC", "#3080A8"],
  },
  autumn: {
    sky: ["#D09060", "#E0B070", "#E8C890"],
    tree1: "#C84020", tree2: "#A83018", trunk: "#5A3820",
    island: ["#3A5830", "#4A7040", "#5A9050"], grass: "#6A9050",
    sun: "#F09828", river: ["#4890A8", "#347080"],
  },
  winter: {
    sky: ["#8898B0", "#B0C0CC", "#C4D4DC"],
    tree1: "#9A7050", tree2: "#7A5030", trunk: "#5A3820",
    island: ["#3A6040", "#4A7850", "#5A9060"], grass: "#62A068",
    sun: "#D8D0C0", river: ["#4280A0", "#305870"],
  },
};

const CHERRY_PETALS = [
  { x: 35,  ex: 52,  dur: "4.0s", begin: "0.0s" },
  { x: 112, ex: 96,  dur: "3.6s", begin: "0.8s" },
  { x: 195, ex: 212, dur: "4.5s", begin: "1.5s" },
  { x: 278, ex: 262, dur: "3.9s", begin: "0.2s" },
  { x: 352, ex: 368, dur: "4.2s", begin: "1.1s" },
  { x: 428, ex: 412, dur: "3.5s", begin: "2.0s" },
  { x: 68,  ex: 82,  dur: "4.7s", begin: "2.5s" },
  { x: 240, ex: 222, dur: "3.8s", begin: "0.5s" },
];

const AUTUMN_LEAVES = [
  { x: 28,  ex: 45,  dur: "3.8s", begin: "0.0s", c: "#D86030" },
  { x: 105, ex: 88,  dur: "4.2s", begin: "0.7s", c: "#E8A020" },
  { x: 188, ex: 205, dur: "3.5s", begin: "1.4s", c: "#C84820" },
  { x: 292, ex: 275, dur: "4.6s", begin: "0.3s", c: "#D87030" },
  { x: 368, ex: 385, dur: "3.9s", begin: "1.8s", c: "#E07020" },
  { x: 448, ex: 430, dur: "4.1s", begin: "2.3s", c: "#B83818" },
  { x: 148, ex: 162, dur: "4.3s", begin: "2.8s", c: "#D87030" },
];

const SNOWFLAKES = [
  { x: 25,  ex: 33,  dur: "5.0s", begin: "0.0s", sz: 4 },
  { x: 92,  ex: 82,  dur: "4.5s", begin: "0.9s", sz: 3 },
  { x: 168, ex: 178, dur: "5.6s", begin: "1.7s", sz: 5 },
  { x: 258, ex: 248, dur: "4.8s", begin: "0.4s", sz: 3 },
  { x: 335, ex: 345, dur: "5.2s", begin: "1.2s", sz: 4 },
  { x: 415, ex: 405, dur: "4.6s", begin: "2.1s", sz: 3 },
  { x: 55,  ex: 63,  dur: "5.3s", begin: "2.6s", sz: 4 },
  { x: 202, ex: 192, dur: "4.9s", begin: "3.0s", sz: 3 },
  { x: 458, ex: 466, dur: "5.1s", begin: "0.6s", sz: 4 },
];

function NodeulScene({ season }: { season: Season }) {
  const th = SEASON_THEME[season];
  const isWinter = season === "winter";
  const isSpring = season === "spring";
  const isAutumn = season === "autumn";
  const isSummer = season === "summer";

  return (
    <svg viewBox="0 0 480 220" xmlns="http://www.w3.org/2000/svg" className="w-full block" style={{ imageRendering: "pixelated" }}>
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={th.sky[0]}/>
          <stop offset="55%" stopColor={th.sky[1]}/>
          <stop offset="100%" stopColor={th.sky[2]}/>
        </linearGradient>
        <linearGradient id="riverGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={th.river[0]}/>
          <stop offset="100%" stopColor={th.river[1]}/>
        </linearGradient>
      </defs>

      {/* 하늘 */}
      <rect width="480" height="220" fill="url(#skyGrad)"/>

      {/* 구름 */}
      <rect x="10"  y="22" width="72" height="12" fill="white" opacity="0.92"/>
      <rect x="6"   y="28" width="82" height="16" fill="white" opacity="0.92"/>
      <rect x="20"  y="14" width="42" height="12" fill="white" opacity="0.88"/>
      <rect x="178" y="14" width="58" height="12" fill="white" opacity="0.86"/>
      <rect x="172" y="20" width="70" height="14" fill="white" opacity="0.86"/>
      <rect x="332" y="26" width="48" height="10" fill="white" opacity="0.76"/>
      <rect x="326" y="32" width="62" height="14" fill="white" opacity="0.76"/>
      <rect x="418" y="18" width="30" height="8"  fill="white" opacity="0.52"/>
      <rect x="414" y="24" width="38" height="8"  fill="white" opacity="0.52"/>

      {/* 태양 */}
      <rect x="434" y="10" width="24" height="24" fill={th.sun}/>
      <rect x="440" y="4"  width="12" height="6"  fill={th.sun}/>
      <rect x="440" y="34" width="12" height="6"  fill={th.sun}/>
      <rect x="428" y="16" width="6"  height="12" fill={th.sun}/>
      <rect x="458" y="16" width="6"  height="12" fill={th.sun}/>
      <rect x="430" y="10" width="4"  height="4"  fill={th.sun}/>
      <rect x="456" y="10" width="4"  height="4"  fill={th.sun}/>
      <rect x="430" y="28" width="4"  height="4"  fill={th.sun}/>
      <rect x="456" y="28" width="4"  height="4"  fill={th.sun}/>

      {/* 서울 스카이라인 */}
      <rect x="0"   y="82" width="16" height="54" fill="#88A8A4" opacity="0.36"/>
      <rect x="20"  y="70" width="11" height="66" fill="#7A9E9A" opacity="0.36"/>
      <rect x="2"   y="66" width="5"  height="16" fill="#88A8A4" opacity="0.30"/>
      <rect x="34"  y="78" width="14" height="58" fill="#88A8A4" opacity="0.32"/>
      <rect x="52"  y="72" width="10" height="64" fill="#7A9E9A" opacity="0.30"/>
      <rect x="374" y="76" width="14" height="60" fill="#88A8A4" opacity="0.36"/>
      <rect x="392" y="66" width="11" height="70" fill="#7A9E9A" opacity="0.36"/>
      <rect x="406" y="76" width="14" height="60" fill="#88A8A4" opacity="0.32"/>
      <rect x="424" y="72" width="10" height="64" fill="#7A9E9A" opacity="0.30"/>
      <rect x="456" y="74" width="24" height="62" fill="#7A9E9A" opacity="0.26"/>

      {/* 한강대교 */}
      <rect x="0"   y="132" width="148" height="7" fill="#9AAAB2" opacity="0.65"/>
      <rect x="332" y="132" width="148" height="7" fill="#9AAAB2" opacity="0.65"/>
      <rect x="0"   y="130" width="148" height="2" fill="#B4C0C4" opacity="0.58"/>
      <rect x="332" y="130" width="148" height="2" fill="#B4C0C4" opacity="0.58"/>
      <rect x="0"   y="139" width="148" height="2" fill="#788490" opacity="0.52"/>
      <rect x="332" y="139" width="148" height="2" fill="#788490" opacity="0.52"/>
      <rect x="0"   y="132" width="10" height="88" fill="#9AAAB2" opacity="0.62"/>
      <rect x="460" y="132" width="20" height="88" fill="#9AAAB2" opacity="0.62"/>

      {/* 한강 */}
      <rect x="0" y="138" width="480" height="82" fill="url(#riverGrad)"/>
      <rect x="16"  y="150" width="48" height="3" fill="#7ACCE8" opacity="0.44"/>
      <rect x="90"  y="162" width="36" height="3" fill="#7ACCE8" opacity="0.38"/>
      <rect x="204" y="148" width="48" height="3" fill="#7ACCE8" opacity="0.34"/>
      <rect x="362" y="155" width="50" height="3" fill="#7ACCE8" opacity="0.44"/>
      <rect x="422" y="168" width="36" height="3" fill="#7ACCE8" opacity="0.38"/>
      <ellipse cx="240" cy="162" rx="82" ry="7" fill="#2C6038" opacity="0.16"/>

      {/* 여름: 요트 */}
      {isSummer && (
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,2; 0,0; 0,-1; 0,0" dur="2.4s" repeatCount="indefinite"/>
          {/* 돛대 */}
          <rect x="57" y="147" width="2" height="16" fill="#484848" opacity="0.9"/>
          {/* 흰 돛 */}
          <rect x="48" y="148" width="9" height="13" fill="white" opacity="0.95"/>
          <rect x="50" y="149" width="7" height="11" fill="white" opacity="0.95"/>
          <rect x="52" y="150" width="4" height="9" fill="white" opacity="0.90"/>
          {/* 파란 돛 */}
          <rect x="59" y="149" width="9" height="11" fill="#4090D8" opacity="0.90"/>
          <rect x="60" y="150" width="7" height="9" fill="#4090D8" opacity="0.88"/>
          {/* 선체 */}
          <rect x="44" y="162" width="30" height="7" fill="#C83030" opacity="0.95"/>
          <rect x="46" y="163" width="28" height="5" fill="#E04040" opacity="0.90"/>
          {/* 뱃머리 */}
          <rect x="40" y="164" width="5" height="4" fill="#C83030" opacity="0.85"/>
          {/* wake */}
          <rect x="73" y="165" width="16" height="2" fill="white" opacity="0.40"/>
          <rect x="73" y="167" width="10" height="1" fill="white" opacity="0.25"/>
          {/* 창문 */}
          <rect x="50" y="163" width="4" height="3" fill="#88CCEE" opacity="0.70"/>
          <rect x="56" y="163" width="4" height="3" fill="#88CCEE" opacity="0.70"/>
        </g>
      )}

      {/* 여름: 두 번째 작은 요트 (오른쪽) */}
      {isSummer && (
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0; 0,1; 0,0" dur="3.1s" repeatCount="indefinite"/>
          <rect x="390" y="152" width="2" height="12" fill="#484848" opacity="0.9"/>
          <rect x="383" y="153" width="7" height="9" fill="white" opacity="0.92"/>
          <rect x="392" y="154" width="7" height="8" fill="#F08030" opacity="0.88"/>
          <rect x="380" y="163" width="22" height="5" fill="#205090" opacity="0.90"/>
          <rect x="378" y="164" width="3" height="3" fill="#205090" opacity="0.80"/>
          <rect x="400" y="165" width="12" height="2" fill="white" opacity="0.35"/>
        </g>
      )}

      {/* 노들섬 */}
      <ellipse cx="240" cy="148" rx="96" ry="24" fill={th.island[0]}/>
      <ellipse cx="240" cy="144" rx="92" ry="20" fill={th.island[1]}/>
      <ellipse cx="240" cy="140" rx="88" ry="16" fill={th.island[2]}/>
      <rect x="185" y="148" width="110" height="6" fill={th.grass} opacity="0.65"/>
      <rect x="148" y="134" width="5" height="12" fill="#266030"/>
      <rect x="156" y="130" width="5" height="15" fill="#266030"/>
      <rect x="312" y="129" width="5" height="15" fill="#266030"/>
      <rect x="320" y="132" width="5" height="13" fill="#266030"/>

      {/* 겨울 눈 */}
      {isWinter && <>
        <rect x="185" y="148" width="110" height="3" fill="white" opacity="0.58"/>
        <rect x="148" y="134" width="5" height="5" fill="white" opacity="0.48"/>
        <rect x="312" y="129" width="5" height="4" fill="white" opacity="0.48"/>
      </>}

      {/* 나무 왼쪽 */}
      <rect x="174" y="118" width="7"  height="24" fill={th.trunk}/>
      <rect x="162" y="100" width="30" height="22" fill={th.tree1}/>
      <rect x="166" y="93"  width="22" height="12" fill={th.tree1}/>
      <rect x="169" y="86"  width="16" height="10" fill={th.tree2}/>
      <rect x="160" y="106" width="30" height="8"  fill={th.tree2}/>
      <rect x="170" y="118" width="8"  height="4"  fill={th.trunk}/>
      <rect x="148" y="124" width="5"  height="18" fill={th.trunk}/>
      <rect x="139" y="110" width="22" height="16" fill={th.tree1}/>
      <rect x="143" y="104" width="14" height="10" fill={th.tree2}/>
      <rect x="156" y="130" width="16" height="6"  fill={isWinter ? th.trunk : th.tree1} opacity="0.7"/>
      {isWinter && <>
        <rect x="162" y="100" width="30" height="5" fill="white" opacity="0.72"/>
        <rect x="166" y="93"  width="22" height="4" fill="white" opacity="0.68"/>
        <rect x="169" y="86"  width="16" height="4" fill="white" opacity="0.72"/>
        <rect x="139" y="110" width="22" height="4" fill="white" opacity="0.68"/>
      </>}

      {/* 라이브하우스 */}
      <rect x="208" y="114" width="58" height="28" fill="#D4C8B0"/>
      <rect x="206" y="107" width="62" height="10" fill="#3C5848"/>
      <rect x="210" y="100" width="54" height="9"  fill="#3C5848"/>
      <rect x="215" y="94"  width="44" height="8"  fill="#445E50"/>
      <rect x="208" y="105" width="62" height="4"  fill="#5A7868"/>
      <rect x="212" y="99"  width="54" height="3"  fill="#5A7868"/>
      <rect x="210" y="92"  width="54" height="4"  fill="#7A9288"/>
      <rect x="234" y="88"  width="6"  height="4"  fill="#5A7268"/>
      {isWinter && <rect x="206" y="92" width="62" height="5" fill="white" opacity="0.78"/>}
      <rect x="212" y="118" width="10" height="8" fill="#7AC0D8" opacity="0.88"/>
      <rect x="226" y="118" width="10" height="8" fill="#7AC0D8" opacity="0.88"/>
      <rect x="240" y="118" width="10" height="8" fill="#7AC0D8" opacity="0.88"/>
      <rect x="254" y="118" width="10" height="8" fill="#7AC0D8" opacity="0.88"/>
      <rect x="211" y="117" width="12" height="10" fill="none" stroke="#9A8C6C" strokeWidth="1"/>
      <rect x="225" y="117" width="12" height="10" fill="none" stroke="#9A8C6C" strokeWidth="1"/>
      <rect x="239" y="117" width="12" height="10" fill="none" stroke="#9A8C6C" strokeWidth="1"/>
      <rect x="253" y="117" width="12" height="10" fill="none" stroke="#9A8C6C" strokeWidth="1"/>
      <rect x="228" y="128" width="12" height="14" fill="#8A5C38"/>
      <rect x="208" y="140" width="58" height="4"  fill="#B89060" opacity="0.78"/>

      {/* 노들서가 */}
      <rect x="272" y="122" width="28" height="20" fill="#DDD2BC"/>
      <rect x="270" y="115" width="32" height="9"  fill="#445E50"/>
      <rect x="274" y="126" width="9"  height="7"  fill="#7AC0D8" opacity="0.82"/>
      <rect x="286" y="126" width="9"  height="7"  fill="#7AC0D8" opacity="0.82"/>
      <rect x="275" y="132" width="8"  height="10" fill="#8A6040"/>
      {isWinter && <rect x="270" y="115" width="32" height="3" fill="white" opacity="0.72"/>}

      {/* 나무 오른쪽 */}
      <rect x="307" y="116" width="7"  height="26" fill={th.trunk}/>
      <rect x="295" y="98"  width="30" height="22" fill={th.tree1}/>
      <rect x="299" y="91"  width="22" height="12" fill={th.tree1}/>
      <rect x="302" y="84"  width="16" height="10" fill={th.tree2}/>
      <rect x="293" y="104" width="30" height="8"  fill={th.tree2}/>
      <rect x="303" y="116" width="8"  height="4"  fill={th.trunk}/>
      <rect x="328" y="122" width="5"  height="20" fill={th.trunk}/>
      <rect x="319" y="110" width="24" height="15" fill={th.tree1}/>
      <rect x="323" y="104" width="16" height="10" fill={th.tree2}/>
      {isWinter && <>
        <rect x="295" y="98"  width="30" height="5" fill="white" opacity="0.72"/>
        <rect x="299" y="91"  width="22" height="4" fill="white" opacity="0.68"/>
        <rect x="302" y="84"  width="16" height="4" fill="white" opacity="0.72"/>
        <rect x="319" y="110" width="24" height="4" fill="white" opacity="0.68"/>
      </>}

      {/* 작은 맹꽁이 얼굴 */}
      <rect x="186" y="141" width="7"  height="8" fill="#4CB85C"/>
      <rect x="197" y="141" width="7"  height="8" fill="#4CB85C"/>
      <rect x="187" y="141" width="5"  height="6" fill="white"/>
      <rect x="198" y="141" width="5"  height="6" fill="white"/>
      <rect x="188" y="142" width="3"  height="4" fill="#181818"/>
      <rect x="199" y="142" width="3"  height="4" fill="#181818"/>
      <rect x="188" y="142" width="1"  height="1" fill="white"/>
      <rect x="199" y="142" width="1"  height="1" fill="white"/>
      <rect x="184" y="147" width="22" height="8" fill="#4CB85C"/>
      <rect x="186" y="148" width="18" height="6" fill="#8CD888"/>
      <rect x="186" y="152" width="14" height="2" fill="#2A7232"/>
      <rect x="184" y="150" width="3"  height="3" fill="#2A7232"/>
      <rect x="202" y="150" width="3"  height="3" fill="#2A7232"/>

      {/* 백로 1 */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-4; 0,0; 0,3; 0,0" dur="2.2s" repeatCount="indefinite"/>
        <rect x="356" y="60" width="16" height="7" fill="white"/>
        <rect x="338" y="53" width="18" height="6" fill="white"/>
        <rect x="330" y="57" width="10" height="5" fill="white"/>
        <rect x="328" y="61" width="6"  height="3" fill="#303030"/>
        <rect x="372" y="53" width="18" height="6" fill="white"/>
        <rect x="388" y="57" width="10" height="5" fill="white"/>
        <rect x="394" y="61" width="6"  height="3" fill="#303030"/>
        <rect x="356" y="54" width="4"  height="8" fill="white"/>
        <rect x="357" y="44" width="12" height="3" fill="#D4A420"/>
        <rect x="352" y="47" width="3"  height="3" fill="#181818"/>
        <rect x="352" y="47" width="1"  height="1" fill="white"/>
        <rect x="358" y="67" width="2"  height="10" fill="white"/>
        <rect x="363" y="67" width="2"  height="10" fill="white"/>
      </g>

      {/* 백로 2 */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,3; 0,0; 0,-4; 0,0" dur="2.8s" repeatCount="indefinite"/>
        <rect x="108" y="74" width="16" height="7" fill="white"/>
        <rect x="90"  y="67" width="18" height="6" fill="white"/>
        <rect x="82"  y="71" width="10" height="5" fill="white"/>
        <rect x="78"  y="75" width="6"  height="3" fill="#303030"/>
        <rect x="124" y="67" width="18" height="6" fill="white"/>
        <rect x="140" y="71" width="10" height="5" fill="white"/>
        <rect x="120" y="68" width="4"  height="8" fill="white"/>
        <rect x="110" y="58" width="12" height="3" fill="#D4A420"/>
        <rect x="124" y="61" width="3"  height="3" fill="#181818"/>
        <rect x="110" y="81" width="2"  height="10" fill="white"/>
        <rect x="115" y="81" width="2"  height="10" fill="white"/>
      </g>

      {/* 물고기 */}
      <rect x="44"  y="170" width="14" height="7"  fill="#E8834A"/>
      <rect x="40"  y="172" width="6"  height="4"  fill="#E8834A"/>
      <rect x="57"  y="171" width="3"  height="2"  fill="white"/>
      <rect x="376" y="176" width="13" height="6"  fill="#D06880"/>
      <rect x="372" y="178" width="6"  height="3"  fill="#D06880"/>
      <rect x="62"  y="158" width="8"  height="2" fill="#8CCCE8" opacity="0.50"/>
      <rect x="370" y="164" width="8"  height="2" fill="#8CCCE8" opacity="0.50"/>

      {/* ── 봄: 벚꽃잎 낙하 ── */}
      {isSpring && CHERRY_PETALS.map((p, i) => (
        <g key={i}>
          <animateTransform attributeName="transform" type="translate"
            from={`${p.x} -8`} to={`${p.ex} 228`}
            dur={p.dur} begin={`-${p.begin}`} repeatCount="indefinite"/>
          <rect x="-3" y="-2" width="7" height="5" rx="2" fill="#F8A8C0" opacity="0.88"/>
        </g>
      ))}

      {/* ── 가을: 낙엽 낙하 ── */}
      {isAutumn && AUTUMN_LEAVES.map((l, i) => (
        <g key={i}>
          <animateTransform attributeName="transform" type="translate"
            from={`${l.x} -8`} to={`${l.ex} 228`}
            dur={l.dur} begin={`-${l.begin}`} repeatCount="indefinite"/>
          <rect x="-3" y="-3" width="7" height="6" rx="1" fill={l.c} opacity="0.85"/>
        </g>
      ))}

      {/* ── 겨울: 눈송이 낙하 ── */}
      {isWinter && SNOWFLAKES.map((s, i) => (
        <g key={i}>
          <animateTransform attributeName="transform" type="translate"
            from={`${s.x} -8`} to={`${s.ex} 228`}
            dur={s.dur} begin={`-${s.begin}`} repeatCount="indefinite"/>
          <rect x={-s.sz / 2} y={-s.sz / 2} width={s.sz} height={s.sz} rx={s.sz / 2} fill="white" opacity="0.90"/>
        </g>
      ))}
    </svg>
  );
}

const STEPS = [
  { n: "01", icon: "📝", title: "행사 등록",   desc: "홍보할 행사 정보를 등록합니다.",        href: "/events/new" },
  { n: "02", icon: "📍", title: "구역 신청",   desc: "원하는 홍보 구역을 선택해 신청합니다.", href: "/dashboard" },
  { n: "03", icon: "📁", title: "홍보물 관리", desc: "이미지·영상을 업로드하고 버전을 관리합니다.", href: "/dashboard" },
  { n: "04", icon: "✅", title: "승인 & 게시", desc: "관리자 승인 후 게시가 시작됩니다.",      href: "/calendar" },
];

const SEASON_LABELS: Record<Season, string> = {
  spring: "🌸 봄",
  summer: "☀ 여름",
  autumn: "🍂 가을",
  winter: "❄ 겨울",
};

export default function LandingPage() {
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const setShowNPC    = useUIStore(s => s.setShowNPC);
  const { data: settings } = useGetSystemSettings({ query: { queryKey: getGetSystemSettingsQueryKey() } });
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [season, setSeason] = useState<Season>(getSeason);

  useEffect(() => {
    const greeting = settings?.find(s => s.key === "npc_greeting")?.value;
    setNPCMessage(greeting || "안녕하세요! 노들섬 홍보 시스템에 오신 것을 환영합니다. 궁금한 점은 언제든지 물어보세요 🐸");
    setShowNPC(true);
  }, [settings, setNPCMessage, setShowNPC]);

  const handleStepClick = (href: string) => {
    if (!isSignedIn) { setLocation("/sign-in"); return; }
    setLocation(href);
  };

  const KR = { fontFamily: "'Noto Sans KR', sans-serif" };
  const skyBg = `linear-gradient(180deg, ${SEASON_THEME[season].sky[0]} 0%, ${SEASON_THEME[season].sky[1]} 55%, ${SEASON_THEME[season].sky[2]} 100%)`;

  return (
    <div className="flex flex-col -mt-4 sm:-mt-6">
      <div className="relative overflow-hidden" style={{ background: skyBg }}>
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-4 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

          {/* 왼쪽: 타이틀 + 절차 안내 */}
          <div className="space-y-3">
            {/* 타이틀 카드 */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="bg-white/93 border border-black/12 shadow-md px-5 py-5"
              style={{ backdropFilter: "blur(4px)" }}
            >
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "0.38rem", letterSpacing: "0.25em" }}
                className="text-primary/70 mb-1.5 uppercase">
                Nodeul Island · PR System
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-foreground leading-snug" style={KR}>
                노들섬 홍보 관리 시스템
              </h1>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed" style={KR}>
                행사 등록부터 홍보물 제출·버전관리·게시 완료까지 한 곳에서 처리하세요.
              </p>
              <div className="mt-3 flex gap-2 flex-wrap">
                {isSignedIn ? (
                  <button onClick={() => setLocation("/dashboard")}
                    className="h-8 px-4 text-xs font-semibold bg-primary text-white rounded hover:bg-primary/85 transition-colors" style={KR}>
                    내 행사 목록 →
                  </button>
                ) : (
                  <button onClick={() => setLocation("/sign-up")}
                    className="h-8 px-4 text-xs font-semibold bg-primary text-white rounded hover:bg-primary/85 transition-colors" style={KR}>
                    지금 시작하기
                  </button>
                )}
              </div>
            </motion.div>

            {/* 절차 안내 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="bg-white/93 border border-black/12 px-4 pt-4 pb-3"
              style={{ backdropFilter: "blur(4px)" }}
            >
              <h2 className="text-sm font-bold text-foreground mb-3" style={KR}>홍보 신청 절차</h2>
              <div className="grid grid-cols-2 gap-2">
                {STEPS.map((step, i) => (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 + i * 0.06 }}
                    onClick={() => handleStepClick(step.href)}
                    className="border border-black/10 p-3 bg-white hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-sm">{step.icon}</span>
                      <span className="text-xs font-bold text-primary/60" style={KR}>{step.n}</span>
                    </div>
                    <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors" style={KR}>{step.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed" style={KR}>{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* 오른쪽: 일러스트 + 시즌 스위처 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-full rounded overflow-hidden border border-white/30 shadow-lg">
              <NodeulScene season={season} />
            </div>
            {/* 시즌 스위처 */}
            <div className="flex gap-1 flex-wrap justify-center">
              {(Object.keys(SEASON_LABELS) as Season[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSeason(s)}
                  className={`px-2.5 py-1 text-[11px] rounded-full transition-all ${season === s
                    ? "bg-white shadow border border-primary/30 text-primary font-bold"
                    : "bg-white/50 text-muted-foreground hover:bg-white/80 border border-transparent"}`}
                  style={KR}
                >
                  {SEASON_LABELS[s]}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
