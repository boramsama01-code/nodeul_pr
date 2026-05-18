import React, { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { PixelButton } from "@/components/pixel/PixelButton";
import { Link } from "wouter";

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setLocation("/dashboard");
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-sm space-y-5 text-center">
        <div>
          <div className="text-5xl mb-1">🐸</div>
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
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="font-pixel-body text-xs text-destructive border border-destructive/30 px-3 py-2 bg-red-50">
                {error}
              </p>
            )}
            <PixelButton type="submit" variant="primary" size="md" disabled={loading} className="w-full">
              {loading ? "로그인 중..." : "로그인"}
            </PixelButton>
          </form>
          <p className="mt-4 text-center font-pixel-body text-xs text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link href="/sign-up">
              <span className="text-primary underline cursor-pointer hover:text-primary/80">회원가입</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
