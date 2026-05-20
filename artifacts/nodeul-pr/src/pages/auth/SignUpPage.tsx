import React, { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { PixelButton } from "@/components/pixel/PixelButton";
import { FrogBadge } from "@/components/pixel/MaengkongiSpeech";
import { Link } from "wouter";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "회원가입 중 오류가 발생했습니다.");
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setSuccess(true);
      } else {
        setLocation("/dashboard");
      }
    } catch {
      setError("회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center py-12">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="flex flex-col items-center gap-1">
            <FrogBadge label="WELCOME!" />
            <p className="font-pixel text-[10px] text-muted-foreground uppercase tracking-widest">NODEUL PR SYSTEM</p>
          </div>
          <div className="bg-white border border-black/15 p-7 shadow-sm text-left space-y-3">
            <p className="text-3xl text-center">🎉</p>
            <h2 className="font-pixel text-base text-primary text-center">가입 완료!</h2>
            <p className="font-pixel-body text-sm text-muted-foreground text-center">
              계정이 생성되었습니다.<br />로그인 페이지에서 바로 로그인해 주세요.
            </p>
            <PixelButton variant="primary" size="md" onClick={() => setLocation("/sign-in")} className="w-full">
              로그인 페이지로
            </PixelButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-sm space-y-5 text-center">
        <div className="flex flex-col items-center gap-1">
          <FrogBadge label="NEW PLAYER" />
          <p className="font-pixel text-[10px] text-muted-foreground uppercase tracking-widest">NODEUL PR SYSTEM</p>
        </div>

        <div className="bg-white border border-black/15 p-7 text-left shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-pixel text-xs uppercase mb-1.5 text-muted-foreground">이메일</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-black/20 px-3 py-2 font-pixel-body text-sm focus:outline-none focus:border-primary bg-white"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block font-pixel text-xs uppercase mb-1.5 text-muted-foreground">비밀번호</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-black/20 px-3 py-2 font-pixel-body text-sm focus:outline-none focus:border-primary bg-white"
                placeholder="6자 이상"
              />
            </div>
            <div>
              <label className="block font-pixel text-xs uppercase mb-1.5 text-muted-foreground">비밀번호 확인</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full border border-black/20 px-3 py-2 font-pixel-body text-sm focus:outline-none focus:border-primary bg-white"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="font-pixel-body text-xs text-destructive border border-destructive/30 px-3 py-2 bg-red-50">
                {error}
              </p>
            )}
            <PixelButton type="submit" variant="primary" size="md" disabled={loading} className="w-full">
              {loading ? "처리 중..." : "회원가입"}
            </PixelButton>
          </form>
          <p className="mt-4 text-center font-pixel-body text-xs text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/sign-in">
              <span className="text-primary underline cursor-pointer hover:text-primary/80">로그인</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
