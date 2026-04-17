import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  Home,
  Layers,
  Receipt,
  ShieldCheck,
  UserCheck,
  Users
} from 'lucide-react';

export type EnterpriseRole =
  | 'super_admin'
  | 'admin'
  | 'teacher'
  | 'student'
  | 'parent'
  | 'owner'
  | 'branch_manager'
  | 'system_automation';

export type LegacyRole = 'family_student' | 'accountant' | 'librarian' | 'user';
export type Role = EnterpriseRole | LegacyRole;

const roleAliasMap: Record<LegacyRole, EnterpriseRole> = {
  family_student: 'parent',
  accountant: 'admin',
  librarian: 'branch_manager',
  user: 'student'
};

export function normalizeRole(role: Role | null | undefined): EnterpriseRole | null {
  if (!role) return null;
  if (role in roleAliasMap) {
    return roleAliasMap[role as LegacyRole];
  }
  return role as EnterpriseRole;
}

const coreRoles: EnterpriseRole[] = ['super_admin', 'admin', 'teacher', 'student', 'parent', 'owner', 'branch_manager', 'system_automation'];

export interface ModuleField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'subjectList' | 'file';
  required?: boolean;
  options?: { value: string; label: string }[];
  optionsEndpoint?: string;
  optionLabelKey?: string;
  optionValueKey?: string;
  multiple?: boolean;
  placeholder?: string;
  hiddenOnEdit?: boolean;
}

export interface ModuleListField {
  key: string;
  label: string;
  width?: string;
}

export interface ModuleAction {
  label: string;
  patchData: Record<string, any>;
  roles: Role[];
  visibleWhen?: (item: any) => boolean;
}

export interface SummaryCard {
  label: string;
  key: string;
  prefix?: string;
}

export interface ModuleConfig {
  path: string;
  title: string;
  entity: string;
  endpoint: string;
  description?: string;
  fields: ModuleField[];
  listFields: ModuleListField[];
  searchField?: string;
  permissions: {
    view: Role[];
    create?: Role[];
    edit?: Role[];
    delete?: Role[];
  };
  createEndpoint?: string;
  disableEdit?: boolean;
  disableDelete?: boolean;
  type?: 'crud' | 'summary';
  summaryCards?: SummaryCard[];
  actions?: ModuleAction[];
}

const roleOptions = [
  { value: 'super_admin', label: 'common.super_admin' },
  { value: 'admin', label: 'common.admin' },
  { value: 'teacher', label: 'common.teacher' },
  { value: 'student', label: 'common.student' },
  { value: 'parent', label: 'common.parent' },
  { value: 'owner', label: 'common.owner' },
  { value: 'branch_manager', label: 'common.branch_manager' },
  { value: 'system_automation', label: 'common.system_automation' }
];

