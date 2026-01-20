import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { z } from 'zod';
import { logActivity } from '@/lib/activityLogger';

const assignmentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(5000, 'Description must be less than 5000 characters'),
  class_id: z.string().min(1, 'Please select a class'),
  assignment_type: z.enum(['assignment', 'cat']),
  go_live_date: z.string().min(1, 'Go live date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  duration_minutes: z.string().optional(),
  max_score: z.string().min(1, 'Max score is required'),
}).refine(data => {
  const goLive = new Date(data.go_live_date);
  const due = new Date(data.due_date);
  return goLive < due;
}, {
  message: 'Go live date must be before due date',
  path: ['due_date']
}).refine(data => {
  const score = parseFloat(data.max_score);
  return !isNaN(score) && score >= 1 && score <= 1000;
}, {
  message: 'Max score must be between 1 and 1000',
  path: ['max_score']
}).refine(data => {
  if (data.assignment_type === 'cat' && data.duration_minutes) {
    const duration = parseInt(data.duration_minutes);
    return !isNaN(duration) && duration >= 1 && duration <= 300;
  }
  return true;
}, {
  message: 'CAT duration must be between 1 and 300 minutes',
  path: ['duration_minutes']
});

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

interface CreateAssignmentFormProps {
  onSuccess: () => void;
}

export function CreateAssignmentForm({ onSuccess }: CreateAssignmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    assignment_type: 'assignment',
    go_live_date: '',
    due_date: '',
    duration_minutes: '',
    max_score: '100',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: classes } = useQuery({
    queryKey: ['lecturer-classes-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, course_name, course_code')
        .eq('archived', false)
        .order('course_name');
      if (error) throw error;
      return data;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error('File size must be less than 50MB');
        e.target.value = '';
        return;
      }
      
      if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
        toast.error('Invalid file type. Allowed: PDF, Word, Excel, Text, Images');
        e.target.value = '';
        return;
      }
    }
    
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form data
    const result = assignmentSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Please fix the form errors');
      return;
    }
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let fileUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('assignments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('assignments')
          .getPublicUrl(fileName);
        
        fileUrl = publicUrl;
      }

      // Convert datetime-local to ISO string (which includes timezone)
      const goLiveISO = new Date(formData.go_live_date).toISOString();
      const dueISO = new Date(formData.due_date).toISOString();

      const { data: insertedAssignment, error } = await supabase.from('assignments').insert({
        title: formData.title.trim(),
        description: formData.description.trim(),
        class_id: formData.class_id,
        assignment_type: formData.assignment_type as 'assignment' | 'cat',
        go_live_date: goLiveISO,
        due_date: dueISO,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        max_score: parseFloat(formData.max_score),
        file_url: fileUrl,
        created_by: user.id,
      }).select().single();

      if (error) throw error;

      // Get class info for activity log
      const selectedClass = classes?.find(c => c.id === formData.class_id);
      const typeLabel = formData.assignment_type === 'cat' ? 'CAT' : 'Assignment';

      // Log activity
      await logActivity(
        user.id,
        'assignment_created',
        `Created ${typeLabel} "${formData.title}" for ${selectedClass?.course_code || 'class'}`,
        insertedAssignment?.id,
        'assignment'
      );

      toast.success('Assignment created successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={errors.title ? 'border-destructive' : ''}
        />
        {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className={errors.description ? 'border-destructive' : ''}
        />
        {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
      </div>

      <div>
        <Label htmlFor="class">Class</Label>
        <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
          <SelectTrigger className={errors.class_id ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes?.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.course_code} - {cls.course_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.class_id && <p className="text-sm text-destructive mt-1">{errors.class_id}</p>}
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <Select value={formData.assignment_type} onValueChange={(value) => setFormData({ ...formData, assignment_type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assignment">Assignment</SelectItem>
            <SelectItem value="cat">CAT (Timed Test)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="go_live_date">Go Live Date</Label>
          <Input
            id="go_live_date"
            type="datetime-local"
            value={formData.go_live_date}
            onChange={(e) => setFormData({ ...formData, go_live_date: e.target.value })}
            className={errors.go_live_date ? 'border-destructive' : ''}
          />
          {errors.go_live_date && <p className="text-sm text-destructive mt-1">{errors.go_live_date}</p>}
        </div>
        <div>
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            type="datetime-local"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className={errors.due_date ? 'border-destructive' : ''}
          />
          {errors.due_date && <p className="text-sm text-destructive mt-1">{errors.due_date}</p>}
        </div>
      </div>

      {formData.assignment_type === 'cat' && (
        <div>
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            id="duration_minutes"
            type="number"
            min="1"
            max="300"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
            className={errors.duration_minutes ? 'border-destructive' : ''}
          />
          {errors.duration_minutes && <p className="text-sm text-destructive mt-1">{errors.duration_minutes}</p>}
        </div>
      )}

      <div>
        <Label htmlFor="max_score">Maximum Score</Label>
        <Input
          id="max_score"
          type="number"
          min="1"
          max="1000"
          step="0.1"
          value={formData.max_score}
          onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
          className={errors.max_score ? 'border-destructive' : ''}
        />
        {errors.max_score && <p className="text-sm text-destructive mt-1">{errors.max_score}</p>}
      </div>

      {formData.assignment_type === 'assignment' && (
        <div>
          <Label htmlFor="file">Assignment File (Optional)</Label>
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
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Assignment'}
      </Button>
    </form>
  );
}
