import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogOut, QrCode, Users, Clock, Calendar, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Session {
  id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_active: boolean;
  classes: {
    course_code: string;
    course_name: string;
  };
  attendance_count: number;
}

export default function SessionHistory() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    totalAttendees: 0,
  });

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          start_time,
          end_time,
          duration_minutes,
          is_active,
          class_id
        `)
        .eq('lecturer_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;

      // Fetch class details and attendance count for each session
      if (data) {
        const enrichedData = await Promise.all(
          data.map(async (session) => {
            // Get class details
            const { data: classData } = await supabase
              .from('classes')
              .select('course_code, course_name')
              .eq('id', session.class_id)
              .single();

            // Count attendees
            const { count } = await supabase
              .from('attendance_records')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', session.id);

            return {
              ...session,
              classes: classData || { course_code: 'N/A', course_name: 'Unknown' },
              attendance_count: count || 0
            };
          })
        );

        setSessions(enrichedData);
        calculateStats(enrichedData);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Session[]) => {
    const totalAttendees = data.reduce((sum, s) => sum + s.attendance_count, 0);
    const activeSessions = data.filter(s => s.is_active).length;

    setStats({
      totalSessions: data.length,
      activeSessions,
      totalAttendees,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/lecturer/dashboard')}>
              ← Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Session History</h1>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSessions}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSessions}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAttendees}</div>
                <p className="text-xs text-muted-foreground">Across all sessions</p>
              </CardContent>
            </Card>
          </div>

          {/* Session List */}
          <Card>
            <CardHeader>
              <CardTitle>All Sessions</CardTitle>
              <CardDescription>
                Complete history of all attendance sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12">
                  <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No sessions yet. Start your first attendance session!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          session.is_active 
                            ? 'bg-green-500/10' 
                            : 'bg-muted-foreground/10'
                        }`}>
                          {session.is_active ? (
                            <Clock className="w-5 h-5 text-green-500 animate-pulse" />
                          ) : (
                            <QrCode className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {session.classes.course_code}
                            </p>
                            {session.is_active && (
                              <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-500 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {session.classes.course_name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="font-medium">{session.attendance_count}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">attendees</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(session.start_time).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.start_time).toLocaleTimeString()}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/lecturer/attendance-management?sessionId=${session.id}`)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}