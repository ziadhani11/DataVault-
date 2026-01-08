import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  ArrowRight, 
  Upload, 
  LineChart, 
  Shield, 
  Zap,
  CheckCircle
} from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Upload,
      title: 'Easy File Upload',
      description: 'Drag and drop Excel files to instantly import your data.',
    },
    {
      icon: LineChart,
      title: 'Smart Dashboards',
      description: 'Auto-generate beautiful visualizations from your data.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Your data is encrypted and protected at all times.',
    },
    {
      icon: Zap,
      title: 'Real-time Insights',
      description: 'Get instant analytics and actionable recommendations.',
    },
  ];

  const benefits = [
    'No coding required',
    'Works with any Excel format',
    'Share with your team',
    'Export to PDF & PNG',
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 bg-gradient-hero pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-glow opacity-30 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/50 glass-strong">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary shadow-glow">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">DataVault</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button variant="hero" onClick={() => navigate('/auth')}>
                Get Started
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8 animate-fade-in">
              <Zap className="h-4 w-4" />
              <span>Analytics made simple for data professionals</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Turn Excel files into
              <span className="text-gradient block mt-2">powerful dashboards</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '200ms' }}>
              Upload your spreadsheets, and let DataVault automatically generate 
              beautiful, interactive dashboards. No coding required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <Button variant="hero" size="xl" onClick={() => navigate('/auth')}>
                Start Free Trial
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button variant="glass" size="xl" onClick={() => navigate('/auth')}>
                View Demo
              </Button>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-10 animate-fade-in" style={{ animationDelay: '400ms' }}>
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 border-t border-border/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything you need to analyze data
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for data analysts who want results, not complexity.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="glass rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-3 rounded-xl bg-gradient-primary w-fit mb-4 group-hover:shadow-glow transition-all">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="glass rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-glow opacity-50" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Ready to transform your data?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Join thousands of analysts who have already simplified their workflow with DataVault.
              </p>
              <Button variant="hero" size="xl" onClick={() => navigate('/auth')}>
                Get Started for Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-primary">
                <BarChart3 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">DataVault</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 DataVault. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
