import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Loader2, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export default function DigitalIDCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfileAndRole() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError) throw roleError;
        setRole(roleData.role);

      } catch (error: any) {
        toast({
          title: 'Error',
          description: `Failed to load ID card data: ${error.message}`,
          variant: 'destructive',
        });
        console.error('Error fetching ID card data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfileAndRole();
  }, [user, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="max-w-md mx-auto my-8">
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>Could not load your profile information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto my-8 overflow-hidden relative shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white transform hover:scale-105 transition-transform duration-300 ease-in-out">
      {/* Background Holographic Effect (CSS based) */}
      <div className="absolute inset-0 z-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at top left, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at bottom right, rgba(0,0,0,0.2) 0%, transparent 50%)`,
        backgroundSize: '100% 100%',
        animation: 'hologram-effect 15s infinite alternate'
      }}></div>
      
      {/* For animation: https://www.w3schools.com/cssref/css3_pr_animation-keyframes.php */}
      <style>{`
        @keyframes hologram-effect {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
      `}</style>

      <CardContent className="relative z-10 p-6 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider">ChuoCheck ID</h2>
          <GraduationCap className="h-8 w-8 text-white opacity-80" />
        </div>

        <Avatar className="h-24 w-24 border-4 border-white shadow-md mb-4">
          <AvatarImage src={profile.avatar_url || 'https://via.placeholder.com/150'} alt={`${profile.full_name}'s avatar`} />
          <AvatarFallback className="bg-blue-800 text-white text-3xl font-semibold">
            {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}
          </AvatarFallback>
        </Avatar>

        <h3 className="text-2xl font-bold mb-1 text-shadow-md">{profile.full_name || 'N/A'}</h3>
        <p className="text-sm opacity-90 mb-4">{role ? role.toUpperCase() : 'USER'}</p>

        <Separator className="w-full bg-blue-400 my-4" />

        <div className="w-full text-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold opacity-90">ID:</span>
            <span className="font-mono text-xs bg-blue-700 px-2 py-1 rounded-sm">{user?.id.substring(0, 8).toUpperCase() || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold opacity-90">Email:</span>
            <span className="text-right">{profile.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold opacity-90">Issued:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
