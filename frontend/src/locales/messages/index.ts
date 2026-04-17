import enAuth from './en/auth.json';
import enAudit from './en/audit.json';
import enAttendance from './en/attendance.json';
import enBooks from './en/books.json';
import enClasses from './en/classes.json';
import enCommon from './en/common.json';
import enDashboard from './en/dashboard.json';
import enErrors from './en/errors.json';
import enExams from './en/exams.json';
import enFinance from './en/finance.json';
import enIssueBooks from './en/issue_books.json';
import enNotifications from './en/notifications.json';
import enPayments from './en/payments.json';
import enReports from './en/reports.json';
import enResults from './en/results.json';
import enReturnBooks from './en/return_books.json';
import enRoles from './en/roles.json';
import enStudents from './en/students.json';
import enSubjects from './en/subjects.json';
import faAuth from './fa/auth.json';
import faAudit from './fa/audit.json';
import faAttendance from './fa/attendance.json';
import faBooks from './fa/books.json';
import faClasses from './fa/classes.json';
import faCommon from './fa/common.json';
import faDashboard from './fa/dashboard.json';
import faErrors from './fa/errors.json';
import faExams from './fa/exams.json';
import faFinance from './fa/finance.json';
import faIssueBooks from './fa/issue_books.json';
import faNotifications from './fa/notifications.json';
import faPayments from './fa/payments.json';
import faReports from './fa/reports.json';
import faResults from './fa/results.json';
import faReturnBooks from './fa/return_books.json';
import faRoles from './fa/roles.json';
import faStudents from './fa/students.json';
import faSubjects from './fa/subjects.json';
import psAuth from './ps/auth.json';
import psAudit from './ps/audit.json';
import psAttendance from './ps/attendance.json';
import psBooks from './ps/books.json';
import psClasses from './ps/classes.json';
import psCommon from './ps/common.json';
import psDashboard from './ps/dashboard.json';
import psErrors from './ps/errors.json';
import psExams from './ps/exams.json';
import psFinance from './ps/finance.json';
import psIssueBooks from './ps/issue_books.json';
import psNotifications from './ps/notifications.json';
import psPayments from './ps/payments.json';
import psReports from './ps/reports.json';
import psResults from './ps/results.json';
import psReturnBooks from './ps/return_books.json';
import psRoles from './ps/roles.json';
import psStudents from './ps/students.json';
import psSubjects from './ps/subjects.json';

export const localeMessages = {
  en: {
    auth: enAuth,
    audit: enAudit,
    attendance: enAttendance,
    books: enBooks,
    classes: enClasses,
    common: enCommon,
    dashboard: enDashboard,
    errors: enErrors,
    exams: enExams,
    finance: enFinance,
    issue_books: enIssueBooks,
    notifications: enNotifications,
    payments: enPayments,
    reports: enReports,
    results: enResults,
    return_books: enReturnBooks,
    roles: enRoles,
    students: enStudents,
    subjects: enSubjects
  },
  fa: {
    auth: faAuth,
    audit: faAudit,
    attendance: faAttendance,
    books: faBooks,
    classes: faClasses,
    common: faCommon,
    dashboard: faDashboard,
    errors: faErrors,
    exams: faExams,
    finance: faFinance,
    issue_books: faIssueBooks,
    notifications: faNotifications,
    payments: faPayments,
    reports: faReports,
    results: faResults,
    return_books: faReturnBooks,
    roles: faRoles,
    students: faStudents,
    subjects: faSubjects
  },
  ps: {
    auth: psAuth,
    audit: psAudit,
    attendance: psAttendance,
    books: psBooks,
    classes: psClasses,
    common: psCommon,
    dashboard: psDashboard,
    errors: psErrors,
    exams: psExams,
    finance: psFinance,
    issue_books: psIssueBooks,
    notifications: psNotifications,
    payments: psPayments,
    reports: psReports,
    results: psResults,
    return_books: psReturnBooks,
    roles: psRoles,
    students: psStudents,
    subjects: psSubjects
  }
} as const;
