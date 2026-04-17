import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { config } from '../config/env';

type TestResult = {
  name: string;
  status: number | null;
  ok: boolean;
  body?: unknown;
  note?: string;
};

function signToken(user: any) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      canonicalRole: user.role,
      branchId: user.branchId?.toString?.() ?? null
    },
    config.jwtSecret,
    { expiresIn: '15m' }
  );
}

async function runRequest(baseUrl: string, path: string, token?: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

async function main() {
  const report: { results: TestResult[] } = { results: [] };
  const app = await createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 8081;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const [superAdmin, student] = await Promise.all([
      User.findOne({ role: 'super_admin', isDeleted: false }).lean<any>(),
      User.findOne({ role: 'student', isDeleted: false }).lean<any>()
    ]);

    if (!superAdmin) {
      report.results.push({
        name: 'super_admin_presence',
        status: null,
        ok: false,
        note: 'No super admin account was available for protected endpoint validation'
      });
    } else {
      const superToken = signToken(superAdmin);
      for (const path of ['/api/exams', '/api/results', '/api/attendance', '/api/branches', '/api/users']) {
        const result = await runRequest(baseUrl, path, superToken);
        report.results.push({
          name: `GET ${path} as super_admin`,
          status: result.status,
          ok: result.status >= 200 && result.status < 300,
          body: result.body
        });
      }
    }

    if (!student) {
      report.results.push({
        name: 'student_presence',
        status: null,
        ok: false,
        note: 'No student account was available for RBAC denial validation'
      });
    } else {
      const studentToken = signToken(student);
      const result = await runRequest(baseUrl, '/api/users', studentToken);
      report.results.push({
        name: 'GET /api/users as student',
        status: result.status,
        ok: result.status === 403,
        body: result.body
      });
    }

    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('API validation failed:', error);
    process.exitCode = 1;
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await mongoose.disconnect();
  }
}

main();
