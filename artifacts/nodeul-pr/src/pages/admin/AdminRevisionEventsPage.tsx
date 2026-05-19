import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Link } from "wouter";
import { useListEvents, getListEventsQueryKey, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/store/useUIStore";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const KR = { fontFamily: "'Noto Sans KR', sans-serif" };

export default function AdminRevisionEventsPage() {
  const { isSignedIn } = useAuth();
  const { data: me } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } });
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<number | null>(null);

  const isAdmin = me?.role === "admin" || me?.role === "super_admin";

  const { data: eventsData, isLoading } = useListEvents(
    { status: "revision_requested", search: search || undefined },
    { query: { enabled: !!isAdmin, queryKey: getListEventsQueryKey({ status: "revision_requested", search: search || undefined }) } }
  );

  React.useEffect(() => {
    setNPCMessage("수정 요청 행사 목록입니다. 재제출 대기 중인 행사를 확인하세요 🐸");
  }, []);

  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (me && !isAdmin) return <Redirect to="/dashboard" />;

  const events = eventsData?.events ?? [];

  const handleApprove = async (id: number) => {
    setActing(id);
    try {
      const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
      await fetch(`${BASE}/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ status: "approved" }),
      });
      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey({ status: "revision_requested" }) });
    } finally { setActing(null); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-black/8">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-bold text-foreground" style={KR}>수정 요청 행사</h1>
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border bg-amber-50 text-amber-700 border-amber-200" style={KR}>
              status = revision_requested
            </span>
          </div>
          <p className="text-xs text-muted-foreground" style={KR}>
            수정 요청(revision_requested) 상태 행사만 표시 — 재제출 대기 {eventsData?.total ?? 0}건
          </p>
        </div>
      </div>

      <div>
        <input
          className="w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary transition-colors"
          style={KR}
          placeholder="행사명 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2">
          <div className="w-4 h-4 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground" style={KR}>불러오는 중...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-sm font-semibold text-emerald-700" style={KR}>수정 요청 행사가 없습니다</p>
          <p className="text-xs text-muted-foreground mt-1" style={KR}>재제출 대기 중인 행사가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="border border-amber-300 bg-amber-50/30 rounded-lg p-4">
              <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded border border-amber-200 uppercase tracking-wide" style={KR}>재제출 대기</span>
                    <Link href={`/events/${event.id}`}>
                      <span className="font-semibold text-sm hover:text-primary hover:underline cursor-pointer" style={KR}>{event.title}</span>
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground" style={KR}>
                    {event.organizationName ?? "—"} | {event.startDate} ~ {event.endDate}
                  </p>
                  {event.adminNote && (
                    <div className="mt-1 text-xs text-amber-800 bg-amber-100 border border-amber-200 rounded px-2 py-1.5" style={KR}>
                      <span className="font-medium">수정 요청 내용:</span> {event.adminNote}
                    </div>
                  )}
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {event.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded" style={KR}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <Link href={`/events/${event.id}`}>
                    <button className="h-8 px-3 text-xs font-medium border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors" style={KR}>상세보기</button>
                  </Link>
                  <button
                    onClick={() => handleApprove(event.id)}
                    disabled={acting === event.id}
                    className="h-8 px-3 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    style={KR}
                  >
                    {acting === event.id ? "처리 중..." : "✓ 재검토 후 승인"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
