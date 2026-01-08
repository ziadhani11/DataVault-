import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboards, type Dashboard, type ChartConfig } from '@/hooks/useDashboards';
import { useFileUpload, type ParsedData } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Save,
  Trash2,
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  Settings,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

const CHART_COLORS = [
  'hsl(175, 80%, 50%)',
  'hsl(190, 80%, 45%)',
  'hsl(200, 70%, 50%)',
  'hsl(220, 70%, 55%)',
  'hsl(260, 60%, 55%)',
  'hsl(300, 60%, 50%)',
];

const chartTypeIcons = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  area: AreaChart,
};

interface AISuggestion {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  xAxis: string;
  yAxis: string;
  reason: string;
}

export default function DashboardEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchDashboards, updateDashboard } = useDashboards();
  const { fetchFiles } = useFileUpload();

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  useEffect(() => {
    loadDashboard();
  }, [id]);

  const loadDashboard = async () => {
    setLoading(true);
    const dashboards = await fetchDashboards();
    const found = dashboards.find(d => d.id === id);
    if (found) {
      setDashboard(found);
      setName(found.name);
      if (found.file_id) {
        await loadFileData(found.file_id);
      }
    }
    setLoading(false);
  };

  const loadFileData = async (fileId: string) => {
    const files = await fetchFiles();
    const file = files.find(f => f.id === fileId);
    if (file) {
      try {
        const { data, error } = await supabase.storage
          .from('excel-files')
          .download(file.file_path);
        if (error) throw error;
        const arrayBuffer = await data.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
        if (jsonData.length > 0) {
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1).map(row => {
          const obj: Record<string, string | number | boolean> = {};
            headers.forEach((header, i) => {
              const val = (row as unknown[])[i];
              if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                obj[header] = val;
              } else {
                obj[header] = val !== undefined && val !== null ? String(val) : '';
              }
            });
            return obj;
          });
          setParsedData({ headers, rows, sheetName });
        }
      } catch (err) {
        console.error('Failed to load file data:', err);
      }
    }
  };

  const handleSave = async () => {
    if (!dashboard) return;
    setSaving(true);
    await updateDashboard(dashboard.id, {
      name,
      chart_config: dashboard.chart_config,
    });
    setSaving(false);
  };

  const addChart = (type: ChartConfig['type']) => {
    if (!dashboard || !parsedData) return;
    const newChart: ChartConfig = {
      id: crypto.randomUUID(),
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
      xAxis: parsedData.headers[0] || '',
      yAxis: parsedData.headers[1] || '',
    };
    setDashboard({
      ...dashboard,
      chart_config: [...dashboard.chart_config, newChart],
    });
  };

  const updateChart = (chartId: string, updates: Partial<ChartConfig>) => {
    if (!dashboard) return;
    setDashboard({
      ...dashboard,
      chart_config: dashboard.chart_config.map(c =>
        c.id === chartId ? { ...c, ...updates } : c
      ),
    });
  };

  const removeChart = (chartId: string) => {
    if (!dashboard) return;
    setDashboard({
      ...dashboard,
      chart_config: dashboard.chart_config.filter(c => c.id !== chartId),
    });
  };

  const getAISuggestions = async (autoApply = false) => {
    if (!parsedData) return;
    
    setAiLoading(true);
    setSuggestions([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('suggest-charts', {
        body: {
          headers: parsedData.headers,
          sampleRows: parsedData.rows.slice(0, 10),
        },
      });

      if (error) throw error;
      
      if (data.error) {
        toast({
          title: 'AI Error',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      const newSuggestions = data.suggestions || [];
      
      // Auto-apply suggestions if requested (on initial load)
      if (autoApply && newSuggestions.length > 0 && dashboard) {
        const newCharts: ChartConfig[] = newSuggestions.map((s: AISuggestion) => ({
          id: crypto.randomUUID(),
          type: s.type,
          title: s.title,
          xAxis: s.xAxis,
          yAxis: s.yAxis,
        }));
        setDashboard({
          ...dashboard,
          chart_config: [...dashboard.chart_config, ...newCharts],
        });
        toast({
          title: 'AI Dashboard Created',
          description: `Added ${newCharts.length} charts based on your data.`,
        });
      } else {
        setSuggestions(newSuggestions);
        if (newSuggestions.length > 0) {
          toast({
            title: 'AI Analysis Complete',
            description: `Found ${newSuggestions.length} chart recommendations for your data.`,
          });
        }
      }
    } catch (err) {
      console.error('AI suggestion error:', err);
      toast({
        title: 'Failed to get suggestions',
        description: 'Could not analyze your data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const applySuggestion = (suggestion: AISuggestion) => {
    if (!dashboard) return;
    const newChart: ChartConfig = {
      id: crypto.randomUUID(),
      type: suggestion.type,
      title: suggestion.title,
      xAxis: suggestion.xAxis,
      yAxis: suggestion.yAxis,
    };
    setDashboard({
      ...dashboard,
      chart_config: [...dashboard.chart_config, newChart],
    });
    toast({
      title: 'Chart added',
      description: suggestion.title,
    });
  };

  const applyAllSuggestions = () => {
    if (!dashboard || suggestions.length === 0) return;
    const newCharts: ChartConfig[] = suggestions.map(s => ({
      id: crypto.randomUUID(),
      type: s.type,
      title: s.title,
      xAxis: s.xAxis,
      yAxis: s.yAxis,
    }));
    setDashboard({
      ...dashboard,
      chart_config: [...dashboard.chart_config, ...newCharts],
    });
    setSuggestions([]);
    toast({
      title: 'All charts added',
      description: `Added ${newCharts.length} charts to your dashboard.`,
    });
  };

  // Aggregate data by grouping xAxis values and summing/counting yAxis values
  const aggregateData = (xAxis: string, yAxis: string) => {
    if (!parsedData) return [];
    
    const aggregated = new Map<string, { sum: number; count: number }>();
    
    parsedData.rows.forEach(row => {
      const key = String(row[xAxis] || 'Unknown');
      const value = Number(row[yAxis]) || 0;
      
      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.sum += value;
        existing.count += 1;
      } else {
        aggregated.set(key, { sum: value, count: 1 });
      }
    });
    
    // Determine if yAxis is numeric or if we should use count
    const isYAxisNumeric = parsedData.rows.some(row => {
      const val = row[yAxis];
      return typeof val === 'number' && !isNaN(val) && val !== 0;
    });
    
    return Array.from(aggregated.entries()).map(([name, data]) => ({
      name,
      value: isYAxisNumeric ? data.sum : data.count,
      count: data.count,
    }));
  };

  const renderChart = (chart: ChartConfig) => {
    if (!parsedData) return null;
    
    // Use aggregated data for better visualization
    const aggregatedData = aggregateData(chart.xAxis, chart.yAxis);
    const rawData = parsedData.rows.slice(0, 50);

    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={aggregatedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <RechartsLineChart data={rawData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={chart.xAxis} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey={chart.yAxis} stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ fill: CHART_COLORS[0] }} />
            </RechartsLineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Pie
                data={aggregatedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {aggregatedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <RechartsAreaChart data={rawData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={chart.xAxis} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area type="monotone" dataKey={chart.yAxis} stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.3} />
            </RechartsAreaChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Dashboard not found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboards
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass-strong sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {editingName ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                  className="w-64"
                  autoFocus
                />
              ) : (
                <h1
                  className="text-lg font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setEditingName(true)}
                >
                  {name}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* AI Suggestions Section */}
        {parsedData && (
          <div className="mb-6 glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-foreground">AI Chart Suggestions</h3>
              </div>
              <Button
                onClick={() => getAISuggestions(false)}
                disabled={aiLoading}
                size="sm"
                className="gap-2"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze Data
                  </>
                )}
              </Button>
            </div>
            
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    AI found {suggestions.length} optimal visualizations for your data:
                  </p>
                  <Button variant="outline" size="sm" onClick={applyAllSuggestions}>
                    Add All Charts
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestions.map((suggestion, i) => {
                    const Icon = chartTypeIcons[suggestion.type];
                    return (
                      <div
                        key={i}
                        className="bg-secondary/50 rounded-lg p-3 flex items-start gap-3 group hover:bg-secondary transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{suggestion.reason}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {suggestion.xAxis} → {suggestion.yAxis}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Add
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {!aiLoading && suggestions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Click "Analyze Data" to get AI-powered chart recommendations based on your spreadsheet.
              </p>
            )}
          </div>
        )}

        {/* Add Chart Toolbar */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Manual Chart Creation</h3>
          <div className="flex gap-2 flex-wrap">
            {(['bar', 'line', 'pie', 'area'] as const).map((type) => {
              const Icon = chartTypeIcons[type];
              return (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => addChart(type)}
                  disabled={!parsedData}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              );
            })}
          </div>
          {!parsedData && !dashboard.file_id && (
            <p className="text-sm text-muted-foreground mt-2">
              Upload a file to this dashboard to add charts.
            </p>
          )}
        </div>

        {/* Charts Grid */}
        {dashboard.chart_config.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboard.chart_config.map((chart) => (
              <div key={chart.id} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <Input
                    value={chart.title}
                    onChange={(e) => updateChart(chart.id, { title: e.target.value })}
                    className="font-medium bg-transparent border-none p-0 h-auto text-foreground"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeChart(chart.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Axis selectors */}
                {parsedData && (
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">X-Axis</label>
                      <select
                        value={chart.xAxis}
                        onChange={(e) => updateChart(chart.id, { xAxis: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-md px-2 py-1 text-sm text-foreground"
                      >
                        {parsedData.headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Y-Axis</label>
                      <select
                        value={chart.yAxis}
                        onChange={(e) => updateChart(chart.id, { yAxis: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-md px-2 py-1 text-sm text-foreground"
                      >
                        {parsedData.headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {renderChart(chart)}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-12 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No charts yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Add charts using the toolbar above
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
