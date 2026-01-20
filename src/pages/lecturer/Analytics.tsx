import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, Users, Calendar, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d'];

export default function Analytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchAnalytics();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('lecturer_id', user.id)
      .order('course_name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load classes',
        variant: 'destructive',
      });
    } else {
      setClasses(data || []);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedClass) return;

    setLoading(true);
    try {
      // Fetch all sessions for the class
      const { data: sessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          attendance_records (
            id,
            student_id,
            scanned_at
          )
        `)
        .eq('class_id', selectedClass)
        .order('start_time', { ascending: true });

      if (sessionsError) throw sessionsError;

      // Calculate analytics
      const totalSessions = sessions?.length || 0;
      const totalAttendance = sessions?.reduce((sum, s) => sum + s.attendance_records.length, 0) || 0;
      const avgAttendance = totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0;

      // Attendance trend over time
      const trendData = sessions?.map((session) => ({
        date: new Date(session.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        attendees: session.attendance_records.length,
      })) || [];

      // Peak attendance times (hour of day)
      const hourDistribution: { [key: number]: number } = {};
      sessions?.forEach((session) => {
        const hour = new Date(session.start_time).getHours();
        hourDistribution[hour] = (hourDistribution[hour] || 0) + session.attendance_records.length;
      });

      const peakHoursData = Object.entries(hourDistribution).map(([hour, count]) => ({
        hour: `${hour}:00`,
        attendance: count,
      }));

      // Get unique students
      const uniqueStudents = new Set<string>();
      sessions?.forEach((session) => {
        session.attendance_records.forEach((record: any) => {
          uniqueStudents.add(record.student_id);
        });
      });

      // Calculate participation rate per student
      const studentParticipation: { [key: string]: number } = {};
      sessions?.forEach((session) => {
        session.attendance_records.forEach((record: any) => {
          studentParticipation[record.student_id] = (studentParticipation[record.student_id] || 0) + 1;
        });
      });

      const participationData = Object.entries(studentParticipation).map(([, count]) => ({
        sessions: count,
        count: 1,
      })).reduce((acc: any[], curr) => {
        const existing = acc.find((item) => item.sessions === curr.sessions);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ ...curr });
        }
        return acc;
      }, []).sort((a, b) => a.sessions - b.sessions);

      setAnalytics({
        totalSessions,
        totalAttendance,
        avgAttendance,
        uniqueStudents: uniqueStudents.size,
        trendData,
        peakHoursData,
        participationData,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/lecturer/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Advanced Analytics</h1>
            <p className="text-muted-foreground">Detailed attendance insights and trends</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Class</CardTitle>
            <CardDescription>Choose a class to view detailed analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.course_code} - {cls.course_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        )}

        {!loading && analytics && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalSessions}</div>
                  <p className="text-xs text-muted-foreground">Sessions conducted</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.avgAttendance}</div>
                  <p className="text-xs text-muted-foreground">Per session</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Attendance</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalAttendance}</div>
                  <p className="text-xs text-muted-foreground">All sessions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Students</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.uniqueStudents}</div>
                  <p className="text-xs text-muted-foreground">Participated</p>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trend</CardTitle>
                <CardDescription>Number of students per session over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="attendees" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            {analytics.peakHoursData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Peak Attendance Hours</CardTitle>
                  <CardDescription>Total attendance by time of day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.peakHoursData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="attendance" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Student Participation Distribution */}
            {analytics.participationData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Student Participation Distribution</CardTitle>
                  <CardDescription>How many students attended how many sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.participationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sessions" label={{ value: 'Number of Sessions Attended', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="hsl(var(--secondary))" name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!loading && !analytics && selectedClass && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No data available for this class yet
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
