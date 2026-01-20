import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, QrCode, History, Settings, LogOut, TrendingUp, Calendar, Award, GraduationCap, Menu, BarChart3, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BrowseClasses from './BrowseClasses';
import SessionNotifications from '@/components/SessionNotifications';
import AnnouncementsInbox from '@/components/AnnouncementsInbox';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { AttendanceGoals } from '@/components/AttendanceGoals';
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

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    classesToday: 0,
    overallAttendance: 0,
    scansThisWeek: 0,
    attendanceStreak: 0,
    upcomingClasses: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchUserName();
    }
  }, [user]);

  const fetchUserName = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();
    
    setUserName(
      data?.full_name || 
      data?.email?.split('@')[0] || 
      'Student'
    );
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get enrolled classes
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('class_id')
        .eq('student_id', user.id);

      const enrolledClassIds = enrollments?.map(e => e.class_id) || [];

      if (enrolledClassIds.length === 0) {
        setStats({
          classesToday: 0,
          overallAttendance: 0,
          scansThisWeek: 0,
          attendanceStreak: 0,
          upcomingClasses: [],
        });
        setLoading(false);
        return;
      }

      // Get active sessions count
      const { count: activeSessions } = await supabase
        .from('attendance_sessions')
        .select('*', { count: 'exact', head: true })
        .in('class_id', enrolledClassIds)
        .eq('is_active', true);

      // Get attendance records
      const { count: attendedSessions } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id);

      // Calculate overall attendance percentage - count ALL sessions (active=false means ended)
      const { count: totalSessions } = await supabase
        .from('attendance_sessions')
        .select('*', { count: 'exact', head: true })
        .in('class_id', enrolledClassIds);

      const attendancePercentage = totalSessions && totalSessions > 0
        ? Math.round((attendedSessions || 0) / totalSessions * 100)
        : 0;

      // Get scans this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: scansThisWeek } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .gte('scanned_at', weekAgo.toISOString());

      // Calculate attendance streak (consecutive days with attendance)
      const { data: recentAttendance } = await supabase
        .from('attendance_records')
        .select('scanned_at')
        .eq('student_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(30);

      let streak = 0;
      if (recentAttendance && recentAttendance.length > 0) {
        const dates = recentAttendance.map(r => new Date(r.scanned_at).toDateString());
        const uniqueDates = [...new Set(dates)];
        
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
          streak = 1;
          for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i - 1]);
            const currDate = new Date(uniqueDates[i]);
            const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000);
            if (diffDays === 1) {
              streak++;
            } else {
              break;
            }
          }
        }
      }

      // Get upcoming classes (next 3 enrolled classes)
      const { data: upcomingData } = await supabase
        .from('classes')
        .select('id, course_code, course_name')
        .in('id', enrolledClassIds)
        .limit(3);

      setStats({
        classesToday: activeSessions || 0,
        overallAttendance: attendancePercentage,
        scansThisWeek: scansThisWeek || 0,
        attendanceStreak: streak,
        upcomingClasses: upcomingData || [],
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SessionNotifications />
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center sm:justify-between relative">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">ChuoCheck Student</h1>
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
              <DropdownMenuItem onClick={() => navigate('/student/scanner')}>
                <QrCode className="w-4 h-4 mr-2" />
                Scan QR Code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/student/attendance')}>
                <History className="w-4 h-4 mr-2" />
                View History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/student/insights')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Attendance Insights
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/student/badges')}>
                <Award className="w-4 h-4 mr-2" />
                Achievement Badges
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/student/digital-id')}>
                <GraduationCap className="w-4 h-4 mr-2" />
                Digital ID Card
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/student/settings')}>
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
              Welcome back{userName && `, ${userName}`}! Track your attendance and manage your classes
            </p>
          </div>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => navigate('/student/scanner')}
                  size="lg" 
                  className="h-16"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Scan QR Code
                </Button>
                <Button 
                  onClick={() => navigate('/student/attendance')}
                  size="lg" 
                  variant="outline"
                  className="h-16"
                >
                  <History className="w-5 h-5 mr-2" />
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* New Features Highlights */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate('/student/insights')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Insights</CardTitle>
                <BarChart3 className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">View detailed analytics and patterns</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate('/student/badges')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Achievement Badges</CardTitle>
                <Award className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Unlock badges and earn rewards</p>
              </CardContent>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.classesToday}</div>
                <p className="text-xs text-muted-foreground">Active sessions now</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : `${stats.overallAttendance}%`}</div>
                <p className="text-xs text-muted-foreground">Across all classes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scans This Week</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.scansThisWeek}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Streak</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.attendanceStreak}</div>
                <p className="text-xs text-muted-foreground">Consecutive days</p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Classes Widget */}
          {stats.upcomingClasses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Your Enrolled Classes
                </CardTitle>
                <CardDescription>Quick access to your classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.upcomingClasses.map((cls: any) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{cls.course_code}</p>
                        <p className="text-sm text-muted-foreground">{cls.course_name}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/student/scanner')}
                      >
                        <QrCode className="h-4 w-4 mr-1" />
                        Scan
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <QuickActions />

          {/* Attendance Goals & Activity */}
          <div className="grid gap-4 md:grid-cols-2">
            <AttendanceGoals />
            <ActivityFeed />
          </div>

          {/* Announcements Inbox */}
          <AnnouncementsInbox />

          {/* Browse Classes Section */}
          <BrowseClasses />
        </div>
      </main>
    </div>
  );
}
