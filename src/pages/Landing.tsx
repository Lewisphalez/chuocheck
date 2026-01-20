import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, ArrowRight, Users, BarChart, CheckCircle, Shield, Bell } from 'lucide-react';

export default function Landing() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const handleDashboardRedirect = () => {
    if (userRole === 'lecturer') {
      navigate('/lecturer/dashboard');
    } else if (userRole === 'student') {
      navigate('/student/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-block">
              <div className="flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-full border border-primary/20 backdrop-blur-sm">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  ChuoCheck
                </h1>
              </div>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              Modern Attendance Tracking
              <span className="block text-primary mt-2">Made Simple</span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Secure, real-time attendance management powered by QR codes. 
              Perfect for universities and educational institutions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {user ? (
                <Button 
                  size="lg" 
                  onClick={handleDashboardRedirect}
                  className="text-lg px-8 py-6 shadow-lg shadow-primary/20"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/auth')}
                    className="text-lg px-8 py-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/auth')}
                    className="text-lg px-8 py-6"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Why Choose ChuoCheck?</h3>
          <p className="text-muted-foreground text-lg">
            Everything you need for modern attendance management
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Secure QR Codes</CardTitle>
              <CardDescription>
                Time-limited, unique QR codes with fraud prevention and screenshot detection
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Real-time Tracking</CardTitle>
              <CardDescription>
                Instant attendance confirmation with live feeds and automatic synchronization
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                <BarChart className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Detailed insights, trends, and exportable reports in PDF and CSV formats
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Device fingerprinting, duplicate prevention, and optional location verification
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Smart Notifications</CardTitle>
              <CardDescription>
                Browser push notifications for active sessions and attendance reminders
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-500/20 transition-colors">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>
                Separate interfaces for lecturers and students with appropriate permissions
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary/5 border-y border-primary/10">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">100%</div>
              <div className="text-muted-foreground">Accurate Tracking</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">Real-time</div>
              <div className="text-muted-foreground">Live Updates</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">Secure</div>
              <div className="text-muted-foreground">Enterprise Grade</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Attendance Tracking?
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join universities worldwide using ChuoCheck for seamless, secure attendance management.
            </p>
            {!user && (
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6 shadow-lg shadow-primary/20"
              >
                Start Free Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold">ChuoCheck</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ChuoCheck. Secure attendance tracking for modern education.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
