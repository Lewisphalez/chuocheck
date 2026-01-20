import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface BadgeData {
  id: string;
  badge_key: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  rarity: string;
  points: number;
  earned?: boolean;
  earned_at?: string;
}

export default function Badges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBadges();
      fetchGamificationPoints();
    }
  }, [user]);

  const fetchBadges = async () => {
    if (!user) return;

    const { data: allBadges } = await supabase
      .from('badges')
      .select('*')
      .order('points', { ascending: false });

    const { data: studentBadges } = await supabase
      .from('student_badges')
      .select('badge_id, earned_at')
      .eq('student_id', user.id);

    if (allBadges && studentBadges) {
      const earnedIds = studentBadges.map(sb => sb.badge_id);
      setEarnedBadges(earnedIds);

      const badgesWithEarned = allBadges.map(badge => ({
        ...badge,
        earned: earnedIds.includes(badge.id),
        earned_at: studentBadges.find(sb => sb.badge_id === badge.id)?.earned_at,
      }));

      setBadges(badgesWithEarned);
    }
    setLoading(false);
  };

  const fetchGamificationPoints = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('gamification_points')
      .select('points, level, rank')
      .eq('student_id', user.id)
      .single();

    if (data) {
      setTotalPoints(data.points);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-orange-700';
      case 'silver': return 'text-gray-400';
      case 'gold': return 'text-yellow-500';
      case 'platinum': return 'text-cyan-400';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Achievement Badges</h1>
            <p className="text-muted-foreground">Collect badges by maintaining good attendance</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Points</div>
                <div className="text-3xl font-bold">{totalPoints}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Badges Earned</div>
                <div className="text-3xl font-bold">{earnedBadges.length}/{badges.length}</div>
              </div>
              <Award className="h-12 w-12 text-primary" />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <Card key={badge.id} className={!badge.earned ? 'opacity-50' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-4xl">{badge.earned ? badge.icon : '🔒'}</div>
                    <div className="flex flex-col gap-1">
                      <Badge className={getRarityColor(badge.rarity)}>
                        {badge.rarity}
                      </Badge>
                      <Badge variant="outline" className={getTierColor(badge.tier)}>
                        {badge.tier}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{badge.name}</CardTitle>
                  <CardDescription>{badge.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{badge.points} points</span>
                    {badge.earned && badge.earned_at && (
                      <span className="text-xs text-muted-foreground">
                        Earned {format(new Date(badge.earned_at), 'MMM dd')}
                      </span>
                    )}
                    {!badge.earned && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span className="text-xs">Locked</span>
                      </div>
                    )}
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
