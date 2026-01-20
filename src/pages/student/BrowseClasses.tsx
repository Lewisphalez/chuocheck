import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, BookOpen, UserCircle, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ClassWithLecturer {
  id: string;
  course_code: string;
  course_name: string;
  section: string | null;
  semester: string;
  academic_year: string;
  lecturer_id: string;
  lecturer_name: string | null;
  lecturer_email: string;
  is_enrolled: boolean;
}

export default function BrowseClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassWithLecturer[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassWithLecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClasses(classes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = classes.filter(
        (c) =>
          c.course_code.toLowerCase().includes(query) ||
          c.course_name.toLowerCase().includes(query) ||
          c.lecturer_name?.toLowerCase().includes(query) ||
          c.lecturer_email.toLowerCase().includes(query)
      );
      setFilteredClasses(filtered);
    }
  }, [searchQuery, classes]);

  const fetchClasses = async () => {
    try {
      setLoading(true);

      // Fetch all classes with lecturer info directly via auth.users
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('course_code');

      if (classesError) throw classesError;

      // Fetch enrollments for current student
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('student_enrollments')
        .select('class_id')
        .eq('student_id', user?.id);

      if (enrollmentsError) throw enrollmentsError;

      const enrolledClassIds = new Set(enrollmentsData?.map((e) => e.class_id) || []);

      // Fetch lecturer profiles including auth users table
      const lecturerIds = [...new Set(classesData?.map((c) => c.lecturer_id) || [])];
      
      // Fetch from profiles table first
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', lecturerIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

      // Combine data
      const classesWithLecturer: ClassWithLecturer[] =
        classesData?.map((c) => {
          const profile = profilesMap.get(c.lecturer_id);
          return {
            ...c,
            lecturer_name: profile?.full_name || profile?.email?.split('@')[0] || 'Lecturer',
            lecturer_email: profile?.email || '',
            is_enrolled: enrolledClassIds.has(c.id),
          };
        }) || [];

      setClasses(classesWithLecturer);
      setFilteredClasses(classesWithLecturer);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (classId: string) => {
    try {
      const { error } = await supabase.from('student_enrollments').insert({
        student_id: user?.id,
        class_id: classId,
      });

      if (error) throw error;

      toast.success('Successfully enrolled in class');
      fetchClasses();
    } catch (error: any) {
      console.error('Error enrolling:', error);
      if (error.code === '23505') {
        toast.error('Already enrolled in this class');
      } else {
        toast.error('Failed to enroll in class');
      }
    }
  };

  const handleUnenroll = async (classId: string) => {
    try {
      const { error } = await supabase
        .from('student_enrollments')
        .delete()
        .eq('student_id', user?.id)
        .eq('class_id', classId);

      if (error) throw error;

      toast.success('Successfully unenrolled from class');
      fetchClasses();
    } catch (error) {
      console.error('Error unenrolling:', error);
      toast.error('Failed to unenroll from class');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Browse Classes</h2>
        <p className="text-muted-foreground">Search and enroll in available classes</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by course code, name, or lecturer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading classes...</div>
      ) : filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No classes found matching your search' : 'No classes available'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredClasses.map((classItem) => (
            <Card key={classItem.id} className={classItem.is_enrolled ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {classItem.course_code}
                      {classItem.section && ` - ${classItem.section}`}
                    </CardTitle>
                    <CardDescription>{classItem.course_name}</CardDescription>
                  </div>
                  {classItem.is_enrolled && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <UserCircle className="h-4 w-4 mr-2" />
                    <span>
                      {classItem.lecturer_name || classItem.lecturer_email}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {classItem.semester} {classItem.academic_year}
                  </div>
                  <Button
                    onClick={() =>
                      classItem.is_enrolled
                        ? handleUnenroll(classItem.id)
                        : handleEnroll(classItem.id)
                    }
                    variant={classItem.is_enrolled ? 'outline' : 'default'}
                    className="w-full"
                    size="sm"
                  >
                    {classItem.is_enrolled ? 'Unenroll' : 'Enroll'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
