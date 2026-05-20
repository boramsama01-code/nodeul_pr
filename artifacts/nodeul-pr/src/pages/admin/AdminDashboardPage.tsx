import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Link } from "wouter";
import {
  useGetAdminDashboard, getGetAdminDashboardQueryKey,
  useGetMe, getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useUIStore } from "@/store/useUIStore";
import { BaekroSpeech } from "@/components/pixel/MaengkongiSpeech";

const KR: Record<string, string> = {
  draft: "초안", submitted: "제출됨", approved: "승인됨",
  revision_requested: "수정 요청", rejected: "반려됨", completed: "완료",
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
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${STATUS_CLS[status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
      {KR[status] ?? status}
    </span>
  );
}

function StatCard({ label, value, sub, urgent }: { label: string; value: number; sub?: string; urgent?: boolean }) {
  return (
    <div className={`border rounded-lg p-4 bg-white flex flex-col gap-1 ${urgent && value > 0 ? "border-amber-300 bg-amber-50/40" : "border-black/10"}`}>
      <span className="text-xs text-muted-foreground font-medium" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
      <span className={`text-3xl font-black tabular-nums ${urgent && value > 0 ? "text-amber-600" : "text-foreground"}`}>{value}</span>
      {sub && <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{sub}</span>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { isSignedIn } = useAuth();
  const { data: me, isLoading: meLoading } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } });
  const setNPCMessage = useUIStore(s => s.setNPCMessage);

  React.useEffect(() => {
    setNPCMessage("관리자 대시보드입니다. 승인 대기 건부터 처리해 주세요 🐸");
  }, [setNPCMessage]);

  const { data: dash, isLoading } = useGetAdminDashboard({
    query: { enabled: !!me, queryKey: getGetAdminDashboardQueryKey() },
  });

  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (!meLoading && me && me.role !== "admin" && me.role !== "super_admin") return <Redirect to="/dashboard" />;

  const recentEvents = dash?.recentEvents ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>관리자 대시보드</h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>노들섬 홍보 통합 관리 시스템</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/events">
            <button className="h-8 px-3 text-xs font-medium border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
              전체 행사
            </button>
          </Link>
          <Link href="/admin/calendar">
            <button className="h-8 px-3 text-xs font-medium border border-primary/40 text-primary rounded bg-primary/5 hover:bg-primary/10 transition-colors" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
              📅 일정표
            </button>
          </Link>
        </div>
      </div>

      {/* ── 백로 인사 ── */}
      {!isLoading && (
        <BaekroSpeech mood="normal">
          {(dash?.pendingApprovalCount ?? 0) > 0
            ? `승인 대기 건이 ${dash!.pendingApprovalCount}개 있습니다. 확인해 주세요! 🦢`
            : "오늘도 노들섬 홍보를 위해 함께해요! 새로운 신청이 오면 바로 알려드릴게요 🦢"}
        </BaekroSpeech>
      )}

      {/* ── 스탯 카드 ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border border-black/10 rounded-lg p-4 bg-white animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="승인 대기" value={dash?.pendingApprovalCount ?? 0} sub="검토 필요" urgent />
          <StatCard label="수정 요청" value={dash?.revisionRequestCount ?? (recentEvents.filter(e => e.status === "revision_requested").length)} sub="재제출 대기" urgent />
          <StatCard label="오늘 일정" value={dash?.todayScheduleCount ?? 0} sub="게시 예정" />
          <StatCard label="일정 충돌" value={dash?.conflictCount ?? 0} sub="확인 필요" urgent />
        </div>
      )}

      {/* ── 최근 행사 테이블 ── */}
      <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/8 bg-gray-50/60">
          <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>최근 행사</h2>
          <Link href="/admin/events">
            <span className="text-xs text-primary hover:underline cursor-pointer" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>전체 보기 →</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>불러오는 중...</div>
        ) : recentEvents.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>최근 행사가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 bg-gray-50/40">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>행사명</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>신청 기관</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>상태</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>기간</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-right" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {recentEvents.map(event => (
                  <tr key={event.id} className={`hover:bg-muted/30 transition-colors ${event.status === "submitted" ? "bg-blue-50/30" : event.status === "revision_requested" ? "bg-amber-50/20" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/events/${event.id}`}>
                        <span className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer line-clamp-1 text-sm" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                          {event.title}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                      {event.organizationName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={event.status} />
                      {event.status === "submitted" && (
                        <span className="ml-1.5 text-[0.55rem] font-bold text-blue-600 uppercase tracking-wide align-middle font-pixel">NEW</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                      {event.startDate} — {event.endDate}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/events/${event.id}`}>
                        <button className={`h-7 px-3 text-xs rounded border transition-colors ${
                          event.status === "submitted"
                            ? "bg-primary text-white border-primary hover:bg-primary/85"
                            : "bg-white text-foreground border-black/15 hover:bg-muted/60"
                        }`} style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                          {event.status === "submitted" ? "검토" : "보기"}
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

      {/* ── 빠른 링크 ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { href: "/admin/pending",   icon: "📥", label: "미승인 행사 검토", desc: "제출된 신청 확인" },
          { href: "/admin/revision", icon: "✏️", label: "수정 요청 행사",   desc: "재제출 대기 중" },
          { href: "/admin/calendar",                         icon: "📅", label: "일정 캘린더",       desc: "충돌·게시 일정 확인" },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <div className="border border-black/10 rounded-lg p-4 bg-white hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{item.label}</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{item.desc}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
