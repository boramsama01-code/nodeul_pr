import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, useLocation } from "wouter";
import { useCreateEvent, useGetMe } from "@workspace/api-client-react";
import { useUIStore } from "@/store/useUIStore";
import { supabase } from "@/lib/supabase";

const KR = { fontFamily: "'Noto Sans KR', sans-serif" };
const inputCls = "w-full border border-black/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const VENUE_OPTIONS = ["잔디마당", "라이브하우스", "노들갤러리1관", "노들갤러리2관", "노들라운지", "노들서가", "마켓뜰", "서가뜰", "노들섬 전역"];
const CATEGORY_OPTIONS = ["음악", "책", "식물", "쿠킹", "예술", "공연", "전시", "어린이", "워크숍", "페스티벌", "강의", "마켓", "팝업", "이벤트"];
const AGE_OPTIONS = ["전체연령", "초등학생 이상", "중학생 이상", "고등학생 이상", "만18세 이상"];
const VIEWING_OPTIONS = ["자유관람", "사전 예매", "선착순 신청", "신청 후 추첨", "현장 판매", "초대자 한정"];
const PROMO_ITEMS = [
  "1층 입구 TV 모니터",
  "1층 벽면 게시대 포스터 (B2 사이즈 10장)",
  "DID (Digital Information Display)",
  "홈페이지 슬라이더 (*서울문화재단/서울시 유관기관만)",
  "잔디마당 입구 LED 전광판 (*서울문화재단/서울시 유관기관만)",
];
const BANNER_ZONES = [
  "(세로) GATE1 엘리베이터 외부 현수막 (*우선배정: ①잔디마당 ②노들갤러리)",
  "(가로) GATE1 난간 현수막 (*우선배정: ①라이브하우스 ②잔디마당)",
  "(세로) A동 2-3층 외부 현수막 (*우선배정: ①노들갤러리)",
  "(세로) 라이브하우스 외부 현수막 (*우선배정: ①라이브하우스)",
];
const LIGHT_POLE_ZONES = ["노들스퀘어-A구역", "노들스퀘어-B구역", "잔디마당-A구역", "잔디마당-B구역"];

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

