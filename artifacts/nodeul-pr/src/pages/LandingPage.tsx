import React, { useEffect } from "react";
import { Link } from "wouter";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelCard } from "@/components/pixel/PixelCard";
import { motion } from "framer-motion";
import { useGetSystemSettings, getGetSystemSettingsQueryKey } from "@workspace/api-client-react";
import { useUIStore } from "@/store/useUIStore";

export default function LandingPage() {
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const setShowNPC = useUIStore(s => s.setShowNPC);

  const { data: settings } = useGetSystemSettings({
    query: { queryKey: getGetSystemSettingsQueryKey() }
  });

  useEffect(() => {
    const greeting = settings?.find(s => s.key === "npc_greeting")?.value;
    setNPCMessage(greeting || "안녕하세요! 노들섬 홍보 통합 시스템입니다. 궁금한 점이 있으시면 저 맹꽁이🐸에게 물어보세요!");
    setShowNPC(true);
  }, [settings, setNPCMessage, setShowNPC]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-6 sm:py-10">

      {/* Title */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          <h1 className="page-title text-primary font-bold">
            노들섬 홍보 통합 시스템
          </h1>
          <p className="font-pixel text-[0.55rem] text-muted-foreground tracking-widest mt-1 uppercase">
            Nodeul Island PR Management System
          </p>
        </motion.div>
      </div>

      {/* CTA 버튼 — 한영 병기 */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-md">
        <Link href="/sign-up" className="flex-1">
          <PixelButton size="lg" variant="primary" className="w-full flex-col gap-0.5 py-4">
            <span className="text-lg leading-tight">새로 시작하기</span>
            <span className="text-[0.6rem] font-pixel opacity-80 tracking-widest">NEW ACCOUNT</span>
          </PixelButton>
        </Link>
        <Link href="/sign-in" className="flex-1">
          <PixelButton size="lg" variant="secondary" className="w-full flex-col gap-0.5 py-4">
            <span className="text-lg leading-tight">로그인</span>
            <span className="text-[0.6rem] font-pixel opacity-80 tracking-widest">SIGN IN</span>
          </PixelButton>
        </Link>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
        {[
          { icon: "📜", title: "홍보 신청", sub: "QUEST LOG", desc: "이벤트를 등록하고 홍보 구역을 신청합니다." },
          { icon: "⚔️", title: "홍보물 제출", sub: "ASSET UPLOAD", desc: "이미지·영상 등 홍보물을 업로드하고 버전을 관리합니다." },
          { icon: "👑", title: "관리자 HUD", sub: "ADMIN PANEL", desc: "담당자가 모든 홍보 채널을 한눈에 승인·조율합니다." },
        ].map(f => (
          <PixelCard key={f.title} className="text-center hover:-translate-y-1 transition-transform">
            <div className="text-3xl mb-2">{f.icon}</div>
            <p className="text-xl font-bold text-foreground mb-0.5">{f.title}</p>
            <p className="font-pixel text-[0.45rem] text-muted-foreground tracking-widest mb-2">{f.sub}</p>
            <p className="text-base text-muted-foreground">{f.desc}</p>
          </PixelCard>
        ))}
      </div>
    </div>
  );
}
