import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Link } from "wouter";
import { useListEvents, getListEventsQueryKey, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/store/useUIStore";
import { BaekroSpeech } from "@/components/pixel/MaengkongiSpeech";
import { supabase } from "@/lib/supabase";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const KR = { fontFamily: "'Noto Sans KR', sans-serif" };

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  submitted: "제출됨",
  approved: "승인됨",
  revision_requested: "수정 요청",
  rejected: "반려됨",
  completed: "완료",
};

const STATUS_CLS: Record<string, string> = {
  draft:              "bg-gray-100 text-gray-500 border-gray-200",
  submitted:          "bg-blue-50 text-blue-700 border-blue-200",
  approved:           "bg-emerald-50 text-emerald-700 border-emerald-200",
  revision_requested: "bg-amber-50 text-amber-700 border-amber-200",
  rejected:           "bg-red-50 text-red-700 border-red-200",
  completed:          "bg-gray-100 text-gray-400 border-gray-200",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${STATUS_CLS[status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`} style={KR}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function AdminEventsPage() {
  const { isSignedIn } = useAuth();
  const { data: me } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } });
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [completing, setCompleting] = useState<number | null>(null);

  const isAdmin = me?.role === "admin" || me?.role === "super_admin";

  const { data: eventsData, isLoading } = useListEvents(
    { status: statusFilter || undefined, search: search || undefined },
    { query: { enabled: !!isAdmin, queryKey: getListEventsQueryKey({ status: statusFilter || undefined, search: search || undefined }) } }
  );

  React.useEffect(() => {
    setNPCMessage("전체 행사 목록입니다. 검토가 필요한 항목을 클릭하세요!");
  }, []);

  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (me && !isAdmin) return <Redirect to="/dashboard" />;

  const allEvents = eventsData?.events || [];
  const events = showCompleted
    ? allEvents
    : allEvents.filter(e => e.status !== "completed");

  const completedCount = allEvents.filter(e => e.status === "completed").length;

  const handleComplete = async (eventId: number) => {
    if (!confirm("이 행사를 완료 처리하면 목록에서 숨겨집니다. 계속하시겠습니까?")) return;
    setCompleting(eventId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${BASE}/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ status: "completed" }),
      });
      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey({}) });
      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey({ status: statusFilter || undefined, search: search || undefined }) });
    } catch {
      alert("완료 처리에 실패했습니다.");
    } finally {
      setCompleting(null);
    }
  };

  const handleRestore = async (eventId: number) => {
    setCompleting(eventId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${BASE}/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ status: "approved" }),
      });
      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey({}) });
      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey({ status: statusFilter || undefined, search: search || undefined }) });
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between pb-4 border-b border-black/8">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={KR}>전체 행사 관리</h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={KR}>
            홍보 신청 행사 전체 목록 — 총 {eventsData?.total ?? 0}건
            {!showCompleted && completedCount > 0 && ` (완료 ${completedCount}건 숨김)`}
          </p>
        </div>
        <Link href="/admin">
          <button className="h-8 px-3 text-xs border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors" style={KR}>
            ← 대시보드
          </button>
        </Link>
      </div>

      {/* ── 백로 도우미 ── */}
      <BaekroSpeech mood="normal">
        전체 행사 목록입니다. 상태 필터로 원하는 행사를 빠르게 찾을 수 있어요.
        <span className="text-amber-700 font-semibold"> 제출됨</span> 상태 행사는 검토가 필요합니다!
        완료 처리한 행사는 기본적으로 목록에서 숨겨져요.
      </BaekroSpeech>

      {/* ── 검색 · 필터 ── */}
      <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-black/8 bg-gray-50/60">
          <h2 className="text-sm font-semibold text-foreground" style={KR}>검색 및 필터</h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                className="w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                style={KR}
                placeholder="행사명 검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-44">
              <select
                className="w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                style={KR}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">전체 상태</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          {completedCount > 0 && (
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                className="accent-primary"
                checked={showCompleted}
                onChange={e => setShowCompleted(e.target.checked)}
              />
              <span className="text-xs text-muted-foreground" style={KR}>
                완료된 행사 포함하여 보기 ({completedCount}건)
              </span>
            </label>
          )}
        </div>
      </div>

      {/* ── 행사 목록 ── */}
      <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-black/8 bg-gray-50/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground" style={KR}>행사 목록</h2>
          <span className="text-xs text-muted-foreground" style={KR}>표시 중 {events.length}건</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2">
            <div className="w-4 h-4 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground" style={KR}>불러오는 중...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm font-semibold text-muted-foreground" style={KR}>
              {statusFilter ? `'${STATUS_LABELS[statusFilter]}' 상태의 행사가 없습니다` : "행사가 없습니다"}
            </p>
            <p className="text-xs text-muted-foreground mt-1" style={KR}>
              {search ? `'${search}' 검색 결과가 없습니다.` : "필터를 변경해 보세요."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 bg-gray-50/40">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground" style={KR}>행사명</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell" style={KR}>신청 기관</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground" style={KR}>상태</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell" style={KR}>기간</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-right" style={KR}>액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {events.map(event => (
                  <tr
                    key={event.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      event.status === "submitted" ? "bg-blue-50/30" :
                      event.status === "revision_requested" ? "bg-amber-50/20" :
                      event.status === "completed" ? "opacity-55" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/events/${event.id}`}>
                        <span className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer line-clamp-1" style={KR}>
                          {event.title}
                        </span>
                      </Link>
                      {event.contactName && (
                        <p className="text-xs text-muted-foreground mt-0.5 hidden lg:block" style={KR}>
                          담당: {event.contactName}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell" style={KR}>
                      {event.organizationName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={event.status} />
                      {event.status === "submitted" && (
                        <span className="ml-1.5 text-[0.55rem] font-bold text-blue-600 uppercase tracking-wide align-middle font-pixel">NEW</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap" style={KR}>
                      {event.startDate} — {event.endDate}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <Link href={`/events/${event.id}`}>
                          <button
                            className={`h-7 px-3 text-xs rounded border transition-colors ${
                              event.status === "submitted"
                                ? "bg-primary text-white border-primary hover:bg-primary/85"
                                : "bg-white text-foreground border-black/15 hover:bg-muted/60"
                            }`}
                            style={KR}
                          >
                            {event.status === "submitted" ? "검토" : "보기"}
                          </button>
                        </Link>
                        {event.status !== "completed" ? (
                          <button
                            onClick={() => handleComplete(event.id)}
                            disabled={completing === event.id}
                            title="완료 처리하면 목록에서 숨겨집니다"
                            className="h-7 px-2.5 text-xs rounded border border-black/15 bg-white text-muted-foreground hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                            style={KR}
                          >
                            {completing === event.id ? "..." : "완료"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestore(event.id)}
                            disabled={completing === event.id}
                            title="완료 취소하고 다시 표시"
                            className="h-7 px-2.5 text-xs rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-40"
                            style={KR}
                          >
                            {completing === event.id ? "..." : "완료 취소"}
                          </button>
                        )}
                      </div>
                    </td>
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
