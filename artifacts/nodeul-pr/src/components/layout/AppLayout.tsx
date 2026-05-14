import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useUser, useClerk } from "@clerk/react";
import { NPCHelper } from "../pixel/NPCHelper";
import { Scanlines } from "../pixel/Scanlines";
import { PixelButton } from "../pixel/PixelButton";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();

  const role = user?.publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "super_admin";

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  return (
    <Scanlines className="flex flex-col min-h-[100dvh] bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b-4 border-black bg-card pixel-border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="font-pixel text-xl tracking-tighter text-primary cursor-pointer pixel-hover-glow-sm px-2 py-1">
              NODEUL PR SYS
            </div>
          </Link>

          <nav className="hidden md:flex gap-6 items-center">
            {isSignedIn ? (
              <>
                <Link href="/dashboard">
                  <span className="font-pixel text-sm cursor-pointer hover:text-primary transition-colors">Quest Log</span>
                </Link>
                {isAdmin && (
                  <Link href="/admin">
                    <span className="font-pixel text-sm cursor-pointer hover:text-destructive transition-colors text-destructive">Admin HUD</span>
                  </Link>
                )}
                <div className="flex items-center gap-4 border-l-4 border-black pl-4">
                  <span className="font-pixel-body text-lg font-bold">{user?.firstName || user?.emailAddresses[0]?.emailAddress}</span>
                  <PixelButton variant="ghost" size="sm" onClick={handleSignOut}>Logout</PixelButton>
                </div>
              </>
            ) : (
              <div className="flex gap-4">
                <Link href="/sign-in">
                  <PixelButton variant="ghost" size="sm">Sign In</PixelButton>
                </Link>
                <Link href="/sign-up">
                  <PixelButton variant="primary" size="sm">Start Game</PixelButton>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-card py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="font-pixel-body text-muted-foreground text-sm uppercase tracking-widest">
            © 1998 NODEUL ISLAND PR DIV. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

      {/* NPC Helper */}
      <NPCHelper />
    </Scanlines>
  );
};