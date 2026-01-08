import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/authContext';
import { mockReports, statusLabels, priorityLabels, categories } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, TrendingUp, Clock, CheckCircle2, AlertTriangle, BarChart3, PieChart } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Redirect } from 'wouter';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function Analytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('30');

  if (!user || user.role !== 'admin') {
    return <Redirect to="/dashboard" />;
  }

  const totalReports = mockReports.length;
  const resolvedReports = mockReports.filter(r => r.status === 'resolved').length;
  const criticalReports = mockReports.filter(r => r.priority === 'critical' && r.status !== 'resolved').length;
  const resolutionRate = Math.round((resolvedReports / totalReports) * 100);

  const statusData = [
    { name: 'Submitted', value: mockReports.filter(r => r.status === 'submitted').length, color: '#3b82f6' },
    { name: 'Reviewed', value: mockReports.filter(r => r.status === 'reviewed').length, color: '#8b5cf6' },
    { name: 'In Progress', value: mockReports.filter(r => r.status === 'in_progress').length, color: '#f59e0b' },
    { name: 'Validation', value: mockReports.filter(r => r.status === 'validation').length, color: '#f97316' },
    { name: 'Resolved', value: mockReports.filter(r => r.status === 'resolved').length, color: '#22c55e' },
  ];

  const categoryData = categories
    .map(cat => ({
      name: cat,
      count: mockReports.filter(r => r.category === cat).length,
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const priorityData = [
    { name: 'Low', value: mockReports.filter(r => r.priority === 'low').length, color: '#94a3b8' },
    { name: 'Medium', value: mockReports.filter(r => r.priority === 'medium').length, color: '#eab308' },
    { name: 'High', value: mockReports.filter(r => r.priority === 'high').length, color: '#f97316' },
    { name: 'Critical', value: mockReports.filter(r => r.priority === 'critical').length, color: '#ef4444' },
  ];

  const handleExport = (format: 'csv' | 'pdf') => {
    toast({
      title: `Exporting report to ${format.toUpperCase()}`,
      description: 'Your download will start shortly.',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-analytics-title">Analytics & Reports</h1>
            <p className="text-muted-foreground">Insights and statistics for barangay operations</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]" data-testid="select-date-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExport('csv')} data-testid="button-export-csv">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')} data-testid="button-export-pdf">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                  <p className="text-3xl font-bold mt-1">{totalReports}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    +12% from last period
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                  <p className="text-3xl font-bold mt-1">{resolutionRate}%</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    +5% improvement
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-chart-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Response Time</p>
                  <p className="text-3xl font-bold mt-1">2.3 days</p>
                  <p className="text-xs text-muted-foreground mt-2">From submission to first action</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-chart-3" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={criticalReports > 0 ? 'border-destructive/50' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical Open</p>
                  <p className="text-3xl font-bold mt-1">{criticalReports}</p>
                  <p className="text-xs text-muted-foreground mt-2">Needs immediate attention</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Reports by Category
              </CardTitle>
              <CardDescription>Distribution of incident reports by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(217, 91%, 50%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Reports by Status
              </CardTitle>
              <CardDescription>Current status distribution of all reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
              <CardDescription>Breakdown of reports by priority level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {priorityData.map(item => (
                  <div
                    key={item.name}
                    className="p-4 rounded-lg border border-border"
                    style={{ borderLeftWidth: 4, borderLeftColor: item.color }}
                  >
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-sm text-muted-foreground">{item.name} Priority</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((item.value / totalReports) * 100)}% of total
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
            <CardDescription>Key metrics for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">{totalReports}</p>
                <p className="text-xs text-muted-foreground">Total Submitted</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-blue-600">
                  {mockReports.filter(r => r.status === 'submitted').length}
                </p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-amber-600">
                  {mockReports.filter(r => r.status === 'in_progress').length}
                </p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-green-600">{resolvedReports}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">2.3</p>
                <p className="text-xs text-muted-foreground">Avg. Days to Resolve</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-chart-2">{resolutionRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