export const modulesConfig: Record<string, ModuleConfig> = {
  branches: {
    path: '/branches',
    title: 'common.branches',
    entity: 'common.branch',
    endpoint: '/branches',
    fields: [
      { name: 'name', label: 'common.name', type: 'text', required: true },
      { name: 'code', label: 'common.code', type: 'text', required: true, hiddenOnEdit: true },
      { name: 'city', label: 'common.city', type: 'text' },
      { name: 'phone', label: 'common.phone', type: 'text' },
      { name: 'managerId', label: 'common.branch_manager', type: 'select', optionsEndpoint: '/branches/manager-options', optionLabelKey: 'name', optionValueKey: '_id' }
    ],
    listFields: [
      { key: 'name', label: 'common.name' },
      { key: 'code', label: 'common.code' },
      { key: 'city', label: 'common.city' },
      { key: 'phone', label: 'common.phone' },
      { key: 'managerName', label: 'common.branch_manager' }
    ],
    searchField: 'name',
    permissions: {
      view: ['super_admin', 'admin', 'owner', 'branch_manager'],
      create: ['super_admin', 'admin', 'owner'],
      edit: ['super_admin', 'admin', 'owner', 'branch_manager'],
      delete: ['super_admin']
    }
  },
  users: {
    path: '/users',
    title: 'common.users',
    entity: 'common.user',
    endpoint: '/users',
    fields: [
      { name: 'name', label: 'common.full_name', type: 'text', required: true },
      { name: 'email', label: 'common.email_address', type: 'email', required: true },
      { name: 'password', label: 'common.password', type: 'password', required: true, hiddenOnEdit: true },
      { name: 'role', label: 'common.role', type: 'select', required: true, options: roleOptions }
    ],
    listFields: [
      { key: 'name', label: 'common.name', width: '35%' },
      { key: 'email', label: 'common.email', width: '35%' },
      { key: 'role', label: 'common.role', width: '30%' }
    ],
    searchField: 'name',
    permissions: {
      view: ['super_admin'],
      create: ['super_admin'],
      edit: ['super_admin'],
      delete: ['super_admin']
    }
  },
  students: {
    path: '/students',
    title: 'common.students',
    entity: 'common.student',
    endpoint: '/students',
    fields: [
      { name: 'firstName', label: 'students.first_name', type: 'text', required: true },
      { name: 'lastName', label: 'students.last_name', type: 'text', required: true },
      { name: 'fatherName', label: 'students.father_name', type: 'text', required: true },
      { name: 'familyPhone', label: 'students.guardian_phone', type: 'text', required: true },
      { name: 'gender', label: 'students.gender', type: 'select', required: true, options: [
        { value: 'male', label: 'students.gender_male' },
        { value: 'female', label: 'students.gender_female' },
        { value: 'other', label: 'students.gender_other' }
      ] },
      { name: 'classId', label: 'students.class', type: 'select', required: true, optionsEndpoint: '/classes', optionLabelKey: 'className', optionValueKey: '_id' },
      { name: 'subjectId', label: 'students.subject', type: 'select', required: true, optionsEndpoint: '/subjects', optionLabelKey: 'title', optionValueKey: '_id' },
      { name: 'teacherId', label: 'students.teacher', type: 'select', required: true, optionsEndpoint: '/teachers', optionLabelKey: 'name', optionValueKey: '_id' },
      { name: 'feeAmount', label: 'students.fee_amount', type: 'number', required: true },
      { name: 'paidAmount', label: 'students.paid_amount', type: 'number' },
      { name: 'registrationExpiryDate', label: 'common.date', type: 'date' },
      { name: 'status', label: 'common.status', type: 'select', options: [
        { value: 'active', label: 'common.active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'graduated', label: 'Graduated' }
      ] }
    ],
    listFields: [
      { key: 'firstName', label: 'students.first_name' },
      { key: 'lastName', label: 'students.last_name' },
      { key: 'gender', label: 'students.gender' },
      { key: 'className', label: 'students.class_name' },
      { key: 'teacherName', label: 'students.teacher_name' }
    ],
    searchField: 'firstName',
    permissions: {
      view: ['super_admin', 'admin', 'branch_manager', 'teacher'],
      create: ['super_admin', 'admin', 'branch_manager'],
      edit: ['super_admin', 'admin', 'branch_manager'],
      delete: ['super_admin', 'admin']
    }
  },
  teachers: {
    path: '/teachers',
    title: 'common.teachers',
    entity: 'common.teacher',
    endpoint: '/teachers',
    fields: [
      { name: 'name', label: 'common.full_name', type: 'text', required: true },
      { name: 'email', label: 'common.email', type: 'email', required: true },
      { name: 'password', label: 'common.password', type: 'password', required: true, hiddenOnEdit: true },
      { name: 'phone', label: 'students.phone', type: 'text', required: true },
      { name: 'gender', label: 'students.gender', type: 'select', required: true, options: [
        { value: 'male', label: 'students.gender_male' },
        { value: 'female', label: 'students.gender_female' },
        { value: 'other', label: 'students.gender_other' }
      ] },
      { name: 'salaryType', label: 'students.salary_type', type: 'select', required: true, options: [
        { value: 'fixed', label: 'students.fixed' },
        { value: 'percentage', label: 'students.percentage' }
      ] },
      { name: 'salaryValue', label: 'students.salary_value', type: 'number', required: true }
    ],
    listFields: [
      { key: 'name', label: 'common.name' },
      { key: 'email', label: 'common.email' },
      { key: 'phone', label: 'students.phone' },
      { key: 'gender', label: 'students.gender' }
    ],
    searchField: 'name',
    permissions: {
      view: ['super_admin', 'admin', 'branch_manager'],
      create: ['super_admin', 'admin', 'branch_manager'],
      edit: ['super_admin', 'admin', 'branch_manager'],
      delete: ['super_admin', 'admin']
    }
  },
  classes: {
    path: '/classes',
    title: 'common.classes',
    entity: 'common.class',
    endpoint: '/classes',
    fields: [
      { name: 'className', label: 'classes.class_name', type: 'text', required: true },
      { name: 'genderRestriction', label: 'classes.gender_restriction', type: 'select', required: true, options: [
        { value: 'coed', label: 'classes.gender_coed' },
        { value: 'male', label: 'students.gender_male' },
        { value: 'female', label: 'students.gender_female' }
      ] },
      { name: 'feeAmount', label: 'students.fee_amount', type: 'number', required: true },
      { name: 'subjects', label: 'classes.subjects', type: 'subjectList', required: true, placeholder: 'classes.subject_names' },
      { name: 'assignedTeachers', label: 'classes.assigned_teachers', type: 'select', multiple: true, required: true, optionsEndpoint: '/teachers', optionLabelKey: 'name', optionValueKey: '_id', placeholder: 'classes.choose_teacher' },
      { name: 'capacity', label: 'classes.capacity', type: 'number' }
    ],
    listFields: [
      { key: 'className', label: 'classes.class_name' },
      { key: 'classCode', label: 'classes.class_code' },
      { key: 'genderRestriction', label: 'classes.gender_restriction' },
      { key: 'feeAmount', label: 'students.fee_amount' },
      { key: 'studentCount', label: 'students.students_count' }
    ],
    searchField: 'className',
    permissions: {
      view: ['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'parent', 'owner'],
      create: ['super_admin', 'admin', 'branch_manager'],
      edit: ['super_admin', 'admin', 'branch_manager'],
      delete: ['super_admin']
    }
  },
  subjects: {
    path: '/subjects',
    title: 'common.subjects',
    entity: 'common.subject',
    endpoint: '/subjects',
    fields: [
      { name: 'title', label: 'subjects.title', type: 'text', required: true },
      { name: 'code', label: 'subjects.code', type: 'text', required: true },
      { name: 'classId', label: 'subjects.class', type: 'select', required: true, optionsEndpoint: '/classes', optionLabelKey: 'className', optionValueKey: '_id' },
      { name: 'feeAmount', label: 'subjects.fee_amount', type: 'number', required: true },
      { name: 'teacher', label: 'subjects.teacher', type: 'select', required: true, optionsEndpoint: '/teachers', optionLabelKey: 'name', optionValueKey: '_id' },
      { name: 'description', label: 'subjects.description', type: 'textarea' }
    ],
    listFields: [
      { key: 'title', label: 'subjects.title' },
      { key: 'code', label: 'subjects.code' },
      { key: 'className', label: 'subjects.class_name' },
      { key: 'teacherName', label: 'subjects.teacher' }
    ],
    searchField: 'title',
    permissions: {
      view: ['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'parent', 'owner'],
      create: ['super_admin', 'admin', 'branch_manager'],
      edit: ['super_admin', 'admin', 'branch_manager'],
      delete: ['super_admin']
    }
  },
  attendance: {
    path: '/attendance',
    title: 'common.attendance',
    entity: 'common.attendance_record',
    endpoint: '/attendance',
    fields: [
      { name: 'studentId', label: 'results.student', type: 'select', required: true, optionsEndpoint: '/students', optionLabelKey: 'firstName', optionValueKey: '_id' },
      { name: 'classId', label: 'students.class', type: 'select', required: true, optionsEndpoint: '/classes', optionLabelKey: 'className', optionValueKey: '_id' },
      { name: 'attendanceDate', label: 'common.date', type: 'date', required: true },
      { name: 'session', label: 'attendance.session', type: 'select', required: true, options: [
        { value: 'morning', label: 'attendance.session_morning' },
        { value: 'afternoon', label: 'attendance.session_afternoon' },
        { value: 'evening', label: 'attendance.session_evening' },
        { value: 'online', label: 'attendance.session_online' }
      ] },
      { name: 'status', label: 'attendance.status', type: 'select', required: true, options: [
        { value: 'present', label: 'attendance.present' },
        { value: 'absent', label: 'attendance.absent' },
        { value: 'late', label: 'attendance.late' },
        { value: 'excused', label: 'attendance.excused' }
      ] }
    ],
    listFields: [
      { key: 'studentName', label: 'results.student' },
      { key: 'className', label: 'students.class' },
      { key: 'attendanceDate', label: 'common.date' },
      { key: 'session', label: 'attendance.session' },
      { key: 'status', label: 'attendance.status' }
    ],
    permissions: {
      view: ['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'parent', 'owner'],
      create: ['super_admin', 'admin', 'branch_manager', 'teacher'],
      edit: [],
      delete: []
    },
    disableEdit: true,
    disableDelete: true
  },
  exams: {
    path: '/exams',
    title: 'common.exams',
    entity: 'common.exam',
    endpoint: '/exams',
    fields: [
      { name: 'title', label: 'exams.title', type: 'text', required: true },
      { name: 'subject', label: 'exams.subject', type: 'select', required: true, optionsEndpoint: '/subjects', optionLabelKey: 'title', optionValueKey: '_id' },
      { name: 'class', label: 'exams.class', type: 'select', required: true, optionsEndpoint: '/classes', optionLabelKey: 'className', optionValueKey: '_id' },
      { name: 'teacherId', label: 'students.teacher', type: 'select', optionsEndpoint: '/teachers', optionLabelKey: 'name', optionValueKey: '_id' },
      { name: 'date', label: 'exams.date', type: 'date', required: true },
      { name: 'totalMarks', label: 'exams.total_marks', type: 'number' }
    ],
    listFields: [
      { key: 'title', label: 'exams.title' },
      { key: 'subjectName', label: 'exams.subject' },
      { key: 'className', label: 'exams.class' },
      { key: 'teacherName', label: 'students.teacher' },
      { key: 'date', label: 'exams.date' }
    ],
    permissions: {
      view: ['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'parent', 'owner'],
      create: ['super_admin', 'admin', 'branch_manager', 'teacher'],
      edit: ['super_admin', 'admin', 'branch_manager', 'teacher'],
      delete: ['super_admin', 'admin']
    },
    disableDelete: true
  },
  results: {
    path: '/results',
    title: 'common.results',
    entity: 'common.result',
    endpoint: '/results',
    fields: [
      { name: 'student', label: 'results.student', type: 'select', required: true, optionsEndpoint: '/students', optionLabelKey: 'firstName', optionValueKey: '_id' },
      { name: 'exam', label: 'results.exam', type: 'select', required: true, optionsEndpoint: '/exams', optionLabelKey: 'title', optionValueKey: '_id' },
      { name: 'score', label: 'results.score', type: 'number', required: true },
      { name: 'gradedBy', label: 'results.graded_by', type: 'select', optionsEndpoint: '/teachers', optionLabelKey: 'name', optionValueKey: '_id' }
    ],
    listFields: [
      { key: 'studentName', label: 'results.student' },
      { key: 'examName', label: 'results.exam' },
      { key: 'subjectName', label: 'exams.subject' },
      { key: 'className', label: 'exams.class' },
      { key: 'teacherName', label: 'students.teacher' },
      { key: 'score', label: 'results.score' },
      { key: 'grade', label: 'results.grade' }
    ],
    permissions: {
      view: ['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'parent', 'owner'],
      create: ['super_admin', 'admin', 'branch_manager', 'teacher'],
      edit: [],
      delete: []
    },
    disableEdit: true,
    disableDelete: true
  },
  payments: {
    path: '/payments',
    title: 'common.payments',
    entity: 'common.payment',
    endpoint: '/payments',
    fields: [
      { name: 'studentId', label: 'results.student', type: 'select', required: true, optionsEndpoint: '/students', optionLabelKey: 'firstName', optionValueKey: '_id' },
      { name: 'amount', label: 'finance.amount', type: 'number', required: true },
      { name: 'method', label: 'payments.method', type: 'select', required: true, options: [
        { value: 'cash', label: 'payments.method_cash' },
        { value: 'bank_transfer', label: 'payments.method_bank' },
        { value: 'mobile_money', label: 'payments.method_mobile' },
        { value: 'card', label: 'payments.method_card' }
      ] },
      { name: 'referenceNumber', label: 'payments.reference', type: 'text' },
      { name: 'notes', label: 'finance.notes', type: 'textarea' }
    ],
    listFields: [
      { key: 'studentName', label: 'results.student' },
      { key: 'invoiceNumber', label: 'payments.reference' },
      { key: 'amount', label: 'finance.amount' },
      { key: 'method', label: 'payments.method' },
      { key: 'paymentDate', label: 'common.date' }
    ],
    permissions: {
      view: ['super_admin', 'admin', 'branch_manager', 'owner', 'student', 'parent'],
      create: ['super_admin', 'admin', 'branch_manager'],
      edit: [],
      delete: []
    },
    disableEdit: true,
    disableDelete: true
  },
  finance: {
    path: '/finance',
    title: 'common.finance',
    entity: 'common.finance',
    endpoint: '/finance',
    createEndpoint: '/finance/income',
    fields: [
      { name: 'title', label: 'finance.title', type: 'text', required: true },
      { name: 'amount', label: 'finance.amount', type: 'number', required: true },
      { name: 'category', label: 'finance.category', type: 'text', required: true },
      { name: 'date', label: 'finance.date', type: 'date' },
      { name: 'notes', label: 'finance.notes', type: 'textarea' }
    ],
    listFields: [
      { key: 'title', label: 'finance.title' },
      { key: 'amount', label: 'finance.amount' },
      { key: 'category', label: 'finance.category' },
      { key: 'date', label: 'finance.date' }
    ],
    permissions: {
      view: ['super_admin', 'admin', 'branch_manager', 'owner'],
      create: ['super_admin', 'admin', 'branch_manager']
    },
    disableEdit: true,
    disableDelete: true
  },
  reports: {
    path: '/reports',
    title: 'common.reports',
    entity: 'common.report',
    endpoint: '/reports',
    fields: [],
    listFields: [
      { key: 'title', label: 'finance.title' },
      { key: 'type', label: 'common.type' },
      { key: 'periodKey', label: 'common.period' },
      { key: 'status', label: 'common.status' }
    ],
    permissions: {
      view: ['super_admin', 'admin', 'branch_manager', 'owner']
    },
    disableEdit: true,
    disableDelete: true
  },
  expenses: {
    path: '/expenses',
    title: 'common.expenses',
    entity: 'common.expense',
    endpoint: '/expenses',
    fields: [
      { name: 'title', label: 'finance.title', type: 'text', required: true },
      { name: 'amount', label: 'finance.amount', type: 'number', required: true },
      { name: 'category', label: 'finance.category', type: 'text', required: true },
      { name: 'date', label: 'finance.date', type: 'date' },
      { name: 'notes', label: 'finance.notes', type: 'textarea' }
    ],
    listFields: [
      { key: 'title', label: 'finance.title' },
      { key: 'amount', label: 'finance.amount' },
      { key: 'category', label: 'finance.category' },
      { key: 'date', label: 'finance.date' }
    ],
    permissions: {
      view: ['super_admin', 'admin', 'branch_manager', 'owner'],
      create: ['super_admin', 'admin', 'branch_manager']
    },
    disableEdit: true,
    disableDelete: true
  },
  families: {
    path: '/families',
    title: 'common.families',
    entity: 'common.family',
    endpoint: '/families',
    fields: [
      { name: 'guardianName', label: 'common.guardian_name', type: 'text', required: true },
      { name: 'guardianEmail', label: 'common.guardian_email', type: 'email', required: true },
      { name: 'guardianPhone', label: 'common.guardian_phone', type: 'text', required: true },
      { name: 'notes', label: 'finance.notes', type: 'textarea' }
    ],
    listFields: [
      { key: 'guardianName', label: 'common.guardian_name' },
      { key: 'guardianEmail', label: 'common.guardian_email' },
      { key: 'guardianPhone', label: 'common.guardian_phone' }
    ],
    permissions: {
      view: ['super_admin', 'admin', 'branch_manager', 'teacher', 'parent', 'owner'],
      create: ['super_admin', 'admin', 'branch_manager', 'teacher'],
      edit: [],
      delete: []
    },
    disableEdit: true,
    disableDelete: true
  },
  notifications: {
    path: '/notifications',
    title: 'common.notifications',
    entity: 'common.notification',
    endpoint: '/notifications',
    fields: [
      { name: 'title', label: 'notifications.title', type: 'text', required: true },
      { name: 'description', label: 'common.description', type: 'textarea', required: true },
      { name: 'classId', label: 'students.class', type: 'select', optionsEndpoint: '/classes', optionLabelKey: 'className', optionValueKey: '_id' },
      { name: 'subjectId', label: 'students.subject', type: 'select', optionsEndpoint: '/subjects', optionLabelKey: 'title', optionValueKey: '_id' },
      { name: 'teacherId', label: 'students.teacher', type: 'select', optionsEndpoint: '/teachers', optionLabelKey: 'name', optionValueKey: '_id' },
      { name: 'image', label: 'notifications.image', type: 'file' },
      { name: 'publishDate', label: 'common.date', type: 'date' },
      { name: 'publishStatus', label: 'notifications.publish_status', type: 'select', required: true, options: [
        { value: 'draft', label: 'notifications.status_draft' },
        { value: 'published', label: 'notifications.status_published' }
      ] },
      { name: 'recipientRoles', label: 'notifications.recipient_roles', type: 'select', options: roleOptions, multiple: true }
    ],
    listFields: [
      { key: 'title', label: 'notifications.title' },
      { key: 'description', label: 'common.description' },
      { key: 'className', label: 'students.class' },
      { key: 'subjectName', label: 'students.subject' },
      { key: 'teacherName', label: 'students.teacher' },
      { key: 'publishDate', label: 'common.date' },
      { key: 'publishStatus', label: 'common.status' }
    ],
    permissions: {
      view: coreRoles,
      create: ['super_admin', 'admin', 'branch_manager', 'teacher', 'owner'],
      edit: ['super_admin', 'admin', 'branch_manager', 'teacher', 'owner'],
      delete: ['super_admin', 'admin', 'branch_manager', 'owner']
    }
  },
  audit: {
    path: '/audit',
    title: 'common.audit_logs',
    entity: 'common.audit',
    endpoint: '/audit',
    fields: [],
    listFields: [
      { key: 'action', label: 'audit.action' },
      { key: 'type', label: 'common.type' },
      { key: 'severity', label: 'common.severity' },
      { key: 'createdAt', label: 'audit.created_at' }
    ],
    permissions: {
      view: ['super_admin', 'owner']
    },
    disableEdit: true,
    disableDelete: true
  },
  roles: {
    path: '/roles',
    title: 'common.roles',
    entity: 'common.role',
    endpoint: '/roles',
    fields: [],
    listFields: [
      { key: 'role', label: 'roles.role' }
    ],
    permissions: {
      view: ['super_admin', 'owner']
    },
    disableEdit: true,
    disableDelete: true
  }
};

export interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles: EnterpriseRole[];
}

const menuConfig: Record<EnterpriseRole, MenuItem[]> = {
  super_admin: [
    { path: '/dashboard', label: 'common.dashboard', icon: Home, roles: coreRoles },
    { path: '/branches', label: 'common.branches', icon: Building2, roles: coreRoles },
    { path: '/users', label: 'common.users', icon: Users, roles: coreRoles },
    { path: '/students', label: 'common.students', icon: GraduationCap, roles: coreRoles },
    { path: '/teachers', label: 'common.teachers', icon: UserCheck, roles: coreRoles },
    { path: '/classes', label: 'common.classes', icon: Layers, roles: coreRoles },
    { path: '/subjects', label: 'common.subjects', icon: BookOpen, roles: coreRoles },
    { path: '/attendance', label: 'common.attendance', icon: ClipboardList, roles: coreRoles },
    { path: '/exams', label: 'common.exams', icon: CalendarCheck, roles: coreRoles },
    { path: '/results', label: 'common.results', icon: FileText, roles: coreRoles },
    { path: '/payments', label: 'common.payments', icon: Receipt, roles: coreRoles },
    { path: '/finance', label: 'common.finance', icon: DollarSign, roles: coreRoles },
    { path: '/expenses', label: 'common.expenses', icon: CreditCard, roles: coreRoles },
    { path: '/reports', label: 'common.reports', icon: Activity, roles: coreRoles },
    { path: '/notifications', label: 'common.notifications', icon: Bell, roles: coreRoles },
    { path: '/audit', label: 'common.audit_logs', icon: ShieldCheck, roles: coreRoles },
    { path: '/roles', label: 'common.roles', icon: ShieldCheck, roles: coreRoles }
  ],
  admin: [
    { path: '/dashboard', label: 'common.dashboard', icon: Home, roles: coreRoles },
    { path: '/branches', label: 'common.branches', icon: Building2, roles: coreRoles },
    { path: '/students', label: 'common.students', icon: GraduationCap, roles: coreRoles },
    { path: '/teachers', label: 'common.teachers', icon: UserCheck, roles: coreRoles },
    { path: '/classes', label: 'common.classes', icon: Layers, roles: coreRoles },
    { path: '/subjects', label: 'common.subjects', icon: BookOpen, roles: coreRoles },
    { path: '/attendance', label: 'common.attendance', icon: ClipboardList, roles: coreRoles },
    { path: '/exams', label: 'common.exams', icon: CalendarCheck, roles: coreRoles },
    { path: '/results', label: 'common.results', icon: FileText, roles: coreRoles },
    { path: '/payments', label: 'common.payments', icon: Receipt, roles: coreRoles },
    { path: '/finance', label: 'common.finance', icon: DollarSign, roles: coreRoles },
    { path: '/expenses', label: 'common.expenses', icon: CreditCard, roles: coreRoles },
    { path: '/reports', label: 'common.reports', icon: Activity, roles: coreRoles },
    { path: '/notifications', label: 'common.notifications', icon: Bell, roles: coreRoles }
  ],
  teacher: [
    { path: '/dashboard', label: 'common.dashboard', icon: Home, roles: coreRoles },
    { path: '/students', label: 'common.students', icon: GraduationCap, roles: coreRoles },
    { path: '/classes', label: 'common.classes', icon: Layers, roles: coreRoles },
    { path: '/subjects', label: 'common.subjects', icon: BookOpen, roles: coreRoles },
    { path: '/attendance', label: 'common.attendance', icon: ClipboardList, roles: coreRoles },
    { path: '/exams', label: 'common.exams', icon: CalendarCheck, roles: coreRoles },
    { path: '/results', label: 'common.results', icon: FileText, roles: coreRoles },
    { path: '/notifications', label: 'common.notifications', icon: Bell, roles: coreRoles }
  ],
  student: [
    { path: '/dashboard', label: 'common.dashboard', icon: Home, roles: coreRoles },
    { path: '/classes', label: 'common.classes', icon: Layers, roles: coreRoles },
    { path: '/subjects', label: 'common.subjects', icon: BookOpen, roles: coreRoles },
    { path: '/attendance', label: 'common.attendance', icon: ClipboardList, roles: coreRoles },
    { path: '/results', label: 'common.results', icon: FileText, roles: coreRoles },
    { path: '/payments', label: 'common.payments', icon: Receipt, roles: coreRoles },
    { path: '/notifications', label: 'common.notifications', icon: Bell, roles: coreRoles }
  ],
  parent: [
    { path: '/dashboard', label: 'common.dashboard', icon: Home, roles: coreRoles },
    { path: '/families', label: 'common.families', icon: Users, roles: coreRoles },
    { path: '/classes', label: 'common.classes', icon: Layers, roles: coreRoles },
    { path: '/attendance', label: 'common.attendance', icon: ClipboardList, roles: coreRoles },
    { path: '/results', label: 'common.results', icon: FileText, roles: coreRoles },
    { path: '/payments', label: 'common.payments', icon: Receipt, roles: coreRoles },
    { path: '/notifications', label: 'common.notifications', icon: Bell, roles: coreRoles }
  ],
  owner: [
    { path: '/dashboard', label: 'common.dashboard', icon: Home, roles: coreRoles },
    { path: '/branches', label: 'common.branches', icon: Building2, roles: coreRoles },
    { path: '/finance', label: 'common.finance', icon: DollarSign, roles: coreRoles },
    { path: '/expenses', label: 'common.expenses', icon: CreditCard, roles: coreRoles },
    { path: '/reports', label: 'common.reports', icon: Activity, roles: coreRoles },
    { path: '/audit', label: 'common.audit_logs', icon: ShieldCheck, roles: coreRoles },
    { path: '/roles', label: 'common.roles', icon: ShieldCheck, roles: coreRoles },
    { path: '/notifications', label: 'common.notifications', icon: Bell, roles: coreRoles }
  ],
  branch_manager: [
    { path: '/dashboard', label: 'common.dashboard', icon: Home, roles: coreRoles },
    { path: '/branches', label: 'common.branches', icon: Building2, roles: coreRoles },
    { path: '/students', label: 'common.students', icon: GraduationCap, roles: coreRoles },
    { path: '/teachers', label: 'common.teachers', icon: UserCheck, roles: coreRoles },
    { path: '/classes', label: 'common.classes', icon: Layers, roles: coreRoles },
    { path: '/subjects', label: 'common.subjects', icon: BookOpen, roles: coreRoles },
    { path: '/attendance', label: 'common.attendance', icon: ClipboardList, roles: coreRoles },
    { path: '/payments', label: 'common.payments', icon: Receipt, roles: coreRoles },
    { path: '/reports', label: 'common.reports', icon: Activity, roles: coreRoles },
    { path: '/notifications', label: 'common.notifications', icon: Bell, roles: coreRoles }
  ],
  system_automation: [
    { path: '/dashboard', label: 'common.dashboard', icon: Home, roles: coreRoles },
    { path: '/reports', label: 'common.reports', icon: Activity, roles: coreRoles },
    { path: '/notifications', label: 'common.notifications', icon: Bell, roles: coreRoles }
  ]
};

export function getMenuForRole(role: Role | null) {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return [];
  return menuConfig[normalizedRole] ?? [];
}

export function getRouteLabel(role: Role | null, pathname: string) {
  const items = getMenuForRole(role);
  const item = items.find((route) => route.path === pathname);
  return item?.label || 'common.dashboard';
}

export const allModuleConfigs = Object.values(modulesConfig);
