import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Trophy, Crown, Medal, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Class {
  id: string;
  course_code: string;
  course_name: string;
}

interface LeaderboardEntry {
  student_id: string;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
  level: number;
  rank: string;
  badge_count: number;
  global_rank: number;
}

export default function LecturerLeaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, course_code, course_name')
        .eq('lecturer_id', user?.id)
        .order('course_code');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      if (selectedClass === 'all') {
        // Fetch all students in lecturer's classes
        const { data: enrollments } = await supabase
          .from('student_enrollments')
          .select('student_id')
          .in('class_id', classes.map(c => c.id));

        if (!enrollments) return;

        const studentIds = [...new Set(enrollments.map(e => e.student_id))];

        const { data, error } = await supabase
          .from('student_leaderboard')
          .select('*')
          .in('student_id', studentIds)
          .order('points', { ascending: false })
          .limit(20);

        if (error) throw error;
        setLeaderboard(data || []);
      } else {
        // Fetch students for specific class
        const { data: enrollments } = await supabase
          .from('student_enrollments')
          .select('student_id')
          .eq('class_id', selectedClass);

        if (!enrollments) return;

        const studentIds = enrollments.map(e => e.student_id);

        const { data, error } = await supabase
          .from('student_leaderboard')
          .select('*')
          .in('student_id', studentIds)
          .order('points', { ascending: false })
          .limit(20);

        if (error) throw error;
        setLeaderboard(data || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-900/20';
    if (rank === 2) return 'bg-gray-100 dark:bg-gray-800';
    if (rank === 3) return 'bg-amber-100 dark:bg-amber-900/20';
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/lecturer/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Student Leaderboard</h1>
                <p className="text-muted-foreground">
                  View top-performing students across your classes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Class Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Filter by Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.course_code} - {cls.course_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Top Students</CardTitle>
            <CardDescription>
              Ranked by attendance points and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading leaderboard...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found for this selection
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.student_id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${getRankColor(index + 1)}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2 min-w-[3rem]">
                        {getRankIcon(index + 1)}
                        <span className="text-2xl font-bold">
                          #{index + 1}
                        </span>
                      </div>
                      
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatar_url || undefined} />
                        <AvatarFallback>
                          {entry.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <p className="font-medium">
                          {entry.full_name || 'Anonymous'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Level {entry.level} • {entry.rank}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold">{entry.points}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.badge_count} badges
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
  );
}
