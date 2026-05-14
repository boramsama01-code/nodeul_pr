import React, { useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { Redirect, useParams, useLocation } from "wouter";
import {
  useGetEvent,
  useCreateComment,
  useCreatePromotionRequest,
  useListPromotionZones,
  useUpdateEvent,
  useSendEventEmail,
} from "@workspace/api-client-react";
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

export default function EventDetailPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const role = user?.publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "super_admin";

  const { data: event, isLoading, refetch } = useGetEvent(Number(id));
  const { data: zones } = useListPromotionZones();
  const createComment = useCreateComment();
  const createPR = useCreatePromotionRequest();
  const updateEvent = useUpdateEvent();
  const sendEmail = useSendEventEmail();

  const [comment, setComment] = useState("");
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const [showPRForm, setShowPRForm] = useState(false);
  const [prForm, setPRForm] = useState({ zoneId: "", startDate: "", endDate: "", notes: "" });
  const [activeTab, setActiveTab] = useState<"overview" | "assets" | "pr" | "schedule" | "comments">("overview");

  React.useEffect(() => {
    if (event) {
      setNPCMessage(`퀘스트 "${event.title}"를 확인 중... 상태: ${STATUS_LABELS[event.status] || event.status}`);
    }
  }, [event]);

  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="text-5xl animate-pixel-bounce">⏳</div>
    </div>
  );
  if (!event) return (
    <div className="text-center py-20">
      <p className="font-pixel text-2xl text-destructive">이벤트를 찾을 수 없습니다.</p>
      <PixelButton className="mt-8" onClick={() => setLocation("/dashboard")}>← 돌아가기</PixelButton>
    </div>
  );

  const handleSubmitForReview = async () => {
    await updateEvent.mutateAsync({ id: Number(id), data: { status: "submitted" } });
    refetch();
    setNPCMessage("검토 요청이 제출되었습니다! 관리자가 확인할 거예요.");
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await createComment.mutateAsync({ eventId: Number(id), data: { content: comment, isAdminOnly } });
    setComment("");
    refetch();
  };

  const handlePRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPR.mutateAsync({
      data: {
        eventId: Number(id),
        zoneId: Number(prForm.zoneId),
        requestedStartDate: prForm.startDate,
        requestedEndDate: prForm.endDate,
        notes: prForm.notes || undefined,
      }
    });
    setShowPRForm(false);
    setPRForm({ zoneId: "", startDate: "", endDate: "", notes: "" });
    refetch();
    setNPCMessage("홍보 구역 신청이 완료되었습니다!");
  };

  const tabs = [
    { id: "overview", label: "개요" },
    { id: "pr", label: `홍보신청 (${event.promotionRequests?.length ?? 0})` },
    { id: "assets", label: `홍보물 (${event.assets?.length ?? 0})` },
    { id: "schedule", label: `일정 (${event.schedules?.length ?? 0})` },
    { id: "comments", label: `코멘트 (${event.comments?.length ?? 0})` },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b-4 border-black pb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <PixelButton variant="ghost" size="sm" onClick={() => setLocation(isAdmin ? "/admin/events" : "/dashboard")}>
              ← 목록
            </PixelButton>
            <PixelBadge variant={STATUS_VARIANTS[event.status] ?? "secondary"}>
              {STATUS_LABELS[event.status] || event.status}
            </PixelBadge>
          </div>
          <h1 className="text-2xl font-pixel text-primary">{event.title}</h1>
          <p className="font-pixel-body text-lg text-muted-foreground mt-1">
            {event.startDate} ~ {event.endDate} {event.venue && `| ${event.venue}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {event.status === "draft" && (
            <PixelButton variant="primary" size="sm" onClick={handleSubmitForReview} disabled={updateEvent.isPending}>
              검토 제출
            </PixelButton>
          )}
          {isAdmin && event.status === "submitted" && (
            <>
              <PixelButton variant="primary" size="sm" onClick={async () => {
                await updateEvent.mutateAsync({ id: Number(id), data: { status: "approved" } });
                refetch();
              }}>승인</PixelButton>
              <PixelButton variant="secondary" size="sm" onClick={async () => {
                await updateEvent.mutateAsync({ id: Number(id), data: { status: "revision_requested" } });
                refetch();
              }}>수정 요청</PixelButton>
              <PixelButton variant="danger" size="sm" onClick={async () => {
                await updateEvent.mutateAsync({ id: Number(id), data: { status: "rejected" } });
                refetch();
              }}>반려</PixelButton>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-4 border-black overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 font-pixel text-xs uppercase whitespace-nowrap border-r-4 border-black last:border-r-0 transition-colors ${activeTab === tab.id ? "bg-primary text-white" : "bg-white hover:bg-muted"}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PixelCard>
            <h3 className="font-pixel text-lg mb-4 border-b-4 border-black pb-2">이벤트 정보</h3>
            <div className="space-y-3 font-pixel-body text-lg">
              <div><span className="font-bold">단체:</span> {event.organizationName || "-"}</div>
              <div><span className="font-bold">담당자:</span> {event.contactName || "-"}</div>
              <div><span className="font-bold">이메일:</span> {event.contactEmail || "-"}</div>
              <div><span className="font-bold">기간:</span> {event.startDate} ~ {event.endDate}</div>
              {event.venue && <div><span className="font-bold">장소:</span> {event.venue}</div>}
              {event.tags && event.tags.length > 0 && (
                <div><span className="font-bold">태그:</span> {event.tags.join(", ")}</div>
              )}
            </div>
          </PixelCard>
          {event.description && (
            <PixelCard>
              <h3 className="font-pixel text-lg mb-4 border-b-4 border-black pb-2">이벤트 설명</h3>
              <p className="font-pixel-body text-lg whitespace-pre-wrap">{event.description}</p>
            </PixelCard>
          )}
          {isAdmin && event.adminNote && (
            <PixelCard variant="alert">
              <h3 className="font-pixel text-lg mb-4 border-b-4 border-black pb-2">관리자 메모</h3>
              <p className="font-pixel-body text-lg">{event.adminNote}</p>
            </PixelCard>
          )}
        </div>
      )}

      {activeTab === "pr" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-pixel text-xl">홍보 구역 신청</h3>
            <PixelButton variant="primary" size="sm" onClick={() => setShowPRForm(!showPRForm)}>
              {showPRForm ? "취소" : "+ 구역 신청"}
            </PixelButton>
          </div>

          {showPRForm && (
            <PixelCard>
              <form onSubmit={handlePRSubmit} className="space-y-4">
                <div>
                  <label className="block font-pixel text-sm mb-2">홍보 구역 *</label>
                  <select
                    required
                    className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                    value={prForm.zoneId}
                    onChange={e => setPRForm(f => ({ ...f, zoneId: e.target.value }))}
                  >
                    <option value="">구역 선택...</option>
                    {zones?.map(z => (
                      <option key={z.id} value={z.id}>{z.name} ({z.type})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-pixel text-sm mb-2">시작일 *</label>
                    <input required type="date" className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg bg-white" value={prForm.startDate} onChange={e => setPRForm(f => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block font-pixel text-sm mb-2">종료일 *</label>
                    <input required type="date" className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg bg-white" value={prForm.endDate} onChange={e => setPRForm(f => ({ ...f, endDate: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block font-pixel text-sm mb-2">요청 메모</label>
                  <textarea className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg bg-white resize-none" rows={2} value={prForm.notes} onChange={e => setPRForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <PixelButton type="submit" variant="primary" size="md" disabled={createPR.isPending}>
                  {createPR.isPending ? "신청 중..." : "구역 신청"}
                </PixelButton>
              </form>
            </PixelCard>
          )}

          {event.promotionRequests?.length === 0 ? (
            <div className="text-center py-12 font-pixel-body text-muted-foreground text-xl">신청된 홍보 구역이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {event.promotionRequests?.map(pr => (
                <div key={pr.id} className="border-4 border-black p-4 bg-white flex justify-between items-start">
                  <div>
                    <div className="font-pixel text-sm">{pr.zoneName} <span className="text-muted-foreground">({pr.zoneType})</span></div>
                    <div className="font-pixel-body text-lg mt-1">{pr.requestedStartDate} ~ {pr.requestedEndDate}</div>
                    {pr.notes && <div className="font-pixel-body text-sm text-muted-foreground mt-1">{pr.notes}</div>}
                    {pr.adminComment && <div className="font-pixel-body text-sm text-destructive mt-1 border-l-4 border-destructive pl-2">{pr.adminComment}</div>}
                  </div>
                  <PixelBadge variant={STATUS_VARIANTS[pr.status] ?? "secondary"}>{STATUS_LABELS[pr.status] || pr.status}</PixelBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "assets" && (
        <div className="space-y-4">
          <h3 className="font-pixel text-xl">홍보물 관리</h3>
          {event.assets?.length === 0 ? (
            <div className="text-center py-12 font-pixel-body text-muted-foreground text-xl">등록된 홍보물이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {event.assets?.map(asset => (
                <div key={asset.id} className="border-4 border-black p-4 bg-white flex justify-between items-center">
                  <div>
                    <div className="font-pixel text-sm">{asset.name}</div>
                    <div className="font-pixel-body text-lg text-muted-foreground">v{asset.currentVersion} / {asset.zoneName || "구역 미지정"}</div>
                  </div>
                  <PixelBadge variant={STATUS_VARIANTS[asset.status as keyof typeof STATUS_VARIANTS] ?? "secondary"}>{asset.status}</PixelBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="space-y-4">
          <h3 className="font-pixel text-xl">게시 일정</h3>
          {event.schedules?.length === 0 ? (
            <div className="text-center py-12 font-pixel-body text-muted-foreground text-xl">등록된 일정이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {event.schedules?.map(sched => (
                <div key={sched.id} className="border-4 border-black p-4 bg-white flex justify-between items-center" style={{ borderLeftColor: sched.zoneColor || "#000", borderLeftWidth: "8px" }}>
                  <div>
                    <div className="font-pixel text-sm">{sched.zoneName} <span className="text-muted-foreground">({sched.zoneType})</span></div>
                    <div className="font-pixel-body text-lg">{sched.startDate} ~ {sched.endDate}</div>
                    {sched.notes && <div className="font-pixel-body text-sm text-muted-foreground">{sched.notes}</div>}
                  </div>
                  <PixelBadge variant={sched.status === "scheduled" ? "success" : "secondary"}>{sched.status}</PixelBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "comments" && (
        <div className="space-y-4">
          <h3 className="font-pixel text-xl">코멘트</h3>
          <div className="space-y-3">
            {event.comments?.map(c => (
              <div key={c.id} className={`border-4 border-black p-4 ${c.isAdminOnly ? "bg-yellow-50 border-yellow-500" : "bg-white"}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-pixel text-xs">{c.authorName} <span className="text-muted-foreground">({c.authorRole})</span></span>
                  <div className="flex items-center gap-2">
                    {c.isAdminOnly && <PixelBadge variant="alert">관리자 전용</PixelBadge>}
                    <span className="font-pixel-body text-sm text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("ko-KR")}</span>
                  </div>
                </div>
                <p className="font-pixel-body text-lg">{c.content}</p>
              </div>
            ))}
            {event.comments?.length === 0 && (
              <div className="text-center py-8 font-pixel-body text-muted-foreground text-xl">코멘트가 없습니다.</div>
            )}
          </div>
          <PixelCard>
            <form onSubmit={handleComment} className="space-y-3">
              <textarea
                className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white resize-none"
                rows={3}
                placeholder="코멘트를 입력하세요..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              {isAdmin && (
                <label className="flex items-center gap-2 font-pixel-body text-lg cursor-pointer">
                  <input type="checkbox" checked={isAdminOnly} onChange={e => setIsAdminOnly(e.target.checked)} className="w-5 h-5" />
                  관리자 전용 코멘트
                </label>
              )}
              <PixelButton type="submit" variant="primary" size="sm" disabled={createComment.isPending || !comment.trim()}>
                {createComment.isPending ? "전송 중..." : "코멘트 등록"}
              </PixelButton>
            </form>
          </PixelCard>
        </div>
      )}
    </div>
  );
}
