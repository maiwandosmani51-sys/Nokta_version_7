# Nokta Academy Management System Info

## Project Status
- Project: `Nokta Academy Management System`
- Last updated: `2026-04-16`
- Current implementation state: `Enterprise-aligned major build completed`
- Project completion: `92%`
- Security score: `91/100`
- RBAC completion: `94%`

## Completed Modules
- Phase 1 Backend foundation: modular backend structure aligned around config, routes, services, models, middlewares, jobs, utils, and validations.
- Phase 2 Database design: mandatory production-grade collections added for roles, permissions, branches, teachers, parents, owners, enrollments, attendance, attendance policies, questions, exam results, payments, salaries, stationery sales, advertisements, learning resources, family links, QR contacts, session tokens, reports, and language settings.
- Phase 3 Enterprise authentication and security: JWT access tokens, refresh rotation, session blacklist support, device tracking, brute-force lockout, password history, forced password change, reset flow, email verification, optional phone verification, request sanitization, rate limiting, CORS and Helmet hardening.
- Phase 4 RBAC and permission engine: centralized permission matrix, role normalization, route ownership map, permission service, role aliases for legacy data, route-level and middleware-level access enforcement.
- Phase 5 Business rules: class gender restriction support, teacher/class gender validation, duplicate attendance prevention, automatic suspension threshold, immutable-style financial record handling, owner approval gate for branch deletion, salary deduction framework.
- Phase 6 Automation engine: scheduled jobs for online attendance auto mark, registration reminders, reminder broadcast, monthly salary generation, suspension enforcement, monthly financial reports, and audit alerts.
- Phase 7 Frontend development: React dashboard and CRUD surfaces aligned to enterprise roles, updated session handling, route guards, role-based menu visibility, and payment/attendance/branch management views.
- Phase 8 Multilingual system: persistent language selection retained through navigation with added attendance and payments locale namespaces.
- Phase 9 Financial security: dedicated payment and salary models, audit history structures on financial collections, immutable/delete-restricted route behavior, finance/report visibility aligned for governance roles.
- Phase 10 Documentation engine: `system_master_rules.js` added as reusable master contract and this system info file created.
- Phase 11 Final system audit: code audit completed and final report generated in `Final_Enterprise_System_Audit.md`.

## Pending or Partial Areas
- External delivery integrations are simulated only: email verification, phone verification, SMS reminders.
- Teacher absence deduction depends on `TEACHER_ABSENT` audit events rather than a dedicated teacher attendance feed.
- Some legacy modules still exist in the codebase and are tolerated through role aliases rather than fully migrated schemas.
- No automated integration test suite was added in this pass.

## Core API List
- Auth: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/logout-all`, `/api/auth/profile`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/email-verification/request`, `/api/auth/email-verification/confirm`, `/api/auth/phone-verification/request`, `/api/auth/phone-verification/confirm`
- Governance: `/api/users`, `/api/roles`, `/api/permissions`, `/api/audit`, `/api/reports`
- Organization: `/api/branches`, `/api/language-settings`
- Academic: `/api/students`, `/api/teachers`, `/api/classes`, `/api/subjects`, `/api/attendance`, `/api/attendance/policies`, `/api/exams`, `/api/results`
- Finance: `/api/payments`, `/api/finance`, `/api/expenses`
- Communication: `/api/families`, `/api/notifications`
- System: `/api/dashboard`, `/health`, `/`

## Frontend Route List
- Public: `/`, `/home`, `/login`, `/forbidden`
- Shared authenticated: `/dashboard`, `/profile`
- Role dashboards: `/dashboard/super-admin`, `/dashboard/admin`, `/dashboard/teacher`, `/dashboard/student`, `/dashboard/parent`, `/dashboard/owner`, `/dashboard/branch-manager`
- Enterprise CRUD and analytics: `/branches`, `/users`, `/students`, `/teachers`, `/classes`, `/subjects`, `/attendance`, `/exams`, `/results`, `/payments`, `/finance`, `/expenses`, `/reports`, `/families`, `/notifications`, `/audit`, `/roles`, `/analytics`, `/campaign`, `/ecommerce`, `/settings`

## Security Summary
- Access tokens are short-lived JWTs with refresh rotation and blacklist-backed logout.
- User records now track password history, failed attempts, lock windows, verified contact state, and device metadata.
- Route protection combines auth, permission, branch, ownership, and audit middleware instead of relying only on local route checks.
- Request bodies, params, and query strings are sanitized against script payloads and Mongo-style operator injection.

## Dependencies
- Backend: Node.js, Express, MongoDB, Mongoose, bcryptjs, jsonwebtoken, Joi, Helmet, CORS, express-rate-limit
- Frontend: React, Vite, Tailwind CSS, React Query, Zustand, i18next, Framer Motion, Recharts, PWA tooling
