import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, ArrowLeft } from 'lucide-react';
import { generatePDFReport, generateCSVReport } from '@/lib/reportUtils';
import { format } from 'date-fns';

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchSessions();
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

  const fetchSessions = async () => {
    if (!selectedClass) return;

    setLoading(true);
    const { data, error } = await supabase
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
      .order('start_time', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load sessions',
        variant: 'destructive',
      });
    } else {
      setSessions(data || []);
    }
    setLoading(false);
  };

  const exportSession = async (session: any, exportFormat: 'pdf' | 'csv') => {
    const selectedClassData = classes.find(c => c.id === selectedClass);
    
    // Fetch student profiles for attendees
    const studentIds = session.attendance_records.map((r: any) => r.student_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', studentIds);

    const attendees = session.attendance_records.map((record: any) => {
      const profile = profiles?.find(p => p.id === record.student_id);
      return {
        name: profile?.full_name || 'Unknown',
        email: profile?.email || 'N/A',
        scannedAt: format(new Date(record.scanned_at), 'HH:mm:ss'),
      };
    });

    const reportData = {
      className: selectedClassData?.course_name || 'Unknown',
      courseCode: selectedClassData?.course_code || 'N/A',
      sessionDate: format(new Date(session.start_time), 'MMM dd, yyyy'),
      sessionTime: format(new Date(session.start_time), 'HH:mm'),
      attendees,
    };

    if (exportFormat === 'pdf') {
      generatePDFReport(reportData);
    } else {
      generateCSVReport(reportData);
    }

    toast({
      title: 'Report Generated',
      description: `${exportFormat.toUpperCase()} report downloaded successfully`,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/lecturer/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Attendance Reports</h1>
            <p className="text-muted-foreground">Export attendance data for your classes</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Class</CardTitle>
            <CardDescription>Choose a class to view and export attendance reports</CardDescription>
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
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        )}

        {!loading && sessions.length === 0 && selectedClass && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No sessions found for this class
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {format(new Date(session.start_time), 'MMMM dd, yyyy')}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(session.start_time), 'HH:mm')} - {session.duration_minutes} minutes
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{session.attendance_records.length}</div>
                    <div className="text-sm text-muted-foreground">Students</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { void exportSession(session, 'pdf'); }}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { void exportSession(session, 'csv'); }}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
