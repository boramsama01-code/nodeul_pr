import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Link } from "wouter";
import { useListEvents, getListEventsQueryKey, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelBadge } from "@/components/pixel/PixelBadge";
import { useUIStore } from "@/store/useUIStore";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  submitted: "제출됨",
  approved: "승인됨",
  revision_requested: "수정 요청",
  rejected: "반려됨",
  completed: "완료",
};

const STATUS_VARIANTS: Record<string, "primary" | "success" | "alert" | "danger" | "secondary"> = {
  draft: "secondary",
  submitted: "primary",
  approved: "success",
  revision_requested: "alert",
  rejected: "danger",
  completed: "success",
};

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
      await fetch(`${BASE}/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
      await fetch(`${BASE}/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "approved" }),
      });
      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey({}) });
      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey({ status: statusFilter || undefined, search: search || undefined }) });
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-black pb-4">
        <div>
          <h1 className="text-3xl font-pixel text-destructive">전체 행사 관리</h1>
          <p className="font-pixel-body text-xl text-muted-foreground mt-1">홍보 신청 행사 전체 목록</p>
        </div>
        <Link href="/admin">
          <PixelButton variant="secondary" size="sm">← 대시보드</PixelButton>
        </Link>
      </div>

      {/* 필터 */}
      <PixelCard>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block font-pixel text-xs mb-2">행사명 검색</label>
            <input
              className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
              placeholder="행사명 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block font-pixel text-xs mb-2">상태 필터</label>
            <select
              className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">전체</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 완료 행사 토글 */}
        {completedCount > 0 && (
          <div className="mt-3 pt-3 border-t-2 border-black">
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <input
                type="checkbox"
                className="w-5 h-5 accent-primary"
                checked={showCompleted}
                onChange={e => setShowCompleted(e.target.checked)}
              />
              <span className="font-pixel-body text-base">
                완료된 행사 보기 ({completedCount}건)
              </span>
            </label>
          </div>
        )}
      </PixelCard>

      {/* 행사 목록 */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-pixel-bounce text-5xl">⏳</div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center p-12 font-pixel-body text-2xl text-muted-foreground">
          {showCompleted ? "행사가 없습니다." : "진행 중인 행사가 없습니다."}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div
              key={event.id}
              className={`border-4 border-black p-4 bg-white transition-colors ${event.status === "completed" ? "opacity-60" : "hover:bg-muted/20"}`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-pixel text-base">{event.title}</h3>
                    <PixelBadge variant={STATUS_VARIANTS[event.status] ?? "secondary"}>
                      {STATUS_LABELS[event.status] || event.status}
                    </PixelBadge>
                  </div>
                  <p className="font-pixel-body text-lg text-muted-foreground">
                    {event.organizationName || "-"} | {event.startDate} ~ {event.endDate}
                  </p>
                  {event.contactName && (
                    <p className="font-pixel-body text-sm text-muted-foreground">
                      담당자: {event.contactName} {event.contactEmail ? `(${event.contactEmail})` : ""}
                    </p>
                  )}
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {event.tags.map((tag, i) => (
                        <span key={i} className="font-pixel-body text-sm bg-muted px-2 py-0.5 border-2 border-black">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  <Link href={`/events/${event.id}`}>
                    <PixelButton variant="secondary" size="sm">상세보기</PixelButton>
                  </Link>
                  {event.status === "submitted" && (
                    <Link href={`/events/${event.id}`}>
                      <PixelButton variant="primary" size="sm">검토 필요!</PixelButton>
                    </Link>
                  )}
                  {event.status !== "completed" ? (
                    <button
                      onClick={() => handleComplete(event.id)}
                      disabled={completing === event.id}
                      title="완료 처리하면 목록에서 숨겨집니다"
                      className="flex items-center gap-1.5 font-pixel-body text-sm px-3 py-1.5 border-2 border-black bg-white hover:bg-success hover:text-white transition-colors disabled:opacity-50"
                    >
                      <input type="checkbox" className="w-4 h-4 pointer-events-none" readOnly checked={false} />
                      완료 처리
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestore(event.id)}
                      disabled={completing === event.id}
                      title="완료 취소하고 다시 표시"
                      className="flex items-center gap-1.5 font-pixel-body text-sm px-3 py-1.5 border-2 border-success bg-success/10 hover:bg-success hover:text-white transition-colors disabled:opacity-50"
                    >
                      <input type="checkbox" className="w-4 h-4 pointer-events-none" readOnly checked />
                      완료됨 (취소)
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="font-pixel-body text-sm text-muted-foreground text-center">
        총 {eventsData?.total || 0}건 | 표시 중 {events.length}건
        {!showCompleted && completedCount > 0 && ` (완료 ${completedCount}건 숨김)`}
      </p>
    </div>
  );
}
