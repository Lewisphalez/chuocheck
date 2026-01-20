import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import LecturerDashboard from "./pages/lecturer/Dashboard";
import LecturerClasses from "./pages/lecturer/Classes";
import StartSession from "./pages/lecturer/StartSession";
import ActiveSession from "./pages/lecturer/ActiveSession";
import SessionHistory from "./pages/lecturer/SessionHistory";
import LecturerReports from "./pages/lecturer/Reports";
import LecturerAnalytics from "./pages/lecturer/Analytics";
import LecturerSettings from "./pages/lecturer/Settings";
import StudentDashboard from "./pages/student/Dashboard";
import Scanner from "./pages/student/Scanner";
import AttendanceHistory from "./pages/student/AttendanceHistory";
import StudentSettings from "./pages/student/Settings";
import AttendanceInsights from "./pages/student/AttendanceInsights";
import Badges from "./pages/student/Badges";
import StudentLeaderboard from "./pages/student/Leaderboard";
import SessionTemplates from "./pages/lecturer/SessionTemplates";
import AttendanceManagement from "./pages/lecturer/AttendanceManagement";
import ClassAnnouncements from "./pages/lecturer/ClassAnnouncements";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUserManagement from "./pages/admin/UserManagement";
import NotFound from "./pages/NotFound";
import OfflineIndicator from "./components/OfflineIndicator";
import ForgotPassword from "./pages/ForgotPassword";
import About from "./pages/About";
import LecturerLeaderboard from "./pages/lecturer/Leaderboard";
import StudyGroups from "./pages/student/StudyGroups";
import BrowseClasses from "./pages/student/BrowseClasses";
import LecturerAssignments from "./pages/lecturer/Assignments";
import StudentAssignments from "./pages/student/Assignments";
import ActivityHistory from "./pages/ActivityHistory";
import DigitalIDPage from "./pages/student/DigitalID";
import LiveClass from "./pages/student/LiveClass";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
            <OfflineIndicator />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/about" element={<About />} />
            
            {/* Lecturer Routes */}
            <Route 
              path="/lecturer/dashboard" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <LecturerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/classes" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <LecturerClasses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/session/:classId" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <StartSession />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/active-session/:sessionId" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <ActiveSession />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/lecturer/session-history" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <SessionHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/leaderboard" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <LecturerLeaderboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/reports" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <LecturerReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/analytics" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <LecturerAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/settings" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <LecturerSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/templates" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <SessionTemplates />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/attendance-management" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <AttendanceManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/announcements" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <ClassAnnouncements />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/assignments" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <LecturerAssignments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lecturer/activity" 
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <ActivityHistory />
                </ProtectedRoute>
              } 
            />
            
            {/* Student Routes */}
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/scanner" 
              element={
                <ProtectedRoute requiredRole="student">
                  <Scanner />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/attendance" 
              element={
                <ProtectedRoute requiredRole="student">
                  <AttendanceHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/live-class/:sessionId" 
              element={
                <ProtectedRoute requiredRole="student">
                  <LiveClass />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/settings" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/insights" 
              element={
                <ProtectedRoute requiredRole="student">
                  <AttendanceInsights />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/badges" 
              element={
                <ProtectedRoute requiredRole="student">
                  <Badges />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/leaderboard" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentLeaderboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/study-groups" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudyGroups />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/browse-classes" 
              element={
                <ProtectedRoute requiredRole="student">
                  <BrowseClasses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/assignments" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentAssignments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/activity" 
              element={
                <ProtectedRoute requiredRole="student">
                  <ActivityHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/digital-id" 
              element={
                <ProtectedRoute requiredRole="student">
                  <DigitalIDPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute>
                  <AdminUserManagement />
                </ProtectedRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
