import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/authContext';
import { mockReports, mockMemos, statusLabels, priorityLabels } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Users,
  ScrollText,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </div>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportRow({ report }: { report: typeof mockReports[0] }) {
  const statusClass = {
    submitted: 'status-submitted',
    reviewed: 'status-reviewed',
    in_progress: 'status-progress',
    validation: 'status-validation',
    resolved: 'status-resolved',
  }[report.status];

  const priorityClass = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    critical: 'priority-critical',
  }[report.priority];

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
      data-testid={`report-row-${report.id}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-muted-foreground">{report.id}</span>
          <Badge variant="outline" className={cn('text-xs', priorityClass)}>
            {priorityLabels[report.priority]}
          </Badge>
        </div>
        <p className="font-medium truncate">{report.category}</p>
        <p className="text-sm text-muted-foreground truncate">{report.location}</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge className={cn('capitalize', statusClass)}>{statusLabels[report.status]}</Badge>
        <Link href={`/reports/${report.id}`}>
          <Button variant="ghost" size="sm" data-testid={`view-report-${report.id}`}>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const userReports = user.role === 'resident'
    ? mockReports.filter(r => r.submittedBy === user.name)
    : mockReports;

  const pendingCount = userReports.filter(r => r.status === 'submitted' || r.status === 'reviewed').length;
  const inProgressCount = userReports.filter(r => r.status === 'in_progress' || r.status === 'validation').length;
  const resolvedCount = userReports.filter(r => r.status === 'resolved').length;
  const criticalCount = userReports.filter(r => r.priority === 'critical' && r.status !== 'resolved').length;

  const recentReports = [...userReports]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const approvedMemos = mockMemos.filter(m => m.status === 'approved').slice(0, 3);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
              {user.role === 'resident' ? 'My Dashboard' : 'Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user.name.split(' ')[0]}
            </p>
          </div>
          {user.role === 'resident' && (
            <Link href="/reports/new">
              <Button data-testid="button-new-report">
                <Plus className="w-4 h-4 mr-2" />
                New Report
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Reports"
            value={userReports.length}
            description={user.role === 'resident' ? 'Your submitted reports' : 'All barangay reports'}
            icon={FileText}
          />
          <StatCard
            title="Pending Review"
            value={pendingCount}
            description="Awaiting action"
            icon={Clock}
          />
          <StatCard
            title="In Progress"
            value={inProgressCount}
            description="Being addressed"
            icon={TrendingUp}
          />
          <StatCard
            title={criticalCount > 0 ? 'Critical Issues' : 'Resolved'}
            value={criticalCount > 0 ? criticalCount : resolvedCount}
            description={criticalCount > 0 ? 'Needs immediate attention' : 'Successfully closed'}
            icon={criticalCount > 0 ? AlertTriangle : CheckCircle2}
            className={criticalCount > 0 ? 'border-destructive/50' : ''}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Reports</CardTitle>
                <CardDescription>Latest activity on incident reports</CardDescription>
              </div>
              <Link href="/reports">
                <Button variant="outline" size="sm" data-testid="link-view-all-reports">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentReports.length > 0 ? (
                recentReports.map(report => (
                  <ReportRow key={report.id} report={report} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No reports yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ScrollText className="w-5 h-5" />
                Announcements
              </CardTitle>
              <CardDescription>Latest memos & ordinances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {approvedMemos.map(memo => (
                <div key={memo.id} className="space-y-1" data-testid={`memo-${memo.id}`}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {memo.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(memo.effectiveDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{memo.title}</p>
                </div>
              ))}
              <Link href="/memos">
                <Button variant="ghost" size="sm" className="w-full mt-2" data-testid="link-view-all-memos">
                  View All Announcements
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {user.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">5</p>
                    <p className="text-sm text-muted-foreground">Registered Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-chart-2/5 border-chart-2/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">85%</p>
                    <p className="text-sm text-muted-foreground">Resolution Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-chart-3/5 border-chart-3/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-chart-3" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">2.3 days</p>
                    <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
