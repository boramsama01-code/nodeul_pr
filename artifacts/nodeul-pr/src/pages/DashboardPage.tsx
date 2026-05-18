import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Link } from "wouter";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import { useUIStore } from "@/store/useUIStore";
import { MaengkongiSpeech, QuestProgress, MissionBanner } from "@/components/pixel/MaengkongiSpeech";

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

  const { data: eventData, isLoading } = useListEvents({}, {
    query: { enabled: !!isSignedIn, queryKey: getListEventsQueryKey({}) },
  });

  const events = eventData?.events ?? [];

  React.useEffect(() => {
    const draftCount = events.filter(e => e.status === "draft").length;
    if (!isLoading && draftCount > 0) {
      setNPCMessage(`초안 행사가 ${draftCount}건이에요! 제출하지 않으면 처리되지 않아요. 빨리 제출해 주세요 🐸`);
    } else {
      setNPCMessage("내 홍보 신청 목록이에요. 새 행사를 신청하거나 진행 현황을 확인하세요 🐸");
    }
  }, [events.length, isLoading, setNPCMessage]);

  if (!isSignedIn) return <Redirect to="/sign-in" />;

  const pending = events.filter(e => e.status === "submitted" || e.status === "revision_requested").length;

  const revisionCount = events.filter(e => e.status === "revision_requested").length;
  const approvedCount = events.filter(e => e.status === "approved" || e.status === "completed").length;
  const questStep = events.length === 0 ? 1 : 2;
  const completedQuestSteps = events.length > 0 ? [1] : [];

  const froggMsg = events.length === 0
    ? "아직 행사 신청이 없어요! 아래 버튼으로 첫 번째 퀘스트를 시작해 보세요 🐸"
    : revisionCount > 0
      ? `⚠️ 수정 요청된 행사가 ${revisionCount}건이에요. 빨리 수정해서 다음 단계로 넘어가요!`
      : approvedCount > 0
        ? `🎉 승인된 행사가 ${approvedCount}건이에요! 홍보가 잘 진행되고 있어요.`
        : `총 ${events.length}건의 행사가 진행 중이에요. 진행 현황을 확인해 보세요!`;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* 미션 배너 */}
      <MissionBanner step="02" title="QUEST LOG — 내 홍보 신청" subtitle="행사별 홍보 진행 현황을 확인하고 다음 단계를 완료하세요" />

      {/* 퀘스트 진행도 */}
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
        <div className="text-[9px] font-pixel text-slate-400 uppercase tracking-widest mb-2">PROGRESS</div>
        <QuestProgress currentStep={questStep} completedSteps={completedQuestSteps} />
      </div>

      {/* 맹꽁이 말풍선 */}
      <MaengkongiSpeech mood={revisionCount > 0 ? "alert" : approvedCount > 0 ? "cheer" : "normal"} label="맹꽁이">
        {froggMsg}
      </MaengkongiSpeech>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground" style={KR}>신청 목록</h1>
          {events.length > 0 && (
            <div className="flex gap-3 flex-wrap mt-0.5">
              <span className="text-xs text-slate-400" style={KR}>전체 {events.length}건</span>
              {pending > 0 && <span className="text-xs text-amber-600 font-medium" style={KR}>⚠ 대기 {pending}건</span>}
              {approvedCount > 0 && <span className="text-xs text-emerald-600 font-medium" style={KR}>✓ 승인 {approvedCount}건</span>}
            </div>
          )}
        </div>
        <Link href="/events/new">
          <button className="h-8 px-3 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 transition-colors" style={KR}>
            + 새 행사 신청
          </button>
        </Link>
      </div>

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
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center">
              <svg viewBox="0 0 32 32" width="64" height="64" style={{ imageRendering: "pixelated" }}>
                <rect x="3" y="2" width="8" height="7" fill="#22c55e"/>
                <rect x="21" y="2" width="8" height="7" fill="#22c55e"/>
                <rect x="2" y="7" width="28" height="13" fill="#22c55e"/>
                <rect x="7" y="18" width="18" height="10" fill="#22c55e"/>
                <rect x="2" y="18" width="6" height="5" fill="#22c55e"/>
                <rect x="24" y="18" width="6" height="5" fill="#22c55e"/>
                <rect x="0" y="23" width="9" height="4" fill="#16a34a"/>
                <rect x="23" y="23" width="9" height="4" fill="#16a34a"/>
                <rect x="4" y="3" width="5" height="5" fill="#dcfce7"/>
                <rect x="23" y="3" width="5" height="5" fill="#dcfce7"/>
                <rect x="6" y="5" width="2" height="2" fill="#1e293b"/>
                <rect x="24" y="5" width="2" height="2" fill="#1e293b"/>
                <rect x="9" y="13" width="14" height="5" fill="#86efac"/>
                <rect x="11" y="15" width="2" height="2" fill="#16a34a"/>
                <rect x="19" y="15" width="2" height="2" fill="#16a34a"/>
                <rect x="13" y="16" width="6" height="1" fill="#16a34a"/>
              </svg>
            </div>
            <div className="space-y-1">
              <p className="font-pixel text-xs text-primary uppercase tracking-widest">READY TO START?</p>
              <p className="text-sm text-muted-foreground" style={KR}>아직 신청한 행사가 없어요. 첫 번째 퀘스트를 시작해 보세요!</p>
            </div>
            <Link href="/events/new">
              <button className="h-9 px-5 text-xs font-semibold bg-primary text-white rounded hover:bg-primary/85 transition-colors" style={KR}>
                🚀 새 행사 신청하기
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
