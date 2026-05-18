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
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="font-pixel text-xl text-primary">노들섬 홍보 시스템</h1>
        <p className="font-pixel-body text-xl text-muted-foreground">로그인해서 홍보 신청을 시작하세요 🐸</p>

        <div className="bg-white border-4 border-black shadow-[4px_4px_0_#000] p-6 text-left">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-pixel text-xs uppercase mb-2">이메일</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border-2 border-black px-3 py-2 font-pixel-body text-base focus:outline-none focus:border-primary bg-white"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block font-pixel text-xs uppercase mb-2">비밀번호</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border-2 border-black px-3 py-2 font-pixel-body text-base focus:outline-none focus:border-primary bg-white"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="font-pixel-body text-sm text-destructive border-2 border-destructive px-3 py-2 bg-destructive/5">
                {error}
              </p>
            )}
            <PixelButton type="submit" variant="primary" size="md" disabled={loading} className="w-full">
              {loading ? "로그인 중..." : "로그인"}
            </PixelButton>
          </form>
          <p className="mt-4 text-center font-pixel-body text-sm text-muted-foreground">
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
