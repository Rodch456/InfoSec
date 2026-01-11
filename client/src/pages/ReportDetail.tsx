import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/authContext';
import { statusLabels, priorityLabels } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRoute, Link } from 'wouter';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Clock,
  MessageSquare,
  Send,
  Camera,
  X,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Report {
  id: string;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  status: 'submitted' | 'reviewed' | 'in_progress' | 'validation' | 'resolved';
  images: string[];
  additionalInfo?: string;
  additionalInfoImages?: string[];
  adminFeedback?: string;
  submittedBy: string;
  submittedAt: string;
  updatedAt: string;
  submitterName?: string;
}

interface ReportMessage {
  id: string;
  reportId: string;
  senderId: string;
  senderRole: 'resident' | 'official' | 'admin';
  message: string;
  images: string[];
  createdAt: string;
  senderName?: string;
}

export default function ReportDetail() {
  const { user } = useAuth();
  const [, params] = useRoute('/reports/:id');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newStatus, setNewStatus] = useState('');
  const [inquiry, setInquiry] = useState('');
  const [response, setResponse] = useState('');
  const [responseImages, setResponseImages] = useState<string[]>([]);

  // Fetch report from API
  const { data: report, isLoading, error } = useQuery<Report>({
    queryKey: ['report', params?.id],
    queryFn: async () => {
      if (!params?.id) throw new Error('Report ID required');
      const res = await fetch(`/api/reports/${params.id}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Report not found');
        throw new Error('Failed to fetch report');
      }
      return res.json();
    },
    enabled: !!params?.id,
  });

  // Fetch messages for the report
  const { data: messages = [], refetch: refetchMessages } = useQuery<ReportMessage[]>({
    queryKey: ['report-messages', params?.id],
    queryFn: async () => {
      if (!params?.id) throw new Error('Report ID required');
      const res = await fetch(`/api/reports/${params.id}/messages`, {
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error('Failed to fetch messages');
      }
      return res.json();
    },
    enabled: !!params?.id,
  });

  if (!user || !params) return null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !report) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error instanceof Error ? error.message : 'Report not found'}</p>
          <Link href="/reports">
            <Button variant="link" className="mt-4">Back to Reports</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

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

  const canUpdateStatus = user.role === 'admin' || user.role === 'official';
  const canRequestInfo = user.role === 'admin' || user.role === 'official';
  const canRespond = user.role === 'resident' && report.submittedBy === user.id;

  const handleStatusUpdate = async () => {
    if (!newStatus || !report) return;

    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['report', report.id] });
      await queryClient.invalidateQueries({ queryKey: ['reports'] });

      toast({
        title: 'Status updated',
        description: `Report status changed to ${statusLabels[newStatus as keyof typeof statusLabels]}`,
      });
      setNewStatus('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSendInquiry = async () => {
    if (!inquiry.trim()) return;

    try {
      const res = await fetch(`/api/reports/${report?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'validation',
          adminFeedback: inquiry,
          senderRole: user.role,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send inquiry: ${res.statusText}`);
      }

      await queryClient.invalidateQueries({ queryKey: ['report', report?.id] });
      await refetchMessages();

      toast({
        title: 'Inquiry sent',
        description: 'The resident will be notified to provide more information.',
      });
      setInquiry('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send inquiry.';
      console.error('Error sending inquiry:', error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleCaptureImage = () => {
    if (responseImages.length >= 5) {
      toast({
        title: 'Maximum images reached',
        description: 'You can only upload up to 5 images.',
        variant: 'destructive',
      });
      return;
    }
    const mockImage = `https://picsum.photos/seed/${Date.now()}/400/300`;
    setResponseImages([...responseImages, mockImage]);
  };

  const handleSubmitResponse = async () => {
    if (!response.trim()) return;

    try {
      const res = await fetch(`/api/reports/${report?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'reviewed',
          additionalInfo: response,
          additionalInfoImages: responseImages,
          senderRole: user.role,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to submit response: ${res.statusText}`);
      }

      await queryClient.invalidateQueries({ queryKey: ['report', report?.id] });
      await refetchMessages();

      toast({
        title: 'Response submitted',
        description: 'Your additional information has been sent.',
      });
      setResponse('');
      setResponseImages([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit response.';
      console.error('Error submitting response:', error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono" data-testid="text-report-id">{report.id}</h1>
              <Badge className={cn('text-sm', statusClass)}>{statusLabels[report.status]}</Badge>
              <Badge variant="outline" className={cn('text-sm', priorityClass)}>
                {priorityLabels[report.priority]}
              </Badge>
            </div>
            <p className="text-muted-foreground">{report.category}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Incident Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{report.description}</p>

                {Array.isArray(report.images) && report.images.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium mb-3">Photo Evidence</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {report.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                          <img
                            src={img}
                            alt={`Evidence ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{report.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{report.submitterName || report.submittedBy}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Submitted {format(new Date(report.submittedAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Updated {format(new Date(report.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversation Thread */}
            {messages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Conversation History
                  </CardTitle>
                  <CardDescription>All requests and responses between admin and resident</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isAdmin = msg.senderRole === 'admin' || msg.senderRole === 'official';
                      const isFromCurrentUser = msg.senderId === user.id;
                      
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "p-4 rounded-lg border",
                            isAdmin
                              ? "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                              : "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={isAdmin ? "default" : "secondary"}>
                                {isAdmin ? (msg.senderRole === 'admin' ? 'Admin' : 'Official') : 'Resident'}
                              </Badge>
                              <span className="text-sm font-medium">{msg.senderName || msg.senderId}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.createdAt), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed mb-3">{msg.message}</p>
                          {Array.isArray(msg.images) && msg.images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                              {msg.images.map((img, idx) => (
                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                                  <img
                                    src={img}
                                    alt={`Attachment ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show admin feedback to residents if exists and no messages yet */}
            {canRespond && report.adminFeedback && messages.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Request for Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg border bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                    <p className="text-sm leading-relaxed">{report.adminFeedback}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show additional info to admins if exists and no messages yet */}
            {canRequestInfo && report.additionalInfo && messages.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Additional Information from Resident
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg border bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
                      <p className="text-sm leading-relaxed">{report.additionalInfo}</p>
                    </div>
                    {Array.isArray(report.additionalInfoImages) && report.additionalInfoImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {report.additionalInfoImages.map((img, idx) => (
                          <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                            <img
                              src={img}
                              alt={`Attachment ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {canUpdateStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Update Status</CardTitle>
                  <CardDescription>Change the status of this report</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="flex-1" data-testid="select-new-status">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="validation">For Validation</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleStatusUpdate} disabled={!newStatus} data-testid="button-update-status">
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {canRequestInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Request Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Ask the resident for more details..."
                      value={inquiry}
                      onChange={(e) => setInquiry(e.target.value)}
                      rows={3}
                      data-testid="input-inquiry"
                    />
                    <Button onClick={handleSendInquiry} disabled={!inquiry.trim()} data-testid="button-send-inquiry">
                      <Send className="w-4 h-4 mr-2" />
                      Send Inquiry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {canRespond && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Provide Additional Information</CardTitle>
                  <CardDescription>Respond to requests from barangay officials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Add more details about the incident..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={3}
                      data-testid="input-response"
                    />
                    <div className="flex flex-wrap gap-2">
                      {responseImages.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setResponseImages(responseImages.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                      {responseImages.length < 5 && (
                        <button
                          onClick={handleCaptureImage}
                          className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          data-testid="button-add-image"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <Button onClick={handleSubmitResponse} disabled={!response.trim()} data-testid="button-submit-response">
                      <Send className="w-4 h-4 mr-2" />
                      Submit Response
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="text-sm font-medium">{statusLabels[report.status]}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(report.updatedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 mt-2" />
                    <div>
                      <p className="text-sm font-medium">Submitted</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(report.submittedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{report.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <Badge variant="outline" className={priorityClass}>
                    {priorityLabels[report.priority]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Images</span>
                  <span>{Array.isArray(report.images) ? report.images.length : 0} attached</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
