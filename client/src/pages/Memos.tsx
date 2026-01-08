import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/authContext';
import { mockMemos } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ScrollText, FileText, Calendar, User, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Memos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMemo, setNewMemo] = useState({
    title: '',
    description: '',
    category: '',
    effectiveDate: '',
  });

  if (!user) return null;

  const canCreate = user.role === 'admin' || user.role === 'official';
  const canApprove = user.role === 'admin';

  const displayMemos = user.role === 'resident'
    ? mockMemos.filter(m => m.status === 'approved')
    : mockMemos;

  const filteredMemos = displayMemos.filter(memo => {
    const matchesSearch = memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'memo' && memo.category === 'memo') ||
      (activeTab === 'ordinance' && memo.category === 'ordinance') ||
      (activeTab === 'pending' && memo.status === 'pending');
    return matchesSearch && matchesTab;
  });

  const handleCreate = () => {
    if (!newMemo.title || !newMemo.description || !newMemo.category) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const action = user.role === 'admin' ? 'published' : 'submitted for approval';
    toast({
      title: `${newMemo.category === 'memo' ? 'Memo' : 'Ordinance'} ${action}`,
      description: user.role === 'admin'
        ? 'The document is now visible to all residents.'
        : 'An admin will review your submission.',
    });
    setIsCreateOpen(false);
    setNewMemo({ title: '', description: '', category: '', effectiveDate: '' });
  };

  const handleApprove = (id: string) => {
    toast({ title: 'Document approved', description: 'The document is now visible to residents.' });
  };

  const handleReject = (id: string) => {
    toast({ title: 'Document rejected', description: 'The submitter will be notified.' });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-memos-title">Memos & Ordinances</h1>
            <p className="text-muted-foreground">
              {user.role === 'resident'
                ? 'Official announcements from your barangay'
                : 'Manage and publish official documents'}
            </p>
          </div>
          {canCreate && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-memo">
                  <Plus className="w-4 h-4 mr-2" />
                  {user.role === 'admin' ? 'Publish Document' : 'Request Upload'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {user.role === 'admin' ? 'Publish New Document' : 'Request Document Upload'}
                  </DialogTitle>
                  <DialogDescription>
                    {user.role === 'admin'
                      ? 'This will be immediately visible to all residents.'
                      : 'Your request will be reviewed by an admin.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Document Type *</Label>
                    <Select
                      value={newMemo.category}
                      onValueChange={(v) => setNewMemo({ ...newMemo, category: v })}
                    >
                      <SelectTrigger data-testid="select-memo-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="memo">Memo</SelectItem>
                        <SelectItem value="ordinance">Ordinance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={newMemo.title}
                      onChange={(e) => setNewMemo({ ...newMemo, title: e.target.value })}
                      placeholder="Document title"
                      data-testid="input-memo-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea
                      value={newMemo.description}
                      onChange={(e) => setNewMemo({ ...newMemo, description: e.target.value })}
                      placeholder="Document content or summary"
                      rows={4}
                      data-testid="input-memo-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Effective Date</Label>
                    <Input
                      type="date"
                      value={newMemo.effectiveDate}
                      onChange={(e) => setNewMemo({ ...newMemo, effectiveDate: e.target.value })}
                      data-testid="input-memo-date"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} data-testid="button-submit-memo">
                      {user.role === 'admin' ? 'Publish' : 'Submit Request'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="memo">Memos</TabsTrigger>
                  <TabsTrigger value="ordinance">Ordinances</TabsTrigger>
                  {canApprove && <TabsTrigger value="pending">Pending</TabsTrigger>}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMemos.length > 0 ? (
                filteredMemos.map(memo => {
                  const Icon = memo.category === 'memo' ? FileText : ScrollText;
                  const statusColor = {
                    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                  }[memo.status];

                  return (
                    <div
                      key={memo.id}
                      className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                      data-testid={`memo-card-${memo.id}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className="capitalize text-xs">
                              {memo.category}
                            </Badge>
                            {user.role !== 'resident' && (
                              <Badge className={cn('text-xs', statusColor)}>
                                {memo.status}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold mb-1">{memo.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {memo.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Effective: {format(new Date(memo.effectiveDate), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {memo.issuedBy}
                            </span>
                          </div>
                        </div>
                        {canApprove && memo.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApprove(memo.id)}
                              data-testid={`approve-${memo.id}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(memo.id)}
                              data-testid={`reject-${memo.id}`}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No documents found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
