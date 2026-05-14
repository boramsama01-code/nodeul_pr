import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { Redirect, Link } from "wouter";
import {
  useGetMe,
  getGetMeQueryKey,
  useGetSystemSettings,
  useUpdateSystemSetting,
  useListPromotionZones,
  useCreatePromotionZone,
  useUpdatePromotionZone,
  useDeletePromotionZone,
  useListAdminUsers,
  useUpdateUserRole,
  getGetSystemSettingsQueryKey,
  getListAdminUsersQueryKey,
  getListPromotionZonesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelBadge } from "@/components/pixel/PixelBadge";
import { useUIStore } from "@/store/useUIStore";

type Tab = "npc" | "zones" | "users";

const ZONE_TYPE_OPTIONS = [
  { value: "instagram", label: "인스타그램" },
  { value: "billboard", label: "야외 전광판" },
  { value: "website_banner", label: "홈페이지 배너" },
  { value: "signage", label: "현장 사이니지" },
  { value: "other", label: "기타" },
];

const COLOR_PRESETS = ["#e1306c", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316"];

const emptyZoneForm = {
  name: "",
  type: "other",
  description: "",
  color: "#8b5cf6",
  requiresEndDate: true,
  requiresAssetUpload: true,
  allowMultipleFiles: false,
  sortOrder: 0,
  maxConcurrent: 1 as number | null,
};

export default function AdminSettingsPage() {
  const { isSignedIn } = useAuth();
  const { data: me } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } });
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>("npc");

  // ─── NPC Setting ─────────────────────────────────────────────────────────────
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

  // ─── Zones ───────────────────────────────────────────────────────────────────
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
    setZoneForm({
      name: zone.name,
      type: zone.type,
      description: zone.description || "",
      color: zone.color || "#8b5cf6",
      requiresEndDate: zone.requiresEndDate,
      requiresAssetUpload: zone.requiresAssetUpload,
      allowMultipleFiles: zone.allowMultipleFiles,
      sortOrder: zone.sortOrder,
      maxConcurrent: zone.maxConcurrent ?? null,
    });
    setShowZoneForm(true);
  };

  const handleNewZone = () => {
    setEditingZoneId(null);
    setZoneForm(emptyZoneForm);
    setShowZoneForm(true);
  };

  const handleZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setZoneError("");
    try {
      const payload = {
        ...zoneForm,
        maxConcurrent: zoneForm.maxConcurrent === null ? null : Number(zoneForm.maxConcurrent),
      };
      if (editingZoneId !== null) {
        await updateZone.mutateAsync({ zoneId: editingZoneId, data: payload });
      } else {
        await createZone.mutateAsync({ data: payload });
      }
      queryClient.invalidateQueries({ queryKey: getListPromotionZonesQueryKey() });
      setShowZoneForm(false);
      setEditingZoneId(null);
    } catch {
      setZoneError("저장에 실패했습니다.");
    }
  };

  const handleDeleteZone = async (id: number, name: string) => {
    if (!confirm(`"${name}" 구역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    await deleteZone.mutateAsync({ zoneId: id });
    queryClient.invalidateQueries({ queryKey: getListPromotionZonesQueryKey() });
  };

  // ─── Users ───────────────────────────────────────────────────────────────────
  const { data: users = [] } = useListAdminUsers({ query: { enabled: tab === "users" && !!me, queryKey: getListAdminUsersQueryKey() } });
  const updateRole = useUpdateUserRole();

  const handleRoleChange = async (userId: number, role: string) => {
    await updateRole.mutateAsync({ userId, data: { role: role as "user" | "admin" | "super_admin" } });
    queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
  };

  // ─── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setNPCMessage("⚙️ 시스템 설정 페이지입니다. 홍보 구역과 NPC 인사말을 관리하세요!");
  }, [setNPCMessage]);

  const role = me?.role;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (role && role !== "admin" && role !== "super_admin") return <Redirect to="/dashboard" />;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "npc", label: "NPC 설정", icon: "🐸" },
    { id: "zones", label: "홍보 구역", icon: "🗺️" },
    { id: "users", label: "사용자 관리", icon: "👥" },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-4 border-black pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-pixel text-primary">시스템 설정</h1>
          <p className="font-pixel-body text-lg text-muted-foreground mt-1">홍보 구역, NPC, 사용자 권한을 관리합니다</p>
        </div>
        <Link href="/admin"><PixelButton variant="ghost" size="sm">← Admin HUD</PixelButton></Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-4 border-black p-1 bg-white">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 font-pixel text-xs py-2 px-1 border-2 transition-colors ${
              tab === t.id ? "bg-primary text-white border-primary" : "border-transparent hover:bg-muted"
            }`}
          >
            <span className="hidden sm:inline">{t.icon} </span>{t.label}
          </button>
        ))}
      </div>

      {/* ── NPC Tab ────────────────────────────────────────────────────────────── */}
      {tab === "npc" && (
        <PixelCard>
          <h2 className="font-pixel text-sm mb-4 border-b-4 border-black pb-2">🐸 맹꽁이 인사말 설정</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-pixel text-xs mb-2">첫 화면 인사말</label>
              <textarea
                rows={4}
                className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white resize-none"
                value={npcText}
                onChange={e => setNpcText(e.target.value)}
                placeholder="예: 안녕하세요! 노들섬 홍보 담당자 맹꽁이입니다 🐸"
              />
              <p className="font-pixel-body text-sm text-muted-foreground mt-1">이 메시지는 사이트 첫 화면에서 표시됩니다.</p>
            </div>
            <div className="border-4 border-black p-3 bg-muted/30">
              <p className="font-pixel text-xs mb-2">미리보기</p>
              <p className="font-pixel-body text-lg">{npcText || "(인사말 없음)"}</p>
            </div>
            <PixelButton
              variant="primary"
              onClick={handleSaveNpc}
              disabled={updateSetting.isPending || !npcText.trim()}
            >
              {updateSetting.isPending ? "저장 중..." : "💾 저장"}
            </PixelButton>
            {updateSetting.isSuccess && (
              <p className="font-pixel-body text-sm text-green-600 border-2 border-green-600 px-3 py-2">✅ 저장되었습니다!</p>
            )}
          </div>
        </PixelCard>
      )}

      {/* ── Zones Tab ──────────────────────────────────────────────────────────── */}
      {tab === "zones" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="font-pixel-body text-lg text-muted-foreground">총 {zones.length}개 구역</p>
            <PixelButton variant="primary" size="sm" onClick={handleNewZone}>+ 새 구역</PixelButton>
          </div>

          {/* Zone Form */}
          {showZoneForm && (
            <PixelCard className="border-primary">
              <h3 className="font-pixel text-sm mb-4 border-b-4 border-black pb-2">
                {editingZoneId !== null ? "구역 편집" : "새 구역 추가"}
              </h3>
              <form onSubmit={handleZoneSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-pixel text-xs mb-1">구역명 *</label>
                    <input
                      required
                      className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                      value={zoneForm.name}
                      onChange={e => setZoneForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="예: 노들마당 전광판"
                    />
                  </div>
                  <div>
                    <label className="block font-pixel text-xs mb-1">유형 *</label>
                    <select
                      className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                      value={zoneForm.type}
                      onChange={e => setZoneForm(f => ({ ...f, type: e.target.value }))}
                    >
                      {ZONE_TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-pixel text-xs mb-1">설명</label>
                  <textarea
                    rows={2}
                    className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white resize-none"
                    value={zoneForm.description}
                    onChange={e => setZoneForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="구역 설명"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-pixel text-xs mb-1">색상</label>
                    <div className="flex gap-2 flex-wrap">
                      {COLOR_PRESETS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setZoneForm(f => ({ ...f, color: c }))}
                          className={`w-7 h-7 border-2 ${zoneForm.color === c ? "border-black scale-125" : "border-transparent"} transition-transform`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={zoneForm.color}
                        onChange={e => setZoneForm(f => ({ ...f, color: e.target.value }))}
                        className="w-7 h-7 border-2 border-black cursor-pointer"
                        title="직접 선택"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-pixel text-xs mb-1">정렬 순서</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                      value={zoneForm.sortOrder}
                      onChange={e => setZoneForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                {/* Behavior Settings */}
                <div className="border-4 border-black p-3 space-y-3 bg-muted/20">
                  <p className="font-pixel text-xs">구역 동작 설정</p>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-primary"
                      checked={zoneForm.requiresEndDate}
                      onChange={e => setZoneForm(f => ({ ...f, requiresEndDate: e.target.checked }))}
                    />
                    <div>
                      <p className="font-pixel-body text-base font-bold">종료일 필요</p>
                      <p className="font-pixel-body text-sm text-muted-foreground">체크 해제 시 시작일만 입력 (업로드형 채널)</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-primary"
                      checked={zoneForm.requiresAssetUpload}
                      onChange={e => setZoneForm(f => ({ ...f, requiresAssetUpload: e.target.checked }))}
                    />
                    <div>
                      <p className="font-pixel-body text-base font-bold">홍보물 업로드 필요</p>
                      <p className="font-pixel-body text-sm text-muted-foreground">체크 해제 시 파일 없이 신청 가능</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-primary"
                      checked={zoneForm.allowMultipleFiles}
                      onChange={e => setZoneForm(f => ({ ...f, allowMultipleFiles: e.target.checked }))}
                    />
                    <div>
                      <p className="font-pixel-body text-base font-bold">다중 파일 업로드</p>
                      <p className="font-pixel-body text-sm text-muted-foreground">체크 시 여러 파일 동시 업로드 가능</p>
                    </div>
                  </label>

                  <div>
                    <p className="font-pixel-body text-base font-bold mb-1">하루 동시 허용 수</p>
                    <div className="flex gap-2 items-center flex-wrap">
                      <button
                        type="button"
                        onClick={() => setZoneForm(f => ({ ...f, maxConcurrent: null }))}
                        className={`font-pixel-body text-sm px-3 py-1 border-2 border-black transition-colors ${zoneForm.maxConcurrent === null ? "bg-primary text-white" : "bg-white hover:bg-muted"}`}
                      >
                        무제한
                      </button>
                      {[1, 2, 3, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setZoneForm(f => ({ ...f, maxConcurrent: n }))}
                          className={`font-pixel-body text-sm px-3 py-1 border-2 border-black transition-colors ${zoneForm.maxConcurrent === n ? "bg-primary text-white" : "bg-white hover:bg-muted"}`}
                        >
                          {n}개
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        placeholder="직접 입력"
                        className="border-4 border-black px-2 py-1 font-pixel-body text-base w-24 focus:outline-none focus:border-primary bg-white"
                        value={zoneForm.maxConcurrent ?? ""}
                        onChange={e => setZoneForm(f => ({ ...f, maxConcurrent: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <p className="font-pixel-body text-sm text-muted-foreground mt-1">
                      {zoneForm.maxConcurrent === null
                        ? "무제한: 같은 날 여러 이벤트 동시 신청 가능"
                        : `${zoneForm.maxConcurrent}개: 같은 기간에 최대 ${zoneForm.maxConcurrent}개까지만 허용`}
                    </p>
                  </div>
                </div>

                {zoneError && <p className="font-pixel-body text-sm text-destructive border-2 border-destructive px-3 py-2">{zoneError}</p>}

                <div className="flex gap-3">
                  <PixelButton type="submit" variant="primary" disabled={createZone.isPending || updateZone.isPending}>
                    {createZone.isPending || updateZone.isPending ? "저장 중..." : "💾 저장"}
                  </PixelButton>
                  <PixelButton type="button" variant="ghost" onClick={() => { setShowZoneForm(false); setEditingZoneId(null); }}>
                    취소
                  </PixelButton>
                </div>
              </form>
            </PixelCard>
          )}

          {/* Zones List */}
          {zonesLoading ? (
            <div className="text-center py-8"><div className="animate-bounce text-3xl">⏳</div></div>
          ) : zones.length === 0 ? (
            <div className="text-center py-12 border-4 border-dashed border-black bg-white">
              <div className="text-4xl mb-4">🗺️</div>
              <p className="font-pixel text-sm text-muted-foreground">등록된 홍보 구역이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {zones.map(zone => (
                <div key={zone.id} className="bg-white border-4 border-black p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div
                    className="w-4 h-4 border-2 border-black flex-shrink-0"
                    style={{ backgroundColor: zone.color || "#888" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-pixel text-xs">{zone.name}</span>
                      {!zone.isActive && <PixelBadge variant="secondary">비활성</PixelBadge>}
                    </div>
                    <div className="font-pixel-body text-sm text-muted-foreground mt-1 flex flex-wrap gap-2">
                      <span>{zone.type}</span>
                      <span>·</span>
                      <span>{zone.requiresEndDate ? "기간 설정" : "날짜만"}</span>
                      <span>·</span>
                      <span>{zone.maxConcurrent === null ? "무제한" : `최대 ${zone.maxConcurrent}개/일`}</span>
                      {zone.requiresAssetUpload && <><span>·</span><span>업로드 필요</span></>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <PixelButton size="sm" variant="secondary" onClick={() => handleEditZone(zone)}>편집</PixelButton>
                    <PixelButton size="sm" variant="ghost" onClick={() => handleDeleteZone(zone.id, zone.name)}>삭제</PixelButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Users Tab ──────────────────────────────────────────────────────────── */}
      {tab === "users" && (
        <div className="space-y-2">
          <p className="font-pixel-body text-lg text-muted-foreground">총 {users.length}명</p>
          {users.map(u => (
            <div key={u.id} className="bg-white border-4 border-black p-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-pixel text-xs truncate">{u.email}</div>
                {u.name && <div className="font-pixel-body text-base text-muted-foreground">{u.name}</div>}
                <div className="font-pixel-body text-sm text-muted-foreground">{u.createdAt.slice(0, 10)} 가입</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  className="border-4 border-black px-2 py-1 font-pixel-body text-base focus:outline-none focus:border-primary bg-white"
                  value={u.role}
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                  disabled={u.id === me?.id}
                >
                  <option value="user">일반 사용자</option>
                  <option value="admin">관리자</option>
                  <option value="super_admin">슈퍼 관리자</option>
                </select>
                {u.id === me?.id && (
                  <PixelBadge variant="primary">나</PixelBadge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
