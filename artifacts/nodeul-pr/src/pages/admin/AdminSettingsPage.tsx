import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import {
  useGetMe, getGetMeQueryKey,
  useGetSystemSettings, useUpdateSystemSetting,
  useListPromotionZones, useCreatePromotionZone, useUpdatePromotionZone, useDeletePromotionZone,
  getGetSystemSettingsQueryKey, getListPromotionZonesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/store/useUIStore";
import { supabase } from "@/lib/supabase";
import { BaekroSpeech } from "@/components/pixel/MaengkongiSpeech";

const COLOR_PRESETS = ["#e1306c", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316"];
const emptyZoneForm = {
  name: "", type: "other", description: "", color: "#8b5cf6",
  requiresEndDate: true, requiresAssetUpload: true, allowMultipleFiles: false,
  sortOrder: 0, maxConcurrent: 1 as number | null,
};
const ROLE_LABELS: Record<string, string> = {
  user: "일반 사용자", admin: "관리자", super_admin: "슈퍼 관리자",
};

const KR = { fontFamily: "'Noto Sans KR', sans-serif" };
const inputCls = "w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1";

export default function AdminSettingsPage() {
  const { isSignedIn } = useAuth();
  const { data: me } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } });
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const queryClient = useQueryClient();

  const { data: settings = [] } = useGetSystemSettings({ query: { enabled: !!me, queryKey: getGetSystemSettingsQueryKey() } });
  const updateSetting = useUpdateSystemSetting();

  // NPC
  const [npcText, setNpcText] = useState("");
  useEffect(() => {
    const found = settings.find(s => s.key === "npc_greeting");
    if (found) setNpcText(found.value);
  }, [settings]);
  const handleSaveNpc = async () => {
    await updateSetting.mutateAsync({ key: "npc_greeting", data: { value: npcText } });
    queryClient.invalidateQueries({ queryKey: getGetSystemSettingsQueryKey() });
    setNPCMessage(npcText);
  };

  // PDF guide
  const pdfUrl = settings.find(s => s.key === "zone_guide_pdf")?.value ?? "";
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfSaved, setPdfSaved] = useState(false);
  const pdfFileRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setPdfError("PDF 파일만 업로드 가능합니다."); return; }
    setPdfUploading(true); setPdfError(""); setPdfSaved(false);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";
      const resp = await fetch(`${apiBase}/admin/upload-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ base64, filename: file.name, mimeType: file.type }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as any).error || "업로드 실패");
      }
      const { url } = await resp.json() as { url: string };
      await updateSetting.mutateAsync({ key: "zone_guide_pdf", data: { value: url } });
      queryClient.invalidateQueries({ queryKey: getGetSystemSettingsQueryKey() });
      setPdfSaved(true);
    } catch (err: any) {
      setPdfError(err.message || "업로드에 실패했습니다.");
    } finally {
      setPdfUploading(false);
      if (pdfFileRef.current) pdfFileRef.current.value = "";
    }
  };

  // Zones
  const { data: zones = [], isLoading: zonesLoading } = useListPromotionZones({ query: { enabled: !!me, queryKey: getListPromotionZonesQueryKey() } });
  const createZone = useCreatePromotionZone();
  const updateZone = useUpdatePromotionZone();
  const deleteZone = useDeletePromotionZone();
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [zoneForm, setZoneForm] = useState(emptyZoneForm);
  const [zoneError, setZoneError] = useState("");

  const handleEditZone = (zone: typeof zones[0]) => {
    setEditingZoneId(zone.id);
    setZoneForm({ name: zone.name, type: zone.type, description: zone.description || "", color: zone.color || "#8b5cf6", requiresEndDate: zone.requiresEndDate, requiresAssetUpload: zone.requiresAssetUpload, allowMultipleFiles: zone.allowMultipleFiles, sortOrder: zone.sortOrder, maxConcurrent: zone.maxConcurrent ?? null });
    setShowZoneForm(true);
    setTimeout(() => document.getElementById("zone-form-section")?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const handleZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setZoneError("");
    try {
      const payload = { ...zoneForm, maxConcurrent: zoneForm.maxConcurrent === null ? null : Number(zoneForm.maxConcurrent) };
      if (editingZoneId !== null) await updateZone.mutateAsync({ zoneId: editingZoneId, data: payload });
      else await createZone.mutateAsync({ data: payload });
      queryClient.invalidateQueries({ queryKey: getListPromotionZonesQueryKey() });
      setShowZoneForm(false); setEditingZoneId(null);
    } catch { setZoneError("저장에 실패했습니다."); }
  };
  const handleDeleteZone = async (id: number, name: string) => {
    if (!confirm(`"${name}" 구역을 삭제하시겠습니까?`)) return;
    await deleteZone.mutateAsync({ zoneId: id });
    queryClient.invalidateQueries({ queryKey: getListPromotionZonesQueryKey() });
  };


  useEffect(() => {
    setNPCMessage("시스템 설정 페이지예요. 구역 등록, 인사말, 가이드 PDF를 설정할 수 있어요! 궁금한 게 있으면 물어봐요 🦢");
  }, [setNPCMessage]);

  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (me && me.role !== "admin" && me.role !== "super_admin") return <Redirect to="/dashboard" />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-bold text-foreground" style={KR}>시스템 설정</h1>
      </div>

      <BaekroSpeech mood="normal">
        인사말·가이드 PDF·홍보 구역·사용자 권한을 이 페이지에서 모두 관리할 수 있어요!
        가이드 PDF는 <strong>행사 등록 폼 상단</strong>에 링크로 표시되어 사용자들이 다운받을 수 있어요 📄
      </BaekroSpeech>

      {/* ── 맹꽁이 인사말 ── */}
      <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-black/8 bg-zinc-50/60">
          <h2 className="text-sm font-semibold text-foreground" style={KR}>🐸 맹꽁이 첫 화면 인사말</h2>
          <p className="text-xs text-muted-foreground mt-0.5" style={KR}>사이트 첫 화면에서 맹꽁이가 표시하는 메시지입니다.</p>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className={labelCls} style={KR}>인사말 내용</label>
            <textarea rows={4} className={`${inputCls} resize-none`} style={KR}
              value={npcText} onChange={e => setNpcText(e.target.value)}
              placeholder="예: 안녕하세요! 노들섬 홍보 담당자 맹꽁이입니다 🐸" />
          </div>
          {npcText && (
            <div className="border border-black/8 rounded px-3 py-2.5 bg-zinc-50/60">
              <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-medium" style={KR}>미리보기</p>
              <p className="text-sm" style={KR}>{npcText}</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button onClick={handleSaveNpc} disabled={updateSetting.isPending || !npcText.trim()}
              className="h-8 px-4 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 transition-colors disabled:opacity-50" style={KR}>
              {updateSetting.isPending ? "저장 중..." : "저장"}
            </button>
            {updateSetting.isSuccess && <span className="text-xs text-emerald-600" style={KR}>✓ 저장되었습니다</span>}
          </div>
        </div>
      </div>

      {/* ── 홍보 가이드 PDF ── */}
      <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-black/8 bg-zinc-50/60">
          <h2 className="text-sm font-semibold text-foreground" style={KR}>📄 홍보 가이드 PDF</h2>
          <p className="text-xs text-muted-foreground mt-0.5" style={KR}>
            행사 등록 폼 상단에 다운로드 링크로 표시됩니다. 교체 시 기존 링크는 새 파일로 대체됩니다.
          </p>
        </div>
        <div className="p-4 space-y-4">
          {pdfUrl ? (
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-emerald-800" style={KR}>현재 등록된 가이드 PDF</p>
                <p className="text-xs text-muted-foreground mt-0.5" style={KR}>행사 등록 폼 상단에서 사용자가 다운로드할 수 있습니다.</p>
              </div>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <button className="h-8 px-3 text-xs font-medium border border-emerald-300 text-emerald-700 rounded bg-white hover:bg-emerald-50 transition-colors flex-shrink-0" style={KR}>
                  📥 PDF 확인
                </button>
              </a>
            </div>
          ) : (
            <div className="border border-dashed border-black/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground" style={KR}>등록된 가이드 PDF가 없습니다.</p>
            </div>
          )}
          <div>
            <label className={labelCls} style={KR}>{pdfUrl ? "PDF 교체" : "PDF 업로드"}</label>
            <div
              className="border-2 border-dashed border-black/15 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => pdfFileRef.current?.click()}
            >
              <input ref={pdfFileRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
              {pdfUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-zinc-300 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground" style={KR}>업로드 중...</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium" style={KR}>📄 클릭하여 PDF 파일 선택</p>
                  <p className="text-xs text-muted-foreground mt-1" style={KR}>PDF 파일만 업로드 가능 · 최대 50MB</p>
                </>
              )}
            </div>
            {pdfError && <p className="text-xs text-destructive mt-1" style={KR}>{pdfError}</p>}
            {pdfSaved && <p className="text-xs text-emerald-600 mt-1" style={KR}>✓ PDF가 성공적으로 업로드되었습니다.</p>}
          </div>
        </div>
      </div>


    </div>
  );
}
