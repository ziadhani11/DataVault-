import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFileUpload, type UploadedFile, type ParsedData } from '@/hooks/useFileUpload';
import { useDashboards, type Dashboard } from '@/hooks/useDashboards';
import { Button } from '@/components/ui/button';
import { FileUploadZone } from '@/components/FileUploadZone';
import { CreateDashboardModal } from '@/components/CreateDashboardModal';
import { InviteTeamModal } from '@/components/InviteTeamModal';
import { SettingsModal } from '@/components/SettingsModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  BarChart3, 
  FileSpreadsheet, 
  TrendingUp, 
  Users, 
  Activity,
  LogOut,
  LayoutDashboard,
  Settings,
  ChevronRight,
  Trash2,
  Clock,
  Edit,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { fetchFiles, deleteFile } = useFileUpload();
  const { fetchDashboards, deleteDashboard } = useDashboards();
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [latestParsedData, setLatestParsedData] = useState<ParsedData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [filesData, dashboardsData] = await Promise.all([
      fetchFiles(),
      fetchDashboards(),
    ]);
    setFiles(filesData);
    setDashboards(dashboardsData);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully logged out.',
    });
  };

  const handleFileUploaded = (file: UploadedFile, data: ParsedData) => {
    setFiles(prev => [file, ...prev]);
    setLatestParsedData(data);
  };

  const handleDeleteFile = async (file: UploadedFile) => {
    const success = await deleteFile(file);
    if (success) {
      setFiles(prev => prev.filter(f => f.id !== file.id));
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    const success = await deleteDashboard(id);
    if (success) {
      setDashboards(prev => prev.filter(d => d.id !== id));
    }
  };

  const stats = [
    { label: 'Total Uploads', value: files.length.toString(), icon: FileSpreadsheet, change: files.length > 0 ? 'Active' : 'None yet' },
    { label: 'Dashboards', value: dashboards.length.toString(), icon: LayoutDashboard, change: dashboards.length > 0 ? 'Active' : 'None yet' },
    { label: 'Data Points', value: latestParsedData ? (latestParsedData.rows.length * latestParsedData.headers.length).toString() : '0', icon: Activity, change: latestParsedData ? 'From latest file' : 'Upload to see' },
    { label: 'Team Members', value: '1', icon: Users, change: 'Just you' },
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass-strong sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">DataVault</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm text-secondary-foreground">{user?.email}</span>
              </div>
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Analyst'}!
          </h1>
          <p className="text-muted-foreground">
            Upload your data and start generating insights.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="glass rounded-xl p-5 hover:border-primary/30 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upload Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FileUploadZone onFileUploaded={handleFileUploaded} />
            
            {/* Recent Files */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Files</h3>
                <div className="space-y-2">
                  {files.slice(0, 5).map((file) => (
                    <div 
                      key={file.id}
                      className="glass rounded-xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileSpreadsheet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteFile(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
            
            <button 
              className="w-full glass rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer group text-left"
              onClick={() => setShowCreateModal(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">New Dashboard</p>
                    <p className="text-sm text-muted-foreground">Create from scratch</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button 
              className="w-full glass rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer group text-left"
              onClick={() => {
                toast({
                  title: 'Templates coming soon',
                  description: 'Pre-built dashboard templates will be available shortly.',
                });
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition-colors">
                    <FileSpreadsheet className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Import Template</p>
                    <p className="text-sm text-muted-foreground">Use a preset layout</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button 
              className="w-full glass rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer group text-left"
              onClick={() => setShowInviteModal(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary group-hover:bg-secondary/80 transition-colors">
                    <Users className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Invite Team</p>
                    <p className="text-sm text-muted-foreground">Collaborate together</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* Dashboards List */}
            {dashboards.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Your Dashboards</h4>
                <div className="space-y-2">
                  {dashboards.map((dashboard) => (
                    <div 
                      key={dashboard.id}
                      className="glass rounded-lg p-3 flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer"
                      onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <LayoutDashboard className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">{dashboard.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 hidden sm:flex">
                          <Clock className="h-3 w-3" />
                          {formatDate(dashboard.updated_at)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/${dashboard.id}`);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDashboard(dashboard.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Preview */}
        {latestParsedData && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Data Preview</h3>
            <div className="glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      {latestParsedData.headers.slice(0, 6).map((header, i) => (
                        <th key={i} className="px-4 py-3 text-left font-medium text-foreground">
                          {header}
                        </th>
                      ))}
                      {latestParsedData.headers.length > 6 && (
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          +{latestParsedData.headers.length - 6} more
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {latestParsedData.rows.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-border/50 hover:bg-secondary/30">
                        {latestParsedData.headers.slice(0, 6).map((header, colIndex) => (
                          <td key={colIndex} className="px-4 py-3 text-muted-foreground">
                            {String(row[header] ?? '-')}
                          </td>
                        ))}
                        {latestParsedData.headers.length > 6 && (
                          <td className="px-4 py-3 text-muted-foreground">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {latestParsedData.rows.length > 5 && (
                <div className="px-4 py-3 text-center text-sm text-muted-foreground bg-secondary/30">
                  Showing 5 of {latestParsedData.rows.length} rows
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state when no data */}
        {!latestParsedData && files.length === 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="glass rounded-xl p-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No recent activity yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Upload your first file to get started
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateDashboardModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onCreated={loadData}
      />
      <InviteTeamModal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
      />
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />
    </div>
  );
}
