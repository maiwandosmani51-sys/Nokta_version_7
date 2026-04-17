import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PageHeader, DataTable, FormModal, SearchFilterBar } from '@/shared/components/Common';
import { attendanceService } from '@/features/attendance/services/attendanceService';
import { normalizeRole } from '@/features/resources/config/modules';
import { useAuthStore } from '@/store/authStore';
import { useDebounce } from '@/hooks/useDebounce';
import { matchesSearch, sortCollection, type ListSortDirection, type ListSortField } from '@/utils/listSearchSort';

function getStatusBadge(status: string) {
  if (status === 'present' || status === 'online_auto_marked') {
    return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
  }
  if (status === 'absent') {
    return 'border-rose-400/30 bg-rose-500/10 text-rose-200';
  }
  if (status === 'late') {
    return 'border-amber-400/30 bg-amber-500/10 text-amber-100';
  }
  return 'border-slate-700 bg-slate-900/70 text-slate-300';
}

export function AttendancePage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const role = normalizeRole((user?.role as any) ?? null);
  const canManage = ['super_admin', 'admin', 'branch_manager', 'teacher'].includes(role ?? '');

  const locale = useMemo(() => {
    if (i18n.resolvedLanguage === 'fa') return 'fa-AF';
    if (i18n.resolvedLanguage === 'ps') return 'ps-AF';
    return 'en-US';
  }, [i18n.resolvedLanguage]);

  const [filters, setFilters] = useState({
    classId: '',
    status: '',
    session: '',
    date: ''
  });
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<ListSortField>('date');
  const [sortDirection, setSortDirection] = useState<ListSortDirection>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    classId: '',
    attendanceDate: new Date().toISOString().slice(0, 10),
    session: 'morning',
    status: 'present',
    notes: ''
  });
  const debouncedSearch = useDebounce(search, 300);

  const queryFilters = useMemo(() => {
    return Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) {
        acc[key as keyof typeof filters] = value;
      }
      return acc;
    }, {} as Record<string, string>);
  }, [filters]);

  const { data: summary, isLoading: summaryLoading, isError } = useQuery({
    queryKey: ['attendance-summary', queryFilters],
    queryFn: () => attendanceService.summary(queryFilters)
  });

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['attendance-records', queryFilters],
    queryFn: () => attendanceService.list(queryFilters)
  });

  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: ['attendance-options', role],
    queryFn: attendanceService.options
  });

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('attendance.all_statuses', { defaultValue: 'All statuses' }) },
      { value: 'present', label: t('attendance.present', { defaultValue: 'Present' }) },
      { value: 'absent', label: t('attendance.absent', { defaultValue: 'Absent' }) },
      { value: 'late', label: t('attendance.late', { defaultValue: 'Late' }) },
      { value: 'excused', label: t('attendance.excused', { defaultValue: 'Excused' }) },
      { value: 'online_auto_marked', label: t('attendance.online_auto_marked', { defaultValue: 'Online auto marked' }) }
    ],
    [t]
  );

  const sessionOptions = useMemo(
    () => [
      { value: '', label: t('attendance.all_sessions', { defaultValue: 'All sessions' }) },
      { value: 'morning', label: t('attendance.session_morning', { defaultValue: 'Morning' }) },
      { value: 'afternoon', label: t('attendance.session_afternoon', { defaultValue: 'Afternoon' }) },
      { value: 'evening', label: t('attendance.session_evening', { defaultValue: 'Evening' }) },
      { value: 'online', label: t('attendance.session_online', { defaultValue: 'Online' }) }
    ],
    [t]
  );

  const formStatusOptions = useMemo(() => statusOptions.filter((item) => item.value), [statusOptions]);
  const formSessionOptions = useMemo(() => sessionOptions.filter((item) => item.value), [sessionOptions]);
  const recordSortOptions = useMemo(
    () => [
      { value: 'name', label: t('common.sort_name', { defaultValue: 'Sort by Name' }) },
      { value: 'date', label: t('common.sort_date', { defaultValue: 'Sort by Date' }) }
    ],
    [t]
  );

  const createMutation = useMutation({
    mutationFn: attendanceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      setIsModalOpen(false);
      setFormError('');
      setFormData({
        studentId: '',
        classId: '',
        attendanceDate: new Date().toISOString().slice(0, 10),
        session: 'morning',
        status: 'present',
        notes: ''
      });
    },
    onError: (error: any) => {
      setFormError(error?.response?.data?.message ?? error?.message ?? t('attendance.record_error', { defaultValue: 'Unable to record attendance.' }));
    }
  });

  const classOptions = useMemo(() => {
    return [
      { value: '', label: t('attendance.all_classes', { defaultValue: 'All classes' }) },
      ...((options?.classes ?? []).map((item) => ({ value: item._id, label: item.className })))
    ];
  }, [options, t]);

  const studentOptions = useMemo(() => {
    return (options?.students ?? []).map((student) => ({
      value: student._id,
      label: student.className ? `${student.name} - ${student.className}` : student.name
    }));
  }, [options]);

  const columns = [
    {
      key: 'studentName',
      label: t('results.student', { defaultValue: 'Student' })
    },
    {
      key: 'className',
      label: t('students.class', { defaultValue: 'Class' })
    },
    {
      key: 'teacherName',
      label: t('students.teacher', { defaultValue: 'Teacher' })
    },
    {
      key: 'attendanceDate',
      label: t('common.date', { defaultValue: 'Date' }),
      render: (item: any) => new Date(item.attendanceDate).toLocaleDateString(locale)
    },
    {
      key: 'session',
      label: t('attendance.session', { defaultValue: 'Session' }),
      render: (item: any) => t(`attendance.session_${item.session}`, { defaultValue: String(item.session) })
    },
    {
      key: 'status',
      label: t('attendance.status', { defaultValue: 'Status' }),
      render: (item: any) => (
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs capitalize ${getStatusBadge(item.status)}`}>
          {t(`attendance.${item.status}`, { defaultValue: String(item.status).replace(/_/g, ' ') })}
        </span>
      )
    },
    {
      key: 'source',
      label: t('attendance.source', { defaultValue: 'Source' }),
      render: (item: any) => t(`attendance.source_${item.source}`, { defaultValue: String(item.source).replace(/_/g, ' ') })
    }
  ];

  const visibleRecords = useMemo(() => {
    const filtered = (records ?? []).filter((record) => matchesSearch(record, debouncedSearch));
    return sortCollection(filtered, sortField, sortDirection);
  }, [debouncedSearch, records, sortDirection, sortField]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="common.attendance"
        description={t('attendance.page_description', {
          defaultValue: 'Track daily attendance, filter by class or session, and review role-scoped attendance health.'
        })}
        actions={
          <div className="flex flex-wrap gap-3">
            {canManage && (
              <Button type="button" onClick={() => setIsModalOpen(true)}>
                {t('common.add_entity', { entity: t('common.attendance_record', { defaultValue: 'Attendance Record' }) })}
              </Button>
            )}
          </div>
        }
      />

      {isError && <Card className="p-6 text-rose-200">{t('attendance.load_error', { defaultValue: 'Unable to load attendance data.' })}</Card>}

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">{t('common.class', { defaultValue: 'Class' })}</label>
            <Select value={filters.classId} options={classOptions} placeholder={t('attendance.all_classes', { defaultValue: 'All classes' })} onChange={(value) => setFilters((current) => ({ ...current, classId: String(value) }))} />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">{t('attendance.status', { defaultValue: 'Status' })}</label>
            <Select value={filters.status} options={statusOptions} placeholder={t('attendance.all_statuses', { defaultValue: 'All statuses' })} onChange={(value) => setFilters((current) => ({ ...current, status: String(value) }))} />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">{t('attendance.session', { defaultValue: 'Session' })}</label>
            <Select value={filters.session} options={sessionOptions} placeholder={t('attendance.all_sessions', { defaultValue: 'All sessions' })} onChange={(value) => setFilters((current) => ({ ...current, session: String(value) }))} />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">{t('common.date', { defaultValue: 'Date' })}</label>
            <Input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setFilters({ classId: '', status: '', session: '', date: '' })}
          >
            {t('attendance.clear_filters', { defaultValue: 'Clear Filters' })}
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="p-6"><p className="text-sm text-slate-400">{t('attendance.total_records', { defaultValue: 'Total Records' })}</p><p className="mt-3 text-3xl font-semibold text-white">{summaryLoading ? '...' : summary?.totalRecords ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">{t('attendance.present', { defaultValue: 'Present' })}</p><p className="mt-3 text-3xl font-semibold text-white">{summaryLoading ? '...' : summary?.present ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">{t('attendance.absent', { defaultValue: 'Absent' })}</p><p className="mt-3 text-3xl font-semibold text-white">{summaryLoading ? '...' : summary?.absent ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">{t('attendance.late', { defaultValue: 'Late' })}</p><p className="mt-3 text-3xl font-semibold text-white">{summaryLoading ? '...' : summary?.late ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">{t('attendance.students_covered', { defaultValue: 'Students Covered' })}</p><p className="mt-3 text-3xl font-semibold text-white">{summaryLoading ? '...' : summary?.studentCount ?? 0}</p></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('attendance.attendance_trend', { defaultValue: 'Attendance Trend' })}</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.recentTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={3} />
                <Line type="monotone" dataKey="absent" stroke="#fb7185" strokeWidth={3} />
                <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('attendance.session_breakdown', { defaultValue: 'Session Breakdown' })}</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.bySession ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="session" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="total" fill="#38bdf8" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('attendance.records_title', { defaultValue: 'Attendance Records' })}</p>
        <div className="mt-4 space-y-4">
          <SearchFilterBar
            value={search}
            onChange={setSearch}
            placeholder={t('common.search_placeholder', { entity: t('attendance.records_title', { defaultValue: 'Attendance Records' }) })}
            createVisible={false}
            extraActions={
              <>
                <div className="w-full sm:w-56">
                  <Select
                    value={sortField}
                    options={recordSortOptions}
                    placeholder={t('common.sort', { defaultValue: 'Sort' })}
                    onChange={(value) => setSortField(String(value) as ListSortField)}
                  />
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}>
                  <ArrowUpDown className="h-4 w-4" />
                  {t(sortDirection === 'asc' ? 'common.ascending' : 'common.descending', {
                    defaultValue: sortDirection === 'asc' ? 'ASC' : 'DESC'
                  })}
                </Button>
              </>
            }
          />
          {recordsLoading ? (
            <div className="text-slate-400">{t('attendance.loading_records', { defaultValue: 'Loading attendance records...' })}</div>
          ) : !visibleRecords.length ? (
            <div className="text-slate-400">{t('common.no_records_found', { defaultValue: 'No attendance records found.' })}</div>
          ) : (
            <DataTable columns={columns} items={visibleRecords} />
          )}
        </div>
      </Card>

      {isModalOpen && canManage && (
        <FormModal
          open={isModalOpen}
          title={t('attendance.record_attendance', { defaultValue: 'Record Attendance' })}
          onClose={() => {
            setIsModalOpen(false);
            setFormError('');
          }}
          onSubmit={(event) => {
            event.preventDefault();

            if (!formData.studentId || !formData.classId || !formData.attendanceDate) {
              setFormError(t('attendance.required_fields', { defaultValue: 'Student, class, and attendance date are required.' }));
              return;
            }

            createMutation.mutate({
              studentId: formData.studentId,
              classId: formData.classId,
              attendanceDate: formData.attendanceDate,
              session: formData.session,
              status: formData.status,
              notes: formData.notes,
              source: 'web'
            });
          }}
          submitLabel={t('attendance.save_attendance', { defaultValue: 'Save Attendance' })}
          loading={createMutation.isPending}
        >
          {formError && <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-200">{formError}</div>}

          <div>
            <label className="mb-1 block text-sm text-slate-300">{t('common.student', { defaultValue: 'Student' })}</label>
            <Select
              value={formData.studentId}
              options={studentOptions}
              placeholder={optionsLoading ? t('attendance.loading_students', { defaultValue: 'Loading students...' }) : t('attendance.select_student', { defaultValue: 'Select student' })}
              onChange={(value) => {
                const studentId = String(value);
                const selectedStudent = (options?.students ?? []).find((item) => item._id === studentId);
                setFormData((current) => ({
                  ...current,
                  studentId,
                  classId: selectedStudent?.classId ?? current.classId
                }));
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">{t('common.class', { defaultValue: 'Class' })}</label>
            <Select
              value={formData.classId}
              options={(options?.classes ?? []).map((item) => ({ value: item._id, label: item.className }))}
              placeholder={optionsLoading ? t('attendance.loading_classes', { defaultValue: 'Loading classes...' }) : t('attendance.select_class', { defaultValue: 'Select class' })}
              onChange={(value) => setFormData((current) => ({ ...current, classId: String(value) }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-slate-300">{t('common.date', { defaultValue: 'Date' })}</label>
              <Input type="date" value={formData.attendanceDate} onChange={(event) => setFormData((current) => ({ ...current, attendanceDate: event.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">{t('attendance.session', { defaultValue: 'Session' })}</label>
              <Select value={formData.session} options={formSessionOptions} onChange={(value) => setFormData((current) => ({ ...current, session: String(value) }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">{t('attendance.status', { defaultValue: 'Status' })}</label>
              <Select value={formData.status} options={formStatusOptions} onChange={(value) => setFormData((current) => ({ ...current, status: String(value) }))} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">{t('attendance.notes', { defaultValue: 'Notes' })}</label>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none backdrop-blur-sm transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </FormModal>
      )}
    </div>
  );
}
