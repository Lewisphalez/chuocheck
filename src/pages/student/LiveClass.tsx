import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Radio, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { getCurrentLocation, calculateDistance } from '@/lib/locationUtils';

interface Session {
  id: string;
  is_active: boolean;
  classroom_latitude: number | null;
  classroom_longitude: number | null;
  geofence_radius_meters: number | null;
  classes: {
    course_code: string;
    course_name: string;
  };
}

interface ActiveCheck {
  id: string;
  expires_at: string;
}

export default function LiveClass() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [activeCheck, setActiveCheck] = useState<ActiveCheck | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [checkStatus, setCheckStatus] = useState<'idle' | 'prompt' | 'verifying' | 'verified'>('idle');

  // Fetch Session Info
  useEffect(() => {
    if (!sessionId) return;

    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*, classes(course_code, course_name)')
        .eq('id', sessionId)
        .single();

      if (error || !data) {
        toast({
          title: 'Session Not Found',
          description: 'Could not load session details.',
          variant: 'destructive',
        });
        navigate('/student/dashboard');
        return;
      }

      if (!data.is_active) {
        toast({
          title: 'Session Ended',
          description: 'This class session has ended.',
        });
        navigate('/student/dashboard');
        return;
      }

      setSession(data);
    };

    fetchSession();

    // Subscribe to Session Updates (End session)
    const sessionChannel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new.is_active === false) {
            toast({
              title: 'Class Ended',
              description: 'The lecturer has ended the session.',
            });
            navigate('/student/dashboard');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionId, navigate, toast]);

  // Subscribe to Presence Checks
  useEffect(() => {
    if (!sessionId) return;

    const checkChannel = supabase
      .channel(`checks-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_checks',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new.is_active) {
            handleNewCheck(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(checkChannel);
    };
  }, [sessionId]);

  const handleNewCheck = (checkData: any) => {
    // Check if we already responded? (The subscription receives all inserts, but for a new check we assume no response yet)
    // In a robust system, we might check DB, but for realtime speed, we just prompt.
    setActiveCheck({
      id: checkData.id,
      expires_at: checkData.expires_at,
    });
    setCheckStatus('prompt');
    
    // Calculate initial time left
    const end = new Date(checkData.expires_at).getTime();
    const now = new Date().getTime();
    setTimeLeft(Math.max(0, Math.floor((end - now) / 1000)));
  };

  // Timer Countdown
  useEffect(() => {
    if (checkStatus !== 'prompt' || !activeCheck) return;

    const interval = setInterval(() => {
      const end = new Date(activeCheck.expires_at).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setCheckStatus('idle');
        setActiveCheck(null);
        toast({
          title: 'Check Missed',
          description: 'You missed the presence check.',
          variant: 'destructive',
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [checkStatus, activeCheck, toast]);

  const confirmPresence = async () => {
    if (!activeCheck || !user || !session) return;
    setCheckStatus('verifying');

    try {
      // Optional: Verify Location again if required
      if (session.location_required && session.classroom_latitude && session.classroom_longitude) {
         // Simple check, or reuse logic from Scanner
         // For speed, let's just grab location if possible, but not block strict validation unless critical
         // To stay consistent with "Anti-Ghosting", we SHOULD verify location.
         try {
            const userLocation = await getCurrentLocation();
            const distance = calculateDistance(
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: session.classroom_latitude, longitude: session.classroom_longitude }
            );

            if (distance > (session.geofence_radius_meters || 150)) { // slightly larger buffer for re-check
                throw new Error(`Location mismatch (${Math.round(distance)}m away)`);
            }
         } catch (locError: any) {
             toast({
                 title: 'Location Check Failed',
                 description: locError.message || 'Could not verify location.',
                 variant: 'destructive'
             });
             setCheckStatus('prompt'); // Let them try again
             return;
         }
      }

      const { error } = await supabase
        .from('session_check_responses')
        .insert({
          check_id: activeCheck.id,
          student_id: user.id,
        });

      if (error) throw error;

      setCheckStatus('verified');
      setTimeout(() => {
        setCheckStatus('idle');
        setActiveCheck(null);
      }, 3000);

      toast({
        title: 'Verified',
        description: 'Your presence has been confirmed.',
      });

    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to confirm presence. Try again.',
        variant: 'destructive',
      });
      setCheckStatus('prompt');
    }
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Loading class data...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h1 className="font-bold text-foreground">Live Class</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/dashboard')}>
            Exit
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl font-bold">{session.classes.course_code}</h2>
          <p className="text-xl text-muted-foreground">{session.classes.course_name}</p>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/10 text-green-600 border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-600 mr-2 animate-pulse"></span>
            You are checked in
          </div>
        </div>

        <p className="text-center text-muted-foreground max-w-md">
          Keep this screen open during class. If the lecturer checks attendance, a prompt will appear here.
        </p>
      </main>

      {/* Presence Check Overlay */}
      {checkStatus !== 'idle' && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">Are you still here?</CardTitle>
              <CardDescription>
                Please confirm your presence to maintain your attendance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {checkStatus === 'verified' ? (
                 <div className="text-center py-4 text-green-600 font-bold text-xl flex flex-col items-center gap-2">
                     <CheckCircle2 className="w-12 h-12" />
                     Verified!
                 </div>
              ) : (
                <>
                    <div className="text-center">
                        <div className="text-4xl font-bold font-mono text-primary mb-2">
                        {timeLeft}s
                        </div>
                        <p className="text-sm text-muted-foreground">remaining</p>
                    </div>

                    <Button 
                        size="lg" 
                        className="w-full h-16 text-lg"
                        onClick={confirmPresence}
                        disabled={checkStatus === 'verifying'}
                    >
                        {checkStatus === 'verifying' ? 'Verifying...' : 'Yes, I\'m Here!'}
                    </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
