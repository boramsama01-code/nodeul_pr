import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetMe, getGetMeQueryKey, useListEvents, getListEventsQueryKey, useGetAdminDashboard, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import { NPCHelper } from "../pixel/NPCHelper";
import { Scanlines } from "../pixel/Scanlines";
import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "@/store/useUIStore";

/* ── 픽셀 아이콘 SVG 컴포넌트 ── */
function PixelListIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} style={{ imageRendering: "pixelated", display: "inline-block", verticalAlign: "middle" }}>
      {/* 클립보드 프레임 */}
      <rect x="1" y="2" width="12" height="11" fill="currentColor" opacity="0.12"/>
      <rect x="1" y="2" width="12" height="1" fill="currentColor"/>
      <rect x="1" y="12" width="12" height="1" fill="currentColor"/>
      <rect x="1" y="2" width="1" height="11" fill="currentColor"/>
      <rect x="12" y="2" width="1" height="11" fill="currentColor"/>
      {/* 클립 */}
      <rect x="5" y="0" width="4" height="3" fill="currentColor"/>
      <rect x="6" y="1" width="2" height="2" fill="white" opacity="0.8"/>
      {/* 줄 1 */}
      <rect x="3" y="5" width="1" height="1" fill="currentColor"/>
      <rect x="5" y="5" width="6" height="1" fill="currentColor"/>
      {/* 줄 2 */}
      <rect x="3" y="7" width="1" height="1" fill="currentColor"/>
      <rect x="5" y="7" width="6" height="1" fill="currentColor"/>
      {/* 줄 3 */}
      <rect x="3" y="9" width="1" height="1" fill="currentColor"/>
      <rect x="5" y="9" width="4" height="1" fill="currentColor"/>
    </svg>
  );
}

function PixelImageIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} style={{ imageRendering: "pixelated", display: "inline-block", verticalAlign: "middle" }}>
      {/* 프레임 */}
      <rect x="1" y="1" width="12" height="9" fill="currentColor" opacity="0.12"/>
      <rect x="1" y="1" width="12" height="1" fill="currentColor"/>
      <rect x="1" y="9" width="12" height="1" fill="currentColor"/>
      <rect x="1" y="1" width="1" height="9" fill="currentColor"/>
      <rect x="12" y="1" width="1" height="9" fill="currentColor"/>
      {/* 태양 */}
      <rect x="9" y="3" width="2" height="2" fill="currentColor" opacity="0.7"/>
      {/* 산 */}
      <rect x="2" y="6" width="4" height="3" fill="currentColor" opacity="0.4"/>
      <rect x="3" y="5" width="2" height="1" fill="currentColor" opacity="0.55"/>
      <rect x="6" y="5" width="5" height="4" fill="currentColor" opacity="0.55"/>
      <rect x="7" y="4" width="3" height="1" fill="currentColor" opacity="0.7"/>
      <rect x="8" y="3" width="1" height="1" fill="currentColor" opacity="0.85"/>
      {/* 업로드 화살표 */}
      <rect x="6" y="11" width="2" height="3" fill="currentColor"/>
      <rect x="4" y="11" width="2" height="2" fill="currentColor"/>
      <rect x="8" y="11" width="2" height="2" fill="currentColor"/>
      <rect x="5" y="10" width="4" height="1" fill="currentColor"/>
      <rect x="6" y="9" width="2" height="1" fill="currentColor"/>
    </svg>
  );
}

function PixelCalendarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} style={{ imageRendering: "pixelated", display: "inline-block", verticalAlign: "middle" }}>
      {/* 프레임 */}
      <rect x="1" y="2" width="12" height="11" fill="currentColor" opacity="0.12"/>
      <rect x="1" y="2" width="12" height="1" fill="currentColor"/>
      <rect x="1" y="12" width="12" height="1" fill="currentColor"/>
      <rect x="1" y="2" width="1" height="11" fill="currentColor"/>
      <rect x="12" y="2" width="1" height="11" fill="currentColor"/>
      {/* 헤더 바 */}
      <rect x="1" y="2" width="12" height="3" fill="currentColor" opacity="0.8"/>
      {/* 고리 */}
      <rect x="4" y="1" width="2" height="3" fill="currentColor"/>
      <rect x="8" y="1" width="2" height="3" fill="currentColor"/>
      {/* 날짜 칸 2x3 */}
      <rect x="2" y="7" width="2" height="2" fill="currentColor" opacity="0.5"/>
      <rect x="5" y="7" width="2" height="2" fill="currentColor" opacity="0.5"/>
      <rect x="8" y="7" width="2" height="2" fill="currentColor" opacity="0.5"/>
      <rect x="2" y="10" width="2" height="2" fill="currentColor" opacity="0.35"/>
      <rect x="5" y="10" width="2" height="2" fill="currentColor" opacity="0.35"/>
      <rect x="8" y="10" width="2" height="2" fill="currentColor" opacity="0.35"/>
    </svg>
  );
}

function PixelDashboardIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} style={{ imageRendering: "pixelated", display: "inline-block", verticalAlign: "middle" }}>
      <rect x="1" y="1" width="5" height="5" fill="currentColor" opacity="0.8"/>
      <rect x="8" y="1" width="5" height="5" fill="currentColor" opacity="0.8"/>
      <rect x="1" y="8" width="5" height="5" fill="currentColor" opacity="0.5"/>
      <rect x="8" y="8" width="5" height="5" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}

function PixelSettingsIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} style={{ imageRendering: "pixelated", display: "inline-block", verticalAlign: "middle" }}>
      <rect x="5" y="1" width="4" height="2" fill="currentColor"/>
      <rect x="1" y="5" width="2" height="4" fill="currentColor"/>
      <rect x="11" y="5" width="2" height="4" fill="currentColor"/>
      <rect x="5" y="11" width="4" height="2" fill="currentColor"/>
      <rect x="3" y="3" width="2" height="2" fill="currentColor"/>
      <rect x="9" y="3" width="2" height="2" fill="currentColor"/>
      <rect x="3" y="9" width="2" height="2" fill="currentColor"/>
      <rect x="9" y="9" width="2" height="2" fill="currentColor"/>
      <rect x="4" y="4" width="6" height="6" fill="currentColor" opacity="0.5"/>
      <rect x="5" y="5" width="4" height="4" fill="white" opacity="0.6"/>
      <rect x="6" y="6" width="2" height="2" fill="currentColor"/>
    </svg>
  );
}

function PixelUsersIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} style={{ imageRendering: "pixelated", display: "inline-block", verticalAlign: "middle" }}>
      {/* 왼쪽 사람 머리 */}
      <rect x="1" y="1" width="4" height="4" fill="currentColor" opacity="0.7"/>
      {/* 왼쪽 사람 몸 */}
      <rect x="0" y="6" width="6" height="4" fill="currentColor" opacity="0.7"/>
      {/* 오른쪽 사람 머리 */}
      <rect x="9" y="1" width="4" height="4" fill="currentColor"/>
      {/* 오른쪽 사람 몸 */}
      <rect x="8" y="6" width="6" height="4" fill="currentColor"/>
      {/* 별(관리자 표시) */}
      <rect x="6" y="11" width="2" height="1" fill="currentColor" opacity="0.8"/>
    </svg>
  );
}

