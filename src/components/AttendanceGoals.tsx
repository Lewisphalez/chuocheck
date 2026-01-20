import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Goal {
  id: string;
  target_percentage: number;
  achieved: boolean;
  goal_type: string;
  class_id?: string;
  class_name?: string;
}

export function AttendanceGoals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentPercentage, setCurrentPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
    fetchCurrentAttendance();
  }, [user]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_goals')
        .select(`
          *,
          classes(course_name)
        `)
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const goalsWithClass = data?.map(goal => ({
        ...goal,
        class_name: goal.classes?.course_name,
      })) || [];

      setGoals(goalsWithClass);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentAttendance = async () => {
    try {
      // Calculate overall attendance percentage
      const { data: patterns, error } = await supabase
        .from('attendance_patterns')
        .select('attendance_percentage')
        .eq('student_id', user?.id);

      if (error) throw error;

      if (patterns && patterns.length > 0) {
        const avg = patterns.reduce((sum, p) => sum + (p.attendance_percentage || 0), 0) / patterns.length;
        setCurrentPercentage(Math.round(avg));
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const checkGoalAchievement = async (goal: Goal) => {
    if (goal.achieved) return;

    const targetMet = currentPercentage >= goal.target_percentage;

    if (targetMet) {
      try {
        const { error } = await supabase
          .from('attendance_goals')
          .update({ 
            achieved: true, 
            achieved_at: new Date().toISOString() 
          })
          .eq('id', goal.id);

        if (!error) {
          toast({
            title: "🎉 Goal Achieved!",
            description: `You've reached your ${goal.target_percentage}% attendance goal!`,
          });
          fetchGoals();
        }
      } catch (error) {
        console.error('Error updating goal:', error);
      }
    }
  };

  useEffect(() => {
    goals.forEach(goal => checkGoalAchievement(goal));
  }, [currentPercentage, goals]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Attendance Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading goals...</div>
        </CardContent>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Attendance Goals
          </CardTitle>
          <CardDescription>
            Set goals to track your attendance progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/student/settings')}
          >
            <Target className="h-4 w-4 mr-2" />
            Set Your First Goal
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Attendance Goals
        </CardTitle>
        <CardDescription>
          Track your progress towards your attendance targets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const progress = Math.min((currentPercentage / goal.target_percentage) * 100, 100);
          
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {goal.achieved ? (
                    <Award className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="font-medium">
                    {goal.goal_type === 'overall' ? 'Overall' : goal.class_name || 'Class'} - {goal.target_percentage}%
                  </span>
                </div>
                {goal.achieved && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Achieved
                  </Badge>
                )}
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Current: {currentPercentage}%</span>
                <span>Target: {goal.target_percentage}%</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
