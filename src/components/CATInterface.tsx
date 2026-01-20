import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { z } from 'zod';

const catSubmissionSchema = z.object({
  content: z.string().trim().max(50000, 'Content must be less than 50000 characters'),
});

interface CATInterfaceProps {
  assignment: any;
  onComplete: () => void;
}

export function CATInterface({ assignment, onComplete }: CATInterfaceProps) {
  const [content, setContent] = useState('');
  const [timeLeft, setTimeLeft] = useState(assignment.duration_minutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAutoSubmit = async () => {
    setAutoSubmitting(true);
    await handleSubmit(true);
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (submitting || autoSubmitting) return;
    
    // Validate content
    const result = catSubmissionSchema.safeParse({ content });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('assignment_submissions').insert({
        assignment_id: assignment.id,
        student_id: user.id,
        content: content.trim(),
        auto_submitted: isAutoSubmit,
        is_late: new Date() > new Date(assignment.due_date),
      });

      if (error) throw error;

      toast.success(isAutoSubmit ? 'Time up! Assignment auto-submitted' : 'Assignment submitted successfully');
      onComplete();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
      setAutoSubmitting(false);
    }
  };

  const isLowTime = timeLeft < 300; // Less than 5 minutes

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{assignment.title}</CardTitle>
              <CardDescription>
                {assignment.classes?.course_code} - {assignment.classes?.course_name}
              </CardDescription>
            </div>
            <div
              className={`flex items-center gap-2 text-2xl font-bold ${
                isLowTime ? 'text-destructive' : ''
              }`}
            >
              <Clock className="h-6 w-6" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLowTime && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Less than 5 minutes remaining! Your work will be auto-submitted when time runs out.
              </AlertDescription>
            </Alert>
          )}

          {assignment.description && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}

          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your answer here..."
              rows={15}
              className="font-mono"
              disabled={autoSubmitting}
              maxLength={50000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length} / 50000 characters
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={submitting || autoSubmitting || !content.trim()}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit CAT'}
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your work will be automatically submitted when the timer reaches zero. Make sure to save your work regularly.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
