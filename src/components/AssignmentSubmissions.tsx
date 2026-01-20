import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface AssignmentSubmissionsProps {
  assignmentId: string;
}

export function AssignmentSubmissions({ assignmentId }: AssignmentSubmissionsProps) {
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const { data: assignment } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, classes(course_name, course_code)')
        .eq('id', assignmentId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: submissions, refetch } = useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;

      // Fetch profile data separately
      const submissionsWithProfiles = await Promise.all(
        (data || []).map(async (submission) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', submission.student_id)
            .single();
          
          return { ...submission, profiles: profile };
        })
      );

      return submissionsWithProfiles;
    },
  });

  const handleGrade = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          score: parseFloat(score),
          feedback,
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success('Grade submitted successfully');
      setGradingSubmission(null);
      setScore('');
      setFeedback('');
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{assignment?.title}</CardTitle>
          <CardDescription>
            {assignment?.classes?.course_code} - {assignment?.classes?.course_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>{assignment?.description}</p>
            <div className="flex gap-4 mt-4">
              <Badge variant={assignment?.assignment_type === 'cat' ? 'destructive' : 'default'}>
                {assignment?.assignment_type.toUpperCase()}
              </Badge>
              <span className="text-muted-foreground">Max Score: {assignment?.max_score}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">
          Submissions ({submissions?.length || 0})
        </h2>
        <div className="space-y-4">
          {submissions?.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {submission.profiles?.full_name || 'Unknown Student'}
                    </CardTitle>
                    <CardDescription>{submission.profiles?.email}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {submission.auto_submitted && (
                      <Badge variant="outline">Auto-submitted</Badge>
                    )}
                    {submission.is_late && (
                      <Badge variant="destructive">Late</Badge>
                    )}
                    {submission.score !== null && (
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Graded
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Submitted {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                  </span>
                </div>

                {submission.submission_file_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(submission.submission_file_url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Submission
                  </Button>
                )}

                {submission.content && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{submission.content}</p>
                  </div>
                )}

                {gradingSubmission === submission.id ? (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <Label htmlFor="score">Score (out of {assignment?.max_score})</Label>
                      <Input
                        id="score"
                        type="number"
                        min="0"
                        max={assignment?.max_score}
                        step="0.1"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="feedback">Feedback</Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleGrade(submission.id)}>
                        Submit Grade
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setGradingSubmission(null);
                          setScore('');
                          setFeedback('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    {submission.score !== null ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Score:</span>
                          <span className="text-lg">
                            {submission.score}/{assignment?.max_score}
                          </span>
                        </div>
                        {submission.feedback && (
                          <div>
                            <span className="font-semibold">Feedback:</span>
                            <p className="text-sm text-muted-foreground mt-1">
                              {submission.feedback}
                            </p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGradingSubmission(submission.id);
                            setScore(submission.score?.toString() || '');
                            setFeedback(submission.feedback || '');
                          }}
                        >
                          Edit Grade
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setGradingSubmission(submission.id)}
                        size="sm"
                      >
                        Grade Submission
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {submissions?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No submissions yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
