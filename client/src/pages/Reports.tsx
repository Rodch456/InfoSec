import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/authContext';
import { statusLabels, priorityLabels, categories } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'wouter';
import { Search, Filter, Plus, MapPin, Calendar, User, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Report {
  id: string;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  status: 'submitted' | 'reviewed' | 'in_progress' | 'validation' | 'resolved';
  images: string[];
  submittedBy: string;
  submittedAt: string;
  updatedAt: string;
  submitterName?: string;
}

export default function Reports() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  if (!user) return null;

  // Fetch reports based on user role
  const reportsUrl = user.role === 'resident' 
    ? `/api/reports/user/${user.id}` 
    : '/api/reports';

  const { data: reports = [], isLoading, error, refetch } = useQuery<Report[]>({
    queryKey: ['reports', user.id, user.role],
    queryFn: async () => {
      const res = await fetch(reportsUrl, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch reports');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-reports-title">
              {user.role === 'resident' ? 'My Reports' : 'All Reports'}
            </h1>
            <p className="text-muted-foreground">
              {user.role === 'resident' ? 'Track your submitted incident reports' : 'Manage and review incident reports'}
            </p>
          </div>
          <div className="flex gap-2">
            {user.role !== 'resident' && (
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                disabled={isLoading}
                data-testid="button-refresh"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            )}
            {user.role === 'resident' && (
              <Link href="/reports/new">
                <Button data-testid="button-new-report">
                  <Plus className="w-4 h-4 mr-2" />
                  New Report
                </Button>
              </Link>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="validation">For Validation</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[130px]" data-testid="select-priority">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
                <p className="font-medium">Loading reports...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-muted-foreground">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium text-destructive">Error loading reports</p>
                <p className="text-sm mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
                <Button variant="outline" onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.length > 0 ? (
                filteredReports.map(report => {
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
                      key={report.id}
                      className="p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
                      data-testid={`report-card-${report.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-semibold text-primary">{report.id}</span>
                            <Badge variant="outline" className="text-xs">{report.category}</Badge>
                            <Badge variant="outline" className={cn('text-xs', priorityClass)}>
                              {priorityLabels[report.priority]}
                            </Badge>
                            <Badge className={cn('text-xs', statusClass)}>
                              {statusLabels[report.status]}
                            </Badge>
                          </div>
                          <p className="text-sm line-clamp-2">{report.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {report.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {report.submittedAt 
                                ? format(new Date(report.submittedAt), 'MMM d, yyyy')
                                : 'N/A'}
                            </span>
                            {user.role !== 'resident' && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {report.submitterName || report.submittedBy}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link href={`/reports/${report.id}`}>
                          <Button variant="outline" size="sm" data-testid={`view-${report.id}`}>
                            View
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No reports found</p>
                  <p className="text-sm">Try adjusting your filters or search query</p>
                </div>
              )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