const navIcons: Record<string, React.ReactNode> = {
  "/dashboard": <PixelListIcon />,
  "/my-assets": <PixelImageIcon />,
  "/calendar":  <PixelCalendarIcon />,
  "/admin":     <PixelDashboardIcon />,
  "/admin/events":   <PixelListIcon />,
  "/admin/calendar": <PixelCalendarIcon />,
  "/admin/settings": <PixelSettingsIcon />,
  "/admin/users":    <PixelUsersIcon />,
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, signOut } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: me } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } });
  const role = me?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  const { data: myEvents } = useListEvents(
    { status: "revision_requested" },
    { query: { enabled: !!isSignedIn && !isAdmin, queryKey: [...getListEventsQueryKey(), "revision_requested"] } }
  );
  const revisionCount = (myEvents as any)?.total ?? (Array.isArray(myEvents) ? myEvents.length : 0);

  const { data: adminDashboard } = useGetAdminDashboard({
    query: {
      enabled: !!isSignedIn && isAdmin,
      queryKey: getGetAdminDashboardQueryKey(),
      refetchInterval: 60_000,
    },
  });
  const newSubmissionsCount = (adminDashboard as any)?.newSubmissionsCount ?? 0;

  const setNpcBadge = useUIStore(s => s.setNpcBadge);
  React.useEffect(() => {
    const count = isAdmin ? newSubmissionsCount : revisionCount;
    const text = isAdmin
      ? count > 0 ? `새 행사 신청이 ${count}건 있어요! 확인해 주세요 🐸` : ""
      : count > 0 ? `수정 요청된 행사가 ${count}건 있어요! 확인해 주세요 🐸` : "";
    setNpcBadge(count, text);
  }, [newSubmissionsCount, revisionCount, isAdmin, setNpcBadge]);

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
    setMobileOpen(false);
  };

  const navLinks = isSignedIn
    ? isAdmin
      ? [
          { href: "/admin",          label: "대시보드",  admin: true },
          { href: "/admin/events",   label: "행사 목록", admin: true, badge: newSubmissionsCount },
          { href: "/admin/calendar", label: "캘린더",   admin: true },
          { href: "/admin/users",    label: "회원 관리", admin: true },
          { href: "/admin/settings", label: "설정",     admin: true },
        ]
      : [
          { href: "/dashboard", label: "내 행사 목록", badge: revisionCount > 0 ? revisionCount : 0 },
          { href: "/calendar",  label: "캘린더" },
        ]
    : [];

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  return (
    <Scanlines className="flex flex-col min-h-[100dvh] bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
          <Link href="/">
            <div className="font-pixel text-sm sm:text-base tracking-tight cursor-pointer whitespace-nowrap">
              <span className="text-primary">NODEUL</span>
              <span className="hidden sm:inline text-foreground"> PR SYSTEM</span>
              <span className="sm:hidden text-foreground"> PR</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-1 items-center flex-1 justify-end">
            {navLinks.map(l => {
              const active = isActive(l.href);
              return (
                <Link key={l.href} href={l.href}>
                  <span
                    className={`relative inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer px-3 py-1.5 rounded transition-all ${
                      active
                        ? "bg-primary/10 text-primary border border-primary/25"
                        : "text-foreground/60 border border-transparent hover:bg-slate-100 hover:text-foreground"
                    }`}
                    style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
                  >
                    <span className={active ? "text-primary" : "text-foreground/40"}>
                      {navIcons[l.href]}
                    </span>
                    {l.label}
                    {(l as any).badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                        {(l as any).badge}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}

            {isSignedIn ? (
              <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 ml-1">
                <span className="text-xs font-semibold text-foreground/60 truncate max-w-[120px]" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {isAdmin
                    ? <><span className="text-primary font-bold">★</span> {(me as any)?.organizationName || "관리자"}</>
                    : ((me as any)?.organizationName || me?.name || me?.email?.split("@")[0] || "")
                  }
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-semibold text-foreground/50 border border-slate-200 px-2.5 py-1 rounded hover:bg-slate-100 hover:text-foreground transition-colors"
                  style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex gap-2 border-l border-slate-200 pl-3 ml-1">
                <Link href="/sign-in">
                  <span className="text-xs font-semibold text-foreground/60 border border-slate-200 px-3 py-1.5 rounded cursor-pointer hover:bg-slate-100 hover:text-foreground transition-colors" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                    로그인
                  </span>
                </Link>
                <Link href="/sign-up">
                  <span className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded cursor-pointer hover:bg-primary/90 transition-colors" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                    회원가입
                  </span>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 flex flex-col justify-center items-center gap-1.5 rounded border border-slate-200 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="메뉴"
          >
            <span className={`block w-4 h-0.5 bg-foreground/60 transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-4 h-0.5 bg-foreground/60 transition-all ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-4 h-0.5 bg-foreground/60 transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-slate-200 bg-white"
            >
              <div className="flex flex-col p-3 gap-1">
                {navLinks.map(l => (
                  <Link key={l.href} href={l.href}>
                    <button
                      onClick={() => setMobileOpen(false)}
                      className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded flex items-center gap-2 transition-colors relative ${
                        isActive(l.href)
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-foreground/60 hover:bg-slate-100 hover:text-foreground border border-transparent"
                      }`}
                      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
                    >
                      <span className={isActive(l.href) ? "text-primary" : "text-foreground/40"}>
                        {navIcons[l.href]}
                      </span>
                      {l.label}
                      {(l as any).badge > 0 && (
                        <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {(l as any).badge}
                        </span>
                      )}
                    </button>
                  </Link>
                ))}
                {isSignedIn ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left text-xs font-semibold px-3 py-2.5 rounded border border-slate-200 text-foreground/50 hover:bg-slate-100 transition-colors mt-1"
                    style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
                  >
                    🚪 로그아웃 ({isAdmin ? "관리자" : ((me as any)?.organizationName || me?.name || me?.email?.split("@")[0])})
                  </button>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <Link href="/sign-in" className="flex-1">
                      <button
                        onClick={() => setMobileOpen(false)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded border border-slate-200 text-foreground/60 hover:bg-slate-100"
                        style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
                      >
                        로그인
                      </button>
                    </Link>
                    <Link href="/sign-up" className="flex-1">
                      <button
                        onClick={() => setMobileOpen(false)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded bg-primary text-white hover:bg-primary/90"
                        style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
                      >
                        회원가입
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50/60 py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-3 text-center">
          <p className="font-pixel-body text-slate-400 text-xs sm:text-sm uppercase tracking-widest">
            ©(재)서울문화재단 노들섬운영팀. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

      <NPCHelper />
    </Scanlines>
  );
};
