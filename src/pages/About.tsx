import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Shield, 
  Smartphone, 
  BarChart3, 
  Users, 
  Award,
  ArrowLeft,
  Mail,
  Github,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <QrCode className="h-8 w-8" />,
      title: 'QR Code Attendance',
      description: 'Secure, time-limited QR codes for quick and fraud-resistant attendance marking',
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Location Verification',
      description: 'GPS-based verification ensures students are physically present in the classroom',
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: 'Mobile-First PWA',
      description: 'Works seamlessly on any device with offline support and push notifications',
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Real-Time Analytics',
      description: 'Comprehensive attendance reports and insights for data-driven decisions',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Study Groups',
      description: 'Collaborative features for students to form study groups and track group attendance',
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Gamification',
      description: 'Badges, points, and leaderboards to motivate consistent attendance',
    },
  ];

  const techStack = [
    'React 18',
    'TypeScript',
    'Tailwind CSS',
    'Supabase',
    'Progressive Web App',
    'Real-time Updates',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <QrCode className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">ChuoCheck</h1>
              <p className="text-muted-foreground">
                Smart Campus Attendance Management
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Mission */}
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              ChuoCheck revolutionizes university attendance tracking through secure QR code technology. 
              We eliminate traditional paper-based systems by enabling lecturers to generate time-limited 
              QR codes that students scan to mark their attendance instantly. Built with mobile-first 
              design principles, ChuoCheck provides real-time attendance monitoring, comprehensive analytics, 
              and seamless offline functionality.
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2 text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <Card>
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
            <CardDescription>Built with modern, reliable technologies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech, index) => (
                <Badge key={index} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Version Info */}
        <Card>
          <CardHeader>
            <CardTitle>Version Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Release Date:</span>
                <span className="font-medium">October 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">License:</span>
                <span className="font-medium">MIT</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Get in Touch</CardTitle>
            <CardDescription>Have questions or feedback? We'd love to hear from you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="mailto:support@chuocheck.app">
                  <Mail className="h-4 w-4 mr-2" />
                  support@chuocheck.app
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://github.com/chuocheck" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub Repository
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://chuocheck.app" target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  Official Website
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
          <Button variant="link" className="p-0 h-auto" asChild>
            <a href="/privacy">Privacy Policy</a>
          </Button>
          <span>•</span>
          <Button variant="link" className="p-0 h-auto" asChild>
            <a href="/terms">Terms of Service</a>
          </Button>
          <span>•</span>
          <Button variant="link" className="p-0 h-auto" asChild>
            <a href="/help">Help & Support</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
