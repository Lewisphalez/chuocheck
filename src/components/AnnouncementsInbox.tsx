import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Megaphone } from 'lucide-react';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  expires_at: string | null;
  classes: {
    course_code: string;
    course_name: string;
  };
  profiles: {
    full_name: string;
  };
}

export default function AnnouncementsInbox() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('announcements-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'class_announcements'
          },
          () => {
            fetchAnnouncements();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchAnnouncements = async () => {
    if (!user) return;

    // Get student's enrolled classes
    const { data: enrollments } = await supabase
      .from('student_enrollments')
      .select('class_id')
      .eq('student_id', user.id);

    if (!enrollments || enrollments.length === 0) {
      setLoading(false);
      return;
    }

    const classIds = enrollments.map(e => e.class_id);

    // Fetch announcements for enrolled classes
    const { data, error } = await supabase
      .from('class_announcements')
      .select(`
        *,
        classes(course_code, course_name),
        profiles!class_announcements_created_by_fkey(full_name)
      `)
      .in('class_id', classIds)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      // Filter out expired announcements
      const now = new Date();
      const activeAnnouncements = data.filter(a => 
        !a.expires_at || new Date(a.expires_at) > now
      );
      setAnnouncements(activeAnnouncements as unknown as Announcement[]);
    }
    
    setLoading(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'normal':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent' || priority === 'high') {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <Megaphone className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcements
          </CardTitle>
          <CardDescription>Class announcements from your lecturers</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No announcements at this time
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Announcements
          {announcements.length > 0 && (
            <Badge variant="secondary">{announcements.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>Class announcements from your lecturers</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="border-l-4" style={{
                borderLeftColor: announcement.priority === 'urgent' ? 'hsl(var(--destructive))' : 
                                 announcement.priority === 'high' ? 'hsl(var(--primary))' : 
                                 'hsl(var(--border))'
              }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getPriorityIcon(announcement.priority)}
                        <CardTitle className="text-base">{announcement.title}</CardTitle>
                      </div>
                      <CardDescription className="text-xs">
                        {announcement.classes?.course_code} - {announcement.classes?.course_name}
                      </CardDescription>
                    </div>
                    <Badge variant={getPriorityColor(announcement.priority)} className="shrink-0">
                      {announcement.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm whitespace-pre-wrap">{announcement.message}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <span>By {announcement.profiles?.full_name || 'Lecturer'}</span>
                    <span>{format(new Date(announcement.created_at), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
