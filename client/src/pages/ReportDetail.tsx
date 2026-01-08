import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/authContext';
import { mockReports, statusLabels, priorityLabels } from '@/lib/mockData';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function ReportDetail() {
  const { user } = useAuth();
  const [, params] = useRoute('/reports/:id');
  const { toast } = useToast();

  const [newStatus, setNewStatus] = useState('');
  const [inquiry, setInquiry] = useState('');
  const [response, setResponse] = useState('');
  const [responseImages, setResponseImages] = useState<string[]>([]);

  if (!user || !params) return null;

  const report = mockReports.find(r => r.id === params.id);

  if (!report) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Report not found</p>
          <Link href="/reports">
            <Button variant="link">Back to Reports</Button>
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
  const canRequestInfo = user.role === 'admin';
  const canRespond = user.role === 'resident' && report.submittedBy === user.name;

  const handleStatusUpdate = () => {
    if (!newStatus) return;
    toast({
      title: 'Status updated',
      description: `Report status changed to ${statusLabels[newStatus as keyof typeof statusLabels]}`,
    });
    setNewStatus('');
  };

  const handleSendInquiry = () => {
    if (!inquiry.trim()) return;
    toast({
      title: 'Inquiry sent',
      description: 'The resident will be notified to provide more information.',
    });
    setInquiry('');
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

  const handleSubmitResponse = () => {
    if (!response.trim()) return;
    toast({
      title: 'Response submitted',
      description: 'Your additional information has been sent.',
    });
    setResponse('');
    setResponseImages([]);
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

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{report.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{report.submittedBy}</span>
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
                  <span>{report.images.length} attached</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
