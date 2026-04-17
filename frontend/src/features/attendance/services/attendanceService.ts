import { api } from '@/services/apiClient';

export interface AttendanceFilters {
  classId?: string;
  studentId?: string;
  status?: string;
  session?: string;
  date?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface AttendanceRecord {
  _id: string;
  studentId?: string;
  classId?: string;
  teacherId?: string;
  studentName: string;
  className: string;
  teacherName: string;
  attendanceDate: string;
  session: string;
  status: string;
  source: string;
  notes?: string;
}

export interface AttendanceSummary {
  totalRecords: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  onlineAutoMarked: number;
  studentCount: number;
  classCount: number;
  byStatus: Array<{ status: string; total: number }>;
  bySession: Array<{ session: string; total: number }>;
  recentTrend: Array<{ date: string; present: number; absent: number; late: number }>;
}

export interface AttendanceOptions {
  students: Array<{ _id: string; name: string; classId?: string; className?: string }>;
  classes: Array<{ _id: string; className: string }>;
}

export const attendanceService = {
  list: (params: AttendanceFilters = {}) =>
    api.get('/attendance', { params: { limit: 100, ...params } }).then((res) => res.data.data as AttendanceRecord[]),
  summary: (params: AttendanceFilters = {}) =>
    api.get('/attendance/summary', { params }).then((res) => res.data.data as AttendanceSummary),
  options: () =>
    api.get('/attendance/options').then((res) => res.data.data as AttendanceOptions),
  create: (payload: {
    studentId: string;
    classId: string;
    attendanceDate: string;
    session: string;
    status: string;
    notes?: string;
    source?: string;
  }) => api.post('/attendance', payload).then((res) => res.data.data as AttendanceRecord)
};
