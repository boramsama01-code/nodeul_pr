import React, { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { useGetMe, getGetMeQueryKey, useGetAdminCalendar, getGetAdminCalendarQueryKey } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventDropArg, DatesSetArg } from "@fullcalendar/core";
import "./AdminCalendarPage.css";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

const ZONE_COLORS: Record<string, string> = {
  instagram: "#e1306c",
  billboard: "#f59e0b",
  website_banner: "#3b82f6",
  signage: "#10b981",
  other: "#8b5cf6",
};
const ZONE_KR: Record<string, string> = {
  instagram: "인스타그램", billboard: "전광판", website_banner: "홈페이지 배너",
  signage: "사이니지", other: "기타",
};
const STATUS_KR: Record<string, string> = {
  draft: "초안", submitted: "제출됨", approved: "승인됨",
  revision_requested: "수정 요청", rejected: "반려됨", completed: "완료",
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getZoneColor(zoneType?: string | null, zoneColor?: string | null) {
  if (zoneType && ZONE_COLORS[zoneType]) return ZONE_COLORS[zoneType];
  return zoneColor || "#52525b";
}

export default function AdminCalendarPage() {
  const { isSignedIn } = useAuth();
  const { data: me } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } });

  const calendarRef = useRef<FullCalendar>(null);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [monthTitle, setMonthTitle] = useState(`${today.getFullYear()}년 ${today.getMonth() + 1}월`);
  const [zoneFilter, setZoneFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const { data: schedules = [], isLoading, refetch } = useGetAdminCalendar(
    { month: monthStr },
    {
      query: {
        enabled: !!me && (me.role === "admin" || me.role === "super_admin"),
        queryKey: getGetAdminCalendarQueryKey({ month: monthStr }),
      },
    }
  );

  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (me && me.role !== "admin" && me.role !== "super_admin") return <Redirect to="/dashboard" />;

  const filtered = schedules.filter((s) => {
    if (zoneFilter && s.zoneType !== zoneFilter) return false;
    if (statusFilter && (s as any).eventStatus !== statusFilter) return false;
    return true;
  });

  const fcEvents = filtered.map((s) => {
    const isEventItem = (s as any).itemType === "event";
    return {
      id: String(s.id),
      title: isEventItem ? `📅 ${s.eventTitle || `행사 #${s.eventId}`}` : s.eventTitle || `행사 #${s.eventId}`,
      start: s.startDate,
      end: addDays(s.endDate, 1),
      backgroundColor: isEventItem ? "#52525b" : getZoneColor(s.zoneType, s.zoneColor),
      borderColor: isEventItem ? "#3f3f46" : "transparent",
      textColor: "#fff",
      extendedProps: s,
    };
  });

  const zoneTypes = Array.from(new Set(schedules.map((s) => s.zoneType).filter(Boolean))) as string[];
  const eventStatuses = Array.from(new Set(schedules.map((s) => (s as any).eventStatus).filter(Boolean))) as string[];

  const handlePrev = () => calendarRef.current?.getApi().prev();
  const handleNext = () => calendarRef.current?.getApi().next();
  const handleToday = () => calendarRef.current?.getApi().today();

  const handleDatesSet = (info: DatesSetArg) => {
    const d = info.view.currentStart;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    setYear(y);
    setMonth(m);
    setMonthTitle(`${y}년 ${m}월`);
  };

  const handleEventDrop = async ({ event, revert }: EventDropArg) => {
    const scheduleId = Number(event.id);
    const newStart = event.startStr.split("T")[0];
    const rawEnd = event.endStr
      ? new Date(new Date(event.endStr).getTime() - 86400000).toISOString().split("T")[0]
      : newStart;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${BASE_URL}/api/schedules/${scheduleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ startDate: newStart, endDate: rawEnd }),
      });
      if (!res.ok) revert();
      else refetch();
    } catch {
      revert();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>홍보 일정 캘린더</h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>구역별 게시 일정 · 드래그로 일정 변경 가능</p>
        </div>
      </div>

      <div className="fc-dark-wrapper">
        {/* Custom Header */}
        <div className="fc-custom-header">
          <div className="fc-nav-group">
            <button className="fc-nav-btn" onClick={handlePrev}>‹</button>
            <span className="fc-month-title">{monthTitle}</span>
            <button className="fc-nav-btn" onClick={handleNext}>›</button>
            <button className="fc-today-btn" onClick={handleToday}>오늘</button>
          </div>
          <div className="fc-filter-group">
            <select className="fc-filter-select" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}>
              <option value="">전체 구역</option>
              {zoneTypes.map(z => <option key={z} value={z}>{ZONE_KR[z] || z}</option>)}
            </select>
            <select className="fc-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">전체 상태</option>
              {eventStatuses.map(s => <option key={s} value={s}>{STATUS_KR[s] || s}</option>)}
            </select>
            <span className="fc-event-count">{filtered.length}건</span>
          </div>
        </div>

        {/* Legend */}
        {zoneTypes.length > 0 && (
          <div className="fc-legend">
            {zoneTypes.map(z => (
              <div
                key={z}
                className={`fc-legend-item${zoneFilter === z ? " active" : ""}`}
                onClick={() => setZoneFilter(zoneFilter === z ? "" : z)}
              >
                <span className="fc-legend-dot" style={{ backgroundColor: ZONE_COLORS[z] || "#52525b" }} />
                <span>{ZONE_KR[z] || z}</span>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="fc-loading">
            <div className="fc-loading-spinner" />
            <span>불러오는 중...</span>
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            locale="ko"
            events={fcEvents}
            editable={true}
            eventDrop={handleEventDrop}
            datesSet={handleDatesSet}
            height="auto"
            dayMaxEvents={4}
            eventContent={(arg) => (
              <div className="fc-event-inner" title={`${arg.event.title} — ${arg.event.extendedProps.zoneName || ""}`}>
                <span className="fc-event-label">{arg.event.title}</span>
              </div>
            )}
            dayCellContent={(arg) => (
              <span className={`fc-custom-day-num${arg.isToday ? " is-today" : ""}${arg.isOther ? " is-other" : ""}`}>
                {arg.date.getDate()}
              </span>
            )}
          />
        )}
      </div>

      {/* Schedule list */}
      {schedules.length > 0 && (
        <div className="border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{month}월 전체 일정</span>
            <span className="text-xs text-zinc-600">{schedules.length}건</span>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {schedules.map(s => (
              <a key={s.id} href={`/events/${s.eventId}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-900 transition-colors">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: getZoneColor(s.zoneType, s.zoneColor) }} />
                <span className="text-sm text-zinc-300 flex-1 truncate" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{s.eventTitle}</span>
                <span className="text-xs text-zinc-500 hidden sm:block" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{ZONE_KR[s.zoneType!] || s.zoneName}</span>
                <span className="text-xs text-zinc-600 whitespace-nowrap">{s.startDate} ~ {s.endDate}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
