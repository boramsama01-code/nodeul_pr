import React, { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Link } from "wouter";
import { useListEvents, getListEventsQueryKey, useListPromotionZones } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/store/useUIStore";
import { MaengkongiSpeech, StepGuide } from "@/components/pixel/MaengkongiSpeech";

const STATUS_LABELS: Record<string, string> = {
  draft: "초안", submitted: "제출됨", approved: "승인됨",
  revision_requested: "수정 요청", rejected: "반려됨", completed: "완료",
};
const STATUS_CLS: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-500 border-zinc-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  revision_requested: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-zinc-100 text-zinc-400 border-zinc-200",
};
const STATUS_ICONS: Record<string, string> = {
  draft: "🔵", submitted: "🟡", approved: "🟢",
  revision_requested: "🟠", rejected: "🔴", completed: "⚪",
};
const STATUS_DESCS: Record<string, string> = {
  draft: "아직 제출 전",
  submitted: "관리자 검토 대기 중",
  approved: "게시 확정",
  revision_requested: "수정 후 재제출 필요",
  rejected: "담당자에게 문의 권장",
  completed: "게시 완료",
};

const KR = { fontFamily: "'Noto Sans KR', sans-serif" };
const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

function StatusPill({ status }: { status: string }) {
  return (
    <div className="relative group inline-flex">
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border cursor-default ${STATUS_CLS[status] ?? "bg-zinc-100 text-zinc-500 border-zinc-200"}`} style={KR}>
        {STATUS_LABELS[status] ?? status}
      </span>
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 pointer-events-none">
        <div className="bg-slate-800 text-white text-[11px] px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
          <div className="font-semibold mb-0.5">{STATUS_ICONS[status]} {STATUS_LABELS[status] ?? status}</div>
          <div className="text-slate-300">{STATUS_DESCS[status]}</div>
        </div>
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800 ml-3" />
      </div>
    </div>
  );
}

export default function MyAssetsPage() {
  const { isSignedIn } = useAuth();
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadEventId, setUploadEventId] = useState<number | null>(null);
  const [uploadMemo, setUploadMemo] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadZoneId, setUploadZoneId] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  React.useEffect(() => {
    setNPCMessage("홍보물을 업로드하거나 재제출하는 페이지예요. 수정 요청된 파일은 여기서 다시 제출하세요 🐸");
  }, [setNPCMessage]);

  const BASE_URL_API = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [guideUrl, setGuideUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${BASE_URL_API}/api/admin/settings`, { headers: { Authorization: `Bearer ${session?.access_token}` } });
        if (res.ok) {
          const settings: any[] = await res.json();
          const pdf = settings.find((s: any) => s.key === "zone_guide_pdf");
          if (pdf?.value) setGuideUrl(pdf.value);
        }
      } catch {}
    })();
  }, []);

  const { data: eventData, isLoading, refetch } = useListEvents(
    {},
    { query: { enabled: !!isSignedIn, queryKey: getListEventsQueryKey({}) } }
  );
  const { data: zones } = useListPromotionZones();

  if (!isSignedIn) return <Redirect to="/sign-in" />;

  const events = eventData?.events ?? [];
  const revisionEvents = events.filter(e => e.status === "revision_requested");
  const approvedEvents = events.filter(e => e.status === "approved");
  const otherEvents = events.filter(e => e.status !== "revision_requested" && e.status !== "approved");

  const openUpload = (eventId: number) => {
    setUploadEventId(eventId);
    setUploadMemo("");
    setUploadName("");
    setUploadZoneId("");
    setUploadSuccess(false);
    setUploadError("");
    setShowUploadModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadEventId) return;
    setUploading(true);
    setUploadError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const path = `events/${uploadEventId}/${Date.now()}_${file.name.replace(/\s/g, "_")}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("nodeul-assets")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("nodeul-assets").getPublicUrl(uploadData.path);
      const fileUrl = urlData.publicUrl;
      const res = await fetch(`${BASE_URL}/api/events/${uploadEventId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          name: uploadName || file.name,
          zoneId: uploadZoneId ? Number(uploadZoneId) : null,
          fileUrl,
          fileType: file.type || "application/octet-stream",
          fileName: file.name,
          fileSize: file.size,
          changeMemo: uploadMemo || null,
        }),
      });
      if (!res.ok) throw new Error("업로드 실패");
      setUploadSuccess(true);
      refetch();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadError(err.message || "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const renderEventRow = (event: any, highlight?: boolean) => (
    <div
      key={event.id}
      className={`border rounded-lg p-4 bg-white ${highlight ? "border-amber-300 bg-amber-50/30" : "border-black/10"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link href={`/events/${event.id}`}>
              <span className="font-semibold text-sm text-foreground hover:text-primary hover:underline cursor-pointer" style={KR}>
                {event.title}
              </span>
            </Link>
            <StatusPill status={event.status} />
            {highlight && (
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide bg-amber-100 px-1.5 py-0.5 rounded" style={KR}>
                파일 재제출 필요
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground" style={KR}>
            {event.startDate} ~ {event.endDate}
            {event.venue ? ` · ${event.venue}` : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => openUpload(event.id)}
            className={`h-8 px-3 text-xs font-medium rounded transition-colors ${
              highlight
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "border border-black/15 bg-white text-foreground hover:bg-muted/60"
            }`}
            style={KR}
          >
            {highlight ? "📎 파일 재제출" : "+ 홍보물 업로드"}
          </button>
          <Link href={`/events/${event.id}`}>
            <button className="h-8 px-3 text-xs border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors" style={KR}>
              상세 보기
            </button>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-4">
        <StepGuide currentStep={3} />
      </div>

      <MaengkongiSpeech mood={revisionEvents.length > 0 ? "alert" : approvedEvents.length > 0 ? "cheer" : "normal"}>
        {revisionEvents.length > 0
          ? `⚠️ 수정 요청된 행사가 ${revisionEvents.length}건이에요! 해당 행사의 홍보물을 수정해서 재제출해 주세요.`
          : approvedEvents.length > 0
            ? `🎉 승인된 행사가 ${approvedEvents.length}건이에요! 홍보물이 정상적으로 접수됐어요.`
            : events.length === 0
              ? "아직 신청한 행사가 없어요. 먼저 행사를 등록해 주세요!"
              : "행사를 선택하고 홍보물을 업로드해 주세요. JPG, PNG, PDF 등 다양한 형식을 지원해요 📁"}
      </MaengkongiSpeech>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground" style={KR}>행사별 홍보물</h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={KR}>
            행사를 선택해 홍보물을 업로드하거나 수정 재제출하세요
          </p>
        </div>
        {guideUrl && (
          <a href={guideUrl} target="_blank" rel="noopener noreferrer">
            <button className="h-8 px-3 text-xs font-medium bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors" style={KR}>
              📄 가이드 PDF
            </button>
          </a>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2">
          <div className="w-4 h-4 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground" style={KR}>불러오는 중...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-sm text-muted-foreground" style={KR}>등록된 행사가 없습니다.</p>
          <Link href="/events/new">
            <button className="h-8 px-4 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85" style={KR}>
              첫 행사 신청하기 →
            </button>
          </Link>
        </div>
      ) : (
        <>
          {revisionEvents.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-amber-700" style={KR}>⚠ 수정 요청 — 파일 재제출 필요</h2>
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{revisionEvents.length}건</span>
              </div>
              {revisionEvents.map(e => renderEventRow(e, true))}
            </section>
          )}

          {approvedEvents.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-emerald-700" style={KR}>✓ 승인됨 — 홍보물 업로드 가능</h2>
                <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{approvedEvents.length}건</span>
              </div>
              {approvedEvents.map(e => renderEventRow(e, false))}
            </section>
          )}

          {otherEvents.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground" style={KR}>기타 행사</h2>
              {otherEvents.map(e => renderEventRow(e, false))}
            </section>
          )}
        </>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={KR}>홍보물 업로드</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
            </div>

            {uploadSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="text-4xl">✅</div>
                <p className="text-sm font-semibold text-emerald-700" style={KR}>업로드 완료!</p>
                <p className="text-xs text-muted-foreground" style={KR}>관리자 검토 후 처리됩니다.</p>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="h-8 px-4 text-xs bg-primary text-white rounded hover:bg-primary/85" style={KR}
                >
                  닫기
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1" style={KR}>홍보물 이름</label>
                  <input
                    className="w-full border border-black/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    style={KR}
                    value={uploadName}
                    onChange={e => setUploadName(e.target.value)}
                    placeholder="예: 인스타그램 배너 v2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1" style={KR}>홍보 구역</label>
                  <select
                    className="w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                    style={KR}
                    value={uploadZoneId}
                    onChange={e => setUploadZoneId(e.target.value)}
                  >
                    <option value="">구역 미지정</option>
                    {zones?.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1" style={KR}>수정 내용 메모</label>
                  <input
                    className="w-full border border-black/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    style={KR}
                    value={uploadMemo}
                    onChange={e => setUploadMemo(e.target.value)}
                    placeholder="어떤 부분을 수정했는지 간단히 적어주세요"
                  />
                </div>
                <div
                  className="border-2 border-dashed border-black/15 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.psd,.ai,.zip,.pptx"
                  />
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-zinc-300 border-t-primary rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground" style={KR}>업로드 중...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium" style={KR}>클릭하여 파일 선택</p>
                      <p className="text-xs text-muted-foreground mt-1" style={KR}>이미지, PDF, PSD, AI, ZIP, PPTX · 최대 50MB</p>
                    </>
                  )}
                </div>
                {uploadError && <p className="text-xs text-destructive" style={KR}>{uploadError}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
