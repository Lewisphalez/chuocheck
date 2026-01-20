import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity,
  CheckCircle, 
  Award, 
  BookOpen, 
  Target, 
  PlayCircle, 
  StopCircle,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'badge_earned':
      return <Award className="h-4 w-4 text-amber-600" />;
    case 'class_enrolled':
      return <BookOpen className="h-4 w-4 text-blue-600" />;
    case 'goal_achieved':
      return <Target className="h-4 w-4 text-purple-600" />;
    case 'session_started':
      return <PlayCircle className="h-4 w-4 text-emerald-600" />;
    case 'session_ended':
      return <StopCircle className="h-4 w-4 text-gray-600" />;
    default:
      return <Activity className="h-4 w-4 text-gray-600" />;
  }
};

export function ActivityFeed({ limit = 10, showViewAll = true }: { limit?: number; showViewAll?: boolean }) {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const handleViewAll = () => {
    if (userRole === 'lecturer') {
      navigate('/lecturer/activity');
    } else if (userRole === 'student') {
      navigate('/student/activity');
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('activity_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          setActivities(prev => [payload.new as ActivityItem, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, limit]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading activities...</div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            No recent activity to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest actions and achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 pb-3 border-b last:border-0">
                <div className="mt-1">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{activity.activity_description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {showViewAll && (
          <Button variant="ghost" className="w-full mt-4" size="sm" onClick={handleViewAll}>
            View All Activity
            <ExternalLink className="h-3 w-3 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
