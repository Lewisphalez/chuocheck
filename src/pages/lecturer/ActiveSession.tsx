import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateQRCode } from '@/lib/qrcode';
import { preventScreenshot } from '@/lib/securityUtils';
import { requestNotificationPermission, notifySessionActive } from '@/lib/notifications';
import { logActivity } from '@/lib/activityLogger';
import { X, Users, Clock, CheckCircle2, LogOut, Shield, MapPin, Settings, AlertCircle, PlayCircle } from 'lucide-react';

interface Session {
  id: string;
  session_code: string;
  end_time: string;
  duration_minutes: number;
  is_active: boolean;
  location_required: boolean;
  classroom_latitude: number | null;
  classroom_longitude: number | null;
  geofence_radius_meters: number | null;
  classes: {
    course_code: string;
    course_name: string;
  };
}

interface AttendanceRecord {
  id: string;
  scanned_at: string;
  student_id: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
}

export default function ActiveSession() {
  const { sessionId } = useParams();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [sentiments, setSentiments] = useState({ understood: 0, neutral: 0, confused: 0 });

  // Presence Check State
  const [activeCheckId, setActiveCheckId] = useState<string | null>(null);
  const [checkTimeLeft, setCheckTimeLeft] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    
    // Initial fetch of sentiments
    const fetchSentiments = async () => {
      const { data } = await supabase
        .from('session_sentiments')
        .select('sentiment')
        .eq('session_id', sessionId);
        
      if (data) {
        const counts = data.reduce((acc: any, curr: any) => {
          acc[curr.sentiment] = (acc[curr.sentiment] || 0) + 1;
          return acc;
        }, { understood: 0, neutral: 0, confused: 0 });
        setSentiments(counts);
      }
    };
    
    fetchSentiments();
    
    // Realtime subscription for sentiments
    const sentimentChannel = supabase
      .channel('sentiment-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_sentiments',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setSentiments(prev => ({
            ...prev,
            [payload.new.sentiment]: (prev[payload.new.sentiment as keyof typeof prev] || 0) + 1
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sentimentChannel);
    };
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
    
    // Request notification permission
    requestNotificationPermission();
    
    // Enable screenshot prevention
    preventScreenshot(() => {
      toast({
        title: 'Security Alert',
        description: 'Screenshot detection activated',
        variant: 'destructive',
      });
    });
  }, [sessionId]);

  useEffect(() => {
    if (!session) return;

    // Set up realtime subscription for new attendance records
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          // Fetch the profile for the new attendee instantly
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', payload.new.student_id)
            .single();
          
          // Add the new attendee to the top of the list immediately
          const newAttendee: AttendanceRecord = {
            id: payload.new.id,
            scanned_at: payload.new.scanned_at,
            student_id: payload.new.student_id,
            profiles: profile || { full_name: null, email: 'Unknown' }
          };
          
          setAttendees((prev) => [newAttendee, ...prev]);
          
          // Show toast notification
          toast({
            title: 'New Attendance',
            description: `${profile?.full_name || profile?.email || 'Student'} just checked in`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, sessionId, toast]);

  // Presence Check Logic
  useEffect(() => {
    if (!activeCheckId) return;

    // Subscribe to responses
    const responseChannel = supabase
      .channel(`responses-${activeCheckId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_check_responses',
          filter: `check_id=eq.${activeCheckId}`,
        },
        () => {
          setVerifiedCount(prev => prev + 1);
        }
      )
      .subscribe();

    // Timer
    const interval = setInterval(() => {
      setCheckTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveCheckId(null); // Check ended locally
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      supabase.removeChannel(responseChannel);
      clearInterval(interval);
    };
  }, [activeCheckId]);

  const triggerPresenceCheck = async () => {
    if (!sessionId || !user) return;
    
    try {
      // 60 seconds duration
      const durationSeconds = 60;
      const expiresAt = new Date(Date.now() + durationSeconds * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('session_checks')
        .insert({
          session_id: sessionId,
          created_by: user.id,
          expires_at: expiresAt,
          is_active: true
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setActiveCheckId(data.id);
      setCheckTimeLeft(durationSeconds);
      setVerifiedCount(0);
      
      toast({
        title: 'Presence Check Started',
        description: 'Students have 60 seconds to confirm they are here.',
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Could not start presence check',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(session.end_time).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining === 0 && session.is_active) {
        endSession();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const fetchSession = async () => {
    if (!sessionId || !user) return;

    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*, classes(course_code, course_name)')
        .eq('id', sessionId)
        .eq('lecturer_id', user.id)
        .single();

      if (error) throw error;
      
      setSession(data);
      
      // Generate QR code
      const qr = await generateQRCode(data.session_code);
      setQrCode(qr);
      
      // Send browser notification
      notifySessionActive(
        `${data.classes.course_code} - ${data.classes.course_name}`,
        data.duration_minutes
      );
      
      await fetchAttendees();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/lecturer/classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('id, scanned_at, student_id')
        .eq('session_id', sessionId)
        .order('scanned_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profile data for each student
      if (data) {
        const enrichedData = await Promise.all(
          data.map(async (record) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', record.student_id)
              .maybeSingle();
            
            return {
              ...record,
              profiles: profile || { full_name: null, email: 'Unknown' }
            };
          })
        );
        
        setAttendees(enrichedData);
      }
    } catch (error: any) {
      console.error('Error fetching attendees:', error);
    }
  };

  const endSession = async () => {
    if (!sessionId || !user) return;

    try {
      const { error } = await supabase
        .from('attendance_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      // Log activity
      await logActivity(
        user.id,
        'session_ended',
        `Ended attendance session for ${session?.classes.course_code} - ${session?.classes.course_name} with ${attendees.length} attendees`,
        sessionId,
        'session'
      );

      toast({
        title: 'Session Ended',
        description: `Session closed with ${attendees.length} attendees`,
      });

      navigate('/lecturer/classes');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate('/lecturer/dashboard')}>
                ← Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/lecturer/attendance-management?sessionId=${sessionId}`)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Active Session</h1>
              <p className="text-sm text-muted-foreground">
                {session?.classes.course_code} - {session?.classes.course_name}
              </p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column: QR Code */}
            <Card>
                <CardHeader>
                <CardTitle>Attendance QR Code</CardTitle>
                <CardDescription>
                    Students scan this code to mark attendance
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="flex justify-center">
                    {qrCode && (
                    <img src={qrCode} alt="QR Code" className="w-full max-w-sm rounded-lg border-2 border-border" />
                    )}
                </div>
                
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 flex items-center justify-between border border-primary/20">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <span className="font-medium">Time Remaining</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">{formatTime(timeLeft)}</span>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 rounded-lg p-4 flex items-center justify-between border border-green-500/20">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Attendees</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{attendees.length}</span>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/5 rounded-lg p-4 flex items-center gap-2 border border-orange-500/20">
                    <Shield className="w-5 h-5 text-orange-600" />
                    <div className="text-sm">
                        <p className="font-medium text-orange-900 dark:text-orange-100">Security Active</p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">Screenshot & fraud prevention enabled</p>
                    </div>
                    </div>
    
                    {session?.location_required && (
                    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/5 rounded-lg p-4 flex items-center gap-2 border border-blue-500/20">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100">Location Verification</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            {session.geofence_radius_meters}m radius from classroom
                        </p>
                        </div>
                    </div>
                    )}
                </div>
    
                <Button onClick={endSession} variant="destructive" className="w-full" size="lg">
                    <X className="w-5 h-5 mr-2" />
                    End Session Now
                </Button>
                </CardContent>
            </Card>

            {/* Right Column: Tools & Feed */}
            <div className="space-y-6">
                {/* Class Pulse */}
                <Card>
                    <CardHeader>
                        <CardTitle>Class Pulse</CardTitle>
                        <CardDescription>Real-time student feedback</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100 dark:bg-green-900/20 dark:border-green-800">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{sentiments.understood}</div>
                                <div className="text-sm text-green-800 dark:text-green-200">Understood</div>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800">
                                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{sentiments.neutral}</div>
                                <div className="text-sm text-yellow-800 dark:text-yellow-200">It's Okay</div>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg border border-red-100 dark:bg-red-900/20 dark:border-red-800">
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{sentiments.confused}</div>
                                <div className="text-sm text-red-800 dark:text-red-200">Confused</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Presence Verification */}
                <Card className="border-orange-200 dark:border-orange-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            Presence Verification
                        </CardTitle>
                        <CardDescription>Trigger a random check to ensure students are paying attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activeCheckId ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">{checkTimeLeft}s</div>
                                        <div className="text-xs text-orange-800 dark:text-orange-300">Remaining</div>
                                    </div>
                                    <div className="h-8 w-px bg-orange-200 dark:bg-orange-800 mx-4"></div>
                                    <div className="text-center flex-1">
                                        <div className="text-3xl font-bold text-primary">{verifiedCount}</div>
                                        <div className="text-xs text-muted-foreground">Students Verified</div>
                                    </div>
                                </div>
                                <p className="text-xs text-center text-muted-foreground animate-pulse">
                                    Checking active engagement...
                                </p>
                            </div>
                        ) : (
                            <Button onClick={triggerPresenceCheck} className="w-full bg-orange-600 hover:bg-orange-700">
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Trigger Random Check
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Attendance Feed */}
                <Card>
                    <CardHeader>
                        <CardTitle>Live Attendance Feed</CardTitle>
                        <CardDescription>
                        Real-time updates as students scan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {attendees.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                            Waiting for students to scan...
                            </p>
                        </div>
                        ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {attendees.map((record) => (
                            <div key={record.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                    {record.profiles.full_name || record.profiles.email}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(record.scanned_at).toLocaleTimeString()}
                                </p>
                                </div>
                            </div>
                            ))}
                        </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}