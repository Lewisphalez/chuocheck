import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, History, FileText, BarChart3, LogOut, Users, TrendingUp, AlertCircle, Plus, GraduationCap, Menu, QrCode, Settings, Layout, UserCog, Megaphone, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { ActivityFeed } from '@/components/ActivityFeed';
import { QuickActions } from '@/components/QuickActions';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LecturerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    activeSessions: 0,
    avgAttendance: 0,
    recentSessions: [] as any[],
    activeSessionsList: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');

  // Timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Dashboard loading timeout - forcing loading state to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  const fetchUserName = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle();
      
      setUserName(
        data?.full_name || 
        data?.email?.split('@')[0] || 
        'Lecturer'
      );
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  }, [user]);

  const fetchDashboardStats = useCallback(async () => {
    if (!user) return;

    try {
      // Get total classes
      const { count: totalClasses } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('lecturer_id', user.id);

      // Get all class IDs for this lecturer
      const { data: classes } = await supabase
        .from('classes')
        .select('id, course_code, course_name')
        .eq('lecturer_id', user.id);

      const classIds = classes?.map(c => c.id) || [];

      // Get total enrolled students across all classes
      const { count: totalStudents } = await supabase
        .from('student_enrollments')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds);

      // Get active sessions
      const { count: activeSessions } = await supabase
        .from('attendance_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('lecturer_id', user.id)
        .eq('is_active', true);

      // Get active sessions list with details
      const { data: activeSessionsList } = await supabase
        .from('attendance_sessions')
        .select('id, end_time, classes(course_code, course_name)')
        .eq('lecturer_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Get recent sessions (last 5)
      const { data: recentSessions } = await supabase
        .from('attendance_sessions')
        .select('*, classes(course_code, course_name)')
        .eq('lecturer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate average attendance using optimized database function
      const { data: avgAttendanceData } = await supabase
        .rpc('calculate_lecturer_avg_attendance', {
          lecturer_uuid: user.id
        });

      const avgAttendance = avgAttendanceData ? Math.round(avgAttendanceData) : 0;

      setStats({
        totalClasses: totalClasses || 0,
        totalStudents: totalStudents || 0,
        activeSessions: activeSessions || 0,
        avgAttendance,
        recentSessions: recentSessions || [],
        activeSessionsList: activeSessionsList || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set partial stats even on error to prevent blank dashboard
      setStats(prev => ({ ...prev }));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchDashboardStats();
      fetchUserName();
    }
  }, [user, fetchDashboardStats, fetchUserName]);

  // Real-time subscriptions for live updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes',
          filter: `lecturer_id=eq.${user.id}`,
        },
        () => {
          fetchDashboardStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_sessions',
          filter: `lecturer_id=eq.${user.id}`,
        },
        () => {
          fetchDashboardStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_enrollments',
        },
        () => {
          fetchDashboardStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
        },
        () => {
          fetchDashboardStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchDashboardStats]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">ChuoCheck Lecturer</h1>
              <p className="text-sm text-muted-foreground">Welcome back{userName && `, ${userName}`}!</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="w-4 h-4 mr-2" />
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/lecturer/classes')}>
                <QrCode className="w-4 h-4 mr-2" />
                Start Session
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/lecturer/classes')}>
                <BookOpen className="w-4 h-4 mr-2" />
                Manage Classes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/lecturer/session-history')}>
                <History className="w-4 h-4 mr-2" />
                Session History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/lecturer/reports')}>
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/lecturer/analytics')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/lecturer/templates')}>
                <Layout className="w-4 h-4 mr-2" />
                Session Templates
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Admin Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/lecturer/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <EmailVerificationBanner />
          
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground mt-2">
              Manage your classes and track attendance
            </p>
          </div>

          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.totalClasses}</div>
                <p className="text-xs text-muted-foreground">Your courses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">Enrolled across classes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.activeSessions}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : `${stats.avgAttendance}%`}</div>
                <p className="text-xs text-muted-foreground">Across all classes</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Sessions Widget */}
          {stats.activeSessionsList.length > 0 && (
            <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary animate-pulse" />
                  Active Sessions
                </CardTitle>
                <CardDescription>Sessions currently running - you can resume at any time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.activeSessionsList.map((session: any) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-muted/50 transition-colors border border-primary/20"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {session.classes?.course_code} - {session.classes?.course_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ends at {new Date(session.end_time).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => navigate(`/lecturer/active-session/${session.id}`)}
                        size="sm"
                        className="ml-2"
                      >
                        Resume Session
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Sessions Widget */}
          {stats.recentSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Sessions
                </CardTitle>
                <CardDescription>Your last 5 attendance sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.recentSessions.map((session: any) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {session.classes?.course_code} - {session.classes?.course_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.start_time).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          session.is_active 
                            ? 'bg-green-500/10 text-green-600' 
                            : 'bg-gray-500/10 text-gray-600'
                        }`}>
                          {session.is_active ? 'Active' : 'Ended'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions & Activity */}
          <div className="grid gap-4 md:grid-cols-2">
            <QuickActions />
            <ActivityFeed />
          </div>

          {/* Quick Actions Legacy */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Manage your classes and sessions efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Button 
                onClick={() => navigate('/lecturer/classes')} 
                className="justify-start h-12"
                variant="outline"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Classes
              </Button>
              <Button 
                onClick={() => navigate('/lecturer/templates')} 
                className="justify-start h-12"
                variant="outline"
              >
                <Layout className="h-4 w-4 mr-2" />
                Session Templates
              </Button>
              <Button 
                onClick={() => navigate('/lecturer/session-history')} 
                className="justify-start h-12"
                variant="outline"
              >
                <History className="h-4 w-4 mr-2" />
                Session History
              </Button>
              <Button 
                onClick={() => navigate('/lecturer/reports')} 
                className="justify-start h-12"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Reports
              </Button>
              <Button 
                onClick={() => navigate('/lecturer/analytics')} 
                className="justify-start h-12"
                variant="outline"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
