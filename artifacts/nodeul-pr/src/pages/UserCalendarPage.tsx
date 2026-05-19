import React, { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, useLocation } from "wouter";
import {
  useListEvents, getListEventsQueryKey,
  useListSchedules, getListSchedulesQueryKey,
  useGetMe, getGetMeQueryKey,
} from "@workspace/api-client-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DatesSetArg } from "@fullcalendar/core";
import "./admin/AdminCalendarPage.css";
import { BaekroSpeech, StepGuide } from "@/components/pixel/MaengkongiSpeech";

const EVENT_PALETTE = [
  "#5b7cff", "#00b5cc", "#0fba81", "#fca30c", "#f05c7a",
  "#9b59f7", "#ff7c3f", "#30b870", "#e84393", "#4a90d9",
  "#26c4b0", "#f0742f", "#7b52f5", "#15bfef", "#db4f6e",
];

const SCHEDULE_STATUS_KR: Record<string, string> = {
  scheduled: "예정",
  in_progress: "진행중",
  completed: "완료",
  cancelled: "취소",
};

function getEventColor(eventId: number): string {
  return EVENT_PALETTE[eventId % EVENT_PALETTE.length];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

const KR = { fontFamily: "'Noto Sans KR', sans-serif" };

export default function UserCalendarPage() {
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const calendarRef = useRef<FullCalendar>(null);
  const today = new Date();
  const [monthTitle, setMonthTitle] = useState(
    `${today.getFullYear()}년 ${today.getMonth() + 1}월`
  );
  const [dateRange, setDateRange] = useState(getMonthRange(today));

  const { data: me } = useGetMe({
    query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() }
  });
  const isAdmin = me?.role === "admin" || me?.role === "super_admin";

  const { data: eventData, isLoading: eventsLoading } = useListEvents(
    {},
    { query: { enabled: !!isSignedIn, queryKey: getListEventsQueryKey({}) } }
  );

  const { data: schedules, isLoading: schedulesLoading } = useListSchedules(
    { startDate: dateRange.start, endDate: dateRange.end },
    {
      query: {
        enabled: !!isSignedIn,
        queryKey: getListSchedulesQueryKey({ startDate: dateRange.start, endDate: dateRange.end }),
      }
    }
  );

  if (!isSignedIn) return <Redirect to="/sign-in" />;

  const events = eventData?.events ?? [];
  const isLoading = eventsLoading || schedulesLoading;

  const eventColorMap = new Map<number, string>();
  events.forEach(e => { if (!eventColorMap.has(e.id)) eventColorMap.set(e.id, getEventColor(e.id)); });

  const fcEvents = [
    ...events.map(e => ({
      id: `ev-${e.id}`,
      title: e.title,
      start: e.startDate,
      end: addDays(e.endDate, 1),
      backgroundColor: eventColorMap.get(e.id) ?? "#6366f1",
      borderColor: "transparent",
      textColor: "#fff",
      extendedProps: { kind: "event", eventId: e.id },
    })),
    ...((schedules ?? []).map(s => ({
      id: `sc-${s.id}`,
      title: `📍 ${s.zoneName ?? s.zoneType ?? "구역"} (${s.eventTitle ?? "행사"})`,
      start: s.startDate,
      end: addDays(s.endDate, 1),
      backgroundColor: s.eventId ? (eventColorMap.get(s.eventId) ?? getEventColor(s.eventId)) : "#64748b",
      borderColor: "transparent",
      textColor: "#fff",
      extendedProps: { kind: "schedule", eventId: s.eventId, zoneName: s.zoneName, zoneType: s.zoneType },
    }))),
  ];

  const legendItems = events.map(e => ({
    id: e.id,
    title: e.title,
    color: eventColorMap.get(e.id) ?? "#6366f1",
  }));

  const handlePrev = () => calendarRef.current?.getApi().prev();
  const handleNext = () => calendarRef.current?.getApi().next();
  const handleToday = () => calendarRef.current?.getApi().today();

  const handleDatesSet = (info: DatesSetArg) => {
    const d = info.view.currentStart;
    setMonthTitle(`${d.getFullYear()}년 ${d.getMonth() + 1}월`);
    setDateRange(getMonthRange(d));
  };

  const approvedEventsCount = events.filter(e => e.status === "approved" || e.status === "completed").length;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-4">
        <StepGuide currentStep={4} />
      </div>

      <BaekroSpeech mood={approvedEventsCount > 0 ? "cheer" : "thinking"}>
        {approvedEventsCount > 0
          ? `🎉 승인된 행사 ${approvedEventsCount}건이 캘린더에 표시돼 있어요! 📍 아이콘은 구역별 홍보 게시 일정입니다.`
          : events.length > 0
            ? "행사가 승인되면 캘린더에 일정이 표시돼요. 담당자 검토를 기다려 주세요 🗓️"
            : "아직 등록된 행사가 없어요. 행사를 먼저 등록해 주세요!"}
        {isAdmin ? " 행사명을 클릭하면 상세 페이지로 이동합니다." : " 캘린더는 조회 전용입니다."}
      </BaekroSpeech>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground" style={KR}>홍보 캘린더</h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={KR}>
            행사 일정 + 구역별 홍보물 게시 일정
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

        {legendItems.length > 0 && (
          <div className="fc-legend" style={{ flexWrap: "wrap", gap: "8px 16px" }}>
            {legendItems.map(item => (
              <div key={item.id} className="fc-legend-item">
                <span className="fc-legend-dot" style={{ backgroundColor: item.color, borderRadius: "2px" }} />
                <span style={KR}>{item.title}</span>
              </div>
            ))}
            {(schedules ?? []).length > 0 && (
              <div className="fc-legend-item" style={{ opacity: 0.7 }}>
                <span style={{ fontSize: "10px" }}>📍</span>
                <span style={KR}>구역별 홍보 게시 일정</span>
              </div>
            )}
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
                style={{ cursor: isAdmin && arg.event.extendedProps.kind === "event" ? "pointer" : "default" }}
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
              if (!isAdmin) return;
              const props = info.event.extendedProps as any;
              if (props.kind === "event" && props.eventId) {
                setLocation(`/events/${props.eventId}`);
              }
            }}
          />
        )}
      </div>

      {/* 행사 목록 */}
      {events.length > 0 && (
        <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-black/8 bg-zinc-50/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground" style={KR}>행사 목록</span>
            <span className="text-xs text-muted-foreground">{events.length}건</span>
          </div>
          <div className="divide-y divide-black/5">
            {events.map((e) => (
              isAdmin ? (
                <button
                  key={e.id}
                  onClick={() => setLocation(`/events/${e.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: eventColorMap.get(e.id) }} />
                  <span className="text-sm text-foreground flex-1 truncate" style={KR}>{e.title}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block" style={KR}>
                    {e.startDate} ~ {e.endDate}
                  </span>
                </button>
              ) : (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: eventColorMap.get(e.id) }} />
                  <span className="text-sm text-foreground flex-1 truncate" style={KR}>{e.title}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block" style={KR}>
                    {e.startDate} ~ {e.endDate}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* 홍보 일정 목록 */}
      {(schedules ?? []).length > 0 && (
        <div className="border border-black/10 rounded-lg bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-black/8 bg-zinc-50/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground" style={KR}>구역별 홍보 게시 일정</span>
            <span className="text-xs text-muted-foreground">{(schedules ?? []).length}건</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8 bg-zinc-50/30">
                {["행사", "구역", "게시 기간", "상태"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground" style={KR}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {(schedules ?? []).map((s) => (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: s.eventId ? getEventColor(s.eventId) : "#94a3b8" }} />
                      <span className="text-sm truncate max-w-[120px]" style={KR}>{s.eventTitle ?? "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-sm" style={KR}>{s.zoneName ?? s.zoneType ?? "구역"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap" style={KR}>
                    {s.startDate} ~ {s.endDate}
                  </td>
                  <td className="px-4 py-2.5">
                    {s.status && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border text-zinc-500 border-zinc-200 bg-zinc-50 whitespace-nowrap" style={KR}>
                        {SCHEDULE_STATUS_KR[s.status] ?? s.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
