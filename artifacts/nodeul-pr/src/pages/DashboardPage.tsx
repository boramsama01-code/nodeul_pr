import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";

import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelBadge } from "@/components/pixel/PixelBadge";
import { Link } from "wouter";
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

export default function DashboardPage() {
  const { isSignedIn } = useAuth();
  const setNPCMessage = useUIStore(state => state.setNPCMessage);

  React.useEffect(() => {
    setNPCMessage("내 홍보 신청 목록이에요! 새 행사를 신청하거나 진행 현황을 확인해 보세요 🐸");
  }, [setNPCMessage]);

  const { data: eventData, isLoading } = useListEvents({}, { query: { enabled: !!isSignedIn, queryKey: getListEventsQueryKey({}) } });

  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }

  const events = eventData?.events || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-pixel text-primary">내 홍보 신청 목록</h1>
        <Link href="/events/new">
          <PixelButton variant="primary" size="md">+ 새 행사 신청</PixelButton>
        </Link>
      </div>

      <PixelCard variant="default" className="bg-white">
        <h2 className="text-xl font-pixel mb-6 border-b-4 border-black pb-2">진행 중인 신청</h2>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-pixel-bounce text-4xl">⏳</div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center p-12 space-y-4">
            <p className="text-2xl font-pixel-body text-muted-foreground">신청 내역이 없습니다.</p>
            <p className="text-lg font-pixel-body text-muted-foreground">위 버튼을 눌러 새 행사 홍보를 신청해 보세요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border-4 border-black p-4 bg-background hover:bg-muted/20 transition-colors pixel-hover-glow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-pixel text-lg">{event.title}</h3>
                    <PixelBadge variant={STATUS_VARIANTS[event.status] ?? "secondary"}>
                      {STATUS_LABELS[event.status] || event.status}
                    </PixelBadge>
                  </div>
                  <p className="font-pixel-body text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString("ko-KR")} ~ {new Date(event.endDate).toLocaleDateString("ko-KR")}
                  </p>
                </div>

                <Link href={`/events/${event.id}`}>
                  <PixelButton variant="secondary" size="sm">상세보기</PixelButton>
                </Link>
              </div>
            ))}
          </div>
        )}
      </PixelCard>
    </div>
  );
}
