import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bell, MapPin, Shield, Palette, Target, Plus, Trash2 } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/notifications';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { AvatarUpload } from '@/components/AvatarUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AttendanceGoal {
  id: string;
  target_percentage: number;
  goal_type: string;
  class_id?: string;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [goals, setGoals] = useState<AttendanceGoal[]>([]);
  const [newGoalTarget, setNewGoalTarget] = useState('90');

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Check location permission
    if ('geolocation' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationEnabled(result.state === 'granted');
      });
    }

    // Fetch profile and goals
    if (user) {
      fetchProfile();
      fetchGoals();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user?.id)
      .single();
    
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
    }
  };

  const fetchGoals = async () => {
    const { data } = await supabase
      .from('attendance_goals')
      .select('*')
      .eq('student_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setGoals(data);
    }
  };

  const handleAvatarUpdate = (url: string) => {
    setAvatarUrl(url);
  };

  const createGoal = async () => {
    const target = parseInt(newGoalTarget);
    if (target < 1 || target > 100) {
      toast({
        title: 'Invalid Target',
        description: 'Please enter a percentage between 1 and 100',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('attendance_goals')
      .insert({
        student_id: user?.id,
        target_percentage: target,
        goal_type: 'overall',
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create goal',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Goal Created',
        description: `Target set to ${target}% attendance`,
      });
      setNewGoalTarget('90');
      fetchGoals();
    }
  };

  const deleteGoal = async (goalId: string) => {
    const { error } = await supabase
      .from('attendance_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete goal',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Goal Deleted',
        description: 'Attendance goal removed',
      });
      fetchGoals();
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      
      if (granted) {
        toast({
          title: 'Notifications Enabled',
          description: 'You will receive attendance session alerts',
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in browser settings',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Notifications Disabled',
        description: 'You will not receive attendance alerts',
      });
      setNotificationsEnabled(false);
    }
  };

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationEnabled(true);
            toast({
              title: 'Location Enabled',
              description: 'Location verification active for attendance',
            });
          },
          () => {
            toast({
              title: 'Permission Denied',
              description: 'Please enable location in browser settings',
              variant: 'destructive',
            });
            setLocationEnabled(false);
          }
        );
      }
    } else {
      setLocationEnabled(false);
      toast({
        title: 'Location Disabled',
        description: 'Location verification will be skipped',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your preferences</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Section */}
          <AvatarUpload 
            currentAvatarUrl={avatarUrl}
            onUploadComplete={handleAvatarUpdate}
          />

          {/* Attendance Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Attendance Goals
              </CardTitle>
              <CardDescription>
                Set and track your attendance targets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  placeholder="Target %"
                  className="flex-1"
                />
                <Button onClick={createGoal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </div>

              {goals.length > 0 && (
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <span className="font-medium">
                        {goal.goal_type === 'overall' ? 'Overall' : 'Class'} - {goal.target_percentage}%
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Receive alerts when attendance sessions are active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="flex flex-col gap-1">
                  <span>Push Notifications</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Get notified about active sessions
                  </span>
                </Label>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Services
              </CardTitle>
              <CardDescription>
                Enable location verification for attendance marking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="location" className="flex flex-col gap-1">
                  <span>Location Verification</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Verify you're in the classroom when marking attendance
                  </span>
                </Label>
                <Switch
                  id="location"
                  checked={locationEnabled}
                  onCheckedChange={handleLocationToggle}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how the app looks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="theme" className="flex flex-col gap-1">
                  <span>Theme</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Choose your preferred color theme
                  </span>
                </Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Your data protection information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Data Collected:</strong> Attendance records, timestamps, device information
                </p>
                <p>
                  <strong>Security:</strong> All data is encrypted and stored securely
                </p>
                <p>
                  <strong>Fraud Prevention:</strong> Screenshot detection and duplicate scan prevention active
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
