import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/authContext';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Download, Filter, Clock, User, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Redirect } from 'wouter';

interface SystemLog {
  id: string;
  userId?: string;
  userName?: string;
  userRole?: 'resident' | 'official' | 'admin';
  action: string;
  affectedData?: string;
  module?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export default function Logs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  if (!user || user.role !== 'admin') {
    return <Redirect to="/dashboard" />;
  }

  // Build query params
  const queryParams = new URLSearchParams();
  if (roleFilter !== 'all') queryParams.set('role', roleFilter);
  if (moduleFilter !== 'all') queryParams.set('module', moduleFilter);
  if (searchQuery) queryParams.set('search', searchQuery);
  queryParams.set('limit', '1000'); // Get more logs

  const { data: logs = [], isLoading, error, refetch } = useQuery<SystemLog[]>({
    queryKey: ['system-logs', roleFilter, moduleFilter, searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/logs?${queryParams.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch logs');
      }
      return res.json();
    },
  });

  // Client-side filtering for search (since API already filters)
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(searchLower) ||
      log.userName?.toLowerCase().includes(searchLower) ||
      log.affectedData?.toLowerCase().includes(searchLower) ||
      log.module?.toLowerCase().includes(searchLower)
    );
  });

  const handleExport = (format: 'csv' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}`,
      description: 'Your download will start shortly.',
    });
  };

  const modules = Array.from(new Set(logs.map(l => l.module).filter(Boolean)));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-logs-title">System Logs</h1>
            <p className="text-muted-foreground">Track all system activities and actions</p>
          </div>
          <div className="flex gap-2">
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{logs.length}</p>
                  <p className="text-xs text-muted-foreground">Total Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-xl font-bold">{logs.filter(l => l.userRole === 'admin').length}</p>
                  <p className="text-xs text-muted-foreground">Admin Actions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-xl font-bold">{logs.filter(l => l.userRole === 'official').length}</p>
                  <p className="text-xs text-muted-foreground">Official Actions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-chart-4" />
                </div>
                <div>
                  <p className="text-xl font-bold">Today</p>
                  <p className="text-xs text-muted-foreground">Last Activity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[130px]" data-testid="select-role">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="official">Official</SelectItem>
                    <SelectItem value="resident">Resident</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger className="w-[130px]" data-testid="select-module">
                    <SelectValue placeholder="Module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    {modules.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
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
                <p className="font-medium">Loading logs...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-muted-foreground">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium text-destructive">Error loading logs</p>
                <p className="text-sm mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
                <Button variant="outline" onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map(log => (
                      <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">{log.userName || 'System'}</TableCell>
                        <TableCell>
                          {log.userRole && (
                            <Badge variant="outline" className="capitalize text-xs">
                              {log.userRole}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>
                          {log.module && (
                            <Badge variant="secondary" className="text-xs">
                              {log.module}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={log.affectedData || ''}>
                          {log.affectedData || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.ipAddress || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No logs found matching your filters</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
