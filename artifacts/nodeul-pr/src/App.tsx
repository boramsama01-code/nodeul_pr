import React, { useEffect, useRef } from "react";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { setAuthTokenGetter } from "@workspace/api-client-react";

import { AppLayout } from "@/components/layout/AppLayout";
import LandingPage from "@/pages/LandingPage";
import SignInPage from "@/pages/auth/SignInPage";
import SignUpPage from "@/pages/auth/SignUpPage";
import DashboardPage from "@/pages/DashboardPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminEventsPage from "@/pages/admin/AdminEventsPage";
import AdminCalendarPage from "@/pages/admin/AdminCalendarPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import EventCreatePage from "@/pages/events/EventCreatePage";
import EventDetailPage from "@/pages/events/EventDetailPage";
import NotFound from "@/pages/not-found";

setAuthTokenGetter(async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <LandingPage />;
  if (isSignedIn) return <Redirect to="/dashboard" />;
  return <LandingPage />;
}

function QueryCacheInvalidator() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
      queryClient.clear();
    }
    prevUserIdRef.current = userId;
  }, [userId, queryClient]);

  return null;
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <QueryCacheInvalidator />
          <AppLayout>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in" component={SignInPage} />
              <Route path="/sign-up" component={SignUpPage} />
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/events/new" component={EventCreatePage} />
              <Route path="/events/:id" component={EventDetailPage} />
              <Route path="/admin" component={AdminDashboardPage} />
              <Route path="/admin/events" component={AdminEventsPage} />
              <Route path="/admin/calendar" component={AdminCalendarPage} />
              <Route path="/admin/settings" component={AdminSettingsPage} />
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </WouterRouter>
  );
}
