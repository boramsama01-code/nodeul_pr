import React from "react";
import { useAuth, useUser } from "@clerk/react";
import { Redirect } from "wouter";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";

import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelBadge } from "@/components/pixel/PixelBadge";
import { Link } from "wouter";
import { useUIStore } from "@/store/useUIStore";

export default function DashboardPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const setNPCMessage = useUIStore(state => state.setNPCMessage);

  React.useEffect(() => {
    setNPCMessage("Quest Log: Here are your active promotion requests!");
  }, [setNPCMessage]);

  const { data: eventData, isLoading } = useListEvents({}, { query: { enabled: !!isSignedIn, queryKey: getListEventsQueryKey({}) } });

  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }

  const events = eventData?.events || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-pixel text-primary uppercase">My Quest Log</h1>
        <Link href="/events/new">
          <PixelButton variant="primary" size="md">Start New Quest (Event)</PixelButton>
        </Link>
      </div>

      <PixelCard variant="default" className="bg-white">
        <h2 className="text-xl font-pixel mb-6 border-b-4 border-black pb-2">Active Quests</h2>
        
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-pixel-bounce text-4xl">⏳</div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center p-12 space-y-4">
            <p className="text-2xl font-pixel-body text-muted-foreground">No active quests found.</p>
            <p className="text-lg font-pixel-body text-muted-foreground">Click the button above to start a new event promotion quest.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border-4 border-black p-4 bg-background hover:bg-muted/20 transition-colors pixel-hover-glow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-pixel text-lg">{event.title}</h3>
                    <PixelBadge variant={event.status === 'completed' ? 'success' : 'primary'}>
                      {event.status}
                    </PixelBadge>
                  </div>
                  <p className="font-pixel-body text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </p>
                </div>
                
                <Link href={`/events/${event.id}`}>
                  <PixelButton variant="secondary" size="sm">View Status</PixelButton>
                </Link>
              </div>
            ))}
          </div>
        )}
      </PixelCard>
    </div>
  );
}