import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, useLocation } from "wouter";
import { useCreateEvent, useListOrganizations, useCreateOrganization, useGetMe } from "@workspace/api-client-react";
import { useUIStore } from "@/store/useUIStore";

const KR = { fontFamily: "'Noto Sans KR', sans-serif" };

const inputCls = "w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1";

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
    title: "", description: "", startDate: "", endDate: "",
    venue: "", contactName: "", contactEmail: "", tags: "",
  });
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (me?.organizationId) setStep("event");
    setNPCMessage("새 행사 홍보를 신청해요! 단체 정보를 입력하세요 🐸");
  }, [me]);

  React.useEffect(() => {
    if (orgs && orgs.length > 0 && me?.organizationId) {
      setStep("event");
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
    } catch {
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
        },
      });
      setNPCMessage("행사 신청 완료! 관리자 승인을 기다려 주세요 🐸");
      setLocation(`/events/${ev.id}`);
    } catch {
      setError("행사 신청에 실패했습니다. 입력 내용을 확인해 주세요.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between pb-4 border-b border-black/8">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={KR}>새 행사 홍보 신청</h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={KR}>단체 정보와 행사 정보를 입력해 주세요</p>
        </div>
        <button onClick={() => setLocation("/dashboard")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors" style={KR}>
          ← 목록
        </button>
      </div>

      {/* 단계 표시 */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${step === "org" ? "bg-primary text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`} style={KR}>
          {step === "event" ? "✓" : "1"} 단체 정보
        </div>
        <div className="w-6 h-px bg-black/15" />
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${step === "event" ? "bg-primary text-white" : "bg-zinc-100 text-zinc-400 border border-zinc-200"}`} style={KR}>
          2 행사 정보
        </div>
      </div>

      {/* ── 단체 정보 ── */}
      {step === "org" && (
        <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-black/8 bg-zinc-50/60">
            <h2 className="text-sm font-semibold text-foreground" style={KR}>단체 정보 입력</h2>
            <p className="text-xs text-muted-foreground mt-0.5" style={KR}>처음 신청하시는 경우 단체 정보를 등록해 주세요</p>
          </div>
          <form onSubmit={handleOrgSubmit} className="p-4 space-y-4">
            <div>
              <label className={labelCls} style={KR}>단체명 / 사업명 *</label>
              <input required className={inputCls} style={KR}
                value={orgForm.name} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))}
                placeholder="예: 서울시 문화재단" />
            </div>
            <div>
              <label className={labelCls} style={KR}>담당자 이름 *</label>
              <input required className={inputCls} style={KR}
                value={orgForm.contactName} onChange={e => setOrgForm(f => ({ ...f, contactName: e.target.value }))}
                placeholder="홍길동" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={KR}>이메일 *</label>
                <input required type="email" className={inputCls} style={KR}
                  value={orgForm.contactEmail} onChange={e => setOrgForm(f => ({ ...f, contactEmail: e.target.value }))}
                  placeholder="contact@example.com" />
              </div>
              <div>
                <label className={labelCls} style={KR}>연락처</label>
                <input className={inputCls} style={KR}
                  value={orgForm.contactPhone} onChange={e => setOrgForm(f => ({ ...f, contactPhone: e.target.value }))}
                  placeholder="02-1234-5678" />
              </div>
            </div>
            {error && (
              <p className="text-xs text-destructive bg-red-50 border border-red-200 rounded px-3 py-2" style={KR}>{error}</p>
            )}
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={createOrg.isPending}
                className="h-8 px-4 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 transition-colors disabled:opacity-50" style={KR}>
                {createOrg.isPending ? "등록 중..." : "다음 단계 →"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 행사 정보 ── */}
      {step === "event" && (
        <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-black/8 bg-zinc-50/60">
            <h2 className="text-sm font-semibold text-foreground" style={KR}>행사 정보 입력</h2>
            <p className="text-xs text-muted-foreground mt-0.5" style={KR}>홍보하실 행사의 기본 정보를 입력해 주세요</p>
          </div>
          <form onSubmit={handleEventSubmit} className="p-4 space-y-4">
            <div>
              <label className={labelCls} style={KR}>행사명 *</label>
              <input required className={inputCls} style={KR}
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="예: 2026 노들섬 버스킹 페스티벌" />
            </div>
            <div>
              <label className={labelCls} style={KR}>행사 설명</label>
              <textarea rows={3} className={`${inputCls} resize-none`} style={KR}
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="행사에 대한 간단한 설명을 입력하세요." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={KR}>시작일 *</label>
                <input required type="date" className={inputCls}
                  value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls} style={KR}>종료일 *</label>
                <input required type="date" className={inputCls}
                  value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelCls} style={KR}>장소</label>
              <input className={inputCls} style={KR}
                value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                placeholder="예: 노들섬 라이브하우스" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={KR}>담당자 이름</label>
                <input className={inputCls} style={KR}
                  value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls} style={KR}>담당자 이메일</label>
                <input type="email" className={inputCls} style={KR}
                  value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelCls} style={KR}>태그 <span className="text-zinc-400">(쉼표로 구분)</span></label>
              <input className={inputCls} style={KR}
                value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="음악, 버스킹, 야외" />
            </div>
            {error && (
              <p className="text-xs text-destructive bg-red-50 border border-red-200 rounded px-3 py-2" style={KR}>{error}</p>
            )}
            <div className="flex items-center justify-between pt-1">
              <button type="button" onClick={() => setLocation("/dashboard")}
                className="h-8 px-3 text-xs text-muted-foreground border border-black/15 rounded bg-white hover:bg-muted/60 transition-colors" style={KR}>
                취소
              </button>
              <button type="submit" disabled={createEvent.isPending}
                className="h-8 px-4 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 transition-colors disabled:opacity-50" style={KR}>
                {createEvent.isPending ? "신청 중..." : "신청 완료 →"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
