import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SessionTemplate {
  id: string;
  name: string;
  duration_minutes: number;
  location_required: boolean;
  qr_refresh_seconds: number;
  grace_period_minutes: number;
  allow_late_entry: boolean;
}

export default function SessionTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    duration_minutes: 60,
    location_required: false,
    qr_refresh_seconds: 0,
    grace_period_minutes: 0,
    allow_late_entry: true,
  });

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('session_templates')
      .select('*')
      .eq('created_by', user.id)
      .order('name');

    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  };

  const createTemplate = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('session_templates')
      .insert({
        ...newTemplate,
        created_by: user.id,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Template created successfully',
      });
      setDialogOpen(false);
      setNewTemplate({
        name: '',
        duration_minutes: 60,
        location_required: false,
        qr_refresh_seconds: 0,
        grace_period_minutes: 0,
        allow_late_entry: true,
      });
      fetchTemplates();
    }
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from('session_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
      fetchTemplates();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/lecturer/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Session Templates</h1>
            <p className="text-muted-foreground">Create and manage reusable session configurations</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Session Template</DialogTitle>
                <DialogDescription>Save frequently used session settings</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Standard Lecture"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newTemplate.duration_minutes}
                    onChange={(e) => setNewTemplate({ ...newTemplate, duration_minutes: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="location">Require Location</Label>
                  <Switch
                    id="location"
                    checked={newTemplate.location_required}
                    onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, location_required: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr_refresh">QR Refresh (seconds, 0 = disabled)</Label>
                  <Input
                    id="qr_refresh"
                    type="number"
                    value={newTemplate.qr_refresh_seconds}
                    onChange={(e) => setNewTemplate({ ...newTemplate, qr_refresh_seconds: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grace">Grace Period (minutes)</Label>
                  <Input
                    id="grace"
                    type="number"
                    value={newTemplate.grace_period_minutes}
                    onChange={(e) => setNewTemplate({ ...newTemplate, grace_period_minutes: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="late">Allow Late Entry</Label>
                  <Switch
                    id="late"
                    checked={newTemplate.allow_late_entry}
                    onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, allow_late_entry: checked })}
                  />
                </div>
                <Button onClick={createTemplate} className="w-full">Create Template</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No templates yet. Create your first template to save time!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>{template.duration_minutes} minutes</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {template.location_required && (
                      <span className="text-xs bg-secondary px-2 py-1 rounded">Location Required</span>
                    )}
                    {template.qr_refresh_seconds > 0 && (
                      <span className="text-xs bg-secondary px-2 py-1 rounded">
                        QR Refresh: {template.qr_refresh_seconds}s
                      </span>
                    )}
                    {template.grace_period_minutes > 0 && (
                      <span className="text-xs bg-secondary px-2 py-1 rounded">
                        Grace: {template.grace_period_minutes}min
                      </span>
                    )}
                    {template.allow_late_entry && (
                      <span className="text-xs bg-secondary px-2 py-1 rounded">Late Entry Allowed</span>
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
