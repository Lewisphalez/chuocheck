import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AddGroupMembersProps {
  groupId: string;
  onMemberAdded: () => void;
}

interface Student {
  id: string;
  email: string;
  full_name: string;
}

export default function AddGroupMembers({ groupId, onMemberAdded }: AddGroupMembersProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searching, setSearching] = useState(false);

  const searchStudents = async (query: string) => {
    if (!query || query.length < 2) {
      setStudents([]);
      return;
    }

    setSearching(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);

    if (!error && data) {
      // Filter out users who are already members
      const { data: existingMembers } = await supabase
        .from('study_group_members')
        .select('student_id')
        .eq('group_id', groupId);

      const memberIds = existingMembers?.map(m => m.student_id) || [];
      const filteredStudents = data.filter(s => !memberIds.includes(s.id));
      
      setStudents(filteredStudents as Student[]);
    }
    
    setSearching(false);
  };

  const addMember = async () => {
    if (!selectedStudent) {
      toast({
        title: 'Error',
        description: 'Please select a student',
        variant: 'destructive',
      });
      return;
    }

    // Verify the selected user has student role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', selectedStudent.id)
      .eq('role', 'student')
      .maybeSingle();

    if (!userRole) {
      toast({
        title: 'Error',
        description: 'Selected user is not a student',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('study_group_members')
      .insert({
        group_id: groupId,
        student_id: selectedStudent.id,
        role: 'member',
      });

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to add member: ${error.message}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `${selectedStudent.full_name || selectedStudent.email} added to group`,
      });
      setOpen(false);
      setSelectedStudent(null);
      setSearchTerm('');
      setStudents([]);
      onMemberAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Members
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Group Members</DialogTitle>
          <DialogDescription>
            Search for students by email or name and add them to your study group
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search Student</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="w-full justify-between"
                >
                  {selectedStudent
                    ? `${selectedStudent.full_name || selectedStudent.email}`
                    : "Search by email or name..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Type email or name..."
                    value={searchTerm}
                    onValueChange={(value) => {
                      setSearchTerm(value);
                      searchStudents(value);
                    }}
                  />
                  <CommandList>
                    {searching && <CommandEmpty>Searching...</CommandEmpty>}
                    {!searching && searchTerm && students.length === 0 && (
                      <CommandEmpty>No students found</CommandEmpty>
                    )}
                    {!searching && students.length > 0 && (
                      <CommandGroup>
                        {students.map((student) => (
                          <CommandItem
                            key={student.id}
                            value={student.id}
                            onSelect={() => {
                              setSelectedStudent(student);
                              setSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedStudent?.id === student.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <div className="font-medium">{student.full_name || 'No name'}</div>
                              <div className="text-xs text-muted-foreground">{student.email}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={addMember} className="w-full" disabled={!selectedStudent}>
            Add to Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
