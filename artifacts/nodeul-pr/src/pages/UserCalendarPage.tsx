import React, { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DatesSetArg } from "@fullcalendar/core";
import "./admin/AdminCalendarPage.css";

const STATUS_COLORS: Record<string, string> = {
  draft: "#a1a1aa",
  submitted: "#3b82f6",
  approved: "#10b981",
  revision_requested: "#f59e0b",
  rejected: "#ef4444",
  completed: "#6d28d9",
};

const STATUS_KR: Record<string, string> = {
  draft: "초안",
  submitted: "제출됨",
  approved: "승인됨",
  revision_requested: "수정 요청",
  rejected: "반려됨",
  completed: "완료",
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const KR = { fontFamily: "'Noto Sans KR', sans-serif" };

export default function UserCalendarPage() {
  const { isSignedIn } = useAuth();
  const calendarRef = useRef<FullCalendar>(null);
  const today = new Date();
  const [monthTitle, setMonthTitle] = useState(
    `${today.getFullYear()}년 ${today.getMonth() + 1}월`
  );

  const { data: eventData, isLoading } = useListEvents(
    {},
    { query: { enabled: !!isSignedIn, queryKey: getListEventsQueryKey({}) } }
  );

  if (!isSignedIn) return <Redirect to="/sign-in" />;

  const events = eventData?.events ?? [];

  const fcEvents = events.map((e) => ({
    id: String(e.id),
    title: e.title,
    start: e.startDate,
    end: addDays(e.endDate, 1),
    backgroundColor: STATUS_COLORS[e.status] ?? "#a1a1aa",
    borderColor: "transparent",
    textColor: "#fff",
    extendedProps: e,
  }));

  const handlePrev = () => calendarRef.current?.getApi().prev();
  const handleNext = () => calendarRef.current?.getApi().next();
  const handleToday = () => calendarRef.current?.getApi().today();

  const handleDatesSet = (info: DatesSetArg) => {
    const d = info.view.currentStart;
    setMonthTitle(`${d.getFullYear()}년 ${d.getMonth() + 1}월`);
  };

  const statuses = Array.from(new Set(events.map((e) => e.status).filter(Boolean)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={KR}>행사 캘린더</h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={KR}>
            내 행사 일정 보기 전용 (드래그 불가)
          </p>
        </div>
      </div>

      <div className="fc-dark-wrapper">
        <div className="fc-custom-header">
          <div className="fc-nav-group">
            <button className="fc-nav-btn" onClick={handlePrev}>‹</button>
            <span className="fc-month-title">{monthTitle}</span>
            <button className="fc-nav-btn" onClick={handleNext}>›</button>
            <button className="fc-today-btn" onClick={handleToday}>오늘</button>
          </div>
          <div className="fc-filter-group">
            <span className="fc-event-count">{events.length}건</span>
          </div>
        </div>

        {statuses.length > 0 && (
          <div className="fc-legend">
            {statuses.map((s) => (
              <div key={s} className="fc-legend-item">
                <span className="fc-legend-dot" style={{ backgroundColor: STATUS_COLORS[s] ?? "#a1a1aa" }} />
                <span style={KR}>{STATUS_KR[s] ?? s}</span>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="fc-loading">
            <div className="fc-loading-spinner" />
            <span style={KR}>불러오는 중...</span>
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            locale="ko"
            events={fcEvents}
            editable={false}
            selectable={false}
            datesSet={handleDatesSet}
            height="auto"
            dayMaxEvents={4}
            eventContent={(arg) => (
              <div
                className="fc-event-inner"
                title={arg.event.title}
              >
                <span className="fc-event-label">{arg.event.title}</span>
              </div>
            )}
            dayCellContent={(arg) => (
              <span
                className={`fc-custom-day-num${arg.isToday ? " is-today" : ""}${arg.isOther ? " is-other" : ""}`}
              >
                {arg.date.getDate()}
              </span>
            )}
            eventClick={(info) => {
              const eventId = info.event.id;
              window.location.href = `${import.meta.env.BASE_URL}events/${eventId}`;
            }}
          />
        )}
      </div>

      {events.length > 0 && (
        <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-black/8 bg-zinc-50/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground" style={KR}>전체 행사 목록</span>
            <span className="text-xs text-muted-foreground">{events.length}건</span>
          </div>
          <div className="divide-y divide-black/5">
            {events.map((e) => (
              <a
                key={e.id}
                href={`${import.meta.env.BASE_URL}events/${e.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[e.status] ?? "#a1a1aa" }}
                />
                <span className="text-sm text-foreground flex-1 truncate" style={KR}>{e.title}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0"
                  style={{ ...KR, color: STATUS_COLORS[e.status], borderColor: STATUS_COLORS[e.status] + "40", backgroundColor: STATUS_COLORS[e.status] + "10" }}
                >
                  {STATUS_KR[e.status] ?? e.status}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block" style={KR}>
                  {e.startDate} ~ {e.endDate}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
