import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Link } from "wouter";
import { useGetMe, getGetMeQueryKey, useGetAdminCalendar, getGetAdminCalendarQueryKey } from "@workspace/api-client-react";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelBadge } from "@/components/pixel/PixelBadge";
import { useUIStore } from "@/store/useUIStore";

const ZONE_COLORS: Record<string, string> = {
  instagram: "#e1306c",
  billboard: "#f59e0b",
  website_banner: "#3b82f6",
  signage: "#10b981",
  other: "#8b5cf6",
};

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function AdminCalendarPage() {
  const { isSignedIn } = useAuth();
  const { data: me } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } });
  const setNPCMessage = useUIStore(s => s.setNPCMessage);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const { data: schedules = [], isLoading } = useGetAdminCalendar(
    { month: monthStr },
    { query: { enabled: !!me && (me.role === "admin" || me.role === "super_admin"), queryKey: getGetAdminCalendarQueryKey({ month: monthStr }) } }
  );

  React.useEffect(() => {
    setNPCMessage("📅 홍보 일정 캘린더입니다. 구역별 색상으로 구분됩니다!");
  }, [setNPCMessage]);

  const role = me?.role;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (role && role !== "admin" && role !== "super_admin") return <Redirect to="/dashboard" />;

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function getSchedulesForDay(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return schedules.filter(s => s.startDate <= dateStr && s.endDate >= dateStr);
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-4 border-black pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-pixel text-primary">홍보 캘린더</h1>
          <p className="font-pixel-body text-lg text-muted-foreground mt-1">구역별 게시 일정을 한눈에 확인</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin"><PixelButton variant="ghost" size="sm">← Admin HUD</PixelButton></Link>
          <Link href="/admin/settings"><PixelButton variant="secondary" size="sm">⚙️ 구역 설정</PixelButton></Link>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-white border-4 border-black p-3">
        <PixelButton variant="ghost" size="sm" onClick={prevMonth}>◀ 이전</PixelButton>
        <span className="font-pixel text-sm sm:text-base">{year}년 {month}월</span>
        <PixelButton variant="ghost" size="sm" onClick={nextMonth}>다음 ▶</PixelButton>
      </div>

      {/* Zone Legend */}
      <div className="flex flex-wrap gap-2">
        {Array.from(new Set(schedules.map(s => s.zoneType).filter(Boolean))).map(type => (
          <div key={type} className="flex items-center gap-1 border-2 border-black px-2 py-1 bg-white">
            <div className="w-3 h-3 border border-black" style={{ backgroundColor: ZONE_COLORS[type!] || "#888" }} />
            <span className="font-pixel-body text-sm">{type}</span>
          </div>
        ))}
        {schedules.length > 0 && (
          <div className="flex items-center gap-1 border-2 border-black px-2 py-1 bg-white">
            <span className="font-pixel-body text-sm text-muted-foreground">총 {schedules.length}건</span>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-bounce text-4xl">⏳</div>
        </div>
      ) : (
        <div className="border-4 border-black bg-white overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b-4 border-black">
            {DAYS.map((d, i) => (
              <div key={d} className={`text-center font-pixel text-xs py-2 border-r-2 border-black last:border-r-0 ${i === 0 ? "text-destructive" : i === 6 ? "text-secondary" : ""}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {Array.from({ length: cells.length / 7 }, (_, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b-2 border-black last:border-b-0">
              {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
                const daySchedules = day ? getSchedulesForDay(day) : [];
                const colIdx = di;
                return (
                  <div
                    key={di}
                    className={`min-h-[60px] sm:min-h-[80px] border-r-2 border-black last:border-r-0 p-1 relative ${
                      !day ? "bg-muted/40" : isToday(day) ? "bg-primary/10" : "bg-white"
                    }`}
                  >
                    {day && (
                      <>
                        <div className={`font-pixel text-[10px] sm:text-xs mb-1 ${colIdx === 0 ? "text-destructive" : colIdx === 6 ? "text-secondary" : ""} ${isToday(day) ? "font-bold text-primary" : ""}`}>
                          {isToday(day) ? `●${day}` : day}
                        </div>
                        <div className="space-y-0.5">
                          {daySchedules.slice(0, 3).map(s => (
                            <Link key={s.id} href={`/events/${s.eventId}`}>
                              <div
                                className="text-white text-[9px] sm:text-xs px-1 py-0.5 truncate cursor-pointer hover:opacity-80 transition-opacity border border-black/20"
                                style={{ backgroundColor: ZONE_COLORS[s.zoneType || ""] || (s.zoneColor || "#888") }}
                                title={`${s.eventTitle} — ${s.zoneName}`}
                              >
                                <span className="hidden sm:inline">{s.eventTitle}</span>
                                <span className="sm:hidden">●</span>
                              </div>
                            </Link>
                          ))}
                          {daySchedules.length > 3 && (
                            <div className="font-pixel text-[9px] text-muted-foreground pl-1">+{daySchedules.length - 3}</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Schedule List */}
      {schedules.length > 0 && (
        <div className="bg-white border-4 border-black p-4">
          <h2 className="font-pixel text-sm mb-4 border-b-4 border-black pb-2">{month}월 전체 일정 목록</h2>
          <div className="space-y-2">
            {schedules.map(s => (
              <Link key={s.id} href={`/events/${s.eventId}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-2 border-black p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                  <div
                    className="w-3 h-3 border border-black flex-shrink-0 hidden sm:block"
                    style={{ backgroundColor: ZONE_COLORS[s.zoneType || ""] || "#888" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel text-xs truncate">{s.eventTitle}</div>
                    <div className="font-pixel-body text-sm text-muted-foreground">{s.zoneName} · {s.startDate} ~ {s.endDate}</div>
                  </div>
                  <PixelBadge variant="secondary">{s.status}</PixelBadge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {schedules.length === 0 && !isLoading && (
        <div className="text-center py-12 border-4 border-dashed border-black bg-white">
          <div className="text-4xl mb-4">📭</div>
          <p className="font-pixel text-sm text-muted-foreground">이 달에 등록된 홍보 일정이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
