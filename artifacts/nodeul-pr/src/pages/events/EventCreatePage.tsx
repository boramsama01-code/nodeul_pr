import React, { useState } from "react";
import { useAuth } from "@clerk/react";
import { Redirect, useLocation } from "wouter";
import { useCreateEvent, useListOrganizations, useCreateOrganization, useGetMe } from "@workspace/api-client-react";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import { useUIStore } from "@/store/useUIStore";

export default function EventCreatePage() {
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const setNPCMessage = useUIStore(s => s.setNPCMessage);

  const { data: me } = useGetMe();
  const { data: orgs } = useListOrganizations({});
  const createOrg = useCreateOrganization();
  const createEvent = useCreateEvent();

  const [step, setStep] = useState<"org" | "event">("org");
  const [orgForm, setOrgForm] = useState({ name: "", contactName: "", contactEmail: "", contactPhone: "" });
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    venue: "",
    contactName: "",
    contactEmail: "",
    tags: "",
  });
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (me?.organizationId) setStep("event");
    setNPCMessage("새 행사 홍보를 신청해요! 먼저 단체 정보를 입력하세요 🐸");
  }, [me]);

  React.useEffect(() => {
    if (orgs && orgs.length > 0 && me?.organizationId) {
      setStep("event");
      setNPCMessage("단체 정보 확인! 이제 행사 정보를 입력하세요 🐸");
    }
  }, [orgs]);

  if (!isSignedIn) return <Redirect to="/sign-in" />;

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createOrg.mutateAsync({ data: orgForm });
      setStep("event");
      setNPCMessage("단체 등록 완료! 이제 행사 정보를 입력하세요 🐸");
    } catch (err: any) {
      setError("단체 등록에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const tags = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
      const ev = await createEvent.mutateAsync({
        data: {
          title: form.title,
          description: form.description || undefined,
          startDate: form.startDate,
          endDate: form.endDate,
          venue: form.venue || undefined,
          contactName: form.contactName || undefined,
          contactEmail: form.contactEmail || undefined,
          tags: tags.length ? tags : undefined,
        }
      });
      setNPCMessage("행사 신청 완료! 관리자 승인을 기다려 주세요 🐸");
      setLocation(`/events/${ev.id}`);
    } catch (err: any) {
      setError("행사 신청에 실패했습니다. 입력 내용을 확인해 주세요.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="border-b-4 border-black pb-4">
        <h1 className="text-3xl font-pixel text-primary">새 행사 홍보 신청</h1>
        <p className="font-pixel-body text-xl text-muted-foreground mt-2">단체 정보와 행사 정보를 입력해 주세요</p>
      </div>

      {/* 단계 표시 */}
      <div className="flex gap-4 font-pixel text-sm">
        <div className={`px-4 py-2 border-4 border-black ${step === "org" ? "bg-primary text-white" : "bg-success/20"}`}>
          {step === "event" ? "✓" : "1"} 단체 정보
        </div>
        <div className={`px-4 py-2 border-4 border-black ${step === "event" ? "bg-primary text-white" : "bg-muted"}`}>
          2 행사 정보
        </div>
      </div>

      {step === "org" && (
        <PixelCard>
          <h2 className="font-pixel text-xl mb-6 border-b-4 border-black pb-2">단체 정보 입력</h2>
          <form onSubmit={handleOrgSubmit} className="space-y-4">
            <div>
              <label className="block font-pixel text-sm mb-2">단체명 / 사업명 *</label>
              <input
                required
                className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                value={orgForm.name}
                onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))}
                placeholder="예: 서울시 문화재단"
              />
            </div>
            <div>
              <label className="block font-pixel text-sm mb-2">담당자 이름 *</label>
              <input
                required
                className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                value={orgForm.contactName}
                onChange={e => setOrgForm(f => ({ ...f, contactName: e.target.value }))}
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block font-pixel text-sm mb-2">이메일 *</label>
              <input
                required
                type="email"
                className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                value={orgForm.contactEmail}
                onChange={e => setOrgForm(f => ({ ...f, contactEmail: e.target.value }))}
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <label className="block font-pixel text-sm mb-2">연락처</label>
              <input
                className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                value={orgForm.contactPhone}
                onChange={e => setOrgForm(f => ({ ...f, contactPhone: e.target.value }))}
                placeholder="02-1234-5678"
              />
            </div>
            {error && <p className="font-pixel-body text-destructive border-2 border-destructive px-3 py-2">{error}</p>}
            <PixelButton type="submit" variant="primary" size="md" disabled={createOrg.isPending}>
              {createOrg.isPending ? "등록 중..." : "다음 단계 →"}
            </PixelButton>
          </form>
        </PixelCard>
      )}

      {step === "event" && (
        <PixelCard>
          <h2 className="font-pixel text-xl mb-6 border-b-4 border-black pb-2">행사 정보 입력</h2>
          <form onSubmit={handleEventSubmit} className="space-y-4">
            <div>
              <label className="block font-pixel text-sm mb-2">행사명 *</label>
              <input
                required
                className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="예: 2026 노들섬 버스킹 페스티벌"
              />
            </div>
            <div>
              <label className="block font-pixel text-sm mb-2">행사 설명</label>
              <textarea
                rows={3}
                className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white resize-none"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="행사에 대한 간단한 설명을 입력하세요."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-pixel text-sm mb-2">시작일 *</label>
                <input
                  required
                  type="date"
                  className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-pixel text-sm mb-2">종료일 *</label>
                <input
                  required
                  type="date"
                  className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                  value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block font-pixel text-sm mb-2">장소</label>
              <input
                className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                value={form.venue}
                onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                placeholder="예: 노들섬 라이브하우스"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-pixel text-sm mb-2">담당자 이름</label>
                <input
                  className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                  value={form.contactName}
                  onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-pixel text-sm mb-2">담당자 이메일</label>
                <input
                  type="email"
                  className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                  value={form.contactEmail}
                  onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block font-pixel text-sm mb-2">태그 (쉼표로 구분)</label>
              <input
                className="w-full border-4 border-black px-3 py-2 font-pixel-body text-lg focus:outline-none focus:border-primary bg-white"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="음악, 버스킹, 야외"
              />
            </div>
            {error && <p className="font-pixel-body text-destructive border-2 border-destructive px-3 py-2">{error}</p>}
            <div className="flex gap-4 pt-2">
              <PixelButton type="button" variant="ghost" size="md" onClick={() => setLocation("/dashboard")}>
                취소
              </PixelButton>
              <PixelButton type="submit" variant="primary" size="md" disabled={createEvent.isPending}>
                {createEvent.isPending ? "신청 중..." : "신청 완료 →"}
              </PixelButton>
            </div>
          </form>
        </PixelCard>
      )}
    </div>
  );
}
