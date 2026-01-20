import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { z } from 'zod';
import { logActivity } from '@/lib/activityLogger';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png',
];

const submissionSchema = z.object({
  content: z.string().max(5000, 'Notes must be less than 5000 characters'),
});

interface AssignmentSubmitDialogProps {
  assignment: any;
  trigger: React.ReactNode;
}

export function AssignmentSubmitDialog({ assignment, trigger }: AssignmentSubmitDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error('File size must be less than 50MB');
        e.target.value = '';
        setFile(null);
        return;
      }
      
      if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
        toast.error('Invalid file type. Allowed: PDF, Word, Excel, Text, Images');
        e.target.value = '';
        setFile(null);
        return;
      }
    }
    
    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    // Validate content
    const result = submissionSchema.safeParse({ content });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let fileUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${assignment.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('submissions')
          .getPublicUrl(fileName);
        
        fileUrl = publicUrl;
      }

      const { error } = await supabase.from('assignment_submissions').insert({
        assignment_id: assignment.id,
        student_id: user.id,
        submission_file_url: fileUrl,
        content: content.trim() || null,
        is_late: new Date() > new Date(assignment.due_date),
      });

      if (error) throw error;

      // Log activity
      await logActivity(
        user.id,
        'assignment_submitted',
        `Submitted assignment "${assignment.title}"`,
        assignment.id,
        'assignment'
      );

      toast.success('Assignment submitted successfully');
      setOpen(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Upload File</Label>
            <div className="mt-2">
              <label
                htmlFor="file"
                className="flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none"
              >
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : 'Click to upload (PDF, Word, Excel, Images - Max 50MB)'}
                  </span>
                </div>
                <input
                  id="file"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                />
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="content">Additional Notes (Optional)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Add any notes or comments..."
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length} / 5000 characters
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || (!file && !content.trim())}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Submit Assignment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
