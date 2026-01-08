export type UserRole = 'resident' | 'official' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  position?: string;
  contact?: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

export interface Report {
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
  additionalInfo?: {
    message: string;
    images: string[];
    respondedAt: string;
  }[];
}

export interface Memo {
  id: string;
  title: string;
  description: string;
  category: 'memo' | 'ordinance';
  issuedBy: string;
  effectiveDate: string;
  status: 'pending' | 'approved' | 'rejected';
  fileUrl?: string;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  affectedData: string;
  timestamp: string;
  module: string;
}

export const mockUsers: User[] = [
  { id: '1', name: 'Juan Dela Cruz', email: 'juan@example.com', role: 'resident', contact: '09171234567', status: 'active' },
  { id: '2', name: 'Maria Santos', email: 'maria@example.com', role: 'resident', contact: '09181234567', status: 'active' },
  { id: '3', name: 'Pedro Reyes', email: 'pedro@brgy.gov.ph', role: 'official', position: 'Barangay Kagawad', contact: '09191234567', status: 'active' },
  { id: '4', name: 'Ana Garcia', email: 'ana@brgy.gov.ph', role: 'official', position: 'Barangay Secretary', contact: '09201234567', status: 'active' },
  { id: '5', name: 'Jose Rizal', email: 'admin@brgy.gov.ph', role: 'admin', position: 'Barangay Captain', contact: '09211234567', status: 'active' },
];

export const mockReports: Report[] = [
  {
    id: 'RPT-2026-001',
    category: 'Road Concern',
    description: 'Large pothole on Main Street near the basketball court causing traffic hazards.',
    priority: 'high',
    location: 'Main Street, Zone 3',
    status: 'in_progress',
    images: [],
    submittedBy: 'Juan Dela Cruz',
    submittedAt: '2026-01-05T08:30:00Z',
    updatedAt: '2026-01-06T14:00:00Z',
  },
  {
    id: 'RPT-2026-002',
    category: 'Waste Management',
    description: 'Uncollected garbage for 3 days at Purok 5. Starting to attract pests.',
    priority: 'medium',
    location: 'Purok 5, Zone 2',
    status: 'reviewed',
    images: [],
    submittedBy: 'Maria Santos',
    submittedAt: '2026-01-06T10:15:00Z',
    updatedAt: '2026-01-07T09:00:00Z',
  },
  {
    id: 'RPT-2026-003',
    category: 'Crime',
    description: 'Suspicious individuals loitering near the elementary school during evening hours.',
    priority: 'critical',
    location: 'Elementary School Area, Zone 1',
    status: 'submitted',
    images: [],
    submittedBy: 'Juan Dela Cruz',
    submittedAt: '2026-01-07T19:45:00Z',
    updatedAt: '2026-01-07T19:45:00Z',
  },
  {
    id: 'RPT-2026-004',
    category: 'Health',
    description: 'Stagnant water breeding mosquitoes in vacant lot.',
    priority: 'medium',
    location: 'Vacant Lot, Zone 4',
    status: 'validation',
    images: [],
    submittedBy: 'Maria Santos',
    submittedAt: '2026-01-04T11:00:00Z',
    updatedAt: '2026-01-07T16:30:00Z',
  },
  {
    id: 'RPT-2026-005',
    category: 'Infrastructure',
    description: 'Broken streetlight making the area dark and unsafe at night.',
    priority: 'low',
    location: 'Corner Street, Zone 3',
    status: 'resolved',
    images: [],
    submittedBy: 'Juan Dela Cruz',
    submittedAt: '2026-01-02T07:00:00Z',
    updatedAt: '2026-01-05T10:00:00Z',
  },
];

export const mockMemos: Memo[] = [
  {
    id: 'MEM-2026-001',
    title: 'Community Clean-Up Drive Schedule',
    description: 'All residents are encouraged to participate in the monthly clean-up drive every last Saturday of the month.',
    category: 'memo',
    issuedBy: 'Jose Rizal',
    effectiveDate: '2026-01-25',
    status: 'approved',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'ORD-2026-001',
    title: 'Curfew Hours for Minors',
    description: 'Minors below 18 years old must be accompanied by adults after 10:00 PM.',
    category: 'ordinance',
    issuedBy: 'Jose Rizal',
    effectiveDate: '2026-01-01',
    status: 'approved',
    createdAt: '2025-12-20T00:00:00Z',
  },
  {
    id: 'MEM-2026-002',
    title: 'Water Interruption Notice',
    description: 'Scheduled water interruption on January 15, 2026 from 8AM to 5PM for pipe maintenance.',
    category: 'memo',
    issuedBy: 'Ana Garcia',
    effectiveDate: '2026-01-15',
    status: 'pending',
    createdAt: '2026-01-08T00:00:00Z',
  },
];

export const mockLogs: LogEntry[] = [
  { id: '1', userId: '5', userName: 'Jose Rizal', role: 'admin', action: 'Updated report status', affectedData: 'Report RPT-2026-001 to In Progress', timestamp: '2026-01-06T14:00:00Z', module: 'Reports' },
  { id: '2', userId: '3', userName: 'Pedro Reyes', role: 'official', action: 'Reviewed report', affectedData: 'Report RPT-2026-002', timestamp: '2026-01-07T09:00:00Z', module: 'Reports' },
  { id: '3', userId: '5', userName: 'Jose Rizal', role: 'admin', action: 'Approved memo', affectedData: 'Memo MEM-2026-001', timestamp: '2026-01-05T10:00:00Z', module: 'Memos' },
  { id: '4', userId: '1', userName: 'Juan Dela Cruz', role: 'resident', action: 'Submitted report', affectedData: 'Report RPT-2026-003', timestamp: '2026-01-07T19:45:00Z', module: 'Reports' },
  { id: '5', userId: '4', userName: 'Ana Garcia', role: 'official', action: 'Created memo request', affectedData: 'Memo MEM-2026-002', timestamp: '2026-01-08T08:00:00Z', module: 'Memos' },
];

export const categories = [
  'Crime',
  'Road Concern',
  'Waste Management',
  'Health',
  'Infrastructure',
  'Noise Complaint',
  'Flooding',
  'Fire Hazard',
  'Other',
];

export const statusLabels: Record<Report['status'], string> = {
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  in_progress: 'In Progress',
  validation: 'For Validation',
  resolved: 'Resolved',
};

export const priorityLabels: Record<Report['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};
