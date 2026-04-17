import type { Request, Response } from 'express';
import { config } from '../config/env';

export function healthCheck(req: Request, res: Response) {
  res.status(200).json({
    status: 'ok',
    port: config.port,
    timestamp: new Date().toISOString()
  });
}

export function getApiOverview(req: Request, res: Response) {
  res.json({
    message: 'Nokta Academy Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      branches: '/api/branches',
      students: '/api/students',
      teachers: '/api/teachers',
      classes: '/api/classes',
      subjects: '/api/subjects',
      attendance: '/api/attendance',
      exams: '/api/exams',
      results: '/api/results',
      payments: '/api/payments',
      finance: '/api/finance',
      expenses: '/api/expenses',
      families: '/api/families',
      books: '/api/books',
      audit: '/api/audit',
      notifications: '/api/notifications',
      roles: '/api/roles',
      permissions: '/api/permissions',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      languageSettings: '/api/language-settings',
      admin: '/api/admin'
    }
  });
}
