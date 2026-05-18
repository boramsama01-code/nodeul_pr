import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Link } from "wouter";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import { useUIStore } from "@/store/useUIStore";

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  submitted: "제출됨",
  approved: "승인됨",
  revision_requested: "수정 요청",
  rejected: "반려됨",
  completed: "완료",
};
const STATUS_CLS: Record<string, string> = {
  draft:              "bg-zinc-100 text-zinc-500 border-zinc-200",
  submitted:          "bg-blue-50 text-blue-700 border-blue-200",
  approved:           "bg-emerald-50 text-emerald-700 border-emerald-200",
  revision_requested: "bg-amber-50 text-amber-700 border-amber-200",
  rejected:           "bg-red-50 text-red-700 border-red-200",
  completed:          "bg-zinc-100 text-zinc-400 border-zinc-200",
};

const KR = { fontFamily: "'Noto Sans KR', sans-serif" };

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${STATUS_CLS[status] ?? "bg-zinc-100 text-zinc-500 border-zinc-200"}`} style={KR}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function DashboardPage() {
  const { isSignedIn } = useAuth();
  const setNPCMessage = useUIStore(s => s.setNPCMessage);

  React.useEffect(() => {
    setNPCMessage("내 홍보 신청 목록이에요! 새 행사를 신청하거나 진행 현황을 확인해 보세요 🐸");
  }, [setNPCMessage]);

  const { data: eventData, isLoading } = useListEvents({}, {
    query: { enabled: !!isSignedIn, queryKey: getListEventsQueryKey({}) },
  });

  if (!isSignedIn) return <Redirect to="/sign-in" />;

  const events = eventData?.events ?? [];
  const pending = events.filter(e => e.status === "submitted" || e.status === "revision_requested").length;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={KR}>내 홍보 신청 목록</h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={KR}>노들섬 홍보 신청 및 진행 현황</p>
        </div>
        <Link href="/events/new">
          <button className="h-8 px-3 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 transition-colors" style={KR}>
            + 새 행사 신청
          </button>
        </Link>
      </div>

      {/* 요약 배지 */}
      {events.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground" style={KR}>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            전체 {events.length}건
          </div>
          {pending > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600" style={KR}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              처리 대기 {pending}건
            </div>
          )}
        </div>
      )}

      {/* 테이블 */}
      <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-black/8 bg-zinc-50/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground" style={KR}>신청 목록</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-12">
            <div className="w-4 h-4 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground" style={KR}>불러오는 중...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-14 space-y-3">
            <p className="text-sm text-muted-foreground" style={KR}>신청 내역이 없습니다.</p>
            <Link href="/events/new">
              <button className="h-8 px-4 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 transition-colors" style={KR}>
                첫 행사 신청하기 →
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 bg-zinc-50/40">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground" style={KR}>행사명</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground" style={KR}>상태</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell" style={KR}>기간</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell" style={KR}>장소</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-right" style={KR}>액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {events.map(event => (
                  <tr key={event.id}
                    className={`hover:bg-muted/30 transition-colors ${event.status === "revision_requested" ? "bg-amber-50/20" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/events/${event.id}`}>
                        <span className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer line-clamp-1" style={KR}>
                          {event.title}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={event.status} />
                      {event.status === "revision_requested" && (
                        <span className="ml-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-wide">ACTION</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap" style={KR}>
                      {event.startDate} ~ {event.endDate}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell truncate max-w-[140px]" style={KR}>
                      {(event as any).venue || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/events/${event.id}`}>
                        <button className={`h-7 px-3 text-xs rounded border transition-colors ${
                          event.status === "revision_requested"
                            ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
                            : "bg-white text-foreground border-black/15 hover:bg-muted/60"
                        }`} style={KR}>
                          {event.status === "revision_requested" ? "수정" : "보기"}
                        </button>
                      </Link>
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
