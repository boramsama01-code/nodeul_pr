import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Link } from "wouter";
import {
  useGetMe, getGetMeQueryKey,
  useGetSystemSettings, useUpdateSystemSetting,
  useListPromotionZones, useCreatePromotionZone, useUpdatePromotionZone, useDeletePromotionZone,
  useListAdminUsers, useUpdateUserRole,
  getGetSystemSettingsQueryKey, getListAdminUsersQueryKey, getListPromotionZonesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/store/useUIStore";
import { supabase } from "@/lib/supabase";

type Tab = "npc" | "zones" | "users" | "pdf";

const DEFAULT_ZONE_TYPES = [
  { value: "instagram", label: "인스타그램" },
  { value: "billboard", label: "야외 전광판" },
  { value: "website_banner", label: "홈페이지 배너" },
  { value: "signage", label: "현장 사이니지" },
  { value: "other", label: "기타" },
];
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
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AdminSettingsPage() {
  const { isSignedIn } = useAuth();
  const { data: me } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } });
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("npc");

  // NPC
  const { data: settings = [] } = useGetSystemSettings({ query: { enabled: !!me, queryKey: getGetSystemSettingsQueryKey() } });
  const updateSetting = useUpdateSystemSetting();
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
      const path = `guides/zone_guide_${Date.now()}.pdf`;
      const { data, error } = await supabase.storage.from("nodeul-assets").upload(path, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("nodeul-assets").getPublicUrl(data.path);
      await updateSetting.mutateAsync({ key: "zone_guide_pdf", data: { value: urlData.publicUrl } });
      queryClient.invalidateQueries({ queryKey: getGetSystemSettingsQueryKey() });
      setPdfSaved(true);
    } catch (err: any) {
      setPdfError(err.message || "업로드에 실패했습니다.");
    } finally {
      setPdfUploading(false);
      if (pdfFileRef.current) pdfFileRef.current.value = "";
    }
  };

  // Zone types (stored in system_settings as JSON)
  const zoneTypesRaw = settings.find(s => s.key === "zone_type_options")?.value ?? "";
  const zoneTypeOptions: { value: string; label: string }[] = (() => {
    try { return JSON.parse(zoneTypesRaw); } catch { return DEFAULT_ZONE_TYPES; }
  })();
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [newTypeValue, setNewTypeValue] = useState("");
  const [zoneTypeError, setZoneTypeError] = useState("");

  const saveZoneTypes = async (types: { value: string; label: string }[]) => {
    await updateSetting.mutateAsync({ key: "zone_type_options", data: { value: JSON.stringify(types) } });
    queryClient.invalidateQueries({ queryKey: getGetSystemSettingsQueryKey() });
  };

  const handleAddZoneType = async () => {
    if (!newTypeLabel.trim()) { setZoneTypeError("유형 이름을 입력해 주세요."); return; }
    setZoneTypeError("");
    const val = newTypeValue.trim() || newTypeLabel.trim().toLowerCase().replace(/\s+/g, "_");
    const updated = [...zoneTypeOptions, { value: val, label: newTypeLabel.trim() }];
    await saveZoneTypes(updated);
    setNewTypeLabel(""); setNewTypeValue("");
  };

  const handleDeleteZoneType = async (val: string) => {
    if (!confirm(`"${val}" 유형을 삭제하시겠습니까?`)) return;
    await saveZoneTypes(zoneTypeOptions.filter(t => t.value !== val));
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

  // Users
  const { data: users = [] } = useListAdminUsers({ query: { enabled: tab === "users" && !!me, queryKey: getListAdminUsersQueryKey() } });
  const updateRole = useUpdateUserRole();
  const handleRoleChange = async (userId: number, role: string) => {
    await updateRole.mutateAsync({ userId, data: { role: role as "user" | "admin" | "super_admin" } });
    queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
  };

  useEffect(() => { setNPCMessage("⚙️ 시스템 설정 페이지입니다. 홍보 구역, NPC 인사말, 사용자 권한을 관리하세요!"); }, [setNPCMessage]);

  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (me && me.role !== "admin" && me.role !== "super_admin") return <Redirect to="/dashboard" />;

  const tabs: { id: Tab; label: string }[] = [
    { id: "npc", label: "맹꽁이 인사말" },
    { id: "zones", label: "홍보 구역" },
    { id: "pdf", label: "가이드 PDF" },
    { id: "users", label: "사용자 관리" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={KR}>시스템 설정</h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={KR}>홍보 구역 · 맹꽁이 인사말 · 가이드 PDF · 사용자 권한 관리</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground" style={KR}>
            내 권한: <span className={`font-semibold ${me?.role === "super_admin" ? "text-violet-600" : "text-primary"}`}>{ROLE_LABELS[me?.role ?? ""] ?? me?.role}</span>
          </span>
          <Link href="/admin">
            <button className="h-7 px-3 text-xs border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors" style={KR}>← 대시보드</button>
          </Link>
        </div>
      </div>

      <div className="flex gap-0 border-b border-black/10">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            style={KR}>{t.label}</button>
        ))}
      </div>

      {/* ── NPC 인사말 ── */}
      {tab === "npc" && (
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
      )}

      {/* ── 가이드 PDF ── */}
      {tab === "pdf" && (
        <div className="space-y-4">
          <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-black/8 bg-zinc-50/60">
              <h2 className="text-sm font-semibold text-foreground" style={KR}>📄 홍보 가이드 PDF</h2>
              <p className="text-xs text-muted-foreground mt-0.5" style={KR}>
                사용자들이 홍보물 신청 전 다운로드할 수 있는 가이드 PDF입니다. 교체 시 기존 링크는 새 파일로 대체됩니다.
              </p>
            </div>
            <div className="p-4 space-y-4">
              {pdfUrl ? (
                <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-emerald-800" style={KR}>현재 등록된 가이드 PDF</p>
                    <p className="text-xs text-muted-foreground mt-0.5 break-all" style={KR}>{pdfUrl}</p>
                  </div>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <button className="h-8 px-3 text-xs font-medium border border-emerald-300 text-emerald-700 rounded bg-white hover:bg-emerald-50 transition-colors flex-shrink-0" style={KR}>
                      📥 다운로드 확인
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
      )}

      {/* ── 홍보 구역 ── */}
      {tab === "zones" && (
        <div className="space-y-4">
          {/* Zone Type Management */}
          <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-black/8 bg-zinc-50/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={KR}>홍보구역 유형 관리</h3>
                <p className="text-xs text-muted-foreground mt-0.5" style={KR}>구역 추가 시 선택할 수 있는 유형 목록입니다.</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="divide-y divide-black/5">
                {zoneTypeOptions.map(t => (
                  <div key={t.value} className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm font-medium" style={KR}>{t.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground font-mono">{t.value}</span>
                    </div>
                    <button onClick={() => handleDeleteZoneType(t.value)}
                      className="h-6 px-2 text-xs border border-red-200 text-red-600 rounded bg-red-50 hover:bg-red-100 transition-colors" style={KR}>삭제</button>
                  </div>
                ))}
              </div>
              <div className="border-t border-black/8 pt-3">
                <p className="text-xs font-medium mb-2" style={KR}>새 유형 추가</p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-black/15 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-primary"
                    style={KR} placeholder="유형 이름 (예: 실내 배너)"
                    value={newTypeLabel} onChange={e => setNewTypeLabel(e.target.value)} />
                  <button onClick={handleAddZoneType}
                    className="h-8 px-3 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 transition-colors" style={KR}>
                    추가
                  </button>
                </div>
                {zoneTypeError && <p className="text-xs text-destructive mt-1" style={KR}>{zoneTypeError}</p>}
              </div>
            </div>
          </div>

          {/* Zone List */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground" style={KR}>총 {zones.length}개 구역</span>
            <button onClick={() => { setEditingZoneId(null); setZoneForm(emptyZoneForm); setShowZoneForm(!showZoneForm); }}
              className="h-7 px-3 text-xs font-medium border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors" style={KR}>
              {showZoneForm && editingZoneId === null ? "취소" : "+ 새 구역"}
            </button>
          </div>

          {showZoneForm && (
            <div className="border border-primary/30 rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-black/8 bg-primary/5">
                <h3 className="text-sm font-semibold text-foreground" style={KR}>{editingZoneId !== null ? "구역 편집" : "새 구역 추가"}</h3>
              </div>
              <form onSubmit={handleZoneSubmit} className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={KR}>구역명 *</label>
                    <input required className={inputCls} style={KR} value={zoneForm.name} onChange={e => setZoneForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 노들마당 전광판" />
                  </div>
                  <div>
                    <label className={labelCls} style={KR}>유형 *</label>
                    <select className={inputCls} style={KR} value={zoneForm.type} onChange={e => setZoneForm(f => ({ ...f, type: e.target.value }))}>
                      {zoneTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls} style={KR}>설명</label>
                  <textarea rows={2} className={`${inputCls} resize-none`} style={KR} value={zoneForm.description} onChange={e => setZoneForm(f => ({ ...f, description: e.target.value }))} placeholder="구역 설명" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} style={KR}>색상</label>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {COLOR_PRESETS.map(c => (
                        <button key={c} type="button" onClick={() => setZoneForm(f => ({ ...f, color: c }))}
                          className={`w-6 h-6 rounded transition-transform ${zoneForm.color === c ? "ring-2 ring-offset-1 ring-zinc-800 scale-110" : "hover:scale-105"}`}
                          style={{ backgroundColor: c }} />
                      ))}
                      <input type="color" value={zoneForm.color} onChange={e => setZoneForm(f => ({ ...f, color: e.target.value }))}
                        className="w-6 h-6 rounded cursor-pointer border border-black/15" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls} style={KR}>정렬 순서</label>
                    <input type="number" min={0} className={inputCls} value={zoneForm.sortOrder} onChange={e => setZoneForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="border border-black/8 rounded p-3 space-y-2.5 bg-zinc-50/60">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" style={KR}>동작 설정</p>
                  {[
                    { key: "requiresEndDate", label: "종료일 필요", desc: "체크 해제 시 시작일만 입력" },
                    { key: "requiresAssetUpload", label: "홍보물 업로드 필요", desc: "파일 없이 신청 불가" },
                    { key: "allowMultipleFiles", label: "다중 파일 업로드", desc: "여러 파일 동시 업로드 허용" },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" className="accent-primary"
                        checked={zoneForm[item.key as keyof typeof zoneForm] as boolean}
                        onChange={e => setZoneForm(f => ({ ...f, [item.key]: e.target.checked }))} />
                      <div>
                        <p className="text-sm font-medium" style={KR}>{item.label}</p>
                        <p className="text-xs text-muted-foreground" style={KR}>{item.desc}</p>
                      </div>
                    </label>
                  ))}
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={KR}>하루 동시 허용 수</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {([null, 1, 2, 3, 5] as (number | null)[]).map(n => (
                        <button key={String(n)} type="button" onClick={() => setZoneForm(f => ({ ...f, maxConcurrent: n }))}
                          className={`h-7 px-3 text-xs rounded border transition-colors ${zoneForm.maxConcurrent === n ? "bg-primary text-white border-primary" : "bg-white border-black/15 hover:bg-muted/60"}`} style={KR}>
                          {n === null ? "무제한" : `${n}개`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {zoneError && <p className="text-xs text-destructive" style={KR}>{zoneError}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={createZone.isPending || updateZone.isPending}
                    className="h-8 px-4 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 transition-colors disabled:opacity-50" style={KR}>
                    {createZone.isPending || updateZone.isPending ? "저장 중..." : "저장"}
                  </button>
                  <button type="button" onClick={() => { setShowZoneForm(false); setEditingZoneId(null); }}
                    className="h-8 px-3 text-xs border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors" style={KR}>
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {zonesLoading ? (
            <div className="flex items-center justify-center p-8 gap-2">
              <div className="w-4 h-4 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground" style={KR}>불러오는 중...</span>
            </div>
          ) : zones.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-black/15 rounded-lg bg-white">
              <p className="text-sm text-muted-foreground" style={KR}>등록된 홍보 구역이 없습니다.</p>
            </div>
          ) : (
            <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/8 bg-zinc-50/60">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground" style={KR}>구역명</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell" style={KR}>유형</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell" style={KR}>동시 허용</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell" style={KR}>상태</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground" style={KR}>액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {zones.map(zone => (
                    <tr key={zone.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: zone.color || "#888" }} />
                          <span className="font-medium" style={KR}>{zone.name}</span>
                        </div>
                        {zone.description && <p className="text-xs text-muted-foreground ml-4 mt-0.5 truncate" style={KR}>{zone.description}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell" style={KR}>
                        {zoneTypeOptions.find(o => o.value === zone.type)?.label ?? zone.type}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell" style={KR}>
                        {zone.maxConcurrent === null ? "무제한" : `${zone.maxConcurrent}개/일`}
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded border ${zone.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"}`} style={KR}>
                          {zone.isActive ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleEditZone(zone)}
                            className="h-6 px-2 text-xs border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors" style={KR}>편집</button>
                          <button onClick={() => handleDeleteZone(zone.id, zone.name)}
                            className="h-6 px-2 text-xs border border-red-200 text-red-600 rounded bg-red-50 hover:bg-red-100 transition-colors" style={KR}>삭제</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 사용자 관리 ── */}
      {tab === "users" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground" style={KR}>총 {users.length}명 가입</span>
          </div>
          <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 bg-zinc-50/60">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground" style={KR}>사용자</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell" style={KR}>이메일</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell" style={KR}>가입일</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-right" style={KR}>권한</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {(users as any[]).map(u => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        {u.organizationName && <p className="text-sm font-medium" style={KR}>{u.organizationName}</p>}
                        {(u.name || u.contactName) && (
                          <p className="text-xs text-muted-foreground" style={KR}>{u.name || u.contactName}</p>
                        )}
                        {!u.organizationName && !u.name && !u.contactName && (
                          <p className="text-sm text-muted-foreground" style={KR}>{u.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell truncate max-w-[200px]">{u.email}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">{u.createdAt?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          className="h-7 px-2 text-xs border border-black/15 rounded bg-white focus:outline-none focus:border-primary transition-colors" style={KR}
                          value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                          disabled={u.id === me?.id}>
                          <option value="user">일반 사용자</option>
                          <option value="admin">관리자</option>
                          <option value="super_admin">슈퍼 관리자</option>
                        </select>
                        {u.id === me?.id && <span className="text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200" style={KR}>나</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
