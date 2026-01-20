import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, X, Loader2 } from 'lucide-react';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);

  // Check if email is verified
  const isVerified = user?.email_confirmed_at !== null;

  const handleResendVerification = async () => {
    try {
      setResending(true);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email || '',
      });

      if (error) throw error;

      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error.message || "Could not resend verification email",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  if (isVerified || dismissed) return null;

  return (
    <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950">
      <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-amber-800 dark:text-amber-200">
          Please verify your email address to access all features.
        </span>
        <div className="flex gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResendVerification}
            disabled={resending}
            className="border-amber-600 text-amber-700 hover:bg-amber-100 dark:border-amber-400 dark:text-amber-300 dark:hover:bg-amber-900"
          >
            {resending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Resend Email"
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
