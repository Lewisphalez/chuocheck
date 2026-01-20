import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  PlayCircle,
  FileText,
  BookOpen,
  BarChart3,
  FileSpreadsheet,
  QrCode,
  Award,
  Trophy,
  Eye,
  Calendar
} from 'lucide-react';

export function QuickActions() {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const lecturerActions = [
    {
      icon: <PlayCircle className="h-5 w-5" />,
      label: 'Start Session',
      description: 'Begin a new attendance session',
      action: () => navigate('/lecturer/classes'),
      variant: 'default' as const,
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'Assignments',
      description: 'Create and grade assignments',
      action: () => navigate('/lecturer/assignments'),
      variant: 'outline' as const,
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Manage Classes',
      description: 'View and edit your classes',
      action: () => navigate('/lecturer/classes'),
      variant: 'outline' as const,
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: 'Analytics',
      description: 'View detailed analytics',
      action: () => navigate('/lecturer/analytics'),
      variant: 'outline' as const,
    },
    {
      icon: <FileSpreadsheet className="h-5 w-5" />,
      label: 'Session Templates',
      description: 'Manage session templates',
      action: () => navigate('/lecturer/templates'),
      variant: 'outline' as const,
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: 'Session History',
      description: 'View past sessions',
      action: () => navigate('/lecturer/session-history'),
      variant: 'outline' as const,
    },
  ];

  const studentActions = [
    {
      icon: <QrCode className="h-5 w-5" />,
      label: 'Scan QR Code',
      description: 'Mark your attendance',
      action: () => navigate('/student/scanner'),
      variant: 'default' as const,
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'Assignments',
      description: 'View and submit work',
      action: () => navigate('/student/assignments'),
      variant: 'outline' as const,
    },
    {
      icon: <Eye className="h-5 w-5" />,
      label: 'View Attendance',
      description: 'Check your attendance records',
      action: () => navigate('/student/attendance'),
      variant: 'outline' as const,
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Browse Classes',
      description: 'Explore available classes',
      action: () => navigate('/student/browse-classes'),
      variant: 'outline' as const,
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: 'My Badges',
      description: 'View your achievements',
      action: () => navigate('/student/badges'),
      variant: 'outline' as const,
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      label: 'Leaderboard',
      description: 'See your ranking',
      action: () => navigate('/student/leaderboard'),
      variant: 'outline' as const,
    },
  ];

  const actions = userRole === 'lecturer' ? lecturerActions : studentActions;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Frequently used features for easy access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto flex-col items-start p-4 space-y-2"
              onClick={action.action}
            >
              <div className="flex items-center gap-2 w-full">
                {action.icon}
                <span className="font-medium text-sm">{action.label}</span>
              </div>
              <span className="text-xs text-muted-foreground text-left w-full">
                {action.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
