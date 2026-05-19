import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
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

  // Users
  const { data: users = [] } = useListAdminUsers({ query: { enabled: !!me, queryKey: getListAdminUsersQueryKey() } });
  const updateRole = useUpdateUserRole();
  const handleRoleChange = async (userId: number, role: string) => {
    await updateRole.mutateAsync({ userId, data: { role: role as "user" | "admin" | "super_admin" } });
    queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
  };

  useEffect(() => {
    setNPCMessage("시스템 설정 페이지예요. 구역 등록, 인사말, 가이드 PDF를 설정할 수 있어요! 궁금한 게 있으면 물어봐요 🦢");
  }, [setNPCMessage]);

  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (me && me.role !== "admin" && me.role !== "super_admin") return <Redirect to="/dashboard" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      {/* ── 홍보 구역 ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground" style={KR}>홍보 구역 관리</h2>
          <button onClick={() => { setEditingZoneId(null); setZoneForm(emptyZoneForm); setShowZoneForm(!showZoneForm); }}
            className="h-7 px-3 text-xs font-medium border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors" style={KR}>
            {showZoneForm && editingZoneId === null ? "취소" : "+ 새 구역"}
          </button>
        </div>

        {showZoneForm && (
          <div id="zone-form-section" className="border border-primary/30 rounded-lg bg-white overflow-hidden">
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
                  <label className={labelCls} style={KR}>유형</label>
                  <input className={inputCls} style={KR} value={zoneForm.type} onChange={e => setZoneForm(f => ({ ...f, type: e.target.value }))} placeholder="예: billboard" />
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
                  {["구역명", "유형", "파일 업로드", "동시 허용", ""].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground" style={KR}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {zones.map(z => (
                  <tr key={z.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {z.color && <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: z.color }} />}
                        <span className="font-medium text-sm" style={KR}>{z.name}</span>
                      </div>
                      {z.description && <p className="text-xs text-muted-foreground mt-0.5 ml-4.5" style={KR}>{z.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground font-mono">{z.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${z.requiresAssetUpload ? "text-emerald-600" : "text-zinc-400"}`} style={KR}>
                        {z.requiresAssetUpload ? "필요" : "불필요"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={KR}>
                      {z.maxConcurrent === null ? "무제한" : `${z.maxConcurrent}개`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleEditZone(z)}
                          className="h-6 px-2 text-xs border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors" style={KR}>수정</button>
                        <button onClick={() => handleDeleteZone(z.id, z.name)}
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

      {/* ── 사용자 권한 관리 ── */}
      <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-black/8 bg-zinc-50/60">
          <h2 className="text-sm font-semibold text-foreground" style={KR}>👥 사용자 권한 관리</h2>
          <p className="text-xs text-muted-foreground mt-0.5" style={KR}>사용자의 역할을 변경하면 즉시 적용됩니다.</p>
        </div>
        <div className="p-4">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6" style={KR}>등록된 사용자가 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8">
                  {["이름", "이메일", "권한"].map(h => (
                    <th key={h} className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground" style={KR}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="px-2 py-2.5 text-sm font-medium" style={KR}>{u.name || "-"}</td>
                    <td className="px-2 py-2.5 text-xs text-muted-foreground" style={KR}>{u.email}</td>
                    <td className="px-2 py-2.5">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="border border-black/15 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-primary"
                        style={KR}
                      >
                        {Object.entries(ROLE_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
