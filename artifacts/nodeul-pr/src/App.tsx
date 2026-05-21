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
import AdminPendingEventsPage from "@/pages/admin/AdminPendingEventsPage";
import AdminRevisionEventsPage from "@/pages/admin/AdminRevisionEventsPage";
import AdminCalendarPage from "@/pages/admin/AdminCalendarPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import EventCreatePage from "@/pages/events/EventCreatePage";
import EventDetailPage from "@/pages/events/EventDetailPage";
import UserCalendarPage from "@/pages/UserCalendarPage";
import MyAssetsPage from "@/pages/MyAssetsPage";
import NotFound from "@/pages/not-found";

setAuthTokenGetter(async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  return <LandingPage />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <Component />;
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
              <Route path="/dashboard">{() => <ProtectedRoute component={DashboardPage} />}</Route>
              <Route path="/events/new">{() => <ProtectedRoute component={EventCreatePage} />}</Route>
              <Route path="/events/:id">{() => <ProtectedRoute component={EventDetailPage} />}</Route>
              <Route path="/calendar">{() => <ProtectedRoute component={UserCalendarPage} />}</Route>
              <Route path="/my-assets">{() => <ProtectedRoute component={MyAssetsPage} />}</Route>
              <Route path="/admin">{() => <ProtectedRoute component={AdminDashboardPage} adminOnly />}</Route>
              <Route path="/admin/pending">{() => <ProtectedRoute component={AdminPendingEventsPage} adminOnly />}</Route>
              <Route path="/admin/revision">{() => <ProtectedRoute component={AdminRevisionEventsPage} adminOnly />}</Route>
              <Route path="/admin/events">{() => <ProtectedRoute component={AdminEventsPage} adminOnly />}</Route>
              <Route path="/admin/calendar">{() => <ProtectedRoute component={AdminCalendarPage} adminOnly />}</Route>
              <Route path="/admin/settings">{() => <ProtectedRoute component={AdminSettingsPage} adminOnly />}</Route>
              <Route path="/admin/users">{() => <ProtectedRoute component={AdminUsersPage} adminOnly />}</Route>
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </WouterRouter>
  );
}
