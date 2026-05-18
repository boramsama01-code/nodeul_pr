import React from "react";
import { useAuth } from "@clerk/react";
import { Redirect } from "wouter";
import { useGetAdminDashboard, getGetAdminDashboardQueryKey, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelBadge } from "@/components/pixel/PixelBadge";
import { PixelButton } from "@/components/pixel/PixelButton";
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

export default function AdminDashboardPage() {
  const { isSignedIn } = useAuth();
  const { data: me, isLoading: meLoading } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } });
  const setNPCMessage = useUIStore(state => state.setNPCMessage);

  React.useEffect(() => {
    setNPCMessage("관리자 대시보드에 오셨군요! 홍보 신청 현황과 일정을 확인하세요. 궁금한 점을 채팅으로 물어보셔도 됩니다 🐸");
  }, [setNPCMessage]);

  const { data: dashboard, isLoading } = useGetAdminDashboard({ query: { enabled: !!me, queryKey: getGetAdminDashboardQueryKey() } });

  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (!meLoading && me && me.role !== "admin" && me.role !== "super_admin") return <Redirect to="/dashboard" />;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end border-b-4 border-black pb-4">
        <div>
          <h1 className="text-4xl font-pixel text-destructive">관리자 대시보드</h1>
          <p className="font-pixel-body text-xl text-muted-foreground mt-2">노들섬 홍보 통합 관리 시스템</p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/events"><PixelButton variant="secondary">전체 행사</PixelButton></Link>
          <Link href="/admin/calendar"><PixelButton variant="accent">일정표</PixelButton></Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-pixel-bounce text-4xl">⏳</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PixelCard variant="alert" className="flex flex-col items-center justify-center p-6 space-y-2">
            <span className="font-pixel-body text-xl">승인 대기</span>
            <span className="font-pixel text-5xl">{dashboard?.pendingApprovalCount || 0}</span>
            {(dashboard?.pendingApprovalCount || 0) > 0 && <span className="animate-pulse text-yellow-300 font-pixel mt-2">! 처리 필요 !</span>}
          </PixelCard>

          <PixelCard className="flex flex-col items-center justify-center p-6 space-y-2 bg-secondary text-secondary-foreground">
            <span className="font-pixel-body text-xl">신규 신청</span>
            <span className="font-pixel text-5xl">{dashboard?.newSubmissionsCount || 0}</span>
          </PixelCard>

          <PixelCard className="flex flex-col items-center justify-center p-6 space-y-2 bg-success text-success-foreground">
            <span className="font-pixel-body text-xl">오늘 일정</span>
            <span className="font-pixel text-5xl">{dashboard?.todayScheduleCount || 0}</span>
          </PixelCard>

          <PixelCard className="flex flex-col items-center justify-center p-6 space-y-2 bg-accent text-accent-foreground">
            <span className="font-pixel-body text-xl">일정 충돌</span>
            <span className="font-pixel text-5xl">{dashboard?.conflictCount || 0}</span>
            {(dashboard?.conflictCount || 0) > 0 && <span className="animate-pulse text-destructive font-pixel mt-2 text-sm">! 주의 !</span>}
          </PixelCard>
        </div>
      )}

      {dashboard?.recentEvents && dashboard.recentEvents.length > 0 && (
        <PixelCard className="bg-white">
          <h2 className="text-xl font-pixel mb-6 border-b-4 border-black pb-2">최근 활동</h2>
          <div className="space-y-4">
            {dashboard.recentEvents.map(event => (
              <div key={event.id} className="flex justify-between items-center border-2 border-black p-3 bg-background">
                <div>
                  <h3 className="font-pixel text-sm">{event.title}</h3>
                  <p className="font-pixel-body text-sm text-muted-foreground">{event.organizationName || "-"}</p>
                </div>
                <div className="flex items-center gap-4">
                  <PixelBadge variant={STATUS_VARIANTS[event.status] ?? "secondary"}>
                    {STATUS_LABELS[event.status] || event.status}
                  </PixelBadge>
                  <Link href={`/events/${event.id}`}>
                    <PixelButton size="sm">상세보기</PixelButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </PixelCard>
      )}
    </div>
  );
}
