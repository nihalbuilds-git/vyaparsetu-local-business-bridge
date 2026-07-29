import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Route-level code splitting: heavy deps (recharts, jspdf, syntax highlighter)
// stay out of the initial bundle.
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Workers = lazy(() => import("./pages/Workers"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Salary = lazy(() => import("./pages/Salary"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const CampaignHistory = lazy(() => import("./pages/CampaignHistory"));
const AttendanceCalendar = lazy(() => import("./pages/AttendanceCalendar"));
const Profile = lazy(() => import("./pages/Profile"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Khata = lazy(() => import("./pages/Khata"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Expenses = lazy(() => import("./pages/Expenses"));
const WorkerAdvances = lazy(() => import("./pages/WorkerAdvances"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Stores = lazy(() => import("./pages/Stores"));
const WhatsAppRemindersPage = lazy(() => import("./pages/WhatsAppReminders"));
const Reports = lazy(() => import("./pages/Reports"));
const Assistant = lazy(() => import("./pages/Assistant"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Refund = lazy(() => import("./pages/legal/Refund"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const SecurityLog = lazy(() => import("./pages/SecurityLog"));
const AIChatWidget = lazy(() => import("./components/AIChatWidget"));
const CookieConsent = lazy(() => import("./components/CookieConsent"));

const queryClient = new QueryClient();

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

const App = () => (
  <ErrorBoundary scope="root">
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<Spinner />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth" element={<Navigate to="/login" replace />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/refund" element={<Refund />} />
                  <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/workers" element={<ProtectedRoute><Workers /></ProtectedRoute>} />
                  <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
                  <Route path="/attendance-calendar" element={<ProtectedRoute><AttendanceCalendar /></ProtectedRoute>} />
                  <Route path="/salary" element={<ProtectedRoute><Salary /></ProtectedRoute>} />
                  <Route path="/campaign" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
                  <Route path="/campaign-history" element={<ProtectedRoute><CampaignHistory /></ProtectedRoute>} />
                  <Route path="/campaigns" element={<Navigate to="/campaign" replace />} />
                  <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
                  <Route path="/business-profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/khata" element={<ProtectedRoute><Khata /></ProtectedRoute>} />
                  <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                  <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                  <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                  <Route path="/worker-advances" element={<ProtectedRoute><WorkerAdvances /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/analytics" element={<Navigate to="/reports" replace />} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
                  <Route path="/stores" element={<ProtectedRoute><Stores /></ProtectedRoute>} />
                  <Route path="/whatsapp-reminders" element={<ProtectedRoute><WhatsAppRemindersPage /></ProtectedRoute>} />
                  <Route path="/security-log" element={<ProtectedRoute><SecurityLog /></ProtectedRoute>} />
                  <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
                  <Route path="/profile" element={<Navigate to="/business-profile" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <ErrorBoundary scope="chat-widget">
                <Suspense fallback={null}>
                  <AIChatWidget />
                </Suspense>
              </ErrorBoundary>
              <Suspense fallback={null}>
                <CookieConsent />
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
