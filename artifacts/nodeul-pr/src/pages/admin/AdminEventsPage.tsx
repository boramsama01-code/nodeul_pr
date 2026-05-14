import React, { useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { Redirect, Link } from "wouter";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelBadge } from "@/components/pixel/PixelBadge";
import { useUIStore } from "@/store/useUIStore";

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
  const { user } = useUser();
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const role = user?.publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "super_admin";

  const { data: eventsData, isLoading } = useListEvents({
    status: statusFilter || undefined,
    search: search || undefined,
  }, { query: { enabled: !!isAdmin, queryKey: getListEventsQueryKey({ status: statusFilter || undefined, search: search || undefined }) } });

  React.useEffect(() => {
    setNPCMessage("전체 이벤트 목록입니다. 검토가 필요한 항목을 클릭하세요!");
  }, []);

  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (!isAdmin) return <Redirect to="/dashboard" />;

  const events = eventsData?.events || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-black pb-4">
        <div>
          <h1 className="text-3xl font-pixel text-destructive uppercase">All Events</h1>
          <p className="font-pixel-body text-xl text-muted-foreground mt-1">전체 이벤트 관리</p>
        </div>
        <Link href="/admin">
          <PixelButton variant="secondary" size="sm">← Admin HUD</PixelButton>
        </Link>
      </div>

      {/* Filters */}
      <PixelCard>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block font-pixel text-xs mb-2">검색</label>
            <input
              className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
              placeholder="이벤트명 검색..."
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
      </PixelCard>

      {/* Events List */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-pixel-bounce text-5xl">⏳</div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center p-12 font-pixel-body text-2xl text-muted-foreground">이벤트가 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div
              key={event.id}
              className="border-4 border-black p-4 bg-white hover:bg-muted/20 transition-colors"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-pixel text-base">{event.title}</h3>
                    <PixelBadge variant={STATUS_VARIANTS[event.status] ?? "secondary"}>
                      {STATUS_LABELS[event.status] || event.status}
                    </PixelBadge>
                  </div>
                  <p className="font-pixel-body text-lg text-muted-foreground">
                    {event.organizationName || "-"} | {event.startDate} ~ {event.endDate}
                  </p>
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {event.tags.map((tag, i) => (
                        <span key={i} className="font-pixel-body text-sm bg-muted px-2 py-0.5 border-2 border-black">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/events/${event.id}`}>
                    <PixelButton variant="secondary" size="sm">상세보기</PixelButton>
                  </Link>
                  {event.status === "submitted" && (
                    <Link href={`/events/${event.id}`}>
                      <PixelButton variant="primary" size="sm">검토 필요 !</PixelButton>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="font-pixel-body text-sm text-muted-foreground text-center">
        총 {eventsData?.total || 0}개 이벤트
      </p>
    </div>
  );
}
