import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { parseCSV } from '@/lib/csvParser';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImportResult {
  email: string;
  status: 'success' | 'failed' | 'duplicate';
  message: string;
}

export function BulkStudentImport({ classId, onImportComplete }: { classId: string; onImportComplete: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      const csvData = await parseCSV(file);
      await processImport(csvData);
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const processImport = async (data: Array<{ email: string; full_name: string }>) => {
    const importResults: ImportResult[] = [];

    for (const row of data) {
      try {
        // Check if user exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', row.email)
          .single();

        if (!existingProfile) {
          // Create auth user (simplified - in production, use proper signup flow)
          importResults.push({
            email: row.email,
            status: 'failed',
            message: 'User account must be created first',
          });
          continue;
        }

        // Check if already enrolled
        const { data: enrollment } = await supabase
          .from('student_enrollments')
          .select('id')
          .eq('student_id', existingProfile.id)
          .eq('class_id', classId)
          .single();

        if (enrollment) {
          importResults.push({
            email: row.email,
            status: 'duplicate',
            message: 'Already enrolled',
          });
          continue;
        }

        // Enroll student
        const { error } = await supabase
          .from('student_enrollments')
          .insert({
            student_id: existingProfile.id,
            class_id: classId,
          });

        if (error) throw error;

        importResults.push({
          email: row.email,
          status: 'success',
          message: 'Successfully enrolled',
        });
      } catch (error: any) {
        importResults.push({
          email: row.email,
          status: 'failed',
          message: error.message || 'Failed to enroll',
        });
      }
    }

    setResults(importResults);
    setShowResults(true);

    const successCount = importResults.filter(r => r.status === 'success').length;
    
    toast({
      title: "Import Complete",
      description: `Successfully enrolled ${successCount} out of ${importResults.length} students`,
    });

    if (successCount > 0) {
      onImportComplete();
    }
  };

  const downloadTemplate = () => {
    const template = 'email,full_name\nstudent@example.com,John Doe\n';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Students</DialogTitle>
          <DialogDescription>
            Upload a CSV file to enroll multiple students at once
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                CSV file should contain columns: email, full_name
                <Button
                  variant="link"
                  size="sm"
                  className="ml-2 p-0"
                  onClick={downloadTemplate}
                >
                  Download Template
                </Button>
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
              <Button
                variant="outline"
                onClick={() => document.getElementById('csv-upload')?.click()}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Select File
                  </>
                )}
              </Button>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
                disabled={importing}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Import Results</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowResults(false);
                  setResults([]);
                  setOpen(false);
                }}
              >
                Done
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {result.status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {result.status === 'failed' && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      {result.status === 'duplicate' && (
                        <FileText className="h-5 w-5 text-amber-600" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{result.email}</p>
                        <p className="text-xs text-muted-foreground">{result.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
