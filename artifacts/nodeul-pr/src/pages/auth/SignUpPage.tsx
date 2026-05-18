import React, { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { PixelButton } from "@/components/pixel/PixelButton";
import { Link } from "wouter";

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
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message || "회원가입 중 오류가 발생했습니다.");
      } else {
        setSuccess(true);
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
        <div className="w-full max-w-md text-center space-y-4">
          <div className="bg-white border-4 border-black shadow-[4px_4px_0_#000] p-8">
            <p className="text-4xl mb-4">📬</p>
            <h2 className="font-pixel text-lg text-primary mb-2">가입 완료!</h2>
            <p className="font-pixel-body text-muted-foreground mb-6">
              이메일 인증 링크를 발송했습니다.<br />이메일을 확인해 주세요.
            </p>
            <PixelButton variant="primary" size="md" onClick={() => setLocation("/sign-in")}>
              로그인 페이지로
            </PixelButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="font-pixel text-xl text-primary">노들섬 홍보 시스템</h1>
        <p className="font-pixel-body text-xl text-muted-foreground">회원가입하고 홍보 신청을 시작하세요 🐸</p>

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
                placeholder="6자 이상"
              />
            </div>
            <div>
              <label className="block font-pixel text-xs uppercase mb-2">비밀번호 확인</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
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
              {loading ? "처리 중..." : "회원가입"}
            </PixelButton>
          </form>
          <p className="mt-4 text-center font-pixel-body text-sm text-muted-foreground">
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
