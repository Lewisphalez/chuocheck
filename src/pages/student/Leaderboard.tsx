import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Medal, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export default function StudentLeaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('student_leaderboard')
        .select('*')
        .order('points', { ascending: false })
        .limit(20);

      if (error) throw error;

      setLeaderboard(data || []);
      
      // Find current user's rank
      const userEntry = data?.find(entry => entry.student_id === user?.id);
      setMyRank(userEntry || null);
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
            onClick={() => navigate('/student/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Leaderboard</h1>
              <p className="text-muted-foreground">
                See how you rank among your peers
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Your Rank Card */}
        {myRank && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Your Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold">#{myRank.global_rank}</div>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={myRank.avatar_url || undefined} />
                    <AvatarFallback>
                      {myRank.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{myRank.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Level {myRank.level} • {myRank.points} points
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {myRank.badge_count} Badges
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Top Students</CardTitle>
            <CardDescription>
              Based on attendance points and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overall" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overall">Overall</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
              </TabsList>

              <TabsContent value="overall" className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading leaderboard...
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No leaderboard data available yet
                  </div>
                ) : (
                  leaderboard.map((entry, index) => (
                    <div
                      key={entry.student_id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        getRankColor(index + 1)
                      } ${
                        entry.student_id === user?.id ? 'ring-2 ring-primary' : ''
                      }`}
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
                            {entry.student_id === user?.id && (
                              <Badge variant="outline" className="ml-2">You</Badge>
                            )}
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
                  ))
                )}
              </TabsContent>

              <TabsContent value="month">
                <div className="text-center py-8 text-muted-foreground">
                  Monthly rankings coming soon
                </div>
              </TabsContent>

              <TabsContent value="week">
                <div className="text-center py-8 text-muted-foreground">
                  Weekly rankings coming soon
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
