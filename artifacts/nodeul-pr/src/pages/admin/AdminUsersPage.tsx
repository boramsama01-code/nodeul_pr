import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useUIStore } from "@/store/useUIStore";

const KR = { fontFamily: "'Noto Sans KR', sans-serif" };

const ROLE_KR: Record<string, string> = {
  user: "일반 사용자",
  admin: "관리자",
  super_admin: "최고 관리자",
};

const ROLE_CLS: Record<string, string> = {
  user: "bg-slate-100 text-slate-600 border-slate-200",
  admin: "bg-blue-50 text-blue-700 border-blue-200",
  super_admin: "bg-amber-50 text-amber-700 border-amber-300",
};

function RolePill({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${ROLE_CLS[role] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {role === "super_admin" && <span className="mr-1">★</span>}
      {ROLE_KR[role] ?? role}
    </span>
  );
}

function getMonthsOld(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
}

async function getApiBase() {
  return import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";
}
async function getToken() {
  const { data: { session } } = await import("@/lib/supabase").then(m => m.supabase.auth.getSession());
  return session?.access_token ?? null;
}

export default function AdminUsersPage() {
  const { isSignedIn } = useAuth();
  const { data: me, isLoading: meLoading } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } });
  const setNPCMessage = useUIStore(s => s.setNPCMessage);

  const [users, setUsers] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updating, setUpdating] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const isSuperAdmin = me?.role === "super_admin";
  const isAdmin = me?.role === "admin" || me?.role === "super_admin";

  useEffect(() => {
    setNPCMessage("회원 목록입니다. 역할을 변경하거나 11개월 이상 된 계정을 관리하세요 🐸");
  }, [setNPCMessage]);

  const fetchUsers = useCallback(async () => {
    if (!me || !isAdmin) return;
    setIsLoading(true);
    try {
      const [apiBase, token] = await Promise.all([getApiBase(), getToken()]);
      const res = await fetch(`${apiBase}/admin/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!isSuperAdmin) return;
    setUpdating(userId);
    try {
      const [apiBase, token] = await Promise.all([getApiBase(), getToken()]);
      const resp = await fetch(`${apiBase}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ role: newRole }),
      });
      if (resp.ok) {
        setRefreshKey(k => k + 1);
        showToast("역할이 변경되었습니다.", true);
      } else {
        const err = await resp.json().catch(() => ({}));
        showToast((err as any).error || "역할 변경에 실패했습니다.", false);
      }
    } catch {
      showToast("네트워크 오류가 발생했습니다.", false);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUsers = async (ids: number[]) => {
    if (ids.length === 0) return;
    const label = `${ids.length}명의 회원`;
    if (!confirm(`${label}을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    try {
      const [apiBase, token] = await Promise.all([getApiBase(), getToken()]);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      let resp: Response;
      if (ids.length === 1) {
        resp = await fetch(`${apiBase}/admin/users/${ids[0]}`, { method: "DELETE", headers });
      } else {
        resp = await fetch(`${apiBase}/admin/users/bulk`, { method: "DELETE", headers, body: JSON.stringify({ userIds: ids }) });
      }
      if (resp.ok) {
        setSelectedIds(new Set());
        setRefreshKey(k => k + 1);
        showToast(`${label}이 삭제되었습니다.`, true);
      } else {
        const err = await resp.json().catch(() => ({}));
        showToast((err as any).error || "삭제에 실패했습니다.", false);
      }
    } catch {
      showToast("네트워크 오류가 발생했습니다.", false);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!Array.isArray(users)) return;
    const selectableIds = users.filter(u => u.id !== me?.id).map(u => u.id as number);
    if (selectedIds.size === selectableIds.length && selectableIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const userList: any[] = Array.isArray(users) ? users : [];
  const oldUsers = userList.filter(u => getMonthsOld(u.createdAt) >= 11 && u.id !== me?.id);

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={KR}>회원 관리</h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={KR}>
            전체 가입 회원 목록 및 역할·삭제 관리
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {oldUsers.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <span className="text-xs font-bold text-red-700" style={KR}>⚠ 만료 임박</span>
              <span className="text-xs font-black text-red-700">{oldUsers.length}명</span>
              <span className="text-xs text-red-600/70" style={KR}>(11개월+)</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-white border border-black/10 rounded-lg px-4 py-2">
            <span className="text-xs text-muted-foreground" style={KR}>내 권한</span>
            <RolePill role={me?.role ?? "user"} />
          </div>
        </div>
      </div>

      {/* 내 계정 정보 */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <span className="text-xl">🐸</span>
        <p className="text-sm font-semibold text-amber-800" style={KR}>
          {me?.email} 로 로그인 중
          {isSuperAdmin && " — 모든 회원의 역할을 변경하고 삭제할 수 있습니다."}
        </p>
      </div>

      {/* 토스트 */}
      {toast && (
        <div
          className={`px-4 py-2.5 rounded border text-sm font-medium ${toast.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}
          style={KR}
        >
          {toast.ok ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* 일괄 삭제 도구바 */}
      {isSuperAdmin && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          <span className="text-sm font-semibold text-red-800" style={KR}>{selectedIds.size}명 선택됨</span>
          <button
            onClick={() => handleDeleteUsers([...selectedIds])}
            disabled={deleting}
            className="h-7 px-3 text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
            style={KR}
          >
            {deleting ? "삭제 중..." : "선택 삭제"}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="h-7 px-3 text-xs border border-red-300 text-red-600 rounded bg-white hover:bg-red-50 transition-colors"
            style={KR}
          >
            취소
          </button>
        </div>
      )}

      {/* 사용자 테이블 */}
      <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-black/8 bg-gray-50/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground" style={KR}>
            전체 회원 {userList.length > 0 ? `(${userList.length}명)` : ""}
          </h2>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded transition-colors text-sm"
            title="새로고침"
          >
            ↻
          </button>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2" style={KR}>
            <div className="w-4 h-4 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
            불러오는 중...
          </div>
        ) : userList.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground" style={KR}>가입된 회원이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 bg-gray-50/40">
                  {isSuperAdmin && (
                    <th className="px-3 py-2.5 w-10">
                      <input
                        type="checkbox"
                        className="accent-primary cursor-pointer"
                        checked={
                          selectedIds.size > 0 &&
                          selectedIds.size === userList.filter(u => u.id !== me?.id).length
                        }
                        onChange={toggleAll}
                        title="전체 선택"
                      />
                    </th>
                  )}
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground" style={KR}>이름 / 이메일</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell" style={KR}>소속 기관</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell" style={KR}>등록 행사</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground" style={KR}>역할</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden lg:table-cell" style={KR}>가입일</th>
                  {isSuperAdmin && (
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-right" style={KR}>역할 변경 / 삭제</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {userList.map((u: any) => {
                  const monthsOld = getMonthsOld(u.createdAt);
                  const isOld = monthsOld >= 11;
                  const isMe = u.id === me?.id;
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isOld && !isMe
                          ? "bg-red-50/40 hover:bg-red-50/70"
                          : isMe
                            ? "bg-amber-50/40 hover:bg-amber-50/70"
                            : "hover:bg-muted/20"
                      }`}
                    >
                      {isSuperAdmin && (
                        <td className="px-3 py-3 text-center">
                          {!isMe ? (
                            <input
                              type="checkbox"
                              className="accent-primary cursor-pointer"
                              checked={selectedIds.has(u.id)}
                              onChange={() => toggleSelect(u.id)}
                            />
                          ) : (
                            <span className="text-amber-500 text-xs font-bold">나</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground text-sm" style={KR}>
                            {u.name || "—"}
                          </span>
                          {isMe && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">나</span>
                          )}
                          {isOld && !isMe && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">만료임박</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5" style={KR}>{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell" style={KR}>
                        {u.organizationName ?? "—"}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {(u.eventCount ?? 0) > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded border border-primary/20" style={KR}>
                            {u.eventCount}건
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50" style={KR}>0건</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <RolePill role={u.role} />
                      </td>
                      <td className="px-4 py-3 text-xs hidden lg:table-cell">
                        <div className={isOld && !isMe ? "text-red-600 font-semibold" : "text-muted-foreground"} style={KR}>
                          {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                        </div>
                        {isOld && !isMe && (
                          <div className="text-[10px] text-red-500 mt-0.5" style={KR}>{monthsOld}개월째</div>
                        )}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-right">
                          {isMe ? (
                            <span className="text-xs text-muted-foreground/60" style={KR}>변경 불가</span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <select
                                value={u.role}
                                disabled={updating === u.id}
                                onChange={e => handleRoleChange(u.id, e.target.value)}
                                className="text-xs border border-black/20 rounded px-2 py-1 bg-white cursor-pointer hover:border-primary/50 disabled:opacity-50 transition-colors"
                                style={KR}
                              >
                                <option value="user">일반 사용자</option>
                                <option value="admin">관리자</option>
                                <option value="super_admin">최고 관리자</option>
                              </select>
                              <button
                                onClick={() => handleDeleteUsers([u.id])}
                                disabled={deleting || updating !== null}
                                className="h-6 px-2 text-xs font-medium border border-red-200 text-red-600 rounded bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-40"
                                style={KR}
                                title="삭제"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
