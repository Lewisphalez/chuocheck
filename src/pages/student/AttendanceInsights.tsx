import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AttendancePattern {
  class_id: string;
  total_sessions: number;
  attended_sessions: number;
  attendance_percentage: number;
  streak_current: number;
  streak_longest: number;
  at_risk: boolean;
  trend: 'improving' | 'declining' | 'stable';
}

export default function AttendanceInsights() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patterns, setPatterns] = useState<AttendancePattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPatterns();
    }
  }, [user]);

  const fetchPatterns = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('attendance_patterns')
      .select('*')
      .eq('student_id', user.id);

    if (!error && data) {
      setPatterns(data as AttendancePattern[]);
    }
    setLoading(false);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const overallAttendance = patterns.length > 0
    ? patterns.reduce((sum, p) => sum + p.attendance_percentage, 0) / patterns.length
    : 0;

  const atRiskClasses = patterns.filter(p => p.at_risk);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Attendance Insights</h1>
            <p className="text-muted-foreground">Your attendance patterns and trends</p>
          </div>
        </div>

        {atRiskClasses.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <Target className="h-4 w-4" />
            <AlertDescription>
              You're at risk in {atRiskClasses.length} {atRiskClasses.length === 1 ? 'class' : 'classes'} (below 70% attendance). 
              Consider improving your attendance to stay on track!
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
            <CardDescription>Your attendance across all classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Attendance</span>
                <span className="text-2xl font-bold">{overallAttendance.toFixed(1)}%</span>
              </div>
              <Progress value={overallAttendance} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : patterns.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No attendance data available yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {patterns.map((pattern) => (
              <Card key={pattern.class_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Class Performance</CardTitle>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(pattern.trend)}
                      <span className="text-sm text-muted-foreground capitalize">{pattern.trend}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Attendance Rate</div>
                      <div className="text-2xl font-bold">{pattern.attendance_percentage.toFixed(1)}%</div>
                      <Progress value={pattern.attendance_percentage} className="h-1 mt-2" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Sessions</div>
                      <div className="text-2xl font-bold">
                        {pattern.attended_sessions}/{pattern.total_sessions}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-xs text-muted-foreground">Current Streak</div>
                        <div className="font-bold">{pattern.streak_current} days 🔥</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      <div>
                        <div className="text-xs text-muted-foreground">Best Streak</div>
                        <div className="font-bold">{pattern.streak_longest} days</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
