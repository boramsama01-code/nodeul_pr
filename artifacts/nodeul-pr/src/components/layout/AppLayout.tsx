import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useClerk } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { NPCHelper } from "../pixel/NPCHelper";
import { Scanlines } from "../pixel/Scanlines";
import { PixelButton } from "../pixel/PixelButton";
import { AnimatePresence, motion } from "framer-motion";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: me } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } });
  const role = me?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
    setMobileOpen(false);
  };

  const navLinks = isSignedIn
    ? [
        { href: "/dashboard", label: "내 신청 목록", icon: "📋" },
        ...(isAdmin ? [
          { href: "/admin", label: "관리자 대시보드", icon: "👾", admin: true },
          { href: "/admin/calendar", label: "일정표", icon: "📅", admin: true },
          { href: "/admin/settings", label: "설정", icon: "⚙️", admin: true },
        ] : []),
      ]
    : [];

  return (
    <Scanlines className="flex flex-col min-h-[100dvh] bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b-4 border-black bg-card">
        <div className="max-w-6xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
          <Link href="/">
            <div className="font-pixel text-sm sm:text-base tracking-tight text-primary cursor-pointer hover:text-primary/80 transition-colors whitespace-nowrap">
              NODEUL PR SYS
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-4 items-center flex-1 justify-end">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}>
                <span className={`font-pixel text-xs cursor-pointer hover:underline transition-colors ${l.admin ? "text-destructive" : ""}`}>
                  {l.label}
                </span>
              </Link>
            ))}
            {isSignedIn ? (
              <div className="flex items-center gap-3 border-l-4 border-black pl-3 ml-1">
                <span className="font-pixel-body text-base font-bold truncate max-w-[120px]">
                  {me?.name || me?.email?.split("@")[0] || ""}
                  {isAdmin && <span className="text-destructive ml-1 text-xs">★</span>}
                </span>
                <PixelButton variant="ghost" size="sm" onClick={handleSignOut}>로그아웃</PixelButton>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/sign-in"><PixelButton variant="ghost" size="sm">로그인</PixelButton></Link>
                <Link href="/sign-up"><PixelButton variant="primary" size="sm">회원가입</PixelButton></Link>
              </div>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-10 h-10 flex flex-col justify-center items-center gap-1.5 border-4 border-black bg-white hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="메뉴"
          >
            <span className={`block w-5 h-0.5 bg-black transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-black transition-all ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-black transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
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
              className="md:hidden overflow-hidden border-t-4 border-black bg-card"
            >
              <div className="flex flex-col p-3 gap-1">
                {navLinks.map(l => (
                  <Link key={l.href} href={l.href}>
                    <button
                      onClick={() => setMobileOpen(false)}
                      className={`w-full text-left font-pixel text-xs px-3 py-3 border-2 border-black hover:bg-primary hover:text-white transition-colors ${l.admin ? "text-destructive border-destructive" : ""}`}
                    >
                      {l.icon} {l.label}
                    </button>
                  </Link>
                ))}
                {isSignedIn ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left font-pixel text-xs px-3 py-3 border-2 border-black hover:bg-destructive hover:text-white transition-colors mt-1"
                  >
                    🚪 로그아웃 ({me?.name || me?.email?.split("@")[0]})
                  </button>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <Link href="/sign-in" className="flex-1">
                      <button onClick={() => setMobileOpen(false)} className="w-full font-pixel text-xs px-3 py-3 border-2 border-black hover:bg-muted">로그인</button>
                    </Link>
                    <Link href="/sign-up" className="flex-1">
                      <button onClick={() => setMobileOpen(false)} className="w-full font-pixel text-xs px-3 py-3 border-2 border-black bg-primary text-white hover:bg-primary/80">회원가입</button>
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
      <footer className="border-t-4 border-black bg-card py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-3 text-center">
          <p className="font-pixel-body text-muted-foreground text-xs sm:text-sm uppercase tracking-widest">
            © 노들섬 홍보팀. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

      <NPCHelper />
    </Scanlines>
  );
};
