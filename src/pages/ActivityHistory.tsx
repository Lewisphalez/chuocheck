import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  CheckCircle, 
  Award, 
  BookOpen, 
  Target, 
  PlayCircle, 
  StopCircle,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ActivityItem {
  id: string;
  activity_type: string;
  activity_description: string;
  created_at: string;
  related_id?: string;
  related_type?: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'attendance_marked':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'badge_earned':
      return <Award className="h-5 w-5 text-amber-600" />;
    case 'class_enrolled':
      return <BookOpen className="h-5 w-5 text-blue-600" />;
    case 'goal_achieved':
      return <Target className="h-5 w-5 text-purple-600" />;
    case 'session_started':
      return <PlayCircle className="h-5 w-5 text-emerald-600" />;
    case 'session_ended':
      return <StopCircle className="h-5 w-5 text-gray-600" />;
    default:
      return <Activity className="h-5 w-5 text-gray-600" />;
  }
};

const activityTypes = [
  { value: 'all', label: 'All Activities' },
  { value: 'attendance_marked', label: 'Attendance Marked' },
  { value: 'badge_earned', label: 'Badges Earned' },
  { value: 'class_enrolled', label: 'Class Enrollments' },
  { value: 'goal_achieved', label: 'Goals Achieved' },
  { value: 'session_started', label: 'Sessions Started' },
  { value: 'session_ended', label: 'Sessions Ended' },
];

export default function ActivityHistory() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, [user, filter]);

  const fetchActivities = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('activity_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (userRole === 'lecturer') {
      navigate('/lecturer/dashboard');
    } else if (userRole === 'student') {
      navigate('/student/dashboard');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Activity History</h1>
              <p className="text-sm text-muted-foreground">View all your recent actions and achievements</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  All Activities
                </CardTitle>
                <CardDescription>
                  {activities.length} activities found
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading activities...
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activities found
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="mt-0.5">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.activity_description}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), 'PPp')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