function CheckGroup({ options, selected, onChange, customKey }: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  customKey?: string;
}) {
  const [customVal, setCustomVal] = useState("");
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  };
  const hasCustom = customKey && selected.some(s => !options.includes(s));
  const customCurrent = hasCustom ? selected.filter(s => !options.includes(s)).join(", ") : "";
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-primary flex-shrink-0" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
            <span className="text-sm" style={KR}>{opt}</span>
          </label>
        ))}
        {customKey && (
          <label className="flex items-center gap-2 cursor-pointer col-span-2">
            <input type="checkbox" className="accent-primary flex-shrink-0"
              checked={hasCustom || false}
              onChange={e => {
                if (!e.target.checked) onChange(selected.filter(s => options.includes(s)));
              }} />
            <span className="text-sm" style={KR}>기타 직접 입력</span>
          </label>
        )}
      </div>
      {customKey && (
        <input
          className={inputCls + " mt-1"}
          style={KR}
          placeholder="직접 입력"
          value={customVal || customCurrent}
          onChange={e => {
            setCustomVal(e.target.value);
            const base = selected.filter(s => options.includes(s));
            if (e.target.value.trim()) onChange([...base, e.target.value.trim()]);
            else onChange(base);
          }}
        />
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

export default function EventCreatePage() {
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const setNPCMessage = useUIStore(s => s.setNPCMessage);
  const { data: me, isLoading: meLoading } = useGetMe();
  const createEvent = useCreateEvent();

  const [step, setStep] = useState<"org" | "event">("org");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [orgForm, setOrgForm] = useState({
    name: "", contactName: "", contactPhone: "", contactTitle: "", extensionPhone: "",
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
    ageLimit: "",
    ageLimitCustom: "",
    viewingMethods: [] as string[],
    ticketLink: "",
    price: "",
    contact: "",
    notes: "",
    snsSiteDate: "",
    promoItems: [] as string[],
    bannerZones: [] as string[],
    lightPoleBannerZones: [] as string[],
  });

  React.useEffect(() => {
    if (me?.organizationId) setStep("event");
    setNPCMessage("새 행사 홍보를 신청해요! 정보를 입력하세요 🐸");
  }, [me]);

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
          contactEmail: "",
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
        bannerZones: meta.bannerZones,
        lightPoleBannerZones: meta.lightPoleBannerZones,
      };

      const ev = await createEvent.mutateAsync({
        data: {
          title: eventForm.title,
          description: meta.description || undefined,
          startDate: eventForm.startDate,
          endDate: eventForm.endDate,
          venue: allVenues.join(", ") || undefined,
          metadata,
        } as any,
      });
      setNPCMessage("행사 신청 완료! 관리자 승인을 기다려 주세요 🐸");
      setLocation(`/events/${ev.id}`);
    } catch (err: any) {
      setError(err.message || "행사 신청에 실패했습니다. 입력 내용을 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const setM = (key: keyof typeof meta, val: unknown) => setMeta(m => ({ ...m, [key]: val }));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-black/8">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={KR}>새 행사 홍보 신청</h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={KR}>담당자 정보와 행사 정보를 입력해 주세요</p>
        </div>
        <button onClick={() => setLocation("/dashboard")} className="text-xs text-muted-foreground hover:text-foreground" style={KR}>
          ← 목록
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${step === "org" ? "bg-primary text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`} style={KR}>
          {step === "event" ? "✓" : "1"} 담당자 정보
        </div>
        <div className="w-6 h-px bg-black/15" />
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${step === "event" ? "bg-primary text-white" : "bg-zinc-100 text-zinc-400 border border-zinc-200"}`} style={KR}>
          2 행사 정보 + 홍보 신청
        </div>
      </div>

      {step === "org" && (
        <Section title="담당자 정보" desc="처음 신청하시는 경우 담당자 정보를 등록해 주세요">
          <form onSubmit={handleOrgSubmit} className="space-y-4">
            <div>
              <label className={labelCls} style={KR}>소속 * <span className="text-zinc-400">(예: 서울문화재단)</span></label>
              <input required className={inputCls} style={KR} value={orgForm.name}
                onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 서울문화재단" />
            </div>
            <div>
              <label className={labelCls} style={KR}>담당자 성함 및 직함 * <span className="text-zinc-400">(예: 홍길동 주임)</span></label>
              <input required className={inputCls} style={KR} value={orgForm.contactName}
                onChange={e => setOrgForm(f => ({ ...f, contactName: e.target.value }))} placeholder="예: 홍길동 주임" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={KR}>핸드폰 번호 *</label>
                <input required type="tel" className={inputCls} style={KR} value={orgForm.contactPhone}
                  onChange={e => setOrgForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="010-1234-5678" />
              </div>
              <div>
                <label className={labelCls} style={KR}>내선번호 <span className="text-zinc-400">(선택)</span></label>
                <input className={inputCls} style={KR} value={orgForm.extensionPhone}
                  onChange={e => setOrgForm(f => ({ ...f, extensionPhone: e.target.value }))} placeholder="예: 1234" />
              </div>
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
                {[...AGE_OPTIONS, "기타 직접 입력"].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" className="accent-primary"
                      checked={opt === "기타 직접 입력" ? !AGE_OPTIONS.includes(meta.ageLimit) && !!meta.ageLimitCustom : meta.ageLimit === opt}
                      onChange={() => { if (opt === "기타 직접 입력") { setM("ageLimit", ""); } else { setM("ageLimit", opt); setM("ageLimitCustom", ""); } }} />
                    <span className="text-sm" style={KR}>{opt}</span>
                  </label>
                ))}
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
                onChange={e => setM("contact", e.target.value)} placeholder="예: @nodeul_island (인스타그램) / nodeul@example.com" />
            </div>
            <div>
              <label className={labelCls} style={KR}>기타 특이사항</label>
              <textarea rows={2} className={`${inputCls} resize-none`} style={KR} value={meta.notes}
                onChange={e => setM("notes", e.target.value)} placeholder="라인업 공개일 별도인 경우, 주차 안내 등" />
            </div>
          </Section>

          <Section title="3. 홍보 신청" desc="승인된 항목은 캘린더에 자동 반영됩니다">
            <div>
              <label className={labelCls} style={KR}>
                홈페이지 / SNS 게시 희망일 * <span className="text-zinc-400">— 홈페이지는 수령일로부터 1주 이내, SNS는 진행일로부터 2주 이내 게시. 라인업 공개일 별도인 경우 특이사항에 기입</span>
              </label>
              <input required type="date" className={inputCls} value={meta.snsSiteDate}
                onChange={e => setM("snsSiteDate", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={KR}>
                사용 희망 홍보 항목 <span className="text-zinc-400">(선택) — 진행일로부터 2주 전 게시. 매주 월요일 교체 (화요일 이후 제출시 차주 월요일 게시)</span>
              </label>
              <CheckGroup options={PROMO_ITEMS} selected={meta.promoItems} onChange={v => setM("promoItems", v)} />
            </div>
            <div>
              <label className={labelCls} style={KR}>
                대형 현수막 희망 구역 <span className="text-zinc-400">(선택) — 라이브하우스 로비 및 입구는 별도 신청 없이 당일 사용 가능. 대관일로부터 최대 1일 전후~당일만 사용 가능</span>
              </label>
              <CheckGroup options={BANNER_ZONES} selected={meta.bannerZones} onChange={v => setM("bannerZones", v)} />
            </div>
            <div>
              <label className={labelCls} style={KR}>
                가로등 배너 희망 구역 <span className="text-zinc-400">(선택) — 대관일로부터 최대 일주일 전~당일만 사용 가능</span>
              </label>
              <CheckGroup options={LIGHT_POLE_ZONES} selected={meta.lightPoleBannerZones} onChange={v => setM("lightPoleBannerZones", v)} />
            </div>
          </Section>

          {error && <p className="text-xs text-destructive bg-red-50 border border-red-200 rounded px-3 py-2" style={KR}>{error}</p>}

          <div className="flex items-center justify-between pt-1 pb-6">
            <button type="button" onClick={() => setLocation("/dashboard")}
              className="h-8 px-3 text-xs text-muted-foreground border border-black/15 rounded bg-white hover:bg-muted/60" style={KR}>
              취소
            </button>
            <button type="submit" disabled={submitting || createEvent.isPending}
              className="h-8 px-5 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 disabled:opacity-50" style={KR}>
              {submitting || createEvent.isPending ? "신청 중..." : "홍보 신청 완료 →"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
