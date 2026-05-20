import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useUIStore } from "@/store/useUIStore";

const ROLE_KR: Record<string, string> = {
  user: "일반 사용자",
  admin: "관리자",
  super_admin: "최고 관리자",
};

const ROLE_CLS: Record<string, string> = {
  user: "bg-gray-100 text-gray-600 border-gray-200",
  admin: "bg-blue-50 text-blue-700 border-blue-200",
  super_admin: "bg-amber-50 text-amber-700 border-amber-300",
};

function RolePill({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${ROLE_CLS[role] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
      {role === "super_admin" && <span className="mr-1">★</span>}
      {ROLE_KR[role] ?? role}
    </span>
  );
}

export default function AdminUsersPage() {
  const { isSignedIn } = useAuth();
  const { data: me, isLoading: meLoading } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } });
  const setNPCMessage = useUIStore(s => s.setNPCMessage);

  const [updating, setUpdating] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [users, setUsers] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setNPCMessage("회원 목록입니다. 역할을 변경하거나 현황을 확인하세요 🐸");
  }, [setNPCMessage]);

  const isSuperAdmin = me?.role === "super_admin";
  const isAdmin = me?.role === "admin" || me?.role === "super_admin";

  const fetchUsers = useCallback(async () => {
    if (!me || !isAdmin) return;
    setIsLoading(true);
    try {
      const { data: { session } } = await import("@/lib/supabase").then(m => m.supabase.auth.getSession());
      const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";
      const res = await fetch(`${apiBase}/admin/users`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? data ?? []);
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, [me?.id, isAdmin, refreshKey]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (!meLoading && me && !isAdmin) return <Redirect to="/dashboard" />;

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!isSuperAdmin) return;
    setUpdating(userId);
    try {
      const { data: { session } } = await import("@/lib/supabase").then(m => m.supabase.auth.getSession());
      const token = session?.access_token;
      const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";
      const resp = await fetch(`${apiBase}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ role: newRole }),
      });
      if (resp.ok) {
        setRefreshKey(k => k + 1);
        setToast({ msg: "역할이 변경되었습니다.", ok: true });
      } else {
        const err = await resp.json().catch(() => ({}));
        setToast({ msg: err.error || "역할 변경에 실패했습니다.", ok: false });
      }
    } catch {
      setToast({ msg: "네트워크 오류가 발생했습니다.", ok: false });
    } finally {
      setUpdating(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>회원 관리</h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
            전체 가입 회원 목록 및 역할 관리
          </p>
        </div>
        {/* 내 계정 배지 */}
        <div className="flex items-center gap-2 bg-white border border-black/10 rounded-lg px-4 py-2 shadow-sm">
          <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>내 계정</span>
          <RolePill role={me?.role ?? "user"} />
        </div>
      </div>

      {/* 내 계정 정보 카드 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <span className="text-xl">🐸</span>
        <div>
          <p className="text-sm font-semibold text-amber-800" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
            {me?.email} 로 로그인됨
          </p>
          <p className="text-xs text-amber-700" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
            권한: <strong>{ROLE_KR[me?.role ?? "user"]}</strong>
            {isSuperAdmin && " — 모든 회원의 역할을 변경할 수 있습니다."}
          </p>
        </div>
      </div>

      {/* 토스트 */}
      {toast && (
        <div className={`px-4 py-2.5 rounded border text-sm font-medium ${toast.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`} style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
          {toast.ok ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* 사용자 테이블 */}
      <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-black/8 bg-gray-50/60">
          <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
            전체 회원 {Array.isArray(users) ? `(${users.length}명)` : ""}
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>불러오는 중...</div>
        ) : !Array.isArray(users) || users.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>가입된 회원이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 bg-gray-50/40">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>이메일</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>소속 기관</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>역할</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>가입일</th>
                  {isSuperAdmin && (
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-right" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>역할 변경</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {(users as any[]).map((u: any) => (
                  <tr key={u.id} className={`hover:bg-muted/30 transition-colors ${u.id === me?.id ? "bg-amber-50/40" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                          {u.email}
                        </span>
                        {u.id === me?.id && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">나</span>
                        )}
                      </div>
                      {u.name && (
                        <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{u.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                      {u.organizationName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <RolePill role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                      {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-right">
                        {u.id === me?.id ? (
                          <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>변경 불가</span>
                        ) : (
                          <select
                            value={u.role}
                            disabled={updating === u.id}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            className="text-xs border border-black/20 rounded px-2 py-1 bg-white cursor-pointer hover:border-primary/50 disabled:opacity-50"
                            style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
                          >
                            <option value="user">일반 사용자</option>
                            <option value="admin">관리자</option>
                            <option value="super_admin">최고 관리자</option>
                          </select>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
