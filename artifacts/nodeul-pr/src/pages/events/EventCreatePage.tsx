import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, useLocation, useSearch } from "wouter";
import { useCreateEvent, useGetMe, useGetEvent, useUpdateEvent, useGetSystemSettings, getGetSystemSettingsQueryKey, getGetEventQueryKey } from "@workspace/api-client-react";
import { useUIStore } from "@/store/useUIStore";
import { supabase } from "@/lib/supabase";
import { BaekroSpeech, StepGuide } from "@/components/pixel/MaengkongiSpeech";

const KR = { fontFamily: "'Noto Sans KR', sans-serif" };
const inputCls = "w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const VENUE_OPTIONS = ["잔디마당", "라이브하우스", "노들갤러리1관", "노들갤러리2관", "노들라운지", "노들서가", "마켓뜰", "서가뜰", "노들섬 전역"];
const CATEGORY_OPTIONS = ["음악", "책", "식물", "쿠킹", "예술", "공연", "전시", "어린이", "워크숍", "페스티벌", "강의", "마켓", "팝업", "행사"];
const AGE_OPTIONS = ["전체연령", "초등학생 이상", "중학생 이상", "고등학생 이상", "만18세 이상"];
const VIEWING_OPTIONS = ["자유관람", "사전 예매", "선착순 신청", "신청 후 추첨", "현장 판매", "초대자 한정"];
const PROMO_STANDARD = [
  "1층 입구 TV 모니터",
  "1층 벽면 게시대 포스터 (B2 사이즈 10장)",
  "DID (Digital Information Display)",
];
const PROMO_RESTRICTED = [
  "홈페이지 슬라이더",
  "잔디마당 입구 LED 전광판",
];
const PROMO_ITEMS = [...PROMO_STANDARD, ...PROMO_RESTRICTED];
const BANNER_ZONES = [
  { label: "(세로) GATE1 엘리베이터 외부 현수막", tooltip: "우선배정: ①잔디마당 ②노들갤러리" },
  { label: "(가로) GATE1 난간 현수막", tooltip: "우선배정: ①라이브하우스 ②잔디마당" },
  { label: "(세로) A동 2-3층 외부 현수막", tooltip: "우선배정: ①노들갤러리" },
  { label: "(세로) 라이브하우스 외부 현수막", tooltip: "우선배정: ①라이브하우스" },
];
const LIGHT_POLE_ZONES = [
  { id: "노들스퀘어-A구역", sub: "4조, 8ea", color: "#f97316" },
  { id: "노들스퀘어-B구역", sub: "4조, 8ea", color: "#22c55e" },
  { id: "잔디마당-A구역", sub: "6조, 12ea", color: "#eab308" },
  { id: "잔디마당-B구역", sub: "6조, 12ea", color: "#a855f7" },
];

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-black/8 bg-zinc-50/60">
        <h2 className="text-sm font-semibold text-foreground" style={KR}>{title}</h2>
        {desc && <p className="text-xs text-muted-foreground mt-0.5" style={KR}>{desc}</p>}
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function CheckGroup({ options, selected, onChange, customKey, cols = 2 }: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  customKey?: string;
  cols?: number;
}) {
  const [customChecked, setCustomChecked] = useState(
    () => customKey ? selected.some(s => !options.includes(s)) : false
  );
  const [customVal, setCustomVal] = useState(() => {
    if (!customKey) return "";
    return selected.filter(s => !options.includes(s)).join(", ");
  });

  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  };

  const handleCustomCheck = (checked: boolean) => {
    setCustomChecked(checked);
    if (!checked) {
      setCustomVal("");
      onChange(selected.filter(s => options.includes(s)));
    }
  };

  const handleCustomInput = (val: string) => {
    setCustomVal(val);
    const base = selected.filter(s => options.includes(s));
    if (val.trim()) onChange([...base, val.trim()]);
    else onChange(base);
  };

  return (
    <div className="space-y-1.5">
      <div className={`grid grid-cols-${cols} gap-1.5`}>
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-primary flex-shrink-0"
              checked={selected.includes(opt)} onChange={() => toggle(opt)} />
            <span className="text-sm" style={KR}>{opt}</span>
          </label>
        ))}
        {customKey && (
          <label className="flex items-center gap-2 cursor-pointer col-span-full">
            <input type="checkbox" className="accent-primary flex-shrink-0"
              checked={customChecked}
              onChange={e => handleCustomCheck(e.target.checked)} />
            <span className="text-sm" style={KR}>기타 직접 입력</span>
          </label>
        )}
      </div>
      {customKey && customChecked && (
        <input className={inputCls + " mt-1"} style={KR}
          placeholder="직접 입력"
          value={customVal}
          onChange={e => handleCustomInput(e.target.value)} />
      )}
    </div>
  );
}

function RadioGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer">
          <input type="radio" className="accent-primary" checked={value === opt} onChange={() => onChange(opt)} />
          <span className="text-sm" style={KR}>{opt}</span>
        </label>
      ))}
    </div>
  );
}

function InfoIcon({ tip }: { tip: string }) {
  return (
    <span className="relative group inline-block flex-shrink-0">
      <span
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-200 text-zinc-500 text-[9px] font-bold cursor-help ml-1"
        style={{ lineHeight: 1 }}
      >i</span>
      <span className="pointer-events-none absolute z-50 left-1/2 -translate-x-1/2 bottom-5 w-52 bg-zinc-800 text-white text-[10px] rounded px-2.5 py-2 leading-relaxed shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-normal text-left" style={KR}>
        {tip}
        <span className="absolute left-1/2 -translate-x-1/2 top-full block w-0 h-0" style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "5px solid #27272a" }} />
      </span>
    </span>
  );
}

export default function EventCreatePage() {
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const editId = new URLSearchParams(searchStr).get("edit");
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const { data: me, isLoading: meLoading } = useGetMe();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { data: settings = [] } = useGetSystemSettings({ query: { queryKey: getGetSystemSettingsQueryKey() } });
  const pdfGuideUrl = settings.find(s => s.key === "zone_guide_pdf")?.value ?? "";

  const { data: editEvent } = useGetEvent(editId ? Number(editId) : 0, {
    query: { enabled: !!editId, queryKey: getGetEventQueryKey(editId ? Number(editId) : 0) },
  });

  const [step, setStep] = useState<"org" | "event">("org");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [orgForm, setOrgForm] = useState({
    name: "", contactName: "", contactPhone: "", contactTitle: "", extensionPhone: "", contactEmail: "",
  });

  const [eventForm, setEventForm] = useState({
    title: "", startDate: "", endDate: "",
  });

  const [meta, setMeta] = useState({
    operatingHours: "",
    venues: [] as string[],
    venueCustom: "",
    lineup: "",
    description: "",
    audience: "",
    categories: [] as string[],
    categoryCustom: "",
    ageLimit: "전체연령",
    ageLimitCustom: "",
    viewingMethods: [] as string[],
    ticketLink: "",
    price: "",
    contact: "",
    notes: "",
    snsSiteDate: "",
    promoItems: [] as string[],
    promoItemDates: {} as Record<string, string>,
    bannerZones: [] as string[],
    lightPoleBannerZones: [] as string[],
  });

  useEffect(() => {
    if (me?.organizationId) setStep("event");
    if (editId) {
      setNPCMessage("초안 행사를 수정하고 있어요. 내용을 확인 후 저장해 주세요 🐸");
    } else {
      setNPCMessage("새 행사 홍보를 신청해요! 정보를 입력하세요 🐸");
    }
    if (me?.email) {
      setOrgForm(f => f.contactEmail ? f : { ...f, contactEmail: me.email ?? "" });
    }
  }, [me, editId]);

  useEffect(() => {
    if (!editEvent) return;
    const m = ((editEvent as any).metadata) ?? {};
    setEventForm({
      title: editEvent.title ?? "",
      startDate: editEvent.startDate ?? "",
      endDate: editEvent.endDate ?? "",
    });
    setMeta(prev => ({
      ...prev,
      operatingHours: m.operatingHours ?? "",
      venues: m.venues ?? [],
      lineup: m.lineup ?? "",
      description: editEvent.description ?? "",
      audience: m.audience ?? "",
      categories: m.categories ?? [],
      ageLimit: AGE_OPTIONS.includes(m.ageLimit ?? "") ? (m.ageLimit ?? "") : "",
      ageLimitCustom: AGE_OPTIONS.includes(m.ageLimit ?? "") ? "" : (m.ageLimit ?? ""),
      viewingMethods: m.viewingMethods ?? [],
      ticketLink: m.ticketLink ?? "",
      price: m.price ?? "",
      contact: m.contact ?? "",
      notes: m.notes ?? "",
      snsSiteDate: m.snsSiteDate ?? "",
      promoItems: m.promoItems ?? [],
      promoItemDates: m.promoItemDates ?? {},
      bannerZones: m.bannerZones ?? [],
      lightPoleBannerZones: m.lightPoleBannerZones ?? [],
    }));
    setStep("event");
  }, [editEvent]);

  if (!isSignedIn) return <Redirect to="/sign-in" />;

  const needsTicketLink = meta.viewingMethods.some(v => v.includes("예매") || v.includes("신청") || v.includes("추첨"));

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${BASE}/api/organizations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          name: orgForm.name,
          contactName: orgForm.contactName,
          contactPhone: orgForm.contactPhone,
          contactTitle: orgForm.contactTitle || undefined,
          extensionPhone: orgForm.extensionPhone || undefined,
          contactEmail: orgForm.contactEmail || "",
        }),
      });
      if (!res.ok) throw new Error("단체 등록에 실패했습니다.");
      setStep("event");
      setNPCMessage("담당자 정보 등록 완료! 이제 행사 정보를 입력하세요 🐸");
    } catch (err: any) {
      setError(err.message || "단체 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const allVenues = [...meta.venues, ...(meta.venueCustom ? [meta.venueCustom] : [])];
      const allCategories = [...meta.categories, ...(meta.categoryCustom ? [meta.categoryCustom] : [])];
      const ageLimit = meta.ageLimit === "" && meta.ageLimitCustom ? meta.ageLimitCustom : meta.ageLimit;

      const metadata: Record<string, unknown> = {
        operatingHours: meta.operatingHours || null,
        venues: allVenues,
        lineup: meta.lineup || null,
        audience: meta.audience || null,
        categories: allCategories,
        ageLimit: ageLimit || null,
        viewingMethods: meta.viewingMethods,
        ticketLink: meta.ticketLink || null,
        price: meta.price || null,
        contact: meta.contact || null,
        notes: meta.notes || null,
        snsSiteDate: meta.snsSiteDate || null,
        promoItems: meta.promoItems,
        promoItemDates: meta.promoItemDates,
        bannerZones: meta.bannerZones,
        lightPoleBannerZones: meta.lightPoleBannerZones,
      };

      const payload = {
        title: eventForm.title,
        description: meta.description || undefined,
        startDate: eventForm.startDate,
        endDate: eventForm.endDate,
        venue: allVenues.join(", ") || undefined,
        contactName: orgForm.contactName || (me?.name ?? undefined),
        tags: allCategories.length > 0 ? allCategories : undefined,
        metadata,
      };

      if (editId) {
        await updateEvent.mutateAsync({ id: Number(editId), data: payload as any });
        setNPCMessage("행사 정보가 수정되었습니다 🐸");
        setLocation(`/events/${editId}`);
      } else {
        const ev = await createEvent.mutateAsync({ data: payload as any });
        setNPCMessage("행사 신청 완료! 관리자 승인을 기다려 주세요 🐸");
        setLocation(`/events/${ev.id}`);
      }
    } catch (err: any) {
      setError(err.message || "행사 신청에 실패했습니다. 입력 내용을 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const setM = (key: keyof typeof meta, val: unknown) => setMeta(m => ({ ...m, [key]: val }));

  const setPromoItemDate = (item: string, date: string) => {
    setMeta(m => ({ ...m, promoItemDates: { ...m.promoItemDates, [item]: date } }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-4">
        <StepGuide currentStep={1} />
      </div>

      <BaekroSpeech mood={step === "org" ? "normal" : "cheer"}>
        {editId
          ? "초안 상태의 행사를 수정하고 있어요. 내용을 확인 후 [저장]을 눌러주세요 🐸"
          : step === "org"
            ? "먼저 담당자 정보를 입력해 주세요. 행사 승인 시 이 정보로 연락을 드려요!"
            : "거의 다 왔어요! 이번엔 행사 정보와 원하는 홍보 구역을 선택해 주세요 🐸"}
      </BaekroSpeech>

      <div className="border-b border-black/8 pb-4" />

      {!editId && (
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${step === "org" ? "bg-primary text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`} style={KR}>
            {step === "event" ? "✓" : "1"} 담당자 정보
          </div>
          <div className="w-6 h-px bg-black/15" />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${step === "event" ? "bg-primary text-white" : "bg-zinc-100 text-zinc-400 border border-zinc-200"}`} style={KR}>
            2 행사 정보 + 홍보 신청
          </div>
        </div>
      )}

      {step === "org" && !editId && (
        <Section title="담당자 정보" desc="처음 신청하시는 경우 담당자 정보를 등록해 주세요">
          <form onSubmit={handleOrgSubmit} className="space-y-4">
            <div>
              <label className={labelCls} style={KR}>소속 * <span className="text-zinc-400">(예: 서울문화재단)</span></label>
              <input required className={inputCls} style={KR} value={orgForm.name}
                onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 서울문화재단" />
            </div>
            <div>
              <label className={labelCls} style={KR}>담당자 성함 및 직함 *</label>
              <input required className={inputCls} style={KR} value={orgForm.contactName}
                onChange={e => setOrgForm(f => ({ ...f, contactName: e.target.value }))} placeholder="예: 김노들 주임" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={KR}>핸드폰 번호 *</label>
                <input required type="tel" className={inputCls} style={KR} value={orgForm.contactPhone}
                  onChange={e => setOrgForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="01012345678" />
              </div>
              <div>
                <label className={labelCls} style={KR}>유선번호 <span className="text-zinc-400">(선택)</span></label>
                <input className={inputCls} style={KR} value={orgForm.extensionPhone}
                  onChange={e => setOrgForm(f => ({ ...f, extensionPhone: e.target.value }))} placeholder="02-123-4567" />
              </div>
            </div>
            <div>
              <label className={labelCls} style={KR}>담당자 이메일 * <span className="text-zinc-400">— 승인 완료 메일이 발송됩니다</span></label>
              <input required type="email" className={inputCls} style={KR} value={orgForm.contactEmail}
                onChange={e => setOrgForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="example@org.com" />
            </div>
            {error && <p className="text-xs text-destructive bg-red-50 border border-red-200 rounded px-3 py-2" style={KR}>{error}</p>}
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={submitting}
                className="h-8 px-4 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 disabled:opacity-50" style={KR}>
                {submitting ? "등록 중..." : "다음 단계 →"}
              </button>
            </div>
          </form>
        </Section>
      )}

      {step === "event" && (
        <form onSubmit={handleEventSubmit} className="space-y-5">
          <Section title="1. 행사 기본 정보">
            <div>
              <label className={labelCls} style={KR}>행사명 *</label>
              <input required className={inputCls} style={KR} value={eventForm.title}
                onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                placeholder="예: 2026 노들섬 버스킹 페스티벌" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={KR}>시작일 *</label>
                <input required type="date" className={inputCls} value={eventForm.startDate}
                  onChange={e => setEventForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls} style={KR}>종료일 *</label>
                <input required type="date" className={inputCls} value={eventForm.endDate}
                  onChange={e => setEventForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelCls} style={KR}>세부 운영시간</label>
              <input className={inputCls} style={KR} value={meta.operatingHours}
                onChange={e => setM("operatingHours", e.target.value)} placeholder="예: 14:00 ~ 21:00 (우천시 취소)" />
            </div>
            <div>
              <label className={labelCls} style={KR}>대관장소 * <span className="text-zinc-400">(다중 선택 가능)</span></label>
              <CheckGroup options={VENUE_OPTIONS} selected={meta.venues}
                onChange={v => setM("venues", v)} customKey="venue" />
            </div>
            <div>
              <label className={labelCls} style={KR}>출연진 / 대표 라인업</label>
              <input className={inputCls} style={KR} value={meta.lineup}
                onChange={e => setM("lineup", e.target.value)} placeholder="예: 밴드 A, DJ B, 가수 C" />
            </div>
          </Section>

          <Section title="2. 행사 상세 정보">
            <div>
              <label className={labelCls} style={KR}>행사 설명 <span className="text-zinc-400">리플렛용 — 3문장 이상 작성해 주세요</span></label>
              <textarea rows={4} className={`${inputCls} resize-none`} style={KR} value={meta.description}
                onChange={e => setM("description", e.target.value)} placeholder="행사를 소개하는 3문장 이상의 설명을 입력하세요." />
            </div>
            <div>
              <label className={labelCls} style={KR}>참여 대상 *</label>
              <RadioGroup
                options={["시민 누구나", "예술가", "사전 초대자 한정 (프라이빗 행사)"]}
                value={meta.audience}
                onChange={v => setM("audience", v)}
              />
              {meta.audience?.includes("사전 초대자") && (
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2" style={KR}>
                  ⚠ 사전 초대자 한정 행사는 별도 홍보가 진행되지 않습니다.
                </div>
              )}
            </div>
            <div>
              <label className={labelCls} style={KR}>
                행사 카테고리 * <span className="text-zinc-400">— 노들섬 공식홈페이지에 노출될 카테고리를 선택해 주세요</span>
              </label>
              <CheckGroup options={CATEGORY_OPTIONS} selected={meta.categories}
                onChange={v => setM("categories", v)} customKey="category" />
            </div>
            <div>
              <label className={labelCls} style={KR}>참여가능연령 *</label>
              <div className="space-y-1.5">
                {[...AGE_OPTIONS, "기타 직접 입력"].map(opt => {
                  const isCustomOpt = opt === "기타 직접 입력";
                  const isCustomActive = !AGE_OPTIONS.includes(meta.ageLimit) && (!!meta.ageLimitCustom || meta.ageLimit === "");
                  return (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" className="accent-primary"
                        checked={isCustomOpt ? isCustomActive : meta.ageLimit === opt}
                        onChange={() => {
                          if (isCustomOpt) { setM("ageLimit", ""); }
                          else { setM("ageLimit", opt); setM("ageLimitCustom", ""); }
                        }} />
                      <span className="text-sm" style={KR}>{opt}</span>
                    </label>
                  );
                })}
                {!AGE_OPTIONS.includes(meta.ageLimit) && (
                  <input className={inputCls + " mt-1"} style={KR}
                    value={meta.ageLimitCustom} onChange={e => setM("ageLimitCustom", e.target.value)}
                    placeholder="직접 입력 (예: 만 14세 이상)" />
                )}
              </div>
            </div>
            <div>
              <label className={labelCls} style={KR}>관람 방법 * <span className="text-zinc-400">(다중 선택 가능)</span></label>
              <CheckGroup options={VIEWING_OPTIONS} selected={meta.viewingMethods}
                onChange={v => setM("viewingMethods", v)} />
            </div>
            {needsTicketLink && (
              <div>
                <label className={labelCls} style={KR}>
                  예매 / 신청 링크 <span className="text-zinc-400">— 확정 안된 경우 플랫폼 주소 작성</span>
                </label>
                <input className={inputCls} style={KR} value={meta.ticketLink}
                  onChange={e => setM("ticketLink", e.target.value)} placeholder="https://..." />
              </div>
            )}
            <div>
              <label className={labelCls} style={KR}>관람료 * <span className="text-zinc-400">(예: 무료 / 전석 50,000원)</span></label>
              <input className={inputCls} style={KR} value={meta.price}
                onChange={e => setM("price", e.target.value)} placeholder="무료" />
            </div>
            <div>
              <label className={labelCls} style={KR}>
                공식문의처 * <span className="text-zinc-400">— 플랫폼 대표번호 X, 유선/메일/SNS로 작성</span>
              </label>
              <input className={inputCls} style={KR} value={meta.contact}
                onChange={e => setM("contact", e.target.value)} placeholder="예: 02-123-4567 / @nodeul_island / nodeul@example.com" />
            </div>
            <div>
              <label className={labelCls} style={KR}>기타 특이사항</label>
              <textarea rows={2} className={`${inputCls} resize-none`} style={KR} value={meta.notes}
                onChange={e => setM("notes", e.target.value)}
                placeholder="예: 라인업 공개일자가 정해져 있는 경우 / 현장 수어통역 지원 등" />
            </div>
          </Section>

          <Section title="3. 홍보 신청" desc="승인된 항목은 캘린더에 자동 반영됩니다">
            {pdfGuideUrl && (
              <a href={pdfGuideUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors shadow-sm" style={KR}>
                <span className="text-base">📥</span>
                홍보 구역 안내 및 제작 사양 안내
              </a>
            )}
            {/* A. 홈페이지/SNS — 필수 */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-md px-4 py-3 space-y-2">
              <p className="text-xs font-bold text-blue-800 mb-1" style={KR}>
                🌐 홈페이지 / SNS 게시
                <span className="ml-1.5 text-[10px] font-semibold text-white bg-blue-500 px-1.5 py-0.5 rounded">필수</span>
              </p>
              <div>
                <label className={labelCls} style={KR}>게시 희망일 *</label>
                <input required type="date" className={inputCls} value={meta.snsSiteDate}
                  onChange={e => setM("snsSiteDate", e.target.value)} />
              </div>
            </div>

            {/* B. 희망 홍보 구역 */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground" style={KR}>
                📍 희망 홍보 구역
                <span className="ml-1.5 text-xs font-normal text-zinc-400">선택</span>
              </p>
              <p className="text-xs text-zinc-400 -mt-1" style={KR}>통상 진행일 2주 전 게시, 매주 월요일 교체 진행 / 별도 희망일자가 없는 경우 게시 희망일 빈칸 제출</p>
              {PROMO_STANDARD.map(item => (
                <div key={item}>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-primary flex-shrink-0 mt-0.5"
                      checked={meta.promoItems.includes(item)}
                      onChange={e => {
                        if (e.target.checked) setM("promoItems", [...meta.promoItems, item]);
                        else { setM("promoItems", meta.promoItems.filter(p => p !== item)); setPromoItemDate(item, ""); }
                      }} />
                    <span className="text-sm" style={KR}>{item}</span>
                  </label>
                  {meta.promoItems.includes(item) && (
                    <div className="ml-6 mt-1">
                      <label className={labelCls} style={KR}>게시 희망일</label>
                      <input type="date" className={inputCls} style={{ maxWidth: 200 }}
                        value={meta.promoItemDates[item] ?? ""}
                        onChange={e => setPromoItemDate(item, e.target.value)} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* C. 현수막 희망 구역 */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-foreground" style={KR}>
                🚩 현수막 희망 구역
                <span className="ml-1.5 text-xs font-normal text-zinc-400">선택</span>
              </p>
              <p className="text-xs text-zinc-400 -mt-1" style={KR}>
                대관일 기준 최대 1일 전후~당일 사용.
              </p>
              <div className="space-y-1.5">
                {BANNER_ZONES.map(zone => (
                  <label key={zone.label} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="accent-primary flex-shrink-0"
                      checked={meta.bannerZones.includes(zone.label)}
                      onChange={e => {
                        if (e.target.checked) setM("bannerZones", [...meta.bannerZones, zone.label]);
                        else setM("bannerZones", meta.bannerZones.filter(b => b !== zone.label));
                      }} />
                    <span className="text-sm" style={KR}>{zone.label}</span>
                    <InfoIcon tip={zone.tooltip} />
                  </label>
                ))}
              </div>

              <p className="text-xs font-bold text-foreground pt-1" style={KR}>
                🔦 가로등 배너 희망 구역
                <span className="ml-1.5 text-xs font-normal text-zinc-400">선택 — 대관일 최대 1주 전~당일</span>
              </p>
              <div className="border border-black/10 rounded-lg overflow-hidden">
                <img
                  src={`${BASE}/banner_area.png`}
                  alt="가로등 배너 구역 안내"
                  className="w-full h-auto block"
                  style={{ objectFit: "contain", background: "#fafafa" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {LIGHT_POLE_ZONES.map(zone => (
                  <label key={zone.id} className="flex items-center gap-2 cursor-pointer border border-black/8 rounded px-3 py-2 hover:bg-zinc-50 transition-colors">
                    <input type="checkbox" className="accent-primary flex-shrink-0"
                      checked={meta.lightPoleBannerZones.includes(zone.id)}
                      onChange={e => {
                        if (e.target.checked) setM("lightPoleBannerZones", [...meta.lightPoleBannerZones, zone.id]);
                        else setM("lightPoleBannerZones", meta.lightPoleBannerZones.filter(z => z !== zone.id));
                      }} />
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: zone.color }} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate" style={KR}>{zone.id}</div>
                      <div className="text-xs text-muted-foreground" style={KR}>{zone.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* D. 유관기관 한정 구역 */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground" style={KR}>🏛 유관기관 한정 구역</p>
              <div className="bg-red-50 border border-red-300 rounded-md px-3 py-2.5">
                <p className="text-xs font-semibold text-red-700" style={KR}>
                  ⚠ 아래 구역은 <strong>서울문화재단 / 서울시 유관기관</strong>만 신청 가능합니다.
                </p>
                <p className="text-[10px] text-red-600 mt-0.5" style={KR}>
                  해당 기관이 아닌 경우 신청하더라도 자동 취소 처리됩니다.
                </p>
              </div>
              {PROMO_RESTRICTED.map(item => (
                <div key={item}>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-primary flex-shrink-0 mt-0.5"
                      checked={meta.promoItems.includes(item)}
                      onChange={e => {
                        if (e.target.checked) setM("promoItems", [...meta.promoItems, item]);
                        else { setM("promoItems", meta.promoItems.filter(p => p !== item)); setPromoItemDate(item, ""); }
                      }} />
                    <span className="text-sm" style={KR}>{item}</span>
                  </label>
                  {meta.promoItems.includes(item) && (
                    <div className="ml-6 mt-1">
                      <label className={labelCls} style={KR}>게시 희망일</label>
                      <input type="date" className={inputCls} style={{ maxWidth: 200 }}
                        value={meta.promoItemDates[item] ?? ""}
                        onChange={e => setPromoItemDate(item, e.target.value)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {error && <p className="text-xs text-destructive bg-red-50 border border-red-200 rounded px-3 py-2" style={KR}>{error}</p>}

          <div className="flex items-center justify-between pt-1 pb-6">
            <button type="button" onClick={() => setLocation(editId ? `/events/${editId}` : "/dashboard")}
              className="h-8 px-3 text-xs text-muted-foreground border border-black/15 rounded bg-white hover:bg-muted/60" style={KR}>
              취소
            </button>
            <button type="submit" disabled={submitting || createEvent.isPending || updateEvent.isPending}
              className="h-8 px-5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50" style={KR}>
              {submitting || createEvent.isPending || updateEvent.isPending
                ? (editId ? "저장 중..." : "신청 중...")
                : (editId ? "수정 저장 →" : "홍보 신청 완료 →")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
