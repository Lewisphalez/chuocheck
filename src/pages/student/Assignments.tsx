import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Download, Upload as UploadIcon, CheckCircle, Home } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { CATInterface } from '@/components/CATInterface';
import { AssignmentSubmitDialog } from '@/components/AssignmentSubmitDialog';
import { useNavigate } from 'react-router-dom';

export default function Assignments() {
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [takingCAT, setTakingCAT] = useState(false);
  const navigate = useNavigate();

  const { data: assignments } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: async () => {
      const { data: assignmentsData, error } = await supabase
        .from('assignments')
        .select(`
          *,
          classes (
            course_name,
            course_code
          )
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const assignmentsWithSubmissions = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          const { data: submission } = await supabase
            .from('assignment_submissions')
            .select('*')
            .eq('assignment_id', assignment.id)
            .eq('student_id', user.id)
            .maybeSingle();

          return { ...assignment, submission };
        })
      );

      return assignmentsWithSubmissions;
    },
  });

  if (takingCAT && selectedAssignment) {
    return (
      <CATInterface
        assignment={selectedAssignment}
        onComplete={() => {
          setTakingCAT(false);
          setSelectedAssignment(null);
        }}
      />
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/student/dashboard')}
        >
          <Home className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">View and complete your assignments</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {assignments?.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {assignment.classes?.course_code} - {assignment.classes?.course_name}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={assignment.assignment_type === 'cat' ? 'destructive' : 'default'}>
                    {assignment.assignment_type.toUpperCase()}
                  </Badge>
                  {assignment.submission && (
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Submitted
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{assignment.description}</p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">
                      Due: {format(new Date(assignment.due_date), 'PPp')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({formatDistanceToNow(new Date(assignment.due_date), { addSuffix: true })})
                    </span>
                  </div>
                </div>
                {assignment.assignment_type === 'cat' && assignment.duration_minutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Duration: {assignment.duration_minutes} minutes
                    </span>
                  </div>
                )}
              </div>

              {assignment.submission ? (
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Your Score:</span>
                    <span className="text-lg">
                      {assignment.submission.score !== null
                        ? `${assignment.submission.score}/${assignment.max_score}`
                        : 'Pending'}
                    </span>
                  </div>
                  {assignment.submission.feedback && (
                    <div className="text-sm">
                      <span className="font-semibold">Feedback:</span>
                      <p className="text-muted-foreground mt-1">{assignment.submission.feedback}</p>
                    </div>
                  )}
                  {assignment.submission.submission_file_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(assignment.submission.submission_file_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      View Submission
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  {assignment.file_url && assignment.assignment_type !== 'cat' && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(assignment.file_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                  {assignment.assignment_type === 'cat' ? (
                    <Button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setTakingCAT(true);
                      }}
                      disabled={new Date() > new Date(assignment.due_date)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Start CAT
                    </Button>
                  ) : (
                    <AssignmentSubmitDialog
                      assignment={assignment}
                      trigger={
                        <Button disabled={new Date() > new Date(assignment.due_date)}>
                          <UploadIcon className="h-4 w-4 mr-2" />
                          Submit
                        </Button>
                      }
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {assignments?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No assignments available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
