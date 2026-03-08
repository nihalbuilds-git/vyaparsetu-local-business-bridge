import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Workers from "./pages/Workers";
import Attendance from "./pages/Attendance";
import Salary from "./pages/Salary";
import Campaigns from "./pages/Campaigns";
import CampaignHistory from "./pages/CampaignHistory";
import AttendanceCalendar from "./pages/AttendanceCalendar";
import Profile from "./pages/Profile";
import Contacts from "./pages/Contacts";
import Khata from "./pages/Khata";
import Inventory from "./pages/Inventory";
import Invoices from "./pages/Invoices";
import Expenses from "./pages/Expenses";
import WorkerAdvances from "./pages/WorkerAdvances";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth" element={<Navigate to="/login" replace />} />
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
              <Route path="/profile" element={<Navigate to="/business-profile" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
