import React, { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, useParams, useLocation, useSearch } from "wouter";
import {
  useGetEvent,
  useCreateComment,
  useUpdateEvent,
  useSendEventEmail,
  useGetMe,
  getGetMeQueryKey,
  useListPromotionZones,
} from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/store/useUIStore";
import { BaekroSpeech } from "@/components/pixel/MaengkongiSpeech";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

function downloadEventPDF(event: any) {
  const STATUS_KR: Record<string, string> = {
    draft: "초안",
    submitted: "제출됨",
    approved: "승인됨",
    revision_requested: "수정 요청",
    rejected: "반려됨",
    completed: "완료",
    pending: "검토 중",
    active: "게시 중",
  };
  const meta = event.meta ?? {};
  const prRows = (event.promotionRequests ?? [])
    .map(
      (pr: any) => `
    <tr>
      <td>${pr.zoneName ?? pr.zoneId}</td>
      <td>${pr.requestedStartDate ?? "-"} ~ ${pr.requestedEndDate ?? "-"}</td>
      <td>${STATUS_KR[pr.status] ?? pr.status}</td>
      <td>${pr.adminComment ?? "-"}</td>
    </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>홍보신청서_${event.title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans KR', sans-serif; font-size: 12px; color: #111; padding: 32px; }
  h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .subtitle { font-size: 11px; color: #555; margin-bottom: 24px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 10px; }
  .row { display: flex; gap: 8px; margin-bottom: 6px; }
  .label { width: 90px; flex-shrink: 0; color: #666; }
  .value { flex: 1; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f4f4f4; border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-weight: 700; }
  td { border: 1px solid #ddd; padding: 6px 8px; }
  .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; background: #e8f5e9; color: #2e7d32; }
  .footer { margin-top: 32px; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>🏝️ 노들섬 홍보 신청서</h1>
  <p class="subtitle">출력일: ${new Date().toLocaleString("ko-KR")} &nbsp;|&nbsp; 신청 ID: #${event.id}</p>

  <div class="section">
    <div class="section-title">행사 기본 정보</div>
    <div class="row"><span class="label">행사명</span><span class="value"><strong>${event.title}</strong></span></div>
    <div class="row"><span class="label">상태</span><span class="value"><span class="status">${STATUS_KR[event.status] ?? event.status}</span></span></div>
    <div class="row"><span class="label">기간</span><span class="value">${event.startDate} ~ ${event.endDate}</span></div>
    <div class="row"><span class="label">장소</span><span class="value">${event.venue ?? meta.venues?.join(", ") ?? "-"}</span></div>
    <div class="row"><span class="label">운영시간</span><span class="value">${meta.operatingHours ?? "-"}</span></div>
    <div class="row"><span class="label">카테고리</span><span class="value">${event.tags?.join(", ") ?? meta.categories?.join(", ") ?? "-"}</span></div>
    <div class="row"><span class="label">관람료</span><span class="value">${meta.price ?? "-"}</span></div>
    ${event.description ? `<div class="row"><span class="label">행사 설명</span><span class="value">${event.description.replace(/\n/g, "<br>")}</span></div>` : ""}
  </div>

  <div class="section">
    <div class="section-title">담당자 정보</div>
    <div class="row"><span class="label">단체명</span><span class="value">${event.organizationName ?? "-"}</span></div>
    <div class="row"><span class="label">담당자</span><span class="value">${[event.contactName, event.contactTitle].filter(Boolean).join(" / ") || "-"}</span></div>
    <div class="row"><span class="label">이메일</span><span class="value">${event.contactEmail ?? "-"}</span></div>
    <div class="row"><span class="label">전화번호</span><span class="value">${event.contactPhone ?? "-"}</span></div>
  </div>

  ${
    prRows
      ? `
  <div class="section">
    <div class="section-title">홍보 구역 신청 현황</div>
    <table>
      <thead><tr><th>홍보 구역</th><th>신청 기간</th><th>상태</th><th>관리자 코멘트</th></tr></thead>
      <tbody>${prRows}</tbody>
    </table>
  </div>`
      : ""
  }

  <div class="footer">
    본 문서는 노들섬 홍보 통합 시스템에서 자동 생성되었습니다. &nbsp;|&nbsp; 문의: nodeul@sfac.or.kr &nbsp;|&nbsp; 02-2105-2414
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  submitted: "제출됨",
  approved: "승인됨",
  revision_requested: "수정 요청",
  rejected: "반려됨",
  completed: "완료",
  pending: "검토 중",
  active: "게시 중",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-600 border-zinc-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  revision_requested: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-zinc-100 text-zinc-500 border-zinc-200",
  pending: "bg-blue-50 text-blue-600 border-blue-200",
  active: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${STATUS_COLORS[status] ?? "bg-zinc-100 text-zinc-500 border-zinc-200"}`}
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

function formatDatetime(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function EventDetailPage() {
  const { isSignedIn } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const setNPCMessage = useUIStore((s) => s.setNPCMessage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: me } = useGetMe({
    query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() },
  });
  const isAdmin = me?.role === "admin" || me?.role === "super_admin";

  const { data: event, isLoading, refetch } = useGetEvent(Number(id));
  const createComment = useCreateComment();
  const updateEvent = useUpdateEvent();
  const sendEmail = useSendEventEmail();

  const [comment, setComment] = useState("");
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const [showPRForm, setShowPRForm] = useState(false);
  const [prSubmitting, setPrSubmitting] = useState(false);
  const searchStr = useSearch();
  const tabFromUrl = new URLSearchParams(searchStr).get("tab") as
    | "overview"
    | "assets"
    | "pr"
    | "comments"
    | null;
  const [activeTab, setActiveTab] = useState<
    "overview" | "assets" | "pr" | "comments"
  >(tabFromUrl ?? "overview");
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(
    null,
  );
  const [showBaekroHint, setShowBaekroHint] = useState(true);

  const [assetRefreshKey, setAssetRefreshKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadAssetId, setUploadAssetId] = useState<number | null>(null);
  const [uploadMemo, setUploadMemo] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [inlinePRActionId, setInlinePRActionId] = useState<number | null>(null);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const [emailSending, setEmailSending] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [prZoneId, setPrZoneId] = useState("");
  const [prStartDate, setPrStartDate] = useState("");
  const [prEndDate, setPrEndDate] = useState("");
  const [prNotes, setPrNotes] = useState("");
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedZoneId, setSchedZoneId] = useState("");
  const [schedStart, setSchedStart] = useState("");
  const [schedEnd, setSchedEnd] = useState("");
  const [schedNotes, setSchedNotes] = useState("");
  const [schedSubmitting, setSchedSubmitting] = useState(false);
  const { data: zones } = useListPromotionZones();

  React.useEffect(() => {
    if (event)
      setNPCMessage(
        `"${event.title}" 행사 상세페이지에요. 상태: ${STATUS_LABELS[event.status] || event.status} 🐸`,
      );
  }, [event]);

  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
      </div>
    );
  if (!event)
    return (
      <div className="text-center py-20">
        <p
          className="text-sm text-zinc-500"
          style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          행사를 찾을 수 없습니다.
        </p>
        <button
          onClick={() => setLocation("/dashboard")}
          className="mt-4 text-xs text-primary underline"
        >
          ← 돌아가기
        </button>
      </div>
    );

  const meta = (event as any).metadata ?? {};
  const metaPromoItems: string[] = meta.promoItems ?? [];
  const metaPromoItemDates: Record<string, string> = meta.promoItemDates ?? {};
  const metaBannerZones: string[] = meta.bannerZones ?? [];
  const metaLightPoleZones: string[] = meta.lightPoleBannerZones ?? [];
  const allRequestedZones = [
    ...metaPromoItems.map((item) => ({
      label: item,
      type: "홍보 구역",
      date: metaPromoItemDates[item] ?? "",
    })),
    ...metaBannerZones.map((z) => ({ label: z, type: "현수막", date: "" })),
    ...metaLightPoleZones.map((z) => ({
      label: z,
      type: "가로등 배너",
      date: "",
    })),
  ];

  const handleSubmitForReview = async () => {
    await updateEvent.mutateAsync({
      id: Number(id),
      data: { status: "submitted" },
    });
    refetch();
  };

  const handleCancelSubmit = async () => {
    await updateEvent.mutateAsync({
      id: Number(id),
      data: { status: "draft" },
    });
    refetch();
  };

  const handleAdminStatus = async (status: string, adminNote?: string) => {
    await updateEvent.mutateAsync({
      id: Number(id),
      data: {
        status: status as any,
        ...(adminNote !== undefined ? { adminNote } : {}),
      },
    });
    refetch();
  };

  const handleRevisionSubmit = async () => {
    if (!revisionNote.trim()) return;
    await handleAdminStatus("revision_requested", revisionNote.trim());
    try {
      await createComment.mutateAsync({
        eventId: Number(id),
        data: {
          content: `[수정 요청] ${revisionNote.trim()}`,
          isAdminOnly: false,
        },
      });
    } catch {}
    setShowRevisionDialog(false);
    setRevisionNote("");
  };

  const handleZoneUpload = (zoneName: string) => {
    setUploadName(zoneName);
    setUploadAssetId(null);
    setUploadMemo("");
    setUploadError("");
    setShowUploadModal(true);
  };

  const handleInlinePRAction = async (
    prId: number,
    action: "approve" | "reject",
  ) => {
    if (action === "reject" && !confirm("이 홍보 신청을 반려하시겠습니까?"))
      return;
    setInlinePRActionId(prId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await fetch(`${BASE_URL}/api/promotion-requests/${prId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({}),
      });
      refetch();
    } finally {
      setInlinePRActionId(null);
    }
  };

  const handleReply = async (parentId: number) => {
    if (!replyText.trim()) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${BASE_URL}/api/events/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          content: replyText.trim(),
          parentId,
          isAdminOnly,
        }),
      });
      if (res.ok) {
        setReplyText("");
        setReplyingToId(null);
        refetch();
      }
    } catch {
      /* ignore */
    }
  };

  const handleSendApprovalEmail = async () => {
    if (!event.contactEmail) return;
    setEmailSending(true);
    try {
      await sendEmail.mutateAsync({
        eventId: Number(id),
        data: {
          emailType: "approved",
          recipientEmail: event.contactEmail,
          subject: `[노들섬] ${event.title} 홍보 신청이 승인되었습니다`,
          body: `안녕하세요,\n\n노들섬 홍보 통합 시스템입니다.\n\n${event.organizationName || "귀 기관"}의 "${event.title}" 행사 홍보 신청이 승인되었습니다.\n\n■ 행사명: ${event.title}\n■ 기간: ${event.startDate} ~ ${event.endDate}\n■ 장소: ${event.venue || "-"}\n\n이제 홍보물을 업로드하시면 최종 검토 후 게시됩니다.\n\n감사합니다.\n노들섬 홍보팀`,
        },
      });
      setEmailSent(true);
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setEmailSending(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await createComment.mutateAsync({
      eventId: Number(id),
      data: { content: comment, isAdminOnly },
    });
    setComment("");
    refetch();
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("이 코멘트를 삭제하시겠습니까?")) return;
    setDeletingCommentId(commentId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await fetch(`${BASE_URL}/api/events/${id}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      refetch();
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleScheduleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedZoneId || !schedStart || !schedEnd) return;
    setSchedSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${BASE_URL}/api/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          eventId: Number(id),
          zoneId: Number(schedZoneId),
          startDate: schedStart,
          endDate: schedEnd,
          notes: schedNotes || null,
        }),
      });
      if (!res.ok) throw new Error("일정 추가 실패");
      setShowScheduleForm(false);
      setSchedZoneId("");
      setSchedStart("");
      setSchedEnd("");
      setSchedNotes("");
      refetch();
    } catch (err: any) {
      alert(err.message || "일정 추가에 실패했습니다.");
    } finally {
      setSchedSubmitting(false);
    }
  };

  const handlePRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prZoneId || !prStartDate || !prEndDate) return;
    setPrSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${BASE_URL}/api/promotion-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          eventId: Number(id),
          zoneId: Number(prZoneId),
          requestedStartDate: prStartDate,
          requestedEndDate: prEndDate,
          notes: prNotes || null,
        }),
      });
      if (!res.ok) throw new Error("구역 신청에 실패했습니다.");
      setShowPRForm(false);
      setPrZoneId("");
      setPrStartDate("");
      setPrEndDate("");
      setPrNotes("");
      refetch();
    } catch (err: any) {
      alert(err.message || "구역 신청에 실패했습니다.");
    } finally {
      setPrSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("파일 크기는 5MB를 초과할 수 없습니다.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++)
        binary += String.fromCharCode(uint8[i]);
      const base64 = btoa(binary);

      const uploadRes = await fetch(
        `${BASE_URL}/api/events/${id}/upload-asset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            base64,
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
          }),
        },
      );
      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error || "파일 업로드에 실패했습니다.");
      }
      const { url: fileUrl } = await uploadRes.json();
      const fileType = file.type || "application/octet-stream";

      if (uploadAssetId) {
        await fetch(`${BASE_URL}/api/assets/${uploadAssetId}/versions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileUrl,
            fileType,
            fileName: file.name,
            fileSize: file.size,
            changeMemo: uploadMemo || null,
          }),
        });
      } else {
        await fetch(`${BASE_URL}/api/events/${id}/assets`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: uploadName || file.name,
            zoneId: null,
            fileUrl,
            fileType,
            fileName: file.name,
            fileSize: file.size,
            changeMemo: uploadMemo || null,
          }),
        });
      }
      refetch();
      setAssetRefreshKey((k) => k + 1);
      setShowUploadModal(false);
      setUploadMemo("");
      setUploadName("");
      setUploadAssetId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadError(err.message || "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleSelectVersion = async (assetId: number, versionId: number) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await fetch(
      `${BASE_URL}/api/assets/${assetId}/versions/${versionId}/select`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({}),
      },
    );
    refetch();
  };

  const adminCommentCount =
    event.comments?.filter(
      (c: any) => c.authorRole === "admin" && !c.isAdminOnly,
    ).length ?? 0;
  const commentBadge =
    !isAdmin && (event.status === "revision_requested" || adminCommentCount > 0)
      ? adminCommentCount || 1
      : 0;

  const tabs = [
    { id: "overview", label: "개요" },
    {
      id: "pr",
      label: `홍보신청·현황 ${allRequestedZones.length > 0 ? allRequestedZones.length : (event.promotionRequests?.length ?? 0)}`,
    },
    { id: "assets", label: `홍보물 ${event.assets?.length ?? 0}` },
    {
      id: "comments",
      label: `코멘트 ${event.comments?.length ?? 0}`,
      badge: commentBadge,
    },
  ];

  const KR = { fontFamily: "'Noto Sans KR', sans-serif" };

  const latestAdminComment =
    event.comments
      ?.filter((c: any) => c.authorRole === "admin" && !c.isAdminOnly)
      .slice(-1)[0] ?? null;

  const myName = me?.name ?? me?.email ?? "";

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* 수정 요청 다이얼로그 */}
      {showRevisionDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowRevisionDialog(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-black/10 w-full max-w-md p-6 mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-bold text-foreground" style={KR}>
              수정 요청 사유 입력
            </h2>
            <p className="text-xs text-muted-foreground" style={KR}>
              신청자에게 전달할 수정 사유를 입력해 주세요. 입력 내용은 코멘트 및
              알림 배너에 표시됩니다.
            </p>
            <textarea
              rows={4}
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-400 resize-none"
              style={KR}
              placeholder="예: 홍보물 해상도가 낮습니다. 300dpi 이상으로 재업로드해 주세요."
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowRevisionDialog(false);
                  setRevisionNote("");
                }}
                className="h-8 px-3 text-xs border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors"
                style={KR}
              >
                취소
              </button>
              <button
                onClick={handleRevisionSubmit}
                disabled={!revisionNote.trim() || updateEvent.isPending}
                className="h-8 px-4 text-xs font-medium bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors disabled:opacity-50"
                style={KR}
              >
                수정 요청 전송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 플로팅 업로드 모달 */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setShowUploadModal(false);
            setUploadError("");
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-black/10 w-full max-w-lg p-6 mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold" style={KR}>
                {uploadAssetId ? "📎 파일 추가" : "📁 홍보물 업로드"}
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadError("");
                }}
                className="text-zinc-400 hover:text-zinc-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            {!uploadAssetId && (
              <div>
                <label
                  className="block text-xs font-medium text-muted-foreground mb-1"
                  style={KR}
                >
                  홍보물 이름 *
                </label>
                <input
                  className="w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                  style={KR}
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="예: 인스타그램 배너"
                />
              </div>
            )}
            {uploadAssetId && (
              <div>
                <label
                  className="block text-xs font-medium text-muted-foreground mb-1"
                  style={KR}
                >
                  변경 내용 메모 (선택)
                </label>
                <input
                  className="w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                  style={KR}
                  value={uploadMemo}
                  onChange={(e) => setUploadMemo(e.target.value)}
                  placeholder="어떤 부분을 수정했는지 간단히 적어주세요"
                />
              </div>
            )}
            <div
              className="border-2 border-dashed border-black/15 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.psd,.ai,.zip,.pptx,.mp4,.mov"
              />
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-zinc-300 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground" style={KR}>
                    업로드 중...
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium" style={KR}>
                    클릭하여 파일 선택
                  </p>
                  <p className="text-xs text-muted-foreground mt-1" style={KR}>
                    이미지, PDF, PSD, AI, ZIP, PPTX, MP4, MOV · 최대 5MB
                  </p>
                </>
              )}
            </div>
            {uploadError && (
              <p className="text-xs text-destructive" style={KR}>
                {uploadError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 수정 요청 배너 */}
      {event.status === "revision_requested" && !isAdmin && (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-amber-800" style={KR}>
                ⚠ 수정 요청
              </span>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide bg-amber-200 px-1.5 py-0.5 rounded">
                ACTION REQUIRED
              </span>
            </div>
            {latestAdminComment ? (
              <p className="text-sm text-amber-900" style={KR}>
                <span className="font-medium">관리자 코멘트:</span>{" "}
                {latestAdminComment.content}
              </p>
            ) : (
              <p className="text-sm text-amber-700" style={KR}>
                관리자가 수정을 요청했습니다. 홍보물 탭에서 파일을 재제출해
                주세요.
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setUploadAssetId(null);
              setUploadName("");
              setUploadMemo("");
              setUploadError("");
              setShowUploadModal(true);
            }}
            className="h-8 px-4 text-xs font-medium bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors flex-shrink-0"
            style={KR}
          >
            📎 파일 재제출
          </button>
        </div>
      )}

      {/* 초안 상태 백로 힌트 */}
      {event.status === "draft" && !isAdmin && showBaekroHint && (
        <div className="relative">
          <BaekroSpeech mood="cheer">
            입력이 완료되셨나요? 반드시 <strong>[검토 제출]</strong> 버튼을
            눌러주세요! 검토 제출 후에도 홍보물 업로드는 계속 가능합니다 🦢
          </BaekroSpeech>
          <button
            onClick={() => setShowBaekroHint(false)}
            className="absolute top-2 right-2 text-xs text-zinc-400 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-3 pb-4 border-b border-black/8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() =>
                setLocation(isAdmin ? "/admin/events" : "/dashboard")
              }
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              style={KR}
            >
              ← 목록
            </button>
            <StatusPill status={event.status} />
            {event.status === "submitted" && (
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                NEW
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground" style={KR}>
            {event.title}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={KR}>
            {event.startDate} ~ {event.endDate}
            {event.venue ? ` · ${event.venue}` : ""}
            {event.organizationName ? ` · ${event.organizationName}` : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {(event.status === "draft" ||
            event.status === "revision_requested") &&
            !isAdmin && (
              <button
                onClick={() => setLocation(`/events/new?edit=${id}`)}
                className="h-8 px-3 text-xs font-medium border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors"
                style={KR}
              >
                ✏ 수정하기
              </button>
            )}
          {event.status === "draft" && (
            <button
              onClick={handleSubmitForReview}
              disabled={updateEvent.isPending}
              className="h-8 px-3 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 transition-colors"
              style={KR}
            >
              검토 제출
            </button>
          )}
          {event.status === "revision_requested" && !isAdmin && (
            <button
              onClick={handleSubmitForReview}
              disabled={updateEvent.isPending}
              className="h-8 px-3 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 transition-colors"
              style={KR}
            >
              수정 완료 · 재제출
            </button>
          )}
          {event.status === "submitted" && !isAdmin && (
            <button
              onClick={handleCancelSubmit}
              disabled={updateEvent.isPending}
              className="h-8 px-3 text-xs font-medium border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors"
              style={KR}
            >
              제출 취소
            </button>
          )}
          {isAdmin && event.status === "submitted" && (
            <>
              <button
                onClick={() => handleAdminStatus("approved")}
                className="h-8 px-3 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                style={KR}
              >
                승인
              </button>
              <button
                onClick={() => setShowRevisionDialog(true)}
                className="h-8 px-3 text-xs font-medium bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                style={KR}
              >
                수정 요청
              </button>
            </>
          )}
          {isAdmin && event.status === "approved" && event.contactEmail && (
            <button
              onClick={handleSendApprovalEmail}
              disabled={emailSending || emailSent}
              className={`h-8 px-3 text-xs font-medium rounded transition-colors ${emailSent ? "bg-zinc-100 text-zinc-400 border border-zinc-200" : "bg-violet-600 text-white hover:bg-violet-700"}`}
              style={KR}
            >
              {emailSending
                ? "발송 중..."
                : emailSent
                  ? "✓ 메일 발송됨"
                  : "✉ 승인 완료 메일 발송"}
            </button>
          )}
          <button
            onClick={() => downloadEventPDF(event)}
            className="h-8 px-3 text-xs font-medium border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors"
            style={KR}
            title="신청 내용을 PDF로 저장"
          >
            📄 PDF 저장
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-black/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`relative px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            style={KR}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
            {(tab as any).badge > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
                title="관리자 코멘트 또는 수정 요청이 있습니다"
              >
                {(tab as any).badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── 개요 탭 ── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* 담당자 정보 */}
          <div className="border border-black/10 rounded-lg p-4 bg-white">
            <h3
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3"
              style={KR}
            >
              담당자 정보
            </h3>
            <dl className="space-y-2">
              {(
                [
                  ["단체", (event as any).organizationName || "-"],
                  [
                    "담당자",
                    [event.contactName, (event as any).contactTitle]
                      .filter(Boolean)
                      .join(" / ") || "-",
                  ],
                  ["이메일", event.contactEmail || (me as any)?.email || "-"],
                  ["전화번호", (event as any).contactPhone || "-"],
                  ["내선번호", (event as any).extensionPhone || null],
                ] as [string, string | null][]
              )
                .filter(([, v]) => v !== null)
                .map(([label, value]) => (
                  <div key={label} className="flex gap-3 text-sm">
                    <dt
                      className="text-muted-foreground w-20 flex-shrink-0"
                      style={KR}
                    >
                      {label}
                    </dt>
                    <dd className="text-foreground" style={KR}>
                      {value}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* 행사 정보 통합 */}
          <div className="border border-black/10 rounded-lg p-4 bg-white">
            <h3
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3"
              style={KR}
            >
              행사 정보
            </h3>
            <dl className="space-y-2">
              {[
                ["기간", `${event.startDate} ~ ${event.endDate}`],
                ["장소", event.venue || meta.venues?.join(", ") || "-"],
                ["운영시간", meta.operatingHours || null],
                [
                  "카테고리",
                  event.tags?.length
                    ? event.tags.join(", ")
                    : meta.categories?.join(", ") || null,
                ],
                ["라인업", meta.lineup || null],
                ["참여 대상", meta.audience || null],
                ["참여 연령", meta.ageLimit || null],
                ["관람료", meta.price || "-"],
                ["관람 방법", meta.viewingMethods?.join(", ") || "-"],
                ["공식 문의처", meta.contact || "-"],
              ]
                .filter(([, v]) => v != null)
                .map(([label, value]) => (
                  <div key={label as string} className="flex gap-3 text-sm">
                    <dt
                      className="text-muted-foreground w-24 flex-shrink-0"
                      style={KR}
                    >
                      {label}
                    </dt>
                    <dd className="text-foreground" style={KR}>
                      {value as string}
                    </dd>
                  </div>
                ))}
              {meta.ticketLink && (
                <div className="flex gap-3 text-sm">
                  <dt
                    className="text-muted-foreground w-24 flex-shrink-0"
                    style={KR}
                  >
                    예매 링크
                  </dt>
                  <dd>
                    <a
                      href={meta.ticketLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline text-sm"
                    >
                      {meta.ticketLink}
                    </a>
                  </dd>
                </div>
              )}
              {meta.notes && (
                <div className="flex gap-3 text-sm">
                  <dt
                    className="text-muted-foreground w-24 flex-shrink-0"
                    style={KR}
                  >
                    특이사항
                  </dt>
                  <dd className="text-foreground" style={KR}>
                    {meta.notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* 설명 */}
          {event.description && (
            <div className="border border-black/10 rounded-lg p-4 bg-white">
              <h3
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3"
                style={KR}
              >
                행사 설명
              </h3>
              <p
                className="text-sm text-foreground whitespace-pre-wrap"
                style={KR}
              >
                {event.description}
              </p>
            </div>
          )}

          {/* 신청한 홍보 구역 */}
          {allRequestedZones.length > 0 && (
            <div className="border border-black/10 rounded-lg p-4 bg-white">
              <h3
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3"
                style={KR}
              >
                신청한 홍보 구역
              </h3>
              <div className="space-y-1.5">
                {meta.snsSiteDate && (
                  <div className="flex items-center gap-2 text-xs py-1.5 border-b border-black/5">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 border border-blue-200 flex-shrink-0"
                      style={KR}
                    >
                      필수
                    </span>
                    <span className="text-foreground flex-1" style={KR}>
                      홈페이지 / SNS 게시
                    </span>
                    <span
                      className="text-muted-foreground text-[10px] flex-shrink-0"
                      style={KR}
                    >
                      {meta.snsSiteDate}
                    </span>
                  </div>
                )}
                {allRequestedZones.map((z, i) => {
                  const isBanner =
                    z.type === "현수막" || z.type === "가로등 배너";
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs py-1.5 border-b border-black/5 last:border-0"
                    >
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 flex-shrink-0"
                        style={KR}
                      >
                        {z.type}
                      </span>
                      <span className="text-foreground flex-1" style={KR}>
                        {z.label}
                      </span>
                      {z.date && (
                        <span
                          className="text-muted-foreground text-[10px] flex-shrink-0"
                          style={KR}
                        >
                          {z.date}
                        </span>
                      )}
                      {!isBanner &&
                        (event.status === "approved" ||
                          event.status === "completed") && (
                          <button
                            onClick={() => handleZoneUpload(z.label)}
                            className="h-5 px-2 text-[10px] border border-primary/30 text-primary rounded bg-primary/5 hover:bg-primary/10 transition-colors flex-shrink-0"
                            style={KR}
                          >
                            + 파일
                          </button>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isAdmin && event.adminNote && (
            <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
              <h3
                className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2"
                style={KR}
              >
                관리자 메모
              </h3>
              <p className="text-sm text-amber-800" style={KR}>
                {event.adminNote}
              </p>
            </div>
          )}
          {isAdmin && event.emailLogs && event.emailLogs.length > 0 && (
            <div className="border border-black/10 rounded-lg p-4 bg-white">
              <h3
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3"
                style={KR}
              >
                메일 발송 이력
              </h3>
              <div className="space-y-1">
                {event.emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 text-xs py-1.5 border-b border-black/5 last:border-0"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.status === "sent" ? "bg-emerald-500" : "bg-red-400"}`}
                    />
                    <span
                      className="text-muted-foreground flex-shrink-0"
                      style={KR}
                    >
                      {log.emailType}
                    </span>
                    <span
                      className="text-foreground flex-1 truncate"
                      style={KR}
                    >
                      {log.subject}
                    </span>
                    <span
                      className="text-muted-foreground flex-shrink-0"
                      style={KR}
                    >
                      {log.recipientEmail}
                    </span>
                    <span className="text-muted-foreground flex-shrink-0">
                      {log.sentAt
                        ? new Date(log.sentAt).toLocaleDateString("ko-KR")
                        : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 홍보신청 탭 ── */}
      {activeTab === "pr" && (
        <div className="space-y-4">
          {/* 신청 시 입력한 홍보 구역 */}
          {allRequestedZones.length > 0 && (
            <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-black/8 bg-zinc-50/60">
                <span
                  className="text-xs font-semibold text-muted-foreground"
                  style={KR}
                >
                  신청 시 선택한 홍보 구역
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/8 bg-zinc-50/30">
                    {["구분", "홍보 구역", "희망 게시일"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground"
                        style={KR}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {allRequestedZones.map((z, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500"
                          style={KR}
                        >
                          {z.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm" style={KR}>
                        {z.label}
                      </td>
                      <td
                        className="px-4 py-2.5 text-xs text-muted-foreground"
                        style={KR}
                      >
                        {z.date || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {event.promotionRequests && event.promotionRequests.length > 0 && (
            <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-black/8 bg-zinc-50/60">
                <span
                  className="text-xs font-semibold text-muted-foreground"
                  style={KR}
                >
                  신청 현황 및 승인 상태
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/8 bg-zinc-50/30">
                    {[
                      ..."홍보 구역,구분,희망 기간,승인 상태,관리자 코멘트".split(
                        ",",
                      ),
                      ...(isAdmin ? ["액션"] : []),
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground"
                        style={KR}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {event.promotionRequests?.map((pr) => (
                    <tr
                      key={pr.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-medium" style={KR}>
                          {pr.zoneName}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200"
                          style={KR}
                        >
                          {pr.zoneType}
                        </span>
                      </td>
                      <td
                        className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap"
                        style={KR}
                      >
                        {pr.requestedStartDate} ~ {pr.requestedEndDate}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusPill status={pr.status} />
                      </td>
                      <td
                        className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate"
                        style={KR}
                      >
                        {pr.adminComment || "-"}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-2.5">
                          {pr.status === "pending" && (
                            <div className="flex items-center gap-1">
                              <button
                                disabled={inlinePRActionId === pr.id}
                                onClick={() =>
                                  handleInlinePRAction(pr.id, "approve")
                                }
                                className="h-6 px-2 text-[10px] font-semibold bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                style={KR}
                              >
                                승인
                              </button>
                              <button
                                disabled={inlinePRActionId === pr.id}
                                onClick={() =>
                                  handleInlinePRAction(pr.id, "reject")
                                }
                                className="h-6 px-2 text-[10px] font-semibold bg-red-400 text-white rounded hover:bg-red-500 transition-colors disabled:opacity-50"
                                style={KR}
                              >
                                반려
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 확정 게시 일정 (구 Schedule 탭) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold" style={KR}>
                확정 게시 일정
              </h3>
              {isAdmin && (
                <button
                  onClick={() => setShowScheduleForm(!showScheduleForm)}
                  className="h-7 px-3 text-xs font-medium border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors"
                  style={KR}
                >
                  {showScheduleForm ? "취소" : "+ 일정 추가"}
                </button>
              )}
            </div>
            {isAdmin && showScheduleForm && (
              <form
                onSubmit={handleScheduleAdd}
                className="border border-black/10 rounded-lg p-4 bg-white space-y-3 mb-3"
              >
                <h4
                  className="text-xs font-semibold text-muted-foreground"
                  style={KR}
                >
                  새 게시 일정 추가
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label
                      className="block text-xs font-medium text-muted-foreground mb-1"
                      style={KR}
                    >
                      홍보 구역 *
                    </label>
                    <select
                      required
                      className="w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                      style={KR}
                      value={schedZoneId}
                      onChange={(e) => setSchedZoneId(e.target.value)}
                    >
                      <option value="">구역 선택</option>
                      {zones?.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({z.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium text-muted-foreground mb-1"
                      style={KR}
                    >
                      게시 시작일 *
                    </label>
                    <input
                      required
                      type="date"
                      className="w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                      style={KR}
                      value={schedStart}
                      onChange={(e) => setSchedStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium text-muted-foreground mb-1"
                      style={KR}
                    >
                      게시 종료일 *
                    </label>
                    <input
                      required
                      type="date"
                      className="w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                      style={KR}
                      value={schedEnd}
                      onChange={(e) => setSchedEnd(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label
                      className="block text-xs font-medium text-muted-foreground mb-1"
                      style={KR}
                    >
                      메모
                    </label>
                    <input
                      className="w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                      style={KR}
                      value={schedNotes}
                      onChange={(e) => setSchedNotes(e.target.value)}
                      placeholder="게시 관련 메모 (선택)"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={
                    schedSubmitting || !schedZoneId || !schedStart || !schedEnd
                  }
                  className="h-8 px-4 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  style={KR}
                >
                  {schedSubmitting ? "추가 중..." : "일정 추가"}
                </button>
              </form>
            )}
            {event.schedules?.length === 0 ? (
              <div
                className="border border-black/10 rounded-lg bg-white text-center py-6 text-sm text-muted-foreground"
                style={KR}
              >
                <p>아직 확정된 게시 일정이 없습니다.</p>
                {!isAdmin && (
                  <p className="text-xs mt-1">
                    행사 승인 후 관리자가 게시 일정을 등록합니다.
                  </p>
                )}
              </div>
            ) : (
              <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/8 bg-zinc-50/60">
                      {["구역", "확정 게시 기간", "상태", "메모"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground"
                          style={KR}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {event.schedules?.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {s.zoneColor && (
                              <span
                                className="w-2 h-2 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: s.zoneColor }}
                              />
                            )}
                            <span className="text-sm" style={KR}>
                              {s.zoneName || "-"}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap"
                          style={KR}
                        >
                          {s.startDate} ~ {s.endDate}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusPill status={s.status} />
                        </td>
                        <td
                          className="px-4 py-2.5 text-xs text-muted-foreground max-w-[160px] truncate"
                          style={KR}
                        >
                          {s.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!isAdmin && (
              <BaekroSpeech mood="thinking">
                여기에 표시되는 일정은{" "}
                <strong>관리자가 확정한 실제 홍보 게시 일정</strong>입니다. 신청
                시 입력한 희망 날짜와 다를 수 있으니 참고해 주세요 🗓️
              </BaekroSpeech>
            )}
          </div>
        </div>
      )}

      {/* ── 홍보물 탭 ── */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          {/* 신청 구역 × 업로드 현황 통합 표 */}
          {allRequestedZones.length > 0 && (
            <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-black/8 bg-zinc-50/60">
                <span
                  className="text-xs font-semibold text-muted-foreground"
                  style={KR}
                >
                  신청 구역 · 업로드 현황
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/8 bg-zinc-50/30">
                    {[
                      "구분",
                      "홍보 구역",
                      "게시 예정일",
                      "업로드 파일",
                      "승인 상태",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground"
                        style={KR}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {meta.snsSiteDate && (
                    <tr className="hover:bg-muted/20 bg-blue-50/20">
                      <td className="px-4 py-2.5">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 border border-blue-200"
                          style={KR}
                        >
                          필수
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm" style={KR}>
                        홈페이지 / SNS 게시
                      </td>
                      <td
                        className="px-4 py-2.5 text-xs text-muted-foreground"
                        style={KR}
                      >
                        {meta.snsSiteDate}
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={KR}>
                        {(() => {
                          const matched =
                            event.assets?.filter(
                              (a) =>
                                a.name?.includes("SNS") ||
                                a.name?.includes("홈페이지") ||
                                a.zoneName?.includes("SNS") ||
                                a.zoneName?.includes("홈페이지"),
                            ) ?? [];
                          return matched.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {matched.map((a) => (
                                <a
                                  key={a.id}
                                  href={a.latestVersionUrl ?? "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline hover:text-primary/80 truncate max-w-[140px]"
                                  title={a.name ?? ""}
                                >
                                  📎 {a.name}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                handleZoneUpload("홈페이지 / SNS 게시")
                              }
                              className="text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                            >
                              미업로드
                            </button>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2.5">
                        {event.assets?.find(
                          (a) =>
                            a.name?.includes("SNS") ||
                            a.name?.includes("홈페이지"),
                        ) ? (
                          <StatusPill
                            status={
                              event.assets?.find(
                                (a) =>
                                  a.name?.includes("SNS") ||
                                  a.name?.includes("홈페이지"),
                              )?.status ?? "pending"
                            }
                          />
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </td>
                    </tr>
                  )}
                  {allRequestedZones.map((z, i) => {
                    const isBanner =
                      z.type === "현수막" || z.type === "가로등 배너";
                    const matchedAsset = event.assets?.find(
                      (a) =>
                        a.name === z.label ||
                        a.zoneName === z.label ||
                        a.name?.includes(z.label.substring(0, 6)),
                    );
                    return (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500"
                            style={KR}
                          >
                            {z.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm" style={KR}>
                          {z.label}
                        </td>
                        <td
                          className="px-4 py-2.5 text-xs text-muted-foreground"
                          style={KR}
                        >
                          {z.date || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={KR}>
                          {isBanner ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
                              🔧 설치 예정
                            </span>
                          ) : matchedAsset ? (
                            <a
                              href={matchedAsset.latestVersionUrl ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline hover:text-primary/80 truncate max-w-[140px] inline-block"
                              title={matchedAsset.name ?? ""}
                            >
                              📎 {matchedAsset.name}
                            </a>
                          ) : (
                            <button
                              onClick={() => handleZoneUpload(z.label)}
                              className="text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                              style={KR}
                            >
                              미업로드
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {isBanner ? (
                            <span className="text-xs text-zinc-400">-</span>
                          ) : matchedAsset ? (
                            <StatusPill
                              status={matchedAsset.status ?? "pending_review"}
                            />
                          ) : (
                            <span className="text-xs text-zinc-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div id="uploadFormAnchor">
            <h3 className="text-sm font-semibold" style={KR}>
              홍보물 관리
            </h3>
          </div>

          {/* 관리자용 최종 선택 파일 목록 + ZIP */}
          {isAdmin &&
            event.assets &&
            event.assets.length > 0 &&
            event.assets.some((a) => a.selectedVersionId) && (
              <div className="border border-emerald-200 rounded-lg bg-emerald-50/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4
                    className="text-xs font-semibold text-emerald-800"
                    style={KR}
                  >
                    📥 최종 선택 파일 목록 (관리자)
                  </h4>
                  <a
                    href={`${BASE_URL}/api/events/${id}/assets/zip`}
                    download
                    onClick={async (e) => {
                      e.preventDefault();
                      const {
                        data: { session },
                      } = await supabase.auth.getSession();
                      const res = await fetch(
                        `${BASE_URL}/api/events/${id}/assets/zip`,
                        {
                          headers: {
                            Authorization: `Bearer ${session?.access_token}`,
                          },
                        },
                      );
                      if (!res.ok) {
                        alert("ZIP 다운로드 실패");
                        return;
                      }
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `assets_event_${id}.zip`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="h-7 px-3 text-[11px] font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                    style={KR}
                  >
                    <span>⬇</span> ZIP 다운로드
                  </a>
                </div>
                <div className="flex flex-col gap-1.5">
                  {event.assets
                    .filter((a) => a.selectedVersionId)
                    .map((asset) => {
                      const url = asset.latestVersionUrl;
                      return (
                        <a
                          key={asset.id}
                          href={url ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-emerald-700 hover:text-emerald-900 hover:underline transition-colors"
                        >
                          <span>📎</span>
                          <span className="font-medium" style={KR}>
                            {asset.name}
                          </span>
                          <span className="text-emerald-500 ml-auto">
                            최종선택 다운로드 →
                          </span>
                        </a>
                      );
                    })}
                </div>
              </div>
            )}

          {event.assets?.length === 0 ? (
            <div
              className="text-center py-10 text-sm text-muted-foreground"
              style={KR}
            >
              등록된 홍보물이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {event.assets?.map((asset) => (
                <div
                  key={asset.id}
                  className="border border-black/10 rounded-lg bg-white overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-black/8 bg-zinc-50/60">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={KR}>
                        {asset.name}
                      </span>
                      {asset.zoneName && (
                        <span
                          className="text-xs text-muted-foreground"
                          style={KR}
                        >
                          · {asset.zoneName}
                        </span>
                      )}
                      <StatusPill status={asset.status ?? "pending_review"} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs text-muted-foreground"
                        style={KR}
                      >
                        v{asset.totalVersions}
                      </span>
                      <button
                        onClick={() => {
                          setUploadAssetId(asset.id);
                          setUploadName("");
                          setUploadMemo("");
                          setUploadError("");
                          setShowUploadModal(true);
                        }}
                        className="h-6 px-2 text-xs border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors"
                        style={KR}
                      >
                        📎 파일 추가
                      </button>
                    </div>
                  </div>
                  <AssetVersionTable
                    assetId={asset.id}
                    isAdmin={isAdmin}
                    onSelect={handleSelectVersion}
                    selectedVersionId={asset.selectedVersionId}
                    refreshKey={assetRefreshKey}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 홍보승인 현황 탭 ── */}

      {/* ── 코멘트 탭 ── */}
      {activeTab === "comments" && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold" style={KR}>
            코멘트
          </h3>
          <div className="space-y-2">
            {event.comments
              ?.filter((c: any) => !c.parentId)
              .map((c: any) => {
                const replies =
                  event.comments?.filter((r: any) => r.parentId === c.id) ?? [];
                return (
                  <div key={c.id}>
                    <div
                      className={`border rounded-lg p-3 ${c.isAdminOnly ? "border-amber-200 bg-amber-50/50" : "border-black/10 bg-white"}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-base leading-none"
                            title={
                              c.authorRole === "admin" ||
                              c.authorRole === "super_admin"
                                ? "맹꽁이 (관리자)"
                                : "백로 (대관사)"
                            }
                          >
                            {c.authorRole === "admin" ||
                            c.authorRole === "super_admin"
                              ? "🐸"
                              : "🦢"}
                          </span>
                          <span className="text-xs font-semibold" style={KR}>
                            {c.authorName}
                          </span>
                          <span
                            className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-zinc-100 rounded"
                            style={KR}
                          >
                            {c.authorRole}
                          </span>
                          {c.isAdminOnly && (
                            <span
                              className="text-[10px] text-amber-700 px-1.5 py-0.5 bg-amber-100 rounded"
                              style={KR}
                            >
                              관리자 전용
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[11px] text-muted-foreground"
                            style={KR}
                          >
                            {formatDatetime(c.createdAt)}
                          </span>
                          <button
                            onClick={() =>
                              setReplyingToId(
                                replyingToId === c.id ? null : c.id,
                              )
                            }
                            className="text-[10px] text-primary hover:text-primary/80 transition-colors px-1"
                            style={KR}
                          >
                            {replyingToId === c.id ? "취소" : "↩ 답글"}
                          </button>
                          {(isAdmin || c.authorName === myName) && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              disabled={deletingCommentId === c.id}
                              className="text-[10px] text-zinc-400 hover:text-red-500 transition-colors px-1"
                              style={KR}
                            >
                              {deletingCommentId === c.id ? "..." : "삭제"}
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-foreground" style={KR}>
                        {c.content}
                      </p>
                    </div>

                    {/* 대댓글 목록 */}
                    {replies.length > 0 && (
                      <div className="ml-5 mt-1 space-y-1 border-l-2 border-primary/20 pl-3">
                        {replies.map((r: any) => (
                          <div
                            key={r.id}
                            className={`border rounded-md p-2.5 ${r.isAdminOnly ? "border-amber-200 bg-amber-50/50" : "border-black/8 bg-zinc-50/60"}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm leading-none">
                                  {r.authorRole === "admin" ||
                                  r.authorRole === "super_admin"
                                    ? "🐸"
                                    : "🦢"}
                                </span>
                                <span
                                  className="text-[11px] font-semibold"
                                  style={KR}
                                >
                                  {r.authorName}
                                </span>
                                <span
                                  className="text-[10px] text-muted-foreground px-1 py-0.5 bg-zinc-100 rounded"
                                  style={KR}
                                >
                                  {r.authorRole}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="text-[10px] text-muted-foreground"
                                  style={KR}
                                >
                                  {formatDatetime(r.createdAt)}
                                </span>
                                {(isAdmin || r.authorName === myName) && (
                                  <button
                                    onClick={() => handleDeleteComment(r.id)}
                                    disabled={deletingCommentId === r.id}
                                    className="text-[10px] text-zinc-400 hover:text-red-500 transition-colors"
                                    style={KR}
                                  >
                                    {deletingCommentId === r.id
                                      ? "..."
                                      : "삭제"}
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-foreground" style={KR}>
                              {r.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 답글 입력창 */}
                    {replyingToId === c.id && (
                      <div className="ml-5 mt-1 pl-3 border-l-2 border-primary/20">
                        <div className="flex gap-2">
                          <textarea
                            rows={2}
                            className="flex-1 border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary resize-none"
                            style={KR}
                            placeholder={`${c.authorName}에게 답글...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                          />
                          <button
                            onClick={() => handleReply(c.id)}
                            disabled={!replyText.trim()}
                            className="h-8 self-end px-3 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 transition-colors disabled:opacity-40"
                            style={KR}
                          >
                            등록
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            {event.comments?.length === 0 && (
              <div
                className="text-center py-8 text-sm text-muted-foreground"
                style={KR}
              >
                코멘트가 없습니다.
              </div>
            )}
          </div>
          <form
            onSubmit={handleComment}
            className="border border-black/10 rounded-lg p-4 bg-white space-y-2"
          >
            <textarea
              rows={3}
              className="w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary resize-none"
              style={KR}
              placeholder="코멘트를 입력하세요..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={createComment.isPending || !comment.trim()}
                className="h-7 px-3 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 transition-colors disabled:opacity-50"
                style={KR}
              >
                등록
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function AssetVersionTable({
  assetId,
  isAdmin,
  onSelect,
  selectedVersionId,
  refreshKey,
}: {
  assetId: number;
  isAdmin: boolean;
  onSelect: (assetId: number, versionId: number) => void;
  selectedVersionId: number | null | undefined;
  refreshKey?: number;
}) {
  const [versions, setVersions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingMemoId, setEditingMemoId] = React.useState<number | null>(null);
  const [editingMemoText, setEditingMemoText] = React.useState("");
  const [savingMemo, setSavingMemo] = React.useState(false);
  const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");
  const KR = { fontFamily: "'Noto Sans KR', sans-serif" };

  const handleMemoSave = async (versionId: number) => {
    setSavingMemo(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${BASE_URL}/api/assets/versions/${versionId}/memo`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ changeMemo: editingMemoText }),
        },
      );
      if (res.ok) {
        const updated = await res.json();
        setVersions((vs) =>
          vs.map((v) =>
            v.id === versionId ? { ...v, changeMemo: updated.changeMemo } : v,
          ),
        );
        setEditingMemoId(null);
      }
    } finally {
      setSavingMemo(false);
    }
  };

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(`${BASE_URL}/api/assets/${assetId}`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setVersions(data.versions || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [assetId, selectedVersionId, refreshKey]);

  if (loading)
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-4 h-4 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
      </div>
    );
  if (!versions.length)
    return (
      <div className="text-center p-6 text-sm text-muted-foreground" style={KR}>
        버전 없음
      </div>
    );

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-black/5">
          <th
            className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground w-10"
            style={KR}
          >
            ver
          </th>
          <th
            className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground"
            style={KR}
          >
            파일명
          </th>
          <th
            className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground hidden sm:table-cell"
            style={KR}
          >
            크기
          </th>
          <th
            className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground hidden md:table-cell"
            style={KR}
          >
            변경 내용
          </th>
          <th
            className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground hidden md:table-cell"
            style={KR}
          >
            업로드일
          </th>
          <th
            className="px-4 py-2 text-xs font-semibold text-muted-foreground text-right"
            style={KR}
          >
            액션
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-black/5">
        {versions.map((v) => {
          const isFinal = v.id === selectedVersionId || v.isSelected;
          return (
            <tr
              key={v.id}
              className={`hover:bg-muted/20 transition-colors ${isFinal ? "bg-emerald-50/40" : ""}`}
            >
              <td className="px-4 py-2.5 text-xs font-mono">
                <div className="flex items-center gap-1">
                  {isFinal && (
                    <span className="text-emerald-600 text-[10px]">✓</span>
                  )}
                  <span className="text-muted-foreground">
                    v{v.versionNumber}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2.5">
                <span className="text-sm font-medium" style={KR}>
                  {v.fileName || `파일 v${v.versionNumber}`}
                </span>
                {isFinal && (
                  <span
                    className="ml-2 text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded"
                    style={KR}
                  >
                    최종 선택
                  </span>
                )}
              </td>
              <td
                className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell"
                style={KR}
              >
                {formatBytes(v.fileSize)}
              </td>
              <td className="px-4 py-2.5 hidden md:table-cell max-w-[200px]">
                {editingMemoId === v.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      className="flex-1 border border-black/15 rounded px-2 py-0.5 text-xs bg-white focus:outline-none focus:border-primary min-w-0"
                      style={KR}
                      value={editingMemoText}
                      onChange={(e) => setEditingMemoText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleMemoSave(v.id);
                        if (e.key === "Escape") setEditingMemoId(null);
                      }}
                    />
                    <button
                      onClick={() => handleMemoSave(v.id)}
                      disabled={savingMemo}
                      className="h-5 px-1.5 text-[10px] bg-primary text-white rounded disabled:opacity-50"
                      style={KR}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingMemoId(null)}
                      className="h-5 px-1.5 text-[10px] border border-black/15 rounded bg-white"
                      style={KR}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 group">
                    <span
                      className="text-xs text-muted-foreground truncate"
                      style={KR}
                    >
                      {v.changeMemo || "-"}
                    </span>
                    <button
                      onClick={() => {
                        setEditingMemoId(v.id);
                        setEditingMemoText(v.changeMemo || "");
                      }}
                      className="opacity-0 group-hover:opacity-100 h-4 px-1 text-[9px] border border-black/15 rounded bg-white text-muted-foreground hover:text-foreground transition-opacity flex-shrink-0"
                      style={KR}
                    >
                      편집
                    </button>
                  </div>
                )}
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                {new Date(v.uploadedAt).toLocaleDateString("ko-KR")}
              </td>
              <td className="px-4 py-2.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <a
                    href={v.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-6 px-2 text-xs border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors"
                    style={KR}
                  >
                    보기
                  </a>
                  {isAdmin && !isFinal && (
                    <button
                      onClick={() => onSelect(assetId, v.id)}
                      className="h-6 px-2 text-xs border border-emerald-300 text-emerald-700 rounded bg-emerald-50 hover:bg-emerald-100 transition-colors"
                      style={KR}
                    >
                      최종 선택
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
