import React from "react";
import { useAuth, useUser } from "@clerk/react";
import { Redirect } from "wouter";
import { useGetAdminDashboard, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelBadge } from "@/components/pixel/PixelBadge";
import { PixelButton } from "@/components/pixel/PixelButton";
import { Link } from "wouter";
import { useUIStore } from "@/store/useUIStore";

export default function AdminDashboardPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const setNPCMessage = useUIStore(state => state.setNPCMessage);

  React.useEffect(() => {
    setNPCMessage("Admin HUD: Monitor all island activities here.");
  }, [setNPCMessage]);

  const { data: dashboard, isLoading } = useGetAdminDashboard({ query: { enabled: !!user, queryKey: getGetAdminDashboardQueryKey() } });

  const role = user?.publicMetadata?.role;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (role !== "admin" && role !== "super_admin") return <Redirect to="/dashboard" />;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end border-b-4 border-black pb-4">
        <div>
          <h1 className="text-4xl font-pixel text-destructive uppercase">Admin HUD</h1>
          <p className="font-pixel-body text-xl text-muted-foreground mt-2">Nodeul Island Central Command</p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/events"><PixelButton variant="secondary">All Events</PixelButton></Link>
          <Link href="/admin/calendar"><PixelButton variant="accent">Calendar</PixelButton></Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-pixel-bounce text-4xl">⏳</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PixelCard variant="alert" className="flex flex-col items-center justify-center p-6 space-y-2">
            <span className="font-pixel-body text-xl">Pending Approvals</span>
            <span className="font-pixel text-5xl">{dashboard?.pendingApprovalCount || 0}</span>
            {(dashboard?.pendingApprovalCount || 0) > 0 && <span className="animate-pulse text-yellow-300 font-pixel mt-2">! ACTION REQ !</span>}
          </PixelCard>
          
          <PixelCard className="flex flex-col items-center justify-center p-6 space-y-2 bg-secondary text-secondary-foreground">
            <span className="font-pixel-body text-xl">New Submissions</span>
            <span className="font-pixel text-5xl">{dashboard?.newSubmissionsCount || 0}</span>
          </PixelCard>
          
          <PixelCard className="flex flex-col items-center justify-center p-6 space-y-2 bg-success text-success-foreground">
            <span className="font-pixel-body text-xl">Today's Schedule</span>
            <span className="font-pixel text-5xl">{dashboard?.todayScheduleCount || 0}</span>
          </PixelCard>
          
          <PixelCard className="flex flex-col items-center justify-center p-6 space-y-2 bg-accent text-accent-foreground">
            <span className="font-pixel-body text-xl">Conflicts</span>
            <span className="font-pixel text-5xl">{dashboard?.conflictCount || 0}</span>
            {(dashboard?.conflictCount || 0) > 0 && <span className="animate-pulse text-destructive font-pixel mt-2 text-sm">! WARNING !</span>}
          </PixelCard>
        </div>
      )}
      
      {dashboard?.recentEvents && dashboard.recentEvents.length > 0 && (
        <PixelCard className="bg-white">
          <h2 className="text-xl font-pixel mb-6 border-b-4 border-black pb-2">Recent Activities</h2>
          <div className="space-y-4">
            {dashboard.recentEvents.map(event => (
              <div key={event.id} className="flex justify-between items-center border-2 border-black p-3 bg-background">
                <div>
                  <h3 className="font-pixel text-sm">{event.title}</h3>
                  <p className="font-pixel-body text-sm text-muted-foreground">{event.organizationName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <PixelBadge>{event.status}</PixelBadge>
                  <Link href={`/admin/events/${event.id}`}>
                    <PixelButton size="sm">Inspect</PixelButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </PixelCard>
      )}
    </div>
  );
}